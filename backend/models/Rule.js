import mongoose from 'mongoose';

const ruleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, default: () => crypto.randomUUID() },
  step_id: { type: String, required: true },
  condition: { type: String, required: true },
  next_step_id: { type: String, default: null },
  priority: { type: Number, required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export default mongoose.model('Rule', ruleSchema);
