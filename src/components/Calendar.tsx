import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SessionModal } from './SessionModal';
import { getCalendarDays, getSessionDateRange, isToday } from '../utils/dateUtils';
import { Card } from './ui';
import './Calendar.css';

export const Calendar: React.FC = () => {
  const { sessions, users } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [clickedDay, setClickedDay] = useState<string | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const calendarDays = getCalendarDays(year, month);

  // Get all visible dates in the calendar (including prev/next month overflow)
  const visibleDates = calendarDays.map(d => d.date);

  const getSessionForDate = (dateStr: string) => {
    // Find sessions where any part of the session (day-before, primary, day-after) 
    // falls within the visible calendar range
    return sessions.find((s) => {
      const { dayBeforeStr, primaryDateStr, dayAfterStr } = getSessionDateRange(s.date);
      const sessionDates = [dayBeforeStr, primaryDateStr, dayAfterStr];
      
      // Check if any part of this session is visible in the calendar
      const hasVisibleDate = sessionDates.some(sd => visibleDates.includes(sd));
      // And check if this specific date is part of the session
      return hasVisibleDate && sessionDates.includes(dateStr);
    });
  };
  
  // Calculate gradient style for a session tile - simple vertical gradient for all tiles
  const getGradientStyle = (dateStr: string, session: any) => {
    if (!session) return {};

    // Get base colors based on session type
    let color1, color2;
    if (!session.userId) {
      color1 = '#fc8181';
      color2 = '#f56565';
    } else if (session.confirmed) {
      color1 = '#48bb78';
      color2 = '#38a169';
    } else {
      color1 = '#f97316';
      color2 = '#ea580c';
    }

    // Simple vertical gradient for all tiles in the session
    return {
      background: `linear-gradient(to bottom, ${color1}, ${color2})`
    } as React.CSSProperties;
  };

  const renderCalendarDays = () => {
    return calendarDays.map((day, index) => {
      // Check for session even for adjacent months (to show disabled sessions)
      const sessionForAnyMonth = getSessionForDate(day.date);
      
      if (!day.isCurrentMonth) {
        // Show session if it exists, but mark as disabled
        const className = sessionForAnyMonth 
          ? 'calendar-day other-month adjacent-month-session' 
          : 'calendar-day other-month';
        return (
          <div key={`empty-${index}`} className={className}>
            <div className="day-number">{day.day}</div>
            {sessionForAnyMonth && (
              <div className="day-info">
                {sessionForAnyMonth.userId 
                  ? users.find(u => u._id === sessionForAnyMonth.userId)?.name || 'Assigned'
                  : 'Unassigned'}
              </div>
            )}
          </div>
        );
      }

      const session = getSessionForDate(day.date);
      const user = session?.userId ? users.find((u) => u._id === session.userId) : null;
      const isPrimaryDate = session && session.date === day.date;
      
      // Determine position in date range for visual merging
      // Check chronologically adjacent days (one day before/after) that belong to THIS session's range
      let positionInRange = '';
      if (session) {
        // Get this session's date range
        const { dayBeforeStr, primaryDateStr, dayAfterStr } = getSessionDateRange(session.date);
        
        // Find index of current day in calendar
        const currentIndex = calendarDays.findIndex(d => d.date === day.date);
        
        // Check if the previous day exists in calendar AND is part of THIS session's range
        const prevDay = currentIndex > 0 ? calendarDays[currentIndex - 1] : null;
        const hasPrev = prevDay && 
          (prevDay.date === dayBeforeStr || prevDay.date === primaryDateStr || prevDay.date === dayAfterStr);
        
        // Check if the next day exists in calendar AND is part of THIS session's range
        const nextDay = currentIndex < calendarDays.length - 1 ? calendarDays[currentIndex + 1] : null;
        const hasNext = nextDay && 
          (nextDay.date === dayBeforeStr || nextDay.date === primaryDateStr || nextDay.date === dayAfterStr);
        
        // Determine position based on adjacent days in the same session
        if (hasPrev && hasNext) {
          positionInRange = ' range-middle'; // Center tile - has days before and after
        } else if (hasNext) {
          positionInRange = ' range-start'; // Leftmost tile - only has day after
        } else if (hasPrev) {
          positionInRange = ' range-end'; // Rightmost tile - only has day before
        }
      }
      
      // Highlight the primary date when any day in the session is clicked
      const isSelected = clickedDay && isPrimaryDate && session.date === clickedDay;

      let className = 'calendar-day';
      if (session) {
        if (!session.userId) {
          className += ' unassigned';
        } else if (session.confirmed) {
          className += ' confirmed';
        } else {
          className += ' session';
        }
        className += positionInRange;
      }

      if (isToday(day.date)) className += ' today';
      if (isSelected && isPrimaryDate) className += ' selected';

      // Check if this is a session from adjacent month (should be disabled but visible)
      const isAdjacentMonthSession = session && !day.isCurrentMonth;
      
      // Calculate gradient style for ALL session tiles
      let style: React.CSSProperties = {};

      if (session) {
        const gradientStyle = getGradientStyle(day.date, session);
        if (gradientStyle && Object.keys(gradientStyle).length > 0) {
          style = gradientStyle;
        }
      }
      
      return (
        <div
          key={day.date}
          className={className + (isAdjacentMonthSession ? ' adjacent-month-session' : '')}
          style={style}
          onClick={() => {
            if (session && !isAdjacentMonthSession) {
              // Set clickedDay to the clicked date, but selectedDate to the primary date
              setClickedDay(session.date);
              setSelectedDate(session.date);
            }
          }}
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
          onClose={() => {
            setSelectedDate(null);
            setClickedDay(null);
          }}
        />
      )}
    </>
  );
};

