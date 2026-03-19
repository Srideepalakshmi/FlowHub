# FlowHub MERN Workflow Engine

A modern, dynamic workflow engine built with the MERN stack (MongoDB, Express, React, Node.js).
It allows users to design workflows, attach sequential or conditional steps, set up a dynamic rule engine for logic flow, and track executions in real-time.

## Features

- **Workflow Builder**: Create workflows and define an input schema (`amount`, `country`, etc.).
- **Step Editor**: Add Tasks, Approvals, and Notifications to your workflow.
- **Rule Engine**: Define dynamic javascript-like conditions (e.g., `amount > 100 && country == 'US'`). Priorities dictate which rule executes first.
- **Execution Engine**: Run workflows, pass input data contexts, and track evaluated rules and statuses step-by-step.
- **Professional UI**: A stunning dark-mode interface built with Tailwind CSS.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally on default port `27017` or update `MONGO_URI` in `.env`)

### Backend Setup
1. CD into the backend directory:
   `cd backend`
2. Install dependencies:
   `npm install`
3. Start the backend Node server:
   `npm start` (Runs on port 5000)

### Frontend Setup
1. CD into the frontend directory:
   `cd frontend`
2. Install dependencies:
   `npm install`
3. Start the Vite React development server:
   `npm run dev` (Runs on port 5173)

## Usage

1. Open `http://localhost:5173`.
2. Click **New Workflow**.
3. Create an "Expense Approval" workflow. Add an input schema field: `amount` (number, required).
4. Save, then open the **Steps Editor**.
5. Add a "Manager Approval" step.
6. Manage rules on the step. Add a rule: condition `amount > 500`, next step `(End Workflow)`.
7. Define a `DEFAULT` rule that points to another step "Auto Reject".
8. Go back to Dashboard, click **Execute** (Play icon) on your workflow.
9. Enter an amount and hit **Start Workflow** to see the logs generate in real-time.
