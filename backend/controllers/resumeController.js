import { parsePDF } from '../utils/pdfParser.js';
import { parseResumeWithAI } from '../services/resumeService.js';

/**
 * Parse resume from PDF URL
 */
export const parseResume = async (req, res) => {
  try {
    const { fileUrl, userId } = req.body;
    console.log('Received parse request:', { fileUrl: fileUrl?.substring(0, 100), userId });

    if (!fileUrl || !userId) {
      return res.status(400).json({
        success: false,
        message: 'fileUrl and userId are required'
      });
    }

    // Fetch PDF
    console.log('Fetching PDF from:', fileUrl);
    const pdfRes = await fetch(fileUrl);
    console.log('PDF fetch response status:', pdfRes.status, pdfRes.statusText);

    if (!pdfRes.ok) {
      throw new Error(`Failed to fetch PDF: ${pdfRes.status} ${pdfRes.statusText}`);
    }

    const arrayBuffer = await pdfRes.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    console.log('PDF fetched successfully, size:', pdfBuffer.length);

    // Parse PDF
    console.log('Parsing PDF text...');
    const pdfText = await parsePDF(pdfBuffer);
    console.log('PDF text extracted, length:', pdfText.length);

    // OpenAI parsing
    console.log('Calling OpenAI API...');
    const parsed = await parseResumeWithAI(pdfText);
    console.log('OpenAI parsing completed');

    res.json({
      success: true,
      data: parsed
    });
  } catch (error) {
    console.error('Resume parsing error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to parse resume',
      error: error.message
    });
  }
};

