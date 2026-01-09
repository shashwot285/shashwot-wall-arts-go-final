// frontend/src/components/Navbar/Navbar.js

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ isAuthenticated, user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    setShowUserMenu(false);
    onLogout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🎨</span>
          <span className="logo-text">WALL ART GO</span>
        </Link>

        <div className="navbar-menu">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Home
          </Link>

          {isAuthenticated ? (
            <div className="user-menu-container">
              <button
                className="user-menu-button"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <span className="user-avatar">
                  {user?.username?.charAt(0).toUpperCase() || 
                   user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
                <span className="user-name">
                  {user?.username || user?.email?.split('@')[0] || 'User'}
                </span>
                <span className="dropdown-arrow">▼</span>
              </button>

              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <p className="user-email">{user?.email}</p>
                    {user?.role === 'admin' && <span className="admin-badge">Admin</span>}
                  </div>

                  <Link
                    to={user?.role === 'admin' ? '/admin/bookings' : '/my-bookings'}
                    className="dropdown-item"
                    onClick={() => setShowUserMenu(false)}
                  >
                    {user?.role === 'admin' ? '📁 Bookings' : '📁 My Bookings'}
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="dropdown-item logout"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/signup" className="nav-button">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;