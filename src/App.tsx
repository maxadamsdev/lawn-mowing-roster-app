import { useState } from 'react';
import { useApp } from './context/AppContext';
import { Login } from './components/Login';
import { Calendar } from './components/Calendar';
import { MyRoster } from './components/MyRoster';
import { AdminPanel } from './components/AdminPanel';
import { AdminDashboard } from './components/AdminDashboard';
import './App.css';
import './components/Layout.css';
import './components/ui/Button.css';
import './components/Alert.css';

type Page = 'home' | 'admin-dashboard';

function App() {
  const { currentUser, setCurrentUser, isLoading, darkMode, setDarkMode } = useApp();
  const [currentPage, setCurrentPage] = useState<Page>('home');

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setCurrentPage('home');
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>🌱 Lawn Mowing (Headingly Center)</h1>
          <p>2 Headingly Lane, Richmond 7020, New Zealand</p>
        </div>
        <div className="header-right">
          {currentUser.isAdmin && (
            <nav className="app-nav">
              <button 
                className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
                onClick={() => setCurrentPage('home')}
              >
                📅 Calendar
              </button>
              <button 
                className={`nav-link ${currentPage === 'admin-dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentPage('admin-dashboard')}
              >
                ⚙️ Admin
              </button>
            </nav>
          )}
          <button 
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <div className="user-badge">
            <strong>{currentUser.name}</strong>
            {currentUser.isAdmin && <span className="admin-badge">Admin</span>}
          </div>
          <button className="btn btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="app-main">
        {currentPage === 'home' ? (
          <>
            <div className="main-content">
              <Calendar />
              {!currentUser.isAdmin && <MyRoster />}
            </div>
            
            {currentUser.isAdmin && (
              <aside className="sidebar">
                <AdminPanel />
              </aside>
            )}
          </>
        ) : (
          <div className="main-content full-width">
            <AdminDashboard />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

