import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import WorkflowEditor from './pages/WorkflowEditor';
import StepRuleEditor from './pages/StepRuleEditor';
import RuleEditor from './pages/RuleEditor';
import ExecutionTracker from './pages/ExecutionTracker';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import AuditLogs from './pages/AuditLogs';
import ExecuteWorkflow from './pages/ExecuteWorkflow';
import ExecutionDetails from './pages/ExecutionDetails';

function App() {
  return (
    <Router>
      <Routes>

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/workflows/new" element={<WorkflowEditor />} />
                <Route path="/workflows/:id/edit" element={<WorkflowEditor />} />
                <Route path="/workflows/:id/steps" element={<StepRuleEditor />} />
                <Route path="/workflows/:id/steps/:stepId/rules" element={<RuleEditor />} />
                <Route path="/workflows/execute" element={<ExecuteWorkflow />} />
                <Route path="/workflows/:id/execute" element={<ExecutionTracker />} />
                <Route path="/executions/:id/details" element={<ExecutionDetails />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/audit-logs" element={<AuditLogs />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          }
        />

      </Routes>
    </Router>
  );
}

export default App;