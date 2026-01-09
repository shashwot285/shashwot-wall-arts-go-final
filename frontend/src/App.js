// frontend/src/App.js

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Navbar from './components/Navbar/Navbar';
import Home from './components/Home/Home';
import ArtworkDetail from './components/ArtworkDetail/ArtworkDetail';
import ArtistProfile from './components/ArtistProfile/ArtistProfile';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Booking from './components/Booking/Booking';
import MyBookings from './components/MyBookings/MyBookings';
import AdminBookings from './components/AdminBookings/AdminBookings';
import ScrollToTop from './components/shared/ScrollToTop';
import SplashScreen from './components/SplashScreen/SplashScreen';
import Footer from './components/Footer/Footer';

import './App.css';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      console.log('🔍 Checking authentication status...');
      
      // ❌ REMOVED THIS LINE - It was clearing localStorage on every page load!
      // localStorage.removeItem('user');
      
      const loggedInUser = localStorage.getItem('user');
      
      if (loggedInUser) {
        try {
          const userData = JSON.parse(loggedInUser);
          
          console.log('👤 Found user in localStorage:', userData);
          
          if (userData.user_id && userData.token) {
            setUser(userData);
            setIsAuthenticated(true);
            console.log('✅ User authenticated:', userData.email || userData.username);
          } else {
            console.warn('⚠️ Invalid user data in localStorage, clearing...');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('❌ Error parsing user data:', error);
          localStorage.removeItem('user');
        }
      } else {
        console.log('ℹ️ No user found in localStorage');
      }
      
      setLoadingUser(false);
    };
    
    checkAuth();
  }, []);

  const handleLogout = () => {
    console.log('👋 Logging out user...');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    
    if (loadingUser) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}>
          Loading...
        </div>
      );
    }
    
    if (!isAuthenticated) {
      console.log('🚫 Access denied - redirecting to login');
      console.log('📍 Saving redirect path:', location.pathname);
      return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
    }
    
    return children;
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="App">
        <ScrollToTop />

        <Navbar
          isAuthenticated={isAuthenticated}
          user={user}
          onLogout={handleLogout}
        />

        <Routes>
          <Route
            path="/login"
            element={
              <Login
                setIsAuthenticated={setIsAuthenticated}
                setUser={setUser}
                isAuthenticated={isAuthenticated}
              />
            }
          />
          
          <Route
            path="/signup"
            element={
              isAuthenticated ? (
                <Navigate to="/" replace />
              ) : (
                <Signup
                  setIsAuthenticated={setIsAuthenticated}
                  setUser={setUser}
                />
              )
            }
          />
          
          <Route path="/" element={<Home />} />
          <Route path="/artwork/:id" element={<ArtworkDetail />} />
          <Route path="/artist/:id" element={<ArtistProfile />} />

          <Route
            path="/booking/:artworkId"
            element={
              <ProtectedRoute>
                <Booking user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <MyBookings user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute>
                <AdminBookings user={user} />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Footer isAuthenticated={isAuthenticated} user={user} />
      </div>
    </Router>
  );
}

export default App;