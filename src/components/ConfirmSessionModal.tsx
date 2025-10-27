import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { sessionsApi } from '../services/api';

interface Props {
  sessionId: string;
  onClose: () => void;
}

export const ConfirmSessionModal: React.FC<Props> = ({ sessionId, onClose }) => {
  const { refreshSessions, showAlert } = useApp();
  const [needsAssistance, setNeedsAssistance] = useState(false);
  const [arrivalDateTime, setArrivalDateTime] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let arrivalDay: string | undefined;
    let arrivalTime: string | undefined;

    if (needsAssistance && arrivalDateTime) {
      const dt = new Date(arrivalDateTime);
      const session = await sessionsApi.getAll().then(r => r.sessions.find(s => s._id === sessionId));
      if (session) {
        const sessionDate = new Date(session.date + 'T00:00:00');
        const dayBefore = new Date(sessionDate);
        dayBefore.setDate(dayBefore.getDate() - 1);
        const dayAfter = new Date(sessionDate);
        dayAfter.setDate(dayAfter.getDate() + 1);

        const selectedDate = dt.toISOString().split('T')[0];
        if (selectedDate === dayBefore.toISOString().split('T')[0]) arrivalDay = 'before';
        else if (selectedDate === sessionDate.toISOString().split('T')[0]) arrivalDay = 'primary';
        else if (selectedDate === dayAfter.toISOString().split('T')[0]) arrivalDay = 'after';

        arrivalTime = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      }
    }

    try {
      await sessionsApi.confirm(sessionId, arrivalDay, arrivalTime, needsAssistance);
      await refreshSessions();
      showAlert('Session confirmed!');
      onClose();
    } catch (err) {
      showAlert('Failed to confirm session', 'error');
    }
  };

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Confirm Session</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={needsAssistance}
                onChange={(e) => setNeedsAssistance(e.target.checked)}
              />
              I need Max's assistance (to help get started with the lawn mower and show me the ropes)
            </label>
          </div>
          {needsAssistance && (
            <div className="form-group">
              <label>When will you arrive?</label>
              <input
                type="datetime-local"
                className="input"
                value={arrivalDateTime}
                onChange={(e) => setArrivalDateTime(e.target.value)}
                required
              />
              <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                Select a time within the 3-day session window
              </small>
            </div>
          )}
          <div className="session-actions">
            <button type="submit" className="btn btn-success">Confirm</button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

