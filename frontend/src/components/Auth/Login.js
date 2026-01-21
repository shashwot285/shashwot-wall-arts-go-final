// frontend/src/components/Auth/Login.js

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './Auth.css';

const Login = ({ setIsAuthenticated, setUser }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const { email, password } = formData;

  // ⭐ NEW: If already authenticated, redirect immediately
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const redirectTo = searchParams.get('redirect') || '/';
      console.log('ℹ️ Already authenticated, redirecting to:', redirectTo);
      navigate(redirectTo, { replace: true });
    }
  }, [navigate, searchParams]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: '' });
    }
  };

  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'email':
        if (!value.trim()) {
          error = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Please enter a valid email address';
        }
        break;

      case 'password':
        if (!value) {
          error = 'Password is required';
        } else if (value.length < 6) {
          error = 'Password must be at least 6 characters';
        }
        break;

      default:
        break;
    }

    return error;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    
    if (error) {
      setFieldErrors({ ...fieldErrors, [name]: error });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    return errors;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Attempting login...');
      
      const response = await authAPI.login({ email, password });
      
      console.log('✅ Login response:', response.data);

      if (response.data.success) {
        const userData = response.data.data;
        
        console.log('👤 User data to store:', userData);
        
        const userToStore = {
          user_id: userData.user_id,
          username: userData.username,
          email: userData.email,
          full_name: userData.full_name,
          phone: userData.phone, // ⭐ ADDED: Store phone
          role: userData.role,
          token: userData.token
        };
        
        console.log('💾 Storing in localStorage:', userToStore);
        localStorage.setItem('user', JSON.stringify(userToStore));
        
        // Update parent state
        setUser(userToStore);
        setIsAuthenticated(true);
        
        console.log('✅ Login successful, state updated');
        
        // ⭐ Wait a tiny bit for state to propagate, then redirect
        const redirectTo = searchParams.get('redirect') || '/';
        console.log('🔄 Redirecting to:', redirectTo);
        
        setTimeout(() => {
          navigate(redirectTo, { replace: true });
        }, 100);
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p className="auth-subtitle">Login to your Wall Arts account</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={onSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={onChange}
              onBlur={handleBlur}
              placeholder="Enter your email"
              className={`form-input ${fieldErrors.email ? 'error' : ''}`}
            />
            {fieldErrors.email && (
              <span className="field-error">{fieldErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={onChange}
              onBlur={handleBlur}
              placeholder="Enter your password"
              className={`form-input ${fieldErrors.password ? 'error' : ''}`}
            />
            {fieldErrors.password && (
              <span className="field-error">{fieldErrors.password}</span>
            )}
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-switch">
            Don't have an account? <Link to={`/signup${searchParams.get('redirect') ? `?redirect=${searchParams.get('redirect')}` : ''}`}>Sign up here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;