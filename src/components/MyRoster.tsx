import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SessionModal } from './SessionModal';
import { formatDateShort, formatDateRange, getSessionDateRange, isPastDate } from '../utils/dateUtils';
import { Card } from './ui';
import './Roster.css';

export const MyRoster: React.FC = () => {
  const { sessions, currentUser } = useApp();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const mySessions = sessions
    .filter(s => s.userId === currentUser?._id)
    .filter(s => !isPastDate(s.date))
    .sort((a, b) => {
      // Simple string comparison works since dates are in YYYY-MM-DD format
      return a.date.localeCompare(b.date);
    });

  return (
    <>
      <Card className="roster-section">
        <h2>📋 My Upcoming Sessions</h2>
        {mySessions.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
            No upcoming sessions assigned to you.
          </p>
        ) : (
          <div className="roster-list">
            {mySessions.map(session => {
              const { dayBeforeStr, dayAfterStr } = getSessionDateRange(session.date);
              const primaryDate = formatDateShort(session.date);
              const dateRange = formatDateRange(dayBeforeStr, dayAfterStr);

              return (
                <div
                  key={session._id}
                  className={`roster-item ${session.confirmed ? 'confirmed' : 'unconfirmed'}`}
                  onClick={() => setSelectedDate(session.date)}
                  style={{ cursor: 'pointer' }}
                >
                  <div>
                    <div className="roster-date">{primaryDate}</div>
                    <div className="roster-status" style={{ fontSize: '14px', color: '#666' }}>
                      {dateRange}
                    </div>
                  </div>
                  <div>
                    {session.confirmed ? (
                      <span style={{ color: '#48bb78', fontWeight: 600 }}>✓ Confirmed</span>
                    ) : (
                      <span style={{ color: '#f56565', fontWeight: 600 }}>Pending Confirmation</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {selectedDate && (
        <SessionModal
          dateStr={selectedDate}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </>
  );
};

