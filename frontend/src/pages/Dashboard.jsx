import React from 'react';
import EmployeeDashboard from './dashboards/EmployeeDashboard';
import ManagerDashboard from './dashboards/ManagerDashboard';
import FinanceDashboard from './dashboards/FinanceDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import HighAuthorityDashboard from './dashboards/HighAuthorityDashboard';

const Dashboard = () => {
  const role = localStorage.getItem('role') || 'employee';

  switch (role) {
    case 'manager':
      return <ManagerDashboard />;
    case 'finance':
      return <FinanceDashboard />;
    case 'high_authority':
      return <HighAuthorityDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'employee':
    default:
      return <EmployeeDashboard />;
  }
};

export default Dashboard;