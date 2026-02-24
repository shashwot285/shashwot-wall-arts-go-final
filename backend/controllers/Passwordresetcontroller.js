const bcrypt = require('bcryptjs');
const db = require('../config/database');

// Security questions list
const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is your favorite book?",
  "What was your childhood nickname?"
];

// Get security questions list
exports.getSecurityQuestions = (req, res) => {
  res.json({ questions: SECURITY_QUESTIONS });
};

// ⭐ UNIVERSAL PASSWORD RESET - Works for ANY user
exports.resetPassword = async (req, res) => {
  try {
    const { email, securityQuestion, securityAnswer, newPassword } = req.body;

    console.log('🔄 Password reset attempt for:', email);

    // Validation
    if (!email || !securityQuestion || !securityAnswer || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Validate question is in allowed list
    if (!SECURITY_QUESTIONS.includes(securityQuestion)) {
      return res.status(400).json({ error: 'Invalid security question' });
    }

    // Find user by email
    const result = await db.query(
      'SELECT user_id, email, security_question, security_answer FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      console.log('❌ User not found:', email);
      return res.status(404).json({ error: 'No account found with this email address' });
    }

    const user = result.rows[0];
    console.log('✅ User found:', email);

    // ⭐ NEW: Check if user has ANY security question set
    if (!user.security_question || !user.security_answer) {
      console.log('❌ No security question set for:', email);
      return res.status(400).json({ 
        error: 'This account does not have a security question set. Please sign up again or contact support.' 
      });
    }

    console.log('📋 User\'s registered security question:', user.security_question);
    console.log('📋 User selected security question:', securityQuestion);

    // ⭐ KEY CHANGE: Verify the user selected THE SAME question they registered with
    if (user.security_question !== securityQuestion) {
      console.log('❌ Wrong security question selected');
      return res.status(400).json({ 
        error: 'This is not the security question you chose during registration. Please select the correct one.' 
      });
    }

    console.log('✅ Correct security question selected');

    // Verify security answer matches
    const isAnswerValid = await bcrypt.compare(
      securityAnswer.toLowerCase().trim(),
      user.security_answer
    );

    if (!isAnswerValid) {
      console.log('❌ Incorrect security answer');
      return res.status(401).json({ error: 'Incorrect security answer' });
    }

    console.log('✅ Security answer correct');

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [hashedPassword, user.user_id]
    );

    console.log('✅ Password reset successful for:', user.email);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to reset password: ' + error.message });
  }
};

// Update user's security question (for existing users)
exports.updateSecurityQuestion = async (req, res) => {
  try {
    const { userId, securityQuestion, securityAnswer } = req.body;

    if (!userId || !securityQuestion || !securityAnswer) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate question is in allowed list
    if (!SECURITY_QUESTIONS.includes(securityQuestion)) {
      return res.status(400).json({ error: 'Invalid security question' });
    }

    // Hash the answer
    const hashedAnswer = await bcrypt.hash(securityAnswer.toLowerCase().trim(), 10);

    // Update user
    await db.query(
      'UPDATE users SET security_question = $1, security_answer = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3',
      [securityQuestion, hashedAnswer, userId]
    );

    res.json({
      success: true,
      message: 'Security question updated successfully'
    });

  } catch (error) {
    console.error('❌ Update security question error:', error);
    res.status(500).json({ error: 'Failed to update security question' });
  }
};