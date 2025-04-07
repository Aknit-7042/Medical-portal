const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Use a persistent secret key
const JWT_SECRET = 'your-super-secret-jwt-key-2025';

// Store authorized user credentials
const AUTHORIZED_USERS = {
  'pmatwa@icloud.com': 'pass-10041998'
};

// Set the authorized email and password
function setAuthorizedUser(email, password) {
  AUTHORIZED_USERS[email] = password;
}

function authenticateUser(email, password) {
  // Check if the email exists and password matches
  const authorizedPassword = AUTHORIZED_USERS[email];
  if (!authorizedPassword || authorizedPassword !== password) {
    return null;
  }

  // Generate JWT token valid for 30 days
  return jwt.sign({ email }, JWT_SECRET, { expiresIn: '30d' });
}

function validateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verify the user is still authorized
    if (!AUTHORIZED_USERS[decoded.email]) {
      throw new Error('User no longer authorized');
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = {
  authenticateUser,
  validateToken,
  setAuthorizedUser
};
