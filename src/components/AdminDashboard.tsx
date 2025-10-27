import React from 'react';
import { UserManagement } from './UserManagement';
import { Card } from './ui';

export const AdminDashboard: React.FC = () => {
  return (
    <div className="admin-dashboard">
      <Card>
        <h1 style={{ marginBottom: '10px' }}>👤 Admin Dashboard</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          Manage users and system settings
        </p>
        <UserManagement />
      </Card>
    </div>
  );
};

