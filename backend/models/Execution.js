import mongoose from 'mongoose';

const executionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, default: () => crypto.randomUUID() },
  workflow_id: { type: String, required: true },
  workflow_version: { type: Number, required: true },
  status: { type: String, default: 'pending' },
  data: { type: Object, default: {} },
  logs: { type: Array, default: [] },
  current_step_id: { type: String, default: null },
  retries: { type: Number, default: 0 },
  triggered_by: { type: String, default: null },
  ended_at: { type: Date, default: null }
}, { timestamps: { createdAt: 'started_at', updatedAt: 'updated_at' } }); // started_at natively handles start time 

export default mongoose.model('Execution', executionSchema);
