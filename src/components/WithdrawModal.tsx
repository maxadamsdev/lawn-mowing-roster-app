import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { sessionsApi } from '../services/api';

interface Props {
  sessionId: string;
  onClose: () => void;
}

export const WithdrawModal: React.FC<Props> = ({ sessionId, onClose }) => {
  const { users, currentUser, refreshSessions, showAlert } = useApp();
  const [selectedUserId, setSelectedUserId] = useState('');

  const handleAssignAndWithdraw = async () => {
    if (!selectedUserId) {
      showAlert('Please select a user', 'error');
      return;
    }
    try {
      await sessionsApi.assign(sessionId, selectedUserId);
      await refreshSessions();
      const assignedUser = users.find(u => u._id === selectedUserId);
      showAlert(`Session reassigned to ${assignedUser?.name}!`);
      onClose();
    } catch (err) {
      showAlert('Failed to reassign session', 'error');
    }
  };

  const handleWithdrawAndEmail = async () => {
    if (!currentUser) return;
    try {
      await sessionsApi.withdraw(sessionId);
      await sessionsApi.requestCoverage(sessionId, currentUser);
      await refreshSessions();
      showAlert('You have withdrawn and coverage request emails have been sent!');
      onClose();
    } catch (err) {
      showAlert('Failed to withdraw', 'error');
    }
  };

  const handleJustWithdraw = async () => {
    try {
      await sessionsApi.withdraw(sessionId);
      await refreshSessions();
      showAlert('You have withdrawn from this session.');
      onClose();
    } catch (err) {
      showAlert('Failed to withdraw', 'error');
    }
  };

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Withdraw from Session</h2>
        <p style={{ marginBottom: '20px', color: '#666' }}>You have a few options for withdrawing from this session:</p>

        <div className="withdraw-option">
          <h3>Option 1: Assign to Someone Else</h3>
          <p>If you've already spoken to someone who can take your place:</p>
          <select className="input" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
            <option value="">Select a user...</option>
            {users.filter(u => u._id !== currentUser?._id).map(u => (
              <option key={u._id} value={u._id}>{u.name}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={handleAssignAndWithdraw} style={{ width: '100%', marginTop: '10px' }}>
            Assign & Withdraw
          </button>
        </div>

        <div className="withdraw-option">
          <h3>Option 2: Request Coverage via Email</h3>
          <p>Send an email to all team members asking for someone to take your place:</p>
          <button className="btn btn-logout" onClick={handleWithdrawAndEmail} style={{ width: '100%' }}>
            Withdraw & Email Everyone
          </button>
        </div>

        <div className="withdraw-option warning">
          <h3>Option 3: Just Withdraw</h3>
          <p>⚠️ Only use this if you've made other arrangements. This will leave the session unassigned without notifying anyone.</p>
          <button className="btn btn-danger" onClick={handleJustWithdraw} style={{ width: '100%' }}>
            Just Withdraw (No Notification)
          </button>
        </div>

        <button className="btn btn-secondary" onClick={onClose} style={{ width: '100%', marginTop: '20px' }}>
          Cancel
        </button>
      </div>
    </div>
  );
};

