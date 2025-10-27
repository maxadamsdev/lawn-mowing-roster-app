import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { authApi } from '../services/api';

export const Login: React.FC = () => {
  const { users, setCurrentUser, showAlert } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [password, setPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState(users);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter((u) =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setFilteredUsers(users);
      setShowDropdown(false);
    }
  }, [searchTerm, users]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      showAlert('Please select a user', 'error');
      return;
    }

    const user = users.find(u => u.name === selectedUser);
    if (!user) {
      showAlert('User not found', 'error');
      return;
    }

    if (user.isAdmin && !password) {
      showAlert('Password required for admin users', 'error');
      return;
    }

    try {
      const { user: loggedInUser } = await authApi.login(selectedUser, password || undefined);
      setCurrentUser(loggedInUser);
      showAlert(`Welcome, ${loggedInUser.name}!`);
    } catch (err) {
      showAlert('Login failed. Please check your credentials.', 'error');
    }
  };

  const selectUser = (userName: string) => {
    setSelectedUser(userName);
    setSearchTerm(userName);
    setShowDropdown(false);
    
    const user = users.find(u => u.name === userName);
    if (user && user.isAdmin) {
      setShowPasswordInput(true);
    } else {
      setShowPasswordInput(false);
      setPassword('');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🌱 Lawn Mowing Roster</h1>
        <p className="login-subtitle">Headingly Center</p>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Select Your Name:</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowDropdown(filteredUsers.length > 0)}
                placeholder="Type to search or select..."
                autoComplete="off"
              />
              
              {showDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '2px solid #ddd',
                  borderTop: 'none',
                  borderRadius: '0 0 8px 8px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                }}>
                  {filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => selectUser(user.name)}
                      style={{
                        padding: '12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #eee',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <div style={{ fontWeight: 600, color: '#333' }}>{user.name}</div>
                      <div style={{ fontSize: '14px', color: '#666' }}>{user.email}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {showPasswordInput && (
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
              />
            </div>
          )}
          
          <button type="submit" className="btn btn-primary">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

