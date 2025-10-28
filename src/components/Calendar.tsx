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
  
  // Calculate gradient style for a session tile - creates one continuous gradient across all tiles
  const getGradientStyle = (dateStr: string, session: any) => {
    if (!session) return {};
    
    const { dayBeforeStr, primaryDateStr, dayAfterStr } = getSessionDateRange(session.date);
    const sessionDates = [dayBeforeStr, primaryDateStr, dayAfterStr];
    const visibleSessionDates = sessionDates.filter(d => visibleDates.includes(d)).sort();
    
    if (visibleSessionDates.length <= 1) return {};
    
    const totalTiles = visibleSessionDates.length;
    const tileIndex = visibleSessionDates.indexOf(dateStr);
    
    if (tileIndex === -1) return {};
    
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
    
    // Create one gradient that spans all tiles
    // Background size = totalTiles * 100% (e.g., 3 tiles = 300%)
    // Background position shifts each tile to show its portion
    // For tile 0: position = 0%, tile 1: position = -100%, tile 2: position = -200%
    const backgroundSize = `${totalTiles * 100}% 100%`;
    const backgroundPosition = `${-(tileIndex * 100)}% 0%`;
    
    // Return style object - inline styles have highest specificity in React
    return {
      background: `linear-gradient(to right, ${color1} 0%, ${color2} 100%)`,
      backgroundSize: backgroundSize,
      backgroundPosition: backgroundPosition,
      backgroundRepeat: 'no-repeat'
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
      
      // Calculate gradient style for multi-tile sessions
      // Check if this session spans multiple visible tiles
      let style: React.CSSProperties = {};
      if (session) {
        const { dayBeforeStr, primaryDateStr, dayAfterStr } = getSessionDateRange(session.date);
        const sessionDates = [dayBeforeStr, primaryDateStr, dayAfterStr];
        const visibleSessionDates = sessionDates.filter(d => visibleDates.includes(d));
        
        // If session spans multiple visible tiles, apply gradient
        if (visibleSessionDates.length > 1 && visibleSessionDates.includes(day.date)) {
          const gradientStyle = getGradientStyle(day.date, session);
          if (Object.keys(gradientStyle).length > 0) {
            style = gradientStyle;
          }
        }
      }

      // Check if we're applying a gradient (multi-tile session)
      const hasGradient = Object.keys(style).length > 0;
      
      return (
        <div
          key={day.date}
          className={className + (isAdjacentMonthSession ? ' adjacent-month-session' : '') + (hasGradient ? ' has-gradient' : '')}
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

