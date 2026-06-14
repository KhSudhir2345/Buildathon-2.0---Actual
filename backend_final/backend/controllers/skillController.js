const Profile = require('../models/Profile');
const User = require('../models/User');
const { processResume } = require('../services/resumeService');
const { processGithub } = require('../services/githubService');
const { extractProjectSkills } = require('../services/geminiService');

const uniqueClean = (values = []) => [
  ...new Set(values.map((value) => String(value).trim()).filter(Boolean)),
];

const normalizeTopSkills = (topSkills, skills = []) => {
  const cleanTopSkills = uniqueClean(topSkills || []);
  if (cleanTopSkills.length > 0) return cleanTopSkills.slice(0, 3);
  return uniqueClean(skills).slice(0, 3);
};

const syncUserFromProfile = async (userId, profile, extra = {}) => {
  const existingUser = await User.findById(userId);
  const username =
    profile.name?.trim() ||
    extra.username?.trim() ||
    existingUser?.username ||
    `Developer ${String(userId).slice(-6)}`;
  const githubHandle = profile.githubUsername || extra.githubUsername || existingUser?.githubHandle || '';

  return User.findByIdAndUpdate(
    userId,
    {
      $set: {
        name: username,
        username,
        githubHandle,
        githubProfile: githubHandle ? `https://github.com/${githubHandle}` : existingUser?.githubProfile || '',
        techStack: profile.skills || [],
        topSkills: profile.topSkills?.length
          ? normalizeTopSkills(profile.topSkills, profile.skills || [])
          : existingUser?.topSkills?.length
            ? existingUser.topSkills
            : normalizeTopSkills([], profile.skills || existingUser?.techStack || []),
        bio: profile.bio || existingUser?.bio || '',
        avatarUrl: profile.avatarUrl || existingUser?.avatarUrl || '',
        lookingFor: profile.lookingFor?.length ? profile.lookingFor : existingUser?.lookingFor || [],
        projects: profile.projects?.length ? profile.projects : existingUser?.projects || [],
        stackSource: profile.stackSource || 'manual',
        githubLanguages: profile.githubLanguages || [],
        githubTopics: profile.githubTopics || [],
        isAvailable: existingUser?.isAvailable ?? true,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

/**
 * POST /api/skills/manual
 * Body: { userId, skills: [], name?, bio?, lookingFor?: [] }
 */
const addManualSkills = async (req, res) => {
  try {
    const { userId, skills, name, bio, lookingFor, topSkills, projects } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    if (!Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ error: 'skills must be a non-empty array' });
    }

    const cleanSkills = uniqueClean(skills);

    const profile = await Profile.findOneAndUpdate(
      { userId },
      {
        $set: {
          ...(name && { name }),
          ...(bio && { bio }),
          ...(lookingFor && { lookingFor }),
          ...(projects && { projects }),
          topSkills: normalizeTopSkills(topSkills, cleanSkills),
          stackSource: 'manual',
        },
        $addToSet: { skills: { $each: cleanSkills } },
      },
      { new: true, upsert: true }
    );

    const user = await syncUserFromProfile(userId, profile);

    return res.json({
      success: true,
      message: `${cleanSkills.length} skills added`,
      profile,
      user,
    });
  } catch (err) {
    console.error('[Manual] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/skills/resume
 * Multipart form: { userId } + file field "resume"
 */
const addResumeSkills = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Use field name "resume"' });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required in form body' });
    }

    console.log(`[Resume] Processing for user ${userId} - file: ${req.file.originalname}`);

    const skills = await processResume(req.file);

    if (skills.length === 0) {
      return res.status(422).json({
        error: 'Could not extract any skills from the uploaded file. Try a different format.',
      });
    }

    const profile = await Profile.findOneAndUpdate(
      { userId },
      {
        $set: { stackSource: 'resume' },
        $addToSet: { skills: { $each: skills } },
      },
      { new: true, upsert: true }
    );

    const user = await syncUserFromProfile(userId, profile);

    return res.json({
      success: true,
      message: `${skills.length} skills extracted from resume`,
      extractedSkills: skills,
      profile,
      user,
    });
  } catch (err) {
    console.error('[Resume] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/skills/github
 * Body: { userId, username }
 */
const addGithubSkills = async (req, res) => {
  try {
    const { userId, username } = req.body;

    if (!userId || !username) {
      return res.status(400).json({ error: 'userId and username are required' });
    }

    console.log(`[GitHub] Processing for user ${userId} - GitHub: @${username}`);

    const { skills, languages, topics } = await processGithub(username);

    if (skills.length === 0) {
      return res.status(422).json({
        error: 'No skills could be extracted. The GitHub account may have no public repos.',
        languages,
        topics,
      });
    }

    const profile = await Profile.findOneAndUpdate(
      { userId },
      {
        $set: {
          githubUsername: username,
          stackSource: 'github',
          githubLanguages: languages,
          githubTopics: topics,
        },
        $addToSet: { skills: { $each: skills } },
      },
      { new: true, upsert: true }
    );

    const user = await syncUserFromProfile(userId, profile);

    return res.json({
      success: true,
      message: `${skills.length} skills extracted from GitHub`,
      extractedSkills: skills,
      languages,
      topics,
      profile,
      user,
    });
  } catch (err) {
    console.error('[GitHub] Error:', err.message);

    // Specific GitHub errors
    if (err.response?.status === 404) {
      return res.status(404).json({ error: `GitHub user "@${req.body.username}" not found` });
    }
    if (err.response?.status === 403) {
      return res.status(403).json({ error: 'GitHub API rate limit exceeded. Try again later.' });
    }

    return res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/skills/project-suggestions
 * Body: { description }
 */
const suggestProjectSkills = async (req, res) => {
  try {
    const { description } = req.body;

    if (!description || description.trim().length < 20) {
      return res.status(400).json({ error: 'Project description must be at least 20 characters' });
    }

    const skills = await extractProjectSkills(description);

    if (skills.length === 0) {
      return res.status(422).json({
        error: 'Could not extract project skills. Add more technical detail and try again.',
      });
    }

    return res.json({
      success: true,
      suggestedSkills: skills,
    });
  } catch (err) {
    console.error('[Project Skills] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/skills/profile/:userId
 */
const getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.params.userId });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    return res.json(profile);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /api/skills/profile/:userId
 * Body: any profile fields to update
 */
const updateProfile = async (req, res) => {
  try {
    const allowed = ['name', 'bio', 'avatarUrl', 'skills', 'topSkills', 'lookingFor', 'githubUsername', 'projects'];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    if (updates.topSkills) {
      updates.topSkills = normalizeTopSkills(updates.topSkills, updates.skills);
    }

    const profile = await Profile.findOneAndUpdate(
      { userId: req.params.userId },
      { $set: updates },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const user = await syncUserFromProfile(req.params.userId, profile);

    return res.json({ success: true, profile, user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * DELETE /api/skills/profile/:userId/skill
 * Body: { skill: "React" }
 * Remove a single skill from profile
 */
const removeSkill = async (req, res) => {
  try {
    const { skill } = req.body;
    if (!skill) return res.status(400).json({ error: 'skill is required' });

    const profile = await Profile.findOneAndUpdate(
      { userId: req.params.userId },
      { $pull: { skills: skill } },
      { new: true }
    );

    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const user = await syncUserFromProfile(req.params.userId, profile);

    return res.json({ success: true, removedSkill: skill, profile, user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  addManualSkills,
  addResumeSkills,
  addGithubSkills,
  suggestProjectSkills,
  getProfile,
  updateProfile,
  removeSkill,
};
