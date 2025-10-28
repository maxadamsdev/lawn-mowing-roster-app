import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { usersApi } from '../services/api';
import { Button, Input, Modal } from './ui';
import { User } from '../types';
import './UserManagement.css';

export const UserManagement: React.FC = () => {
  const { users, refreshUsers, showAlert } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      showAlert('Name and email are required', 'error');
      return;
    }

    try {
      await usersApi.create(name, email, phone, isAdmin);
      await refreshUsers();
      showAlert(`User ${name} added successfully!`);
      setName('');
      setEmail('');
      setPhone('');
      setIsAdmin(false);
    } catch (err) {
      showAlert('Failed to add user', 'error');
    }
  };

  const handleDelete = async (id: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove ${userName}?`)) return;
    
    try {
      await usersApi.delete(id);
      await refreshUsers();
      showAlert(`${userName} removed successfully!`);
    } catch (err) {
      showAlert('Failed to remove user', 'error');
    }
  };

  const handleUpdate = async (id: string, data: any) => {
    try {
      await usersApi.update(id, data);
      await refreshUsers();
      showAlert('User updated successfully!');
      setEditingUser(null);
    } catch (err) {
      showAlert('Failed to update user', 'error');
    }
  };

  return (
    <div className="users-section">
      <h2>👥 Manage Users</h2>
      
      <form onSubmit={handleSubmit} className="user-form">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="tel"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Button type="submit">Add User</Button>
      </form>

      <ul className="user-list">
        {users.map(user => (
          <li key={user._id} className="user-item">
            <div className="user-info">
              <div className="user-name">
                {user.name} {user.isAdmin && <span className="admin-badge">Admin</span>}
              </div>
              <div className="user-email">{user.email}</div>
              {user.phone && <div className="user-phone">📞 {user.phone}</div>}
            </div>
            <div className="user-actions">
              <Button 
                onClick={() => setEditingUser(user._id)}
                style={{ background: '#48bb78', padding: '8px 16px', fontSize: '14px' }}
              >
                Edit
              </Button>
              {!user.isAdmin && (
                <Button 
                  variant="danger" 
                  onClick={() => handleDelete(user._id, user.name)}
                  style={{ padding: '8px 16px', fontSize: '14px' }}
                >
                  Remove
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {editingUser && (
        <EditUserModal
          user={users.find(u => u._id === editingUser)!}
          onSave={handleUpdate}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
};

interface EditUserModalProps {
  user: User;
  onSave: (id: string, data: Partial<User>) => void;
  onClose: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onSave, onClose }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(user._id, { name, email, phone });
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <h2>Edit User</h2>
      <form onSubmit={handleSubmit}>
        <Input
          label="Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <div className="modal-actions">
          <Button type="submit">Save</Button>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
};

