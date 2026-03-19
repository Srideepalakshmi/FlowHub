import express from 'express';
import Step from '../models/Step.js';

const router = express.Router({ mergeParams: true });

// Get steps for workflow (Mounted on /workflows/:workflow_id/steps)
router.get('/', async (req, res) => {
  try {
    const steps = await Step.find({ workflow_id: req.params.workflow_id }).sort({ order: 1 });
    res.json(steps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create step for workflow
router.post('/', async (req, res) => {
  try {
    const step = new Step({ ...req.body, workflow_id: req.params.workflow_id });
    await step.save();
    res.status(201).json(step);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update step
router.put('/:id', async (req, res) => {
  try {
    const step = await Step.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!step) return res.status(404).json({ error: 'Step not found' });
    res.json(step);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete step
router.delete('/:id', async (req, res) => {
  try {
    await Step.findOneAndDelete({ id: req.params.id });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
