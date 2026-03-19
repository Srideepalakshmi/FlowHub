import express from 'express';
import Rule from '../models/Rule.js';

const router = express.Router({ mergeParams: true });

// Get rules for step (Mounted on /steps/:step_id/rules)
router.get('/', async (req, res) => {
  try {
    const rules = await Rule.find({ step_id: req.params.step_id }).sort({ priority: 1 });
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create rule
router.post('/', async (req, res) => {
  try {
    const rule = new Rule({ ...req.body, step_id: req.params.step_id });
    await rule.save();
    res.status(201).json(rule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update rule
router.put('/:id', async (req, res) => {
  try {
    const rule = await Rule.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!rule) return res.status(404).json({ error: 'Rule not found' });
    res.json(rule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete rule
router.delete('/:id', async (req, res) => {
  try {
    await Rule.findOneAndDelete({ id: req.params.id });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
