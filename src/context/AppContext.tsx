import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '../types';
import { usersApi, sessionsApi } from '../services/api';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  sessions: Session[];
  isLoading: boolean;
  error: string | null;
  setCurrentUser: (user: User | null) => void;
  refreshUsers: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  showAlert: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

interface Alert {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const showAlert = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    }, 5000);
  };

  const refreshUsers = async () => {
    try {
      const { users: fetchedUsers } = await usersApi.getAll();
      setUsers(fetchedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
      showAlert('Failed to fetch users', 'error');
    }
  };

  const refreshSessions = async () => {
    try {
      const { sessions: fetchedSessions } = await sessionsApi.getAll();
      setSessions(fetchedSessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
      showAlert('Failed to fetch sessions', 'error');
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      await Promise.all([refreshUsers(), refreshSessions()]);
      
      // Check for stored user
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          setCurrentUser(JSON.parse(storedUser));
        } catch (e) {
          localStorage.removeItem('currentUser');
        }
      }
      
      setIsLoading(false);
    };

    initialize();
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        sessions,
        isLoading,
        error,
        setCurrentUser,
        refreshUsers,
        refreshSessions,
        showAlert,
      }}
    >
      {children}
      <div className="alert-container">
        {alerts.map((alert) => (
          <div key={alert.id} className={`alert alert-${alert.type}`}>
            <span className="alert-icon">
              {alert.type === 'success' && '✓'}
              {alert.type === 'error' && '✕'}
              {alert.type === 'info' && 'ℹ'}
            </span>
            <span className="alert-message">{alert.message}</span>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};

