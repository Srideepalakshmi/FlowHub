import { Parser } from 'expr-eval';
import Rule from '../models/Rule.js';
import Step from '../models/Step.js';
import Execution from '../models/Execution.js';

const parser = new Parser();

// Add string functions to expr-eval
parser.functions.contains = function (str, val) { return String(str).includes(val); };
parser.functions.startsWith = function (str, val) { return String(str).startsWith(val); };
parser.functions.endsWith = function (str, val) { return String(str).endsWith(val); };

/**
 * Evaluates rules for a given step and context variables.
 * Returns the matching next_step_id or null if none match (or if it hits a DEFAULT rule that has null).
 * Returns evaluation logs for the execution history.
 */
export const evaluateRulesForStep = async (stepId, dataContext) => {
  const rules = await Rule.find({ step_id: stepId }).sort({ priority: 1 });
  const evaluated_rules = [];
  
  for (const rule of rules) {
    if (rule.condition === 'DEFAULT') {
      evaluated_rules.push({ rule: rule.condition, result: true });
      return { nextStepId: rule.next_step_id, evaluatedRules: evaluated_rules };
    }

    try {
      // Evaluate condition expression
      const expr = parser.parse(rule.condition);
      const result = expr.evaluate(dataContext);
      
      evaluated_rules.push({ rule: rule.condition, result: !!result });
      
      if (result) {
        return { nextStepId: rule.next_step_id, evaluatedRules: evaluated_rules };
      }
    } catch (err) {
      console.error(`Rule evaluation error for rule ${rule.id}: `, err.message);
      // If rule fails evaluation (e.g., missing variable), mark as false and continue
      evaluated_rules.push({ rule: rule.condition, result: false, error: err.message });
      // Depending on strictness, we could throw here, but let's just proceed to next priorities
    }
  }

  // If no rules match and no DEFAULT rule exists, workflow stops
  return { nextStepId: null, evaluatedRules: evaluated_rules };
};

/**
 * Executes a single step and evaluates next steps. 
 * This mock simulates immediate execution of tasks and notifications.
 * Approvals would technically pause execution and wait for a user PUT request,
 * but for simplicity of the engine loop, we simulate it executing immediately or we just 
 * record the state change and stop the loop, waiting for resume.
 */
export const executeStep = async (executionId, stepId) => {
  const execution = await Execution.findOne({ id: executionId });
  const step = await Step.findOne({ id: stepId });
  
  if (!execution || !step) throw new Error('Execution or Step not found');

  const startTime = new Date();
  
  let resultNextStepId = null;
  let evalLogs = [];
  let stepStatus = 'completed';
  let stepError = null;

  try {
    // 1. "Execute" the step action
    if (step.step_type === 'task') {
      console.log(`[Task] Executing system action for ${step.name}`);
      // Simulate work
    } else if (step.step_type === 'notification') {
      console.log(`[Notification] Sending message to ${step.metadata?.notification_channel}`);
    } else if (step.step_type === 'approval') {
      // Pause engine loop here to wait for manual UI approval
      const role = step.metadata?.assignee_role || 'manager';
      let statusStr = 'Pending Manager Approval';
      if (role === 'finance') statusStr = 'Pending Finance Approval';
      if (role === 'high_authority') statusStr = 'Pending CEO Approval';
      
      console.log(`[Approval] Pausing engine. Setting status to: ${statusStr}`);
      stepStatus = statusStr;
      return { logEntry: null, nextStepId: null, stepStatus }; // Breaks the loop
    }

    // 2. Evaluate rules to find next step
    const ruleEvaluation = await evaluateRulesForStep(stepId, execution.data);
    resultNextStepId = ruleEvaluation.nextStepId;
    evalLogs = ruleEvaluation.evaluatedRules;

  } catch (err) {
    stepStatus = 'failed';
    stepError = err.message;
  }

  const endTime = new Date();

  // Create log entry matches format specified in docs
  const logEntry = {
    step_name: step.name,
    step_type: step.step_type,
    evaluated_rules: evalLogs,
    selected_next_step: resultNextStepId ? (await Step.findOne({id: resultNextStepId}))?.name : null,
    status: stepStatus,
    approver_id: step.step_type === 'approval' ? 'system-auto' : null,
    error_message: stepError,
    started_at: startTime.toISOString(),
    ended_at: endTime.toISOString()
  };

  return { logEntry, nextStepId: resultNextStepId, stepStatus };
};

export const resumeApproval = async (executionId, approverId, action, comment) => {
  const execution = await Execution.findOne({ id: executionId });
  if (!execution) throw new Error("Execution not found");
  
  const step = execution.current_step_id ? await Step.findOne({ id: execution.current_step_id }) : null;
  
  if (!step) {
    execution.status = action === 'Approve' ? 'completed' : 'failed';
    const logEntry = {
      step_name: 'System Approval',
      step_type: 'approval',
      evaluated_rules: [],
      selected_next_step: null,
      status: action === 'Approve' ? 'completed' : 'rejected',
      approver_id: approverId,
      error_message: comment ? `Comment: ${comment}` : null,
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString()
    };
    execution.logs.push(logEntry);
    await execution.save();
    return execution;
  }
  
  // Expose action to rule evaluator
  execution.data.approval_action = action;
  if(comment) execution.data.approval_comment = comment; // Also expose comment
  
  if (action === 'Reject') {
    const logEntry = {
      step_name: step.name,
      step_type: step.step_type,
      evaluated_rules: [],
      selected_next_step: null,
      status: 'rejected',
      approver_id: approverId,
      error_message: comment ? `Comment: ${comment}` : null,
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString()
    };
    execution.logs.push(logEntry);
    execution.current_step_id = null;
    execution.status = 'rejected';
    execution.ended_at = new Date();
    await execution.save();
    return execution;
  }

  const ruleEvaluation = await evaluateRulesForStep(step.id, execution.data);
  const nextStepId = ruleEvaluation.nextStepId;
  const evalLogs = ruleEvaluation.evaluatedRules;

  const logEntry = {
    step_name: step.name,
    step_type: step.step_type,
    evaluated_rules: evalLogs,
    selected_next_step: nextStepId ? (await Step.findOne({id: nextStepId}))?.name : null,
    status: action === 'Approve' ? 'completed' : 'rejected',
    approver_id: approverId,
    error_message: comment ? `Comment: ${comment}` : null,
    started_at: new Date().toISOString(),
    ended_at: new Date().toISOString()
  };

  execution.logs.push(logEntry);
  execution.current_step_id = nextStepId;
  
  if (!nextStepId) {
    execution.status = action === 'Approve' ? 'completed' : 'failed';
  } else {
    execution.status = 'in_progress';
  }
  
  await execution.save();
  return execution;
};
