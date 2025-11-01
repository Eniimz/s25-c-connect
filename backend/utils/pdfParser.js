import { PdfReader } from 'pdfreader';

/**
 * Parse PDF buffer and extract text content
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<string>} - Extracted text content
 */
export function parsePDF(buffer) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const reader = new PdfReader();

    reader.parseBuffer(buffer, (err, item) => {
      if (err) {
        reject(err);
      } else if (item === null || item === undefined) {
        const cleanText = chunks
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        resolve(cleanText);
      } else if (item.text) {
        chunks.push(item.text);
      }
    });
  });
}

