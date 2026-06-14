const { GoogleGenerativeAI } = require('@google/generative-ai');

let model;
let activeModelName;

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

const getGeminiModel = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  const modelName = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

  if (!model || activeModelName !== modelName) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: modelName });
    activeModelName = modelName;
  }

  return model;
};

module.exports = { DEFAULT_GEMINI_MODEL, getGeminiModel };
