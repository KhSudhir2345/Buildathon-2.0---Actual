const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: { type: String, trim: true, default: '' },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: { type: String, minlength: 6, select: false },
  githubHandle: { type: String, default: '' },
  githubProfile: { type: String, trim: true, default: '' },
  techStack: { type: [String], default: [] },
  topSkills: { type: [String], default: [] },
  bio: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  avatar: { type: String, default: '' },
  lookingFor: { type: [String], default: [] },
  projects: {
    type: [
      {
        name: { type: String, default: '' },
        description: { type: String, default: '' },
        link: { type: String, default: '' },
      },
    ],
    default: [],
  },
  ratings: [
    {
      raterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      value: { type: Number, min: 1, max: 5 },
    },
  ],
  ratingCount: { type: Number, default: 0 },
  ratingAverage: { type: Number, default: 0 },
  stackSource: {
    type: String,
    enum: ['manual', 'resume', 'github', 'mixed'],
    default: 'manual',
  },
  githubLanguages: { type: [String], default: [] },
  githubTopics: { type: [String], default: [] },
  swipedUsers: {
    type: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        action: { type: String, enum: ['liked', 'passed'] },
      },
    ],
    default: [],
  },
  matches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.virtual('skills').get(function () {
  return this.techStack || [];
});

userSchema.virtual('skills').set(function (skills) {
  this.techStack = skills;
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

userSchema.index({ techStack: 1 });
userSchema.index({ lookingFor: 1 });

module.exports = mongoose.model('User', userSchema);
