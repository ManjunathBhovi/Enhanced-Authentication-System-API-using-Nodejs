const User = require('../models/User');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 },
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }
}).single('profilePhoto');

function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
}

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send('User already exists.');
    }

    const user = new User({ name, email, password });
    await user.save();

    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).send({ token });
  } catch (error) {
    res.status(500).send('Server error');
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send('Invalid credentials');
    }

    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).send({ token });
  } catch (error) {
    res.status(500).send('Server error');
  }
};

const updateProfile = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).send(err);
    }
    const { name, bio, phone } = req.body;
    const profilePhoto = req.file ? `/uploads/${req.file.filename}` : undefined;

    try {
      const updates = { name, bio, phone };
      if (profilePhoto) {
        updates.profilePhoto = profilePhoto;
      }
      const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
      res.status(200).send(user);
    } catch (error) {
      res.status(500).send('Server error');
    }
  });
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).send('User not found');
    }
    res.status(200).send(user);
  } catch (error) {
    res.status(500).send('Server error');
  }
};

module.exports = {
  registerUser,
  loginUser,
  updateProfile,
  getProfile
};
