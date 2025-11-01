import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize OpenAI
// const openai = new OpenAI({ 
//   apiKey: process.env.OPENAI_API_KEY 
// });

// Health check
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Backend is running',
    timestamp: new Date().toISOString()
  });
});

// // Example OpenAI endpoint
// app.post('/api/openai/chat', async (req, res) => {
//   try {
//     const { message } = req.body;

//     if (!message) {
//       return res.status(400).json({
//         success: false,
//         message: 'Message is required'
//       });
//     }

//     const response = await openai.chat.completions.create({
//       model: 'gpt-4',
//       messages: [
//         {
//           role: 'user',
//           content: message
//         }
//       ],
//       max_tokens: 500
//     });

//     res.json({
//       success: true,
//       data: {
//         message: response.choices[0].message.content
//       }
//     });
//   } catch (error) {
//     console.error('OpenAI Error:', error.message);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to process request',
//       error: error.message
//     });
//   }
// });

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error Occurred";

  console.error('Error:', err);

  res.status(statusCode).json({
    success: false,
    statusCode,
    message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Starting the server
const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}`);
  console.log(`🤖 OpenAI endpoint: http://localhost:${PORT}/api/openai/chat`);
});
