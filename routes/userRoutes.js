const express = require('express');
const passport = require('passport');
const router = express.Router();
const { registerUser, loginUser, updateProfile, getProfile } = require('../controllers/userController');

// GitHub OAuth Login Route
router.get('/login/github', passport.authenticate('github', { scope: ['user:email'] }));

// GitHub OAuth Callback Route
router.get('/login/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect('/');
  }
);

// User Registration, Login, Profile Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/profile', passport.authenticate('jwt', { session: false }), updateProfile);
router.get('/profile', passport.authenticate('jwt', { session: false }), getProfile);

module.exports = router;
