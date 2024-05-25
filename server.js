require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;
const userRoutes = require('./routes/userRoutes');
const User = require('./models/User');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Express session middleware
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Passport GitHub Strategy Configuration
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/api/users/login/github/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ githubId: profile.id });

    if (!user) {
      user = new User({
        name: profile.displayName || profile.username,
        email: profile.emails[0].value,
        githubId: profile.id,
        provider: 'github'
      });
      await user.save();
    }
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Passport serialization and deserialization
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Routes
app.use('/api/users', userRoutes);

// Sign out route
app.get('/api/users/logout', (req, res) => {
  req.logout(); // Passport method to log out the user
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Failed to logout');
    }
    res.clearCookie('connect.sid'); // Clear the session cookie
    res.status(200).send('Logged out successfully');
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
