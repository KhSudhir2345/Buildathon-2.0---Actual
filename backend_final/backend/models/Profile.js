const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    skills: {
      type: [String],
      default: [],
    },
    topSkills: {
      type: [String],
      default: [],
    },
    githubUsername: {
      type: String,
      default: '',
    },
    lookingFor: {
      // e.g. ["UI Designer", "ML Engineer", "Backend Dev"]
      type: [String],
      default: [],
    },
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
    stackSource: {
      type: String,
      enum: ['manual', 'resume', 'github', 'mixed'],
      default: 'manual',
    },
    // Raw data stored separately for reference
    githubLanguages: {
      type: [String],
      default: [],
    },
    githubTopics: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Remove duplicate skills before saving
ProfileSchema.pre('save', function (next) {
  this.skills = [...new Set(this.skills.map((s) => s.trim()))];
  this.topSkills = [...new Set(this.topSkills.map((s) => s.trim()).filter(Boolean))].slice(0, 3);
  next();
});

module.exports = mongoose.model('Profile', ProfileSchema);
