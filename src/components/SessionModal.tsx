import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { sessionsApi } from '../services/api';
import { ConfirmSessionModal } from './ConfirmSessionModal';
import { WithdrawModal } from './WithdrawModal';
import { formatDate, formatDateRange, getSessionDateRange } from '../utils/dateUtils';
import { Modal, Button } from './ui';

interface SessionModalProps {
  dateStr: string;
  onClose: () => void;
}

export const SessionModal: React.FC<SessionModalProps> = ({ dateStr, onClose }) => {
  const { sessions, users, currentUser, refreshSessions, showAlert } = useApp();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const session = sessions.find((s) => s.date === dateStr);

  if (!session) {
    return null;
  }

  const user = session.userId ? users.find((u) => u._id === session.userId) : null;
  const { dayBeforeStr, dayAfterStr } = getSessionDateRange(session.date);
  const formattedRange = formatDateRange(dayBeforeStr, dayAfterStr);
  const formattedPrimaryDate = formatDate(session.date);

  const handleAssign = async (userId: string) => {
    try {
      await sessionsApi.assign(session._id, userId);
      await refreshSessions();
      showAlert('Session assigned successfully!');
      
      // If assigning to self, open confirm modal
      if (userId === currentUser?._id) {
        setTimeout(() => setShowConfirmModal(true), 300);
      }
    } catch (err) {
      showAlert('Failed to assign session', 'error');
    }
  };

  const handleRequestCoverage = async () => {
    if (!currentUser) return;
    
    try {
      await sessionsApi.requestCoverage(session._id, currentUser);
      showAlert('Coverage request emails sent!');
    } catch (err) {
      showAlert('Failed to send coverage request', 'error');
    }
  };

  const isMySession = user?._id === currentUser?._id;
  const isAdmin = currentUser?.isAdmin;

  return (
    <>
      <Modal isOpen={true} onClose={onClose}>
        <h2>Session Details</h2>

        <div className="session-info">
          <div className="info-row">
            <span className="info-label">Session Date Range:</span>
            <span className="info-value">{formattedRange}</span>
          </div>

          <div className="info-row">
            <span className="info-label">Primary Date:</span>
            <span className="info-value">{formattedPrimaryDate}</span>
          </div>

          <div className="info-row">
            <span className="info-label">Location:</span>
            <span className="info-value">2 Headingly Lane, Richmond 7020, New Zealand</span>
          </div>

          <div className="info-row">
            <span className="info-label">Duration:</span>
            <span className="info-value">2-3hr</span>
          </div>

          {isAdmin && (
            <>
              <div className="info-row">
                <span className="info-label">Assigned To:</span>
                <span className="info-value">
                  {user ? `${user.name} (${user.email})` : 'Not assigned'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <select
                  id="userSelect"
                  className="input"
                  defaultValue={session.userId || ''}
                  style={{ flex: 3, margin: 0, minWidth: '200px' }}
                >
                  <option value="">Select user...</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={() => {
                    const select = document.getElementById('userSelect') as HTMLSelectElement;
                    if (select.value) handleAssign(select.value);
                  }}
                  style={{ flex: 1, minWidth: '100px' }}
                >
                  Assign
                </Button>
              </div>
            </>
          )}

          {!isAdmin && !user && (
            <div className="modal-actions">
              <Button
                onClick={() => currentUser && handleAssign(currentUser._id)}
                style={{ width: '100%' }}
              >
                Assign Myself to This Session
              </Button>
            </div>
          )}

          {isMySession && !session.confirmed && (
            <div className="modal-actions" style={{ flexDirection: 'column' }}>
              <Button onClick={() => setShowConfirmModal(true)} style={{ width: '100%' }}>
                Confirm Session Details
              </Button>
              <Button 
                variant="danger" 
                onClick={() => setShowWithdrawModal(true)} 
                style={{ width: '100%' }}
              >
                Withdraw from This Session
              </Button>
              <Button 
                onClick={handleRequestCoverage} 
                style={{ width: '100%', background: '#48bb78' }}
              >
                Request Coverage via Email
              </Button>
            </div>
          )}

          {isMySession && session.confirmed && (
            <div className="info-row">
              <span className="info-label">Status:</span>
              <span className="info-value" style={{ color: '#48bb78', fontWeight: 600 }}>
                ✓ Confirmed
                {session.needsAssistance && session.arrivalTime && (
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                    Assistance requested at {session.arrivalTime}
                  </div>
                )}
              </span>
            </div>
          )}
        </div>
      </Modal>

      {showConfirmModal && (
        <ConfirmSessionModal
          sessionId={session._id}
          onClose={() => {
            setShowConfirmModal(false);
            onClose();
          }}
        />
      )}

      {showWithdrawModal && (
        <WithdrawModal
          sessionId={session._id}
          onClose={() => {
            setShowWithdrawModal(false);
            onClose();
          }}
        />
      )}
    </>
  );
};

