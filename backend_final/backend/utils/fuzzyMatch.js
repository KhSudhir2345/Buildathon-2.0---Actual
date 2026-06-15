/**
 * Fuzzy Matching Utility
 * Handles typos and variations in skill searches
 */

/**
 * Levenshtein distance algorithm
 * Returns the number of single-character edits needed to change one string to another
 */
const levenshteinDistance = (str1, str2) => {
  const track = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(0));

  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }

  return track[str2.length][str1.length];
};

/**
 * Check if a query string fuzzy matches a candidate skill
 * @param {string} query - User input (e.g., "reacct")
 * @param {string} candidate - Skill name (e.g., "react")
 * @param {number} maxDistance - Maximum allowed edit distance (default 1)
 * @returns {boolean}
 */
const fuzzyMatch = (query, candidate, maxDistance = 1) => {
  const q = query.toLowerCase().trim();
  const c = candidate.toLowerCase().trim();

  if (!q || !c) return false;

  // Exact match
  if (q === c) return true;

  // Substring or prefix match for partial input
  if (c.includes(q) || q.includes(c) || (q.length >= 2 && c.startsWith(q))) {
    return true;
  }

  // Edit distance match
  return levenshteinDistance(q, c) <= maxDistance;
};

/**
 * Find best fuzzy matches from a candidate list
 * @param {string} query - User input
 * @param {array} candidates - List of skill names to match against
 * @returns {array} - Matched skills sorted by relevance
 */
const fuzzyMatchSkills = (query, candidates, maxDistance = 1) => {
  const q = query.toLowerCase().trim();
  const scored = candidates
    .map((candidate) => {
      const c = candidate.toLowerCase().trim();
      const distance = levenshteinDistance(q, c);
      const match = fuzzyMatch(q, c, maxDistance);
      return { skill: candidate, distance, match };
    })
    .filter((item) => item.match)
    .sort((a, b) => a.distance - b.distance || a.skill.localeCompare(b.skill));

  return scored.map((item) => item.skill);
};

/**
 * Find the best match from candidates, or return the original if no good match
 */
const findBestMatch = (query, candidates, maxDistance = 1) => {
  const matches = fuzzyMatchSkills(query, candidates, maxDistance);
  return matches.length > 0 ? matches[0] : query;
};

module.exports = {
  levenshteinDistance,
  fuzzyMatch,
  fuzzyMatchSkills,
  findBestMatch,
};
