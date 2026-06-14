const express = require('express');
const router = express.Router();
const User = require('../models/User');

const cleanList = (values = [], limit) => {
  const cleanValues = [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
  return limit ? cleanValues.slice(0, limit) : cleanValues;
};

// Create a new user
router.post('/', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'username is required' });
    }

    const payload = {
      ...req.body,
      username: username.trim(),
      name: req.body.name?.trim() || username.trim(),
      githubHandle: req.body.githubHandle?.trim() || '',
      techStack: cleanList(req.body.techStack || []),
      topSkills: cleanList(req.body.topSkills || req.body.techStack || [], 3),
      lookingFor: cleanList(req.body.lookingFor || []),
    };

    const existingUser = await User.findOne({ username: payload.username });
    if (existingUser) {
      return res.status(200).json(existingUser);
    }

    const newUser = new User(payload);
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all users for the MatchGrid
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password -swipedUsers -matches');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET one user for the profile detail page
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password -swipedUsers -matches');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile fields stored on the user card/profile
router.put('/:userId', async (req, res) => {
  try {
    const allowed = ['username', 'name', 'githubHandle', 'githubProfile', 'techStack', 'skills', 'topSkills', 'bio', 'avatarUrl', 'avatar', 'lookingFor', 'projects', 'isAvailable'];
    const updates = {};

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (updates.username) updates.username = String(updates.username).trim();
    if (updates.name) updates.name = String(updates.name).trim();
    if (updates.name && !updates.username) updates.username = updates.name;
    if (updates.username && !updates.name) updates.name = updates.username;
    if (updates.githubHandle !== undefined) updates.githubHandle = String(updates.githubHandle).trim();
    if (updates.githubProfile !== undefined) updates.githubProfile = String(updates.githubProfile).trim();
    if (updates.skills) {
      updates.techStack = updates.skills;
      delete updates.skills;
    }
    if (updates.techStack) updates.techStack = cleanList(updates.techStack);
    if (updates.topSkills) updates.topSkills = cleanList(updates.topSkills, 3);

    // Accept comma-separated string or array for lookingFor
    if (updates.lookingFor && !Array.isArray(updates.lookingFor)) {
      updates.lookingFor = String(updates.lookingFor)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (updates.lookingFor) updates.lookingFor = cleanList(updates.lookingFor);

    const user = await User.findByIdAndUpdate(req.params.userId, { $set: updates }, { new: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
