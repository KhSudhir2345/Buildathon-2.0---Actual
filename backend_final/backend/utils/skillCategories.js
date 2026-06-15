/**
 * Skill Categories & Relationships
 * Groups similar technologies so users find relevant matches
 */

const skillCategories = {
  // Frontend Frameworks
  frontend: {
    category: 'Frontend',
    keywords: ['frontend', 'front-end', 'ui', 'frontend development'],
    skills: ['react', 'vue', 'angular', 'next.js', 'nuxt.js', 'svelte', 'ember', 'astro'],
  },
  
  // Backend Frameworks
  backend: {
    category: 'Backend',
    keywords: ['backend', 'back-end', 'server', 'api', 'backend development'],
    skills: ['node.js', 'express.js', 'nest.js', 'django', 'flask', 'fastapi', 'spring boot', 'ruby on rails', 'laravel', 'asp.net'],
  },
  
  // Databases
  databases: {
    category: 'Databases',
    keywords: ['database', 'db', 'sql', 'databases', 'data storage'],
    skills: ['mongodb', 'postgresql', 'mysql', 'redis', 'firebase', 'dynamodb', 'elasticsearch', 'cassandra'],
  },
  
  // Programming Languages
  languages: {
    category: 'Languages',
    keywords: ['programming', 'languages', 'language'],
    skills: ['javascript', 'typescript', 'python', 'java', 'golang', 'rust', 'cpp', 'csharp', 'ruby', 'kotlin', 'objective-c', 'php'],
  },
  
  // DevOps & Cloud
  devops: {
    category: 'DevOps/Cloud',
    keywords: ['devops', 'cloud', 'infrastructure', 'infra'],
    skills: ['docker', 'kubernetes', 'aws', 'gcp', 'azure', 'ci/cd', 'jenkins', 'gitlab ci', 'terraform', 'ansible'],
  },
  
  // Testing
  testing: {
    category: 'Testing',
    keywords: ['testing', 'test', 'qa', 'quality assurance'],
    skills: ['jest', 'cypress', 'selenium', 'mocha', 'pytest', 'unittest', 'jasmine', 'karma', 'rspec', 'vitest'],
  },
  
  // AI/ML
  ai_ml: {
    category: 'AI/ML',
    keywords: ['ai', 'ml', 'machine learning', 'artificial intelligence', 'deep learning'],
    skills: ['machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn', 'keras', 'nlp', 'computer vision', 'llm'],
  },
  
  // Data Tools
  data: {
    category: 'Data',
    keywords: ['data', 'analytics', 'etl', 'big data'],
    skills: ['sql', 'pandas', 'numpy', 'spark', 'hadoop', 'data analysis', 'big data', 'etl'],
  },
  
  // Frontend Tools & Libraries
  frontend_tools: {
    category: 'Frontend Tools',
    keywords: ['css', 'html', 'graphql', 'build tools'],
    skills: ['webpack', 'vite', 'parcel', 'rollup', 'tailwind', 'sass', 'css', 'html', 'graphql'],
  },
  
  // Mobile
  mobile: {
    category: 'Mobile',
    keywords: ['mobile', 'ios', 'android', 'native'],
    skills: ['react native', 'flutter', 'swift', 'kotlin', 'ios', 'android', 'expo'],
  },
};

/**
 * Flatten all skills with their categories
 */
const buildSkillToCategoryMap = () => {
  const map = {};
  Object.values(skillCategories).forEach((catObj) => {
    catObj.skills.forEach((skill) => {
      map[skill.toLowerCase()] = catObj.category;
    });
  });
  return map;
};

const buildKeywordToCategoryMap = () => {
  const map = {};
  Object.values(skillCategories).forEach((catObj) => {
    (catObj.keywords || []).forEach((keyword) => {
      map[keyword.toLowerCase()] = catObj.category;
    });
  });
  return map;
};

const skillToCategoryMap = buildSkillToCategoryMap();
const keywordToCategoryMap = buildKeywordToCategoryMap();

/**
 * Get all skills in a category
 */
const getSkillsInCategory = (category) => {
  const categoryObj = Object.values(skillCategories).find(
    (c) => c.category.toLowerCase() === category.toLowerCase()
  );
  return categoryObj ? categoryObj.skills : [];
};

/**
 * Get category for a skill
 */
const getSkillCategory = (skill) => {
  const normalized = String(skill).toLowerCase().trim();
  return skillToCategoryMap[normalized] || keywordToCategoryMap[normalized] || null;
};

/**
 * Get all related skills (same category)
 */
const getRelatedSkills = (skill) => {
  const category = getSkillCategory(skill);
  if (!category) return [skill];
  return getSkillsInCategory(category);
};

/**
 * Expand search query to include related skills
 */
const expandSearchSkills = (skills) => {
  const expanded = new Set();
  
  skills.forEach((skill) => {
    const related = getRelatedSkills(skill);
    related.forEach((s) => expanded.add(s));
  });
  
  return Array.from(expanded);
};

module.exports = {
  skillCategories,
  skillToCategoryMap,
  getSkillCategory,
  getRelatedSkills,
  getSkillsInCategory,
  expandSearchSkills,
};
