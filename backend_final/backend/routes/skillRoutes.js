const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  addManualSkills,
  addResumeSkills,
  addGithubSkills,
  suggestProjectSkills,
  getProfile,
  updateProfile,
  removeSkill,
} = require('../controllers/skillController');

// --- Skill Extraction Routes ---

// Option 1: Manual skill input
// POST /api/skills/manual
// Body: { userId, skills: ["React", "Node.js"], topSkills?: [], name?, bio?, lookingFor?: [] }
router.post('/manual', addManualSkills);

// Option 2: Resume upload -> OCR -> Gemini
// POST /api/skills/resume
// Form-data: { userId } + file field named "resume" (PDF/PNG/JPG, max 5MB)
router.post('/resume', upload.single('resume'), addResumeSkills);

// Option 3: GitHub username -> GitHub API -> Gemini
// POST /api/skills/github
// Body: { userId, username: "torvalds" }
router.post('/github', addGithubSkills);

// Option 4: Project description -> Gemini suggested search skills
// POST /api/skills/project-suggestions
// Body: { description: "I am building..." }
router.post('/project-suggestions', suggestProjectSkills);

// --- Profile CRUD Routes ---

// GET /api/skills/profile/:userId
router.get('/profile/:userId', getProfile);

// PUT /api/skills/profile/:userId
// Body: any subset of { name, bio, avatarUrl, skills, topSkills, lookingFor, githubUsername, projects }
router.put('/profile/:userId', updateProfile);

// DELETE /api/skills/profile/:userId/skill
// Body: { skill: "React" }
router.delete('/profile/:userId/skill', removeSkill);

module.exports = router;
