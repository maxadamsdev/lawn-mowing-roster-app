import React from 'react';
import { UserManagement } from './UserManagement';
import { MyRoster } from './MyRoster';

export const AdminPanel: React.FC = () => {
  return (
    <div className="admin-panel">
      <h2>Admin Dashboard</h2>
      <MyRoster />
      <UserManagement />
    </div>
  );
};

