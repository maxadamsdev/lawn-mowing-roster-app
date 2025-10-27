import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SessionModal } from './SessionModal';
import { formatDateShort, formatDateRange, getSessionDateRange } from '../utils/dateUtils';
import { Card } from './ui';

export const MyRoster: React.FC = () => {
  const { sessions, currentUser } = useApp();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const isPastDate = (dateString: string): boolean => {
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const mySessions = sessions
    .filter(s => s.userId === currentUser?._id)
    .filter(s => !isPastDate(s.date))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
              const dateRange = `${formatDateShort(dayBeforeStr)} - ${formatDateShort(dayAfterStr)}`;

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

