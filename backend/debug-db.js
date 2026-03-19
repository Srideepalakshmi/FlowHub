import mongoose from 'mongoose';
import Workflow from './models/Workflow.js';
import Step from './models/Step.js';

mongoose.connect('mongodb://localhost:27017/flowhub')
  .then(async () => {
    console.log("=== WORKFLOWS ===");
    const wfs = await Workflow.find().lean();
    console.log(wfs.map(w => ({ id: w.id, name: w.name })));

    console.log("\n=== STEPS ===");
    const steps = await Step.find().lean();
    console.log(steps.map(s => ({ id: s.id, workflow_id: s.workflow_id, name: s.name })));

    mongoose.disconnect();
  })
  .catch(console.error);
