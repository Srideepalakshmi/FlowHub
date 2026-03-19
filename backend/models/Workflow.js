import mongoose from 'mongoose';

const workflowSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, default: () => crypto.randomUUID() },
  name: { type: String, required: true },
  version: { type: Number, default: 1 },
  is_active: { type: Boolean, default: true },
  input_schema: { type: Object, required: true },
  start_step_id: { type: String, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export default mongoose.model('Workflow', workflowSchema);
