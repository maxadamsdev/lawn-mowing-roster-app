import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '../types';
import { usersApi, sessionsApi } from '../services/api';
import '../components/Alert.css';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  sessions: Session[];
  isLoading: boolean;
  error: string | null;
  darkMode: boolean;
  setCurrentUser: (user: User | null) => void;
  setDarkMode: (darkMode: boolean) => void;
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
  // Initialize currentUser from localStorage immediately to persist login state
  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
    } catch (e) {
      localStorage.removeItem('currentUser');
    }
    return null;
  });

  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  // Load dark mode preference from localStorage, default to false
  const [darkMode, setDarkModeState] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  // Wrapper for setCurrentUser that also persists to localStorage
  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  };

  const setDarkMode = (value: boolean) => {
    setDarkModeState(value);
    localStorage.setItem('darkMode', value.toString());
    document.documentElement.classList.toggle('dark', value);
  };

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
      
      // Load users and sessions
      const [usersResult] = await Promise.all([
        usersApi.getAll().then(r => r.users),
        refreshSessions()
      ]);
      
      // Update users state
      setUsers(usersResult);
      
      // Verify stored user still exists in the users list
      // Read directly from localStorage to check the persisted user
      try {
        const storedUserJson = localStorage.getItem('currentUser');
        if (storedUserJson) {
          const storedUser: User = JSON.parse(storedUserJson);
          const userStillExists = usersResult.some((u: User) => u._id === storedUser._id);
          
          if (!userStillExists) {
            // User no longer exists, clear login state
            setCurrentUser(null);
          }
        }
      } catch (e) {
        // Invalid stored user, clear it
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
      }
      
      setIsLoading(false);
    };

    initialize();
    
    // Apply dark mode class on mount
    document.documentElement.classList.toggle('dark', darkMode);
  }, []);


  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        sessions,
        isLoading,
        error,
        darkMode,
        setCurrentUser,
        setDarkMode,
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

