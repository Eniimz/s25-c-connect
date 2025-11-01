import OpenAI from 'openai';

// Initialize OpenAI lazily when needed
let openai;

function getOpenAIClient() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
}

/**
 * Parse resume text using OpenAI
 * @param {string} pdfText - Extracted text from PDF
 * @returns {Promise<Object>} - Parsed resume data
 */
export async function parseResumeWithAI(pdfText) {
  const client = getOpenAIClient();
  const completion = await client.chat.completions.create({
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

  return JSON.parse(completion.choices[0].message.content || '{}');
}

