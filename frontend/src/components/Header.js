import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/global.css';

const Header = ({ isAuthenticated, user, onLogout, toggleSidebar }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await onLogout();
    navigate('/login');
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <header className="header">
      <div className="header-left">
        {isAuthenticated && (
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <span className="material-icons">menu</span>
          </button>
        )}
        <Link to="/" className="logo">
          <img src="/assets/logo.png" alt="NexaCore Logo" />
          <span>NexaCore</span>
        </Link>
      </div>
      
      <nav className="main-nav">
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/explorer">Explorer</Link></li>
          {isAuthenticated ? (
            <>
              <li><Link to="/wallet">Wallet</Link></li>
              <li><Link to="/dashboard">Dashboard</Link></li>
            </>
          ) : (
            <li><Link to="/support">Support</Link></li>
          )}
        </ul>
      </nav>
      
      <div className="header-right">
        {isAuthenticated ? (
          <div className="user-menu">
            <button className="user-button" onClick={toggleDropdown}>
              <img 
                src={user?.avatar || '/assets/images/default-avatar.png'} 
                alt={user?.name || 'User'} 
                className="user-avatar" 
              />
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="material-icons">arrow_drop_down</span>
            </button>
            
            {dropdownOpen && (
              <div className="dropdown-menu">
                <Link to="/profile" onClick={() => setDropdownOpen(false)}>
                  <span className="material-icons">person</span> Profile
                </Link>
                <Link to="/settings" onClick={() => setDropdownOpen(false)}>
                  <span className="material-icons">settings</span> Settings
                </Link>
                <div className="dropdown-divider"></div>
                <button onClick={handleLogout} className="logout-button">
                  <span className="material-icons">logout</span> Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="auth-buttons">
            <Link to="/login" className="btn btn-outline">Login</Link>
            <Link to="/register" className="btn btn-primary">Register</Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;