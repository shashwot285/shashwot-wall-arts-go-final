// frontend/src/components/Auth/Signup.js

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './Auth.css';

const Signup = ({ setIsAuthenticated, setUser }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const { username, email, password, confirmPassword, full_name, phone } = formData;

  // ⭐ DEBUG: Log when component mounts
  useEffect(() => {
    console.log('🔍 SIGNUP COMPONENT MOUNTED');
    console.log('🔍 Current URL:', window.location.href);
    console.log('🔍 Search params string:', window.location.search);
    console.log('🔍 Redirect param value:', searchParams.get('redirect'));
    console.log('🔍 All params:', Object.fromEntries(searchParams.entries()));
  }, [searchParams]);

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
      case 'username':
        if (!value.trim()) {
          error = 'Username is required';
        } else if (value.length < 3) {
          error = 'Username must be at least 3 characters';
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          error = 'Username can only contain letters, numbers, and underscores';
        }
        break;

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

      case 'confirmPassword':
        if (!value) {
          error = 'Please confirm your password';
        } else if (value !== formData.password) {
          error = 'Passwords do not match';
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

    if (!username.trim()) {
      errors.username = 'Username is required';
    } else if (username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }

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

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      console.log('📝 Attempting signup...');
      console.log('🔍 BEFORE SIGNUP - Redirect param:', searchParams.get('redirect'));
      
      const response = await authAPI.register({ 
        username, 
        email, 
        password, 
        full_name, 
        phone 
      });
      
      console.log('✅ Signup response:', response.data);

      if (response.data.success) {
        const userData = response.data.data;
        
        console.log('👤 User data to store:', userData);
        
        const userToStore = {
          user_id: userData.user_id,
          username: userData.username,
          email: userData.email,
          full_name: userData.full_name,
          phone: userData.phone,
          role: userData.role,
          token: userData.token
        };
        
        console.log('💾 Storing in localStorage:', userToStore);
        localStorage.setItem('user', JSON.stringify(userToStore));
        
        setUser(userToStore);
        setIsAuthenticated(true);
        
        console.log('✅ Signup successful, state updated');
        
        const redirectTo = searchParams.get('redirect') || '/';
        console.log('🔄 FINAL CHECK - searchParams.get redirect:', searchParams.get('redirect'));
        console.log('🔄 Redirecting to:', redirectTo);
        console.log('🔍 Full URL now:', window.location.href);
        
        setTimeout(() => {
          navigate(redirectTo, { replace: true });
        }, 100);
      }
    } catch (err) {
      console.error('❌ Signup error:', err);
      setError(err.response?.data?.message || 'Registration failed. Try a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card signup-card">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p className="auth-subtitle">Join Wall Arts today</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={onSubmit} className="auth-form" noValidate>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">Username *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={username}
                onChange={onChange}
                onBlur={handleBlur}
                placeholder="Choose a username"
                className={`form-input ${fieldErrors.username ? 'error' : ''}`}
              />
              {fieldErrors.username && (
                <span className="field-error">{fieldErrors.username}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
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
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="full_name">Full Name</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={full_name}
                onChange={onChange}
                placeholder="Your full name"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={phone}
                onChange={onChange}
                placeholder="+977-XXXXXXXXXX"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={onChange}
                onBlur={handleBlur}
                placeholder="Min 6 characters"
                className={`form-input ${fieldErrors.password ? 'error' : ''}`}
              />
              {fieldErrors.password && (
                <span className="field-error">{fieldErrors.password}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={onChange}
                onBlur={handleBlur}
                placeholder="Confirm password"
                className={`form-input ${fieldErrors.confirmPassword ? 'error' : ''}`}
              />
              {fieldErrors.confirmPassword && (
                <span className="field-error">{fieldErrors.confirmPassword}</span>
              )}
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-switch">
            Already have an account? <Link to={`/login${searchParams.get('redirect') ? `?redirect=${searchParams.get('redirect')}` : ''}`}>Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;