const mongoose = require('mongoose');
const User = require('../models/User');
const Connection = require('../models/Connection');

const cleanList = (values = []) => [
  ...new Set(values.map((value) => String(value).trim()).filter(Boolean)),
];

const serializeProfile = (profile) => ({
  ...profile,
  skills: profile.techStack || profile.skills || [],
});

// Skill normalization map (common aliases → canonical names)
const skillMap = {
  'js': 'javascript',
  'node': 'node.js',
  'nodejs': 'node.js',
  'ts': 'typescript',
  'py': 'python',
  'rb': 'ruby',
  'go': 'golang',
  'c++': 'cpp',
  'c#': 'csharp',
  'kt': 'kotlin',
  'obj-c': 'objective-c',
  'mongo': 'mongodb',
  'db': 'database',
  'vue': 'vue.js',
  'ng': 'angular',
  'next': 'next.js',
  'nuxt': 'nuxt.js',
  'express': 'express.js',
  'nest': 'nest.js',
  'nestjs': 'nest.js',
  'rails': 'ruby on rails',
  'ror': 'ruby on rails',
  'spring': 'spring boot',
  'springboot': 'spring boot',
  'k8s': 'kubernetes',
  'ci/cd': 'ci/cd',
  'ml': 'machine learning',
  'ai': 'artificial intelligence',
  'dl': 'deep learning',
};

const normalizeSkill = (skill) => {
  const normalized = skill.toLowerCase().trim();
  return skillMap[normalized] || normalized;
};

exports.discoverProfiles = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const querySkills = req.query.skills
      ? req.query.skills.split(',').map((skill) => skill.trim()).filter(Boolean).map(normalizeSkill)
      : [];
    const matchSkills = cleanList(querySkills.length ? querySkills : (currentUser.lookingFor || []))
      .map((skill) => normalizeSkill(skill).toLowerCase());

    const limit = Math.min(parseInt(req.query.limit, 10) || 24, 50);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const userObjectId = new mongoose.Types.ObjectId(req.user.id);

    const acceptedConnections = await Connection.find({
      $or: [{ senderId: userObjectId }, { receiverId: userObjectId }],
      status: 'ACCEPTED',
    }).lean();

    const acceptedUserIds = acceptedConnections.map((connection) => (
      connection.senderId.toString() === req.user.id ? connection.receiverId : connection.senderId
    ));

    const excludedIds = [
      userObjectId,
      ...acceptedUserIds,
      ...currentUser.swipedUsers
        .filter((swipe) => swipe.action === 'passed')
        .map((swipe) => swipe.user),
    ];

    const baseMatch = {
      _id: { $nin: excludedIds },
      isAvailable: true,
    };

    const projectFields = {
      password: 0,
      swipedUsers: 0,
      matches: 0,
      __v: 0,
    };

    const currentUserSkills = cleanList(currentUser.techStack || []).map((skill) => normalizeSkill(skill).toLowerCase());
    
    const scoringStages = matchSkills.length
      ? [
          {
            $addFields: {
              normalizedTechStack: {
                $map: { 
                  input: { $ifNull: ['$techStack', []] }, 
                  as: 'skill', 
                  in: { $toLower: { $arrayElemAt: [
                    // Normalize: check if skill (lowercased) is in skillMap, if yes use mapped value, else use original
                    [
                      skillMap[{ $toLower: '$$skill' }] || { $toLower: '$$skill' }
                    ], 
                    0
                  ]} } 
                },
              },
              normalizedLookingFor: {
                $map: { 
                  input: { $ifNull: ['$lookingFor', []] }, 
                  as: 'skill', 
                  in: { $toLower: { $arrayElemAt: [
                    [skillMap[{ $toLower: '$$skill' }] || { $toLower: '$$skill' }], 
                    0
                  ]} } 
                },
              },
            },
          },
          {
            $addFields: {
              matchScore: { $size: { $setIntersection: ['$normalizedTechStack', matchSkills] } },
              mutualScore: { 
                $multiply: [
                  2,
                  { $size: { $setIntersection: ['$normalizedLookingFor', currentUserSkills] } }
                ] 
              },
              ratingScore: {
                $multiply: [
                  { $ifNull: ['$ratingAverage', 0] },
                  0.4,
                  {
                    $cond: [
                      { $gte: [{ $ifNull: ['$ratingCount', 0] }, 3] },
                      1,
                      { $divide: [{ $ifNull: ['$ratingCount', 0] }, 3] },
                    ],
                  },
                ],
              },
            },
          },
          {
            $addFields: {
              totalScore: { $add: ['$matchScore', '$mutualScore', '$ratingScore'] },
            },
          },
          { $sort: { totalScore: -1, createdAt: -1 } },
        ]
      : [{ $sort: { createdAt: -1 } }];

    let profiles = await User.aggregate([
      { $match: baseMatch },
      ...scoringStages,
      { $skip: skip },
      { $limit: limit },
      { $project: projectFields },
    ]);

    if (matchSkills.length && profiles.length === 0) {
      profiles = await User.aggregate([
        { $match: baseMatch },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        { $project: projectFields },
      ]);
    }

    const profileIds = profiles.map((profile) => profile._id);
    const connectionStatuses = await Connection.find({
      $or: [
        { senderId: userObjectId, receiverId: { $in: profileIds } },
        { senderId: { $in: profileIds }, receiverId: userObjectId },
      ],
      status: { $in: ['PENDING', 'REJECTED'] },
    }).lean();

    const connectionMap = {};
    connectionStatuses.forEach((connection) => {
      const otherUserId = connection.senderId.toString() === req.user.id
        ? connection.receiverId.toString()
        : connection.senderId.toString();

      const isSender = connection.senderId.toString() === req.user.id;
      const statusKey = connection.status === 'PENDING'
        ? isSender
          ? 'PENDING_SENT'
          : 'PENDING_RECEIVED'
        : isSender
          ? 'REJECTED_SENT'
          : 'REJECTED_RECEIVED';

      connectionMap[otherUserId] = statusKey;
    });

    const profilesWithStatus = profiles.map((profile) => ({
      ...profile,
      connectionStatus: connectionMap[profile._id.toString()] || null,
    }));

    res.status(200).json({
      success: true,
      count: profilesWithStatus.length,
      matchSkillsUsed: matchSkills,
      page,
      profiles: profilesWithStatus.map(serializeProfile),
    });
  } catch (err) {
    console.error('Discover profiles error:', err.message);
    res.status(500).json({ success: false, message: 'Server error fetching profiles' });
  }
};

