import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { PdfReader } from 'pdfreader';

dotenv.config();

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Resume parsing endpoint
app.post('/api/parse-resume', async (req, res) => {
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
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `Parse this resume and extract information into JSON format:

Extract the following fields:
- "full_name": The person's full name (string)
- "skills": Array of technical skills, programming languages, tools (array of strings)
- "bio": A 2-3 sentence professional summary based on their experience and goals (string)
- "projects": Array of project names or short descriptions if available (array of strings)

Important: Be thorough and accurate. Extract ALL relevant skills. For projects, list any major projects mentioned.

Resume content:
${pdfText}

Return ONLY valid JSON in this exact format:
{
  "full_name": "...",
  "skills": ["skill1", "skill2", ...],
  "bio": "Professional summary here",
  "projects": ["project1", "project2", ...]
}`
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2000
    });

    const parsed = JSON.parse(completion.choices[0].message.content || '{}');
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
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  console.error('Error:', err);
  res.status(statusCode).json({ success: false, statusCode, message });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// PDF parser helper
function parsePDF(buffer) {
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

// Start server
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}`);
  console.log(`Resume parsing: http://localhost:${PORT}/api/parse-resume`);
  console.log(`OpenAI endpoint: http://localhost:${PORT}/api/openai/chat`);
});