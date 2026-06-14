const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) => (
  jwt.sign({ id: userId }, process.env.JWT_SECRET || 'devtinder-local-secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
);

const cleanList = (values = []) => [
  ...new Set(values.map((value) => String(value).trim()).filter(Boolean)),
];

const serializeUser = (user) => ({
  id: user._id,
  _id: user._id,
  name: user.name || user.username,
  username: user.username,
  email: user.email,
  githubProfile: user.githubProfile,
  githubHandle: user.githubHandle,
  bio: user.bio,
  skills: user.techStack || [],
  techStack: user.techStack || [],
  topSkills: user.topSkills || [],
  lookingFor: user.lookingFor || [],
  avatar: user.avatar || user.avatarUrl,
  avatarUrl: user.avatarUrl || user.avatar,
  projects: user.projects || [],
  isAvailable: user.isAvailable,
});

const makeUniqueUsername = async (name) => {
  const base = name.trim();
  let candidate = base;
  let suffix = 1;

  while (await User.exists({ username: candidate })) {
    suffix += 1;
    candidate = `${base} ${suffix}`;
  }

  return candidate;
};

exports.signup = async (req, res) => {
  try {
    const { name, email, password, githubProfile, bio, skills, lookingFor } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const cleanSkills = cleanList(Array.isArray(skills) ? skills : []);
    const githubHandle = githubProfile
      ? githubProfile.replace(/^https?:\/\/(www\.)?github\.com\//i, '').replace(/^@/, '').split('/')[0]
      : '';

    const username = await makeUniqueUsername(name);

    const user = await User.create({
      name: name.trim(),
      username,
      email: normalizedEmail,
      password: hashedPassword,
      githubProfile: githubProfile || '',
      githubHandle,
      bio: bio || '',
      techStack: cleanSkills,
      topSkills: cleanSkills.slice(0, 3),
      lookingFor: cleanList(Array.isArray(lookingFor) ? lookingFor : []),
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token: generateToken(user._id),
      user: serializeUser(user),
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((error) => error.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'That name or email is already in use' });
    }
    console.error('Signup error:', err.message);
    res.status(500).json({ success: false, message: 'Server error during signup' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: generateToken(user._id),
      user: serializeUser(user),
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user: serializeUser(user) });
  } catch (err) {
    console.error('GetMe error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
