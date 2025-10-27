import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SessionModal } from './SessionModal';
import { getCalendarDays, getSessionDateRange } from '../utils/dateUtils';
import { Card } from './ui';

export const Calendar: React.FC = () => {
  const { sessions, users } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const calendarDays = getCalendarDays(year, month);

  const getSessionForDate = (dateStr: string) => {
    return sessions.find((s) => {
      const { dayBeforeStr, primaryDateStr, dayAfterStr } = getSessionDateRange(s.date);
      return dateStr === dayBeforeStr || dateStr === primaryDateStr || dateStr === dayAfterStr;
    });
  };

  const renderCalendarDays = () => {
    return calendarDays.map((day, index) => {
      if (!day.isCurrentMonth) {
        return <div key={`empty-${index}`} className="calendar-day other-month">{day.day}</div>;
      }

      const session = getSessionForDate(day.date);
      const user = session?.userId ? users.find((u) => u._id === session.userId) : null;
      const isPrimaryDate = session && session.date === day.date;

      let className = 'calendar-day';
      if (session) {
        if (!session.userId) {
          className += ' unassigned';
        } else if (session.confirmed) {
          className += ' confirmed';
        } else {
          className += ' session';
        }
      }

      const today = new Date();
      const isToday = 
        day.date === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      if (isToday) className += ' today';

      return (
        <div
          key={day.date}
          className={className}
          onClick={() => session && setSelectedDate(session.date)}
        >
          <div className="day-number">{day.day}</div>
          {session && user && (
            <div className="day-info">
              {user.name}
              {isPrimaryDate && ' (Primary)'}
            </div>
          )}
          {session && !user && (
            <div className="day-info">Unassigned</div>
          )}
        </div>
      );
    });
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  return (
    <>
      <Card className="calendar-container">
        <div className="calendar-header">
          <h2>📅 Session Calendar</h2>
          <div className="calendar-nav">
            <button onClick={previousMonth}>← Previous</button>
            <span className="current-month">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={nextMonth}>Next →</button>
          </div>
        </div>

        <div className="calendar-legend">
          <div className="legend-item">
            <span className="legend-color unassigned"></span>
            <span>Unassigned</span>
          </div>
          <div className="legend-item">
            <span className="legend-color assigned"></span>
            <span>Assigned</span>
          </div>
          <div className="legend-item">
            <span className="legend-color confirmed"></span>
            <span>Confirmed</span>
          </div>
          <div className="legend-item">
            <span className="legend-color today"></span>
            <span>Today</span>
          </div>
        </div>

        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="calendar-day header">
              {day}
            </div>
          ))}
          {renderCalendarDays()}
        </div>
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

