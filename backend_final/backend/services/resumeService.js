const fs = require('fs');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const { extractSkills } = require('./geminiService');

/**
 * Try extracting text from PDF using pdf-parse (handles text-based PDFs).
 * Falls back to Tesseract OCR for scanned/image PDFs.
 */
const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);

    // If we got decent text, use it
    if (data.text && data.text.trim().length > 100) {
      console.log('[ResumeService] Extracted text via pdf-parse');
      return data.text;
    }

    // Fallback: scanned PDF - use OCR
    console.log('[ResumeService] pdf-parse yielded little text, falling back to Tesseract');
    return await extractTextWithOCR(filePath);
  } catch (err) {
    console.error('[ResumeService] pdf-parse failed, trying Tesseract:', err.message);
    return await extractTextWithOCR(filePath);
  }
};

/**
 * OCR via Tesseract.js - works on images and scanned PDFs.
 */
const extractTextWithOCR = async (filePath) => {
  try {
    const {
      data: { text },
    } = await Tesseract.recognize(filePath, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          process.stdout.write(`\r[Tesseract] Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });
    console.log('\n[ResumeService] OCR complete via Tesseract');
    return text;
  } catch (err) {
    console.error('[ResumeService] Tesseract OCR failed:', err.message);
    return '';
  }
};

/**
 * Main resume processing function.
 * Accepts multer file object, extracts text, returns skills.
 *
 * @param {{ path: string, mimetype: string }} file - Multer file object
 * @returns {Promise<string[]>} - Extracted skill array
 */
const processResume = async (file) => {
  const { path: filePath, mimetype } = file;

  try {
    let text = '';

    if (mimetype === 'application/pdf') {
      text = await extractTextFromPDF(filePath);
    } else {
      // Image file (PNG/JPG)
      text = await extractTextWithOCR(filePath);
    }

    if (!text || text.trim().length < 20) {
      throw new Error('Could not extract readable text from file');
    }

    const skills = await extractSkills(text);
    return skills;
  } finally {
    // Always clean up the temp upload file
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (cleanupErr) {
      console.warn('[ResumeService] Could not delete temp file:', cleanupErr.message);
    }
  }
};

module.exports = { processResume };
