const axios = require('axios');
const { extractSkills } = require('./geminiService');

// GitHub API client with optional token auth
const githubAPI = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Accept: 'application/vnd.github.v3+json',
    ...(process.env.GITHUB_TOKEN && {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    }),
  },
  timeout: 10000,
});

/**
 * Fetch public repos for a GitHub user (up to 30, sorted by last updated)
 */
const getUserRepos = async (username) => {
  const { data } = await githubAPI.get(
    `/users/${username}/repos?per_page=30&sort=updated&type=public`
  );
  return data;
};

/**
 * Get languages breakdown for a single repo.
 * Returns array of language names used.
 */
const getRepoLanguages = async (username, repoName) => {
  try {
    const { data } = await githubAPI.get(`/repos/${username}/${repoName}/languages`);
    return Object.keys(data);
  } catch {
    return [];
  }
};

/**
 * Fetch user profile info (bio, location, etc.)
 */
const getUserProfile = async (username) => {
  const { data } = await githubAPI.get(`/users/${username}`);
  return data;
};

/**
 * Main GitHub processing function.
 * 1. Validates user exists
 * 2. Fetches repos + language data in parallel
 * 3. Aggregates all languages, topics, repo names
 * 4. Sends summary to Gemini for skill extraction
 *
 * @param {string} username - GitHub username
 * @returns {{ skills: string[], languages: string[], topics: string[] }}
 */
const processGithub = async (username) => {
  // Step 1: Validate user exists (throws 404 if not)
  const userProfile = await getUserProfile(username);

  // Step 2: Fetch repos
  const repos = await getUserRepos(username);

  if (!repos || repos.length === 0) {
    return { skills: [], languages: [], topics: [] };
  }

  // Step 3: Fetch all repo languages in parallel
  const languageResults = await Promise.allSettled(
    repos.map((repo) => getRepoLanguages(username, repo.name))
  );

  // Step 4: Aggregate everything
  const languageSet = new Set();
  const topicSet = new Set();
  const repoDescriptions = [];

  repos.forEach((repo, idx) => {
    // Primary language from repo metadata
    if (repo.language) languageSet.add(repo.language);

    // Topics/tags on repo
    if (repo.topics && repo.topics.length > 0) {
      repo.topics.forEach((t) => topicSet.add(t));
    }

    // Repo name and description for context
    if (repo.description) {
      repoDescriptions.push(`${repo.name}: ${repo.description}`);
    }

    // Languages from detailed breakdown
    const langResult = languageResults[idx];
    if (langResult.status === 'fulfilled') {
      langResult.value.forEach((lang) => languageSet.add(lang));
    }
  });

  // Build a rich summary string for Gemini
  const summary = `
GitHub Profile: ${username}
Bio: ${userProfile.bio || 'N/A'}
Public repos: ${repos.length}

Programming languages used across repositories:
${[...languageSet].join(', ')}

Repository topics and tags:
${[...topicSet].join(', ')}

Repository names and descriptions:
${repoDescriptions.slice(0, 15).join('\n')}
`.trim();

  // Step 5: Extract skills via Gemini
  const skills = await extractSkills(summary);

  return {
    skills,
    languages: [...languageSet],
    topics: [...topicSet],
  };
};

module.exports = { processGithub };
