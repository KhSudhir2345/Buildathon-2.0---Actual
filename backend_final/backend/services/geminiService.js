const { getGeminiModel } = require('../config/gemini');

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
    const responseText = result.response.text().trim();

    // Strip any accidental markdown fences
    const cleaned = responseText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    const skills = JSON.parse(cleaned);

    if (!Array.isArray(skills)) return [];

    // Final dedup and clean
    return [...new Set(skills.map((s) => String(s).trim()).filter(Boolean))];
  } catch (err) {
    console.error('Gemini extractSkills error:', err.message);
    return [];
  }
};

module.exports = { extractSkills };
