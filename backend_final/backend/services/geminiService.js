const { getGeminiModel } = require('../config/gemini');

const parseSkillArray = (responseText) => {
  const cleaned = responseText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  const skills = JSON.parse(cleaned);

  if (!Array.isArray(skills)) return [];

  return [...new Set(skills.map((s) => String(s).trim()).filter(Boolean))];
};

/**
 * Takes any raw text (resume, GitHub summary, etc.)
 * and returns an array of extracted tech skills via Gemini.
 *
 * @param {string} text - Raw input text
 * @returns {Promise<string[]>} - Array of skill strings
 */
const extractSkills = async (text) => {
  if (!text || text.trim().length < 10) {
    return [];
  }

  const prompt = `
You are a precise tech skill extractor for a developer matchmaking platform.

From the text below, extract ALL technical skills including:
- Programming languages (e.g. Python, JavaScript, C++)
- Frameworks and libraries (e.g. React, Django, TensorFlow)
- Tools and platforms (e.g. Docker, AWS, Git, Figma)
- Databases (e.g. MongoDB, PostgreSQL, Redis)
- Concepts relevant to software development (e.g. REST API, GraphQL, Machine Learning)

Rules:
- Return ONLY a valid JSON array of strings
- No duplicates
- Normalize casing (e.g. "javascript" -> "JavaScript", "react.js" -> "React")
- No explanations, no markdown, no code fences - just the raw JSON array
- If no skills found, return an empty array: []

Example output: ["Python", "React", "Node.js", "MongoDB", "Docker", "REST API"]

Text to analyze:
${text.substring(0, 8000)}
`.trim();

  try {
    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    return parseSkillArray(result.response.text().trim());
  } catch (err) {
    console.error('Gemini extractSkills error:', err.message);
    return [];
  }
};

const extractProjectSkills = async (description) => {
  if (!description || description.trim().length < 20) {
    return [];
  }

  const prompt = `
You are a senior software project planner for a developer matchmaking platform.

Read the project description below and infer the practical technical skills needed to build it.

Include:
- Programming languages
- Frameworks and libraries
- Backend/frontend platforms
- Databases and infrastructure
- APIs, protocols, and development concepts
- AI/ML, DevOps, or design tools only when relevant

Rules:
- Return ONLY a valid JSON array of strings
- Return 6 to 18 skills when possible
- Prefer specific, searchable skills over vague words
- Normalize casing (e.g. "react.js" -> "React", "nodejs" -> "Node.js")
- No duplicates
- No explanations, no markdown, no code fences - just the raw JSON array
- If the description is not a software project, return an empty array: []

Example output: ["React", "Node.js", "Express", "MongoDB", "Socket.IO", "JWT", "REST API"]

Project description:
${description.substring(0, 5000)}
`.trim();

  try {
    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    return parseSkillArray(result.response.text().trim());
  } catch (err) {
    console.error('Gemini extractProjectSkills error:', err.message);
    return [];
  }
};

module.exports = { extractSkills, extractProjectSkills };