exports.swipeProfile = async (req, res) => {
  try {
    const { targetUserId, action } = req.body;

    if (!targetUserId || !['liked', 'passed'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "targetUserId and a valid action ('liked' or 'passed') are required",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid targetUserId' });
    }
    if (targetUserId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot swipe on yourself' });
    }

    const currentUser = await User.findById(req.user.id);
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target user not found' });
    }

    const alreadySwiped = currentUser.swipedUsers.some((swipe) => swipe.user.toString() === targetUserId);
    if (alreadySwiped) {
      return res.status(409).json({ success: false, message: 'You already swiped on this user' });
    }

    currentUser.swipedUsers.push({ user: targetUser._id, action });
    let connection = null;

    if (action === 'liked') {
      connection = await Connection.findOne({
        $or: [
          { senderId: currentUser._id, receiverId: targetUser._id },
          { senderId: targetUser._id, receiverId: currentUser._id },
        ],
      });

      if (!connection) {
        connection = await Connection.create({
          senderId: currentUser._id,
          receiverId: targetUser._id,
          status: 'PENDING',
        });
      }
    }

    await currentUser.save();

    res.status(200).json({
      success: true,
      message: action === 'liked' ? 'Connection request sent' : 'Profile skipped',
      connection,
    });
  } catch (err) {
    console.error('Swipe error:', err.message);
    res.status(500).json({ success: false, message: 'Server error processing swipe' });
  }
};

exports.getMatches = async (req, res) => {
  try {
    const connections = await Connection.find({
      $or: [{ senderId: req.user.id }, { receiverId: req.user.id }],
      status: 'ACCEPTED',
    }).populate('senderId receiverId');

    res.status(200).json({ success: true, count: connections.length, matches: connections });
  } catch (err) {
    console.error('Get matches error:', err.message);
    res.status(500).json({ success: false, message: 'Server error fetching matches' });
  }
};

exports.rateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const rating = Number(req.body.rating);

    if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5',
      });
    }

    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot rate yourself',
      });
    }

    const connection = await Connection.findOne({
      $or: [
        { senderId: req.user.id, receiverId: userId },
        { senderId: userId, receiverId: req.user.id },
      ],
      status: 'ACCEPTED',
    });

    if (!connection) {
      return res.status(403).json({
        success: false,
        message: 'You can only rate users after a matched connection is accepted',
      });
    }

    const ratedUser = await User.findById(userId);
    if (!ratedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const existingRating = ratedUser.ratings.find(
      (item) => item.raterId.toString() === req.user.id
    );

    if (existingRating) {
      existingRating.value = rating;
    } else {
      ratedUser.ratings.push({ raterId: req.user.id, value: rating });
    }

    ratedUser.ratingCount = ratedUser.ratings.length;
    ratedUser.ratingAverage =
      ratedUser.ratings.reduce((sum, item) => sum + item.value, 0) /
      ratedUser.ratingCount;

    await ratedUser.save();

    res.status(200).json({
      success: true,
      ratingCount: ratedUser.ratingCount,
      ratingAverage: ratedUser.ratingAverage,
    });
  } catch (err) {
    console.error('Rate user error:', err.message);
    res.status(500).json({ success: false, message: 'Server error rating user' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      'name',
      'username',
      'bio',
      'githubProfile',
      'githubHandle',
      'techStack',
      'skills',
      'topSkills',
      'lookingFor',
      'isAvailable',
      'avatar',
      'avatarUrl',
      'projects',
    ];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (updates.skills) {
      updates.techStack = updates.skills;
      delete updates.skills;
    }
    if (updates.name && !updates.username) updates.username = updates.name;
    if (updates.username && !updates.name) updates.name = updates.username;

    ['techStack', 'topSkills', 'lookingFor'].forEach((field) => {
      if (updates[field] !== undefined && !Array.isArray(updates[field])) {
        updates[field] = String(updates[field])
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (updates[field]) updates[field] = cleanList(updates[field]);
    });
    if (updates.topSkills) updates.topSkills = updates.topSkills.slice(0, 3);

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, message: 'Profile updated', user });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};
