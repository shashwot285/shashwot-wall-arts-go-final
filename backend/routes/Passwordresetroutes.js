const express = require('express');
const router = express.Router();
const passwordResetController = require('../controllers/passwordResetController');

// Get list of security questions
router.get('/security-questions', passwordResetController.getSecurityQuestions);

// Reset password - single endpoint (NO verification step)
router.post('/reset-password', passwordResetController.resetPassword);

// Update security question (for existing users)
router.post('/update-security-question', passwordResetController.updateSecurityQuestion);

module.exports = router;