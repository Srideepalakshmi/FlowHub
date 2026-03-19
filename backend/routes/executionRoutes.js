import express from 'express';
import Execution from '../models/Execution.js';
import Workflow from '../models/Workflow.js';
import Step from '../models/Step.js';
import Rule from '../models/Rule.js';
import User from '../models/User.js';
import { executeStep, resumeApproval } from '../services/engine.js';

const router = express.Router();

// Get all executions (with query filters)
router.get('/executions', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
       if (req.query.status === 'pending_approval') {
           filter.status = { $regex: /^Pending/i };
       } else {
           filter.status = req.query.status;
       }
    }
    if (req.query.triggered_by) filter.triggered_by = req.query.triggered_by;
    
    let executions = await Execution.find(filter).sort({ started_at: -1 });
    
    if (req.query.assignee_role) {
       const roleToFind = req.query.assignee_role;
       let matchingStatus = 'Pending Manager Approval';
       if (roleToFind === 'finance') matchingStatus = 'Pending Finance Approval';
       if (roleToFind === 'high_authority') matchingStatus = 'Pending CEO Approval';
       
       executions = executions.filter(ex => 
           ex.status === matchingStatus || 
           (ex.status === 'pending_approval' && ((!ex.current_step_id && roleToFind === 'manager') || true))
       );
    }
    
    // We append the workflow name to make frontend easier
    const enriched = await Promise.all(executions.map(async (ex) => {
        const wf = await Workflow.findOne({ id: ex.workflow_id });
        const exObj = ex.toObject();
        exObj.workflow_name = wf ? wf.name : 'Unknown Workflow';
        return exObj;
    }));
    
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single execution
router.get('/executions/:id', async (req, res) => {
  try {
    const execution = await Execution.findOne({ id: req.params.id });
    if (!execution) return res.status(404).json({ error: 'Execution not found' });
    res.json(execution);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Workflow Execution
router.post('/workflows/:workflow_id/execute', async (req, res) => {
  try {
    const workflow = await Workflow.findOne({ id: req.params.workflow_id });
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

    // Force strict 3-stage validation for all executions: Manager -> Finance -> CEO
    let steps = await Step.find({ workflow_id: workflow.id }).sort({ order: 1 });
    let mStep = steps.find(s => s.metadata?.assignee_role === 'manager');
    let fStep = steps.find(s => s.metadata?.assignee_role === 'finance');
    let cStep = steps.find(s => s.metadata?.assignee_role === 'high_authority');

    if (!mStep) mStep = await Step.create({ workflow_id: workflow.id, name: 'Manager Approval', step_type: 'approval', order: 10, metadata: { assignee_role: 'manager' } });
    if (!fStep) fStep = await Step.create({ workflow_id: workflow.id, name: 'Finance Approval', step_type: 'approval', order: 20, metadata: { assignee_role: 'finance' } });
    if (!cStep) cStep = await Step.create({ workflow_id: workflow.id, name: 'CEO Approval', step_type: 'approval', order: 30, metadata: { assignee_role: 'high_authority' } });

    // Link missing rules
    const linkSteps = async (from, to) => {
        const existing = await Rule.findOne({ step_id: from.id });
        if (!existing) await Rule.create({ step_id: from.id, condition: 'DEFAULT', next_step_id: to.id, priority: 1 });
    };
    await linkSteps(mStep, fStep);
    await linkSteps(fStep, cStep);

    // Get requester role
    const triggerEmail = req.body.triggered_by || 'anonymous';
    let triggerUser = null;
    try { triggerUser = await User.findOne({ email: triggerEmail }); } catch (e) {}
    const triggerRole = triggerUser ? triggerUser.role : 'employee';

    // Route execution based on who initiated it
    let startStepId = mStep.id; 
    let initialStatus = 'Pending Manager Approval';

    if (triggerRole === 'manager') {
       startStepId = fStep.id;
       initialStatus = 'Pending Finance Approval';
    } else if (triggerRole === 'finance' || triggerRole === 'high_authority' || triggerRole === 'admin') {
       startStepId = cStep.id;
       initialStatus = 'Pending CEO Approval';
    }

    // Create execution record
    const execution = new Execution({
      workflow_id: workflow.id,
      workflow_version: workflow.version,
      status: initialStatus,
      data: req.body.data || {},
      current_step_id: startStepId,
      triggered_by: triggerEmail
    });
    
    await execution.save();
    console.log(`[DEBUG] strictly routed execution to ${startStepId} with status ${initialStatus}`);

    // Kick off engine in background
    runWorkflowLoop(execution.id).catch(console.error);
    res.status(201).json(execution);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/executions/:id/cancel', async (req, res) => {
    try {
        const execution = await Execution.findOneAndUpdate(
            { id: req.params.id }, 
            { status: 'canceled', ended_at: new Date() },
            { new: true }
        );
        res.json(execution);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Approve or Reject an Execution Step
router.post('/executions/:id/action', async (req, res) => {
    try {
        const { action, approverId, comment } = req.body; // 'Approve' or 'Reject'
        const execution = await resumeApproval(req.params.id, approverId, action, comment);
        
        // Resume background loop if not finished
        if (execution.status === 'in_progress') {
            runWorkflowLoop(execution.id).catch(console.error);
        }
        
        res.json(execution);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Retry Failed Execution
router.post('/executions/:id/retry', async (req, res) => {
    try {
        const execution = await Execution.findOne({ id: req.params.id });
        if (!execution) return res.status(404).json({ error: 'Execution not found' });
        
        if (execution.status !== 'failed' && execution.status !== 'canceled' && execution.status !== 'rejected') {
            return res.status(400).json({ error: 'Can only retry failed, rejected, or canceled executions' });
        }
        
        let retryStepId = execution.current_step_id;
        
        // If execution has no current step (e.g. failure halted it completely), try to infer from last log
        if (!retryStepId && execution.logs.length > 0) {
            const lastLog = execution.logs[execution.logs.length - 1];
            const step = await Step.findOne({ workflow_id: execution.workflow_id, name: lastLog.step_name });
            if (step) retryStepId = step.id;
        }
        
        // Ultimate fallback to start step
        if (!retryStepId) {
            const workflow = await Workflow.findOne({ id: execution.workflow_id });
            retryStepId = workflow?.start_step_id;
        }
        
        execution.current_step_id = retryStepId;
        execution.status = 'in_progress';
        execution.ended_at = null; // Clear completion time since it's running again
        
        execution.logs.push({
            step_name: 'SYSTEM RETRY',
            step_type: 'task',
            status: 'completed',
            started_at: new Date().toISOString(),
            ended_at: new Date().toISOString(),
            selected_next_step: retryStepId ? 'Resuming...' : 'Restarting...'
        });
        
        await execution.save();
        
        if (retryStepId) {
            runWorkflowLoop(execution.id).catch(console.error);
        }
        
        res.json(execution);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Background processor loop
async function runWorkflowLoop(executionId) {
  let execution = await Execution.findOne({ id: executionId });
  const maxIterations = 50; // Safety guard
  let iterations = 0;

  while (execution && execution.status === 'in_progress' && execution.current_step_id && iterations < maxIterations) {
    iterations++;
    
    const { logEntry, nextStepId, stepStatus } = await executeStep(execution.id, execution.current_step_id);
    
    if (stepStatus.startsWith('Pending')) {
      execution.status = stepStatus;
      await execution.save();
      break; // Exit loop, wait for API approve call
    }

    // Update execution with log
    if (logEntry) execution.logs.push(logEntry);
    
    if (stepStatus === 'failed') {
      execution.status = 'failed';
      execution.ended_at = new Date();
      await execution.save();
      break;
    }

    // Move to next step
    execution.current_step_id = nextStepId;
    
    if (!nextStepId) {
      execution.status = 'completed';
      execution.ended_at = new Date();
    }
    
    await execution.save();
    
    // Refetch to get updated status in case canceled mid-flight
    execution = await Execution.findOne({ id: executionId });
  }

  if (iterations >= maxIterations) {
     execution.status = 'failed';
     execution.logs.push({ step_name: 'SYSTEM', status: 'failed', error_message: 'Max iterations reached (infinite loop protection)'});
     execution.ended_at = new Date();
     await execution.save();
  }
}

export default router;
