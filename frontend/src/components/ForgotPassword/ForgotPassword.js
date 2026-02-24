// frontend/src/components/ForgotPassword/ForgotPassword.js

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { passwordResetAPI } from '../../services/api';
import './ForgotPassword.css';

// ⭐ FALLBACK: Hardcoded security questions in case API fails
const FALLBACK_QUESTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is your favorite book?",
  "What was your childhood nickname?"
];

const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // ⭐ Get email from login page if passed
  const emailFromLogin = location.state?.email || '';
  
  const [formData, setFormData] = useState({
    email: emailFromLogin, // ⭐ Autofill email
    securityQuestion: '',
    securityAnswer: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [securityQuestions, setSecurityQuestions] = useState(FALLBACK_QUESTIONS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch security questions on mount
  useEffect(() => {
    fetchSecurityQuestions();
  }, []);

  const fetchSecurityQuestions = async () => {
    try {
      console.log('🔍 Fetching security questions from API...');
      const response = await passwordResetAPI.getSecurityQuestions();
      console.log('✅ Security questions response:', response.data);
      
      if (response.data && response.data.questions) {
        setSecurityQuestions(response.data.questions);
        console.log('✅ Security questions loaded:', response.data.questions);
      }
    } catch (err) {
      console.error('❌ Failed to fetch security questions:', err);
      console.log('ℹ️ Using fallback security questions');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.email || !formData.securityQuestion || !formData.securityAnswer || !formData.newPassword || !formData.confirmPassword) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Submitting password reset...', {
        email: formData.email,
        securityQuestion: formData.securityQuestion
      });

      const response = await passwordResetAPI.resetPassword({
        email: formData.email,
        securityQuestion: formData.securityQuestion,
        securityAnswer: formData.securityAnswer,
        newPassword: formData.newPassword
      });

      console.log('✅ Password reset response:', response.data);

      if (response.data.success) {
        setSuccess('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      console.error('❌ Password reset error:', err);
      console.error('❌ Error response:', err.response);
      
      // ⭐ Better error messages
      if (err.response?.status === 500) {
        setError('Server error. Please make sure you have set a security question during registration.');
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <h2>Account Verification</h2>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your registered email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Security Question</label>
            <select
              name="securityQuestion"
              value={formData.securityQuestion}
              onChange={handleChange}
              required
            >
              <option value="">Select your security question</option>
              {securityQuestions.map((question, index) => (
                <option key={index} value={question}>
                  {question}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Security Answer</label>
            <input
              type="text"
              name="securityAnswer"
              placeholder="Enter your answer"
              value={formData.securityAnswer}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              name="newPassword"
              placeholder="Create new password"
              value={formData.newPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>

          <div className="login-link">
            Remember your password? <span onClick={() => navigate('/login')}>Log in</span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;