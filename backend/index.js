import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import workflowRoutes from './routes/workflowRoutes.js';
import stepRoutes from './routes/stepRoutes.js';
import ruleRoutes from './routes/ruleRoutes.js';
import executionRoutes from './routes/executionRoutes.js';
import authRoutes from './routes/authRoutes.js';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/workflows', workflowRoutes);
app.use('/workflows/:workflow_id/steps', stepRoutes);
app.use('/steps', stepRoutes);
app.use('/steps/:step_id/rules', ruleRoutes);
app.use('/rules', ruleRoutes);
app.use('/', executionRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/flowhub')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => console.log('DB Connection Error: ', err.message));

export default app;
