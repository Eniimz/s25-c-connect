# CampusConnect 🚀

A modern job matching platform connecting students and professionals with opportunities using AI-powered resume parsing and smart matching algorithms.

![CampusConnect](https://img.shields.io/badge/CampusConnect-v1.0-blue)
![React](https://img.shields.io/badge/React-19-blue)
![Express](https://img.shields.io/badge/Express-4-green)
![Supabase](https://img.shields.io/badge/Supabase-Enabled-purple)

## ✨ Features

- 🔍 **Smart Job Matching** - AI-powered algorithm that matches candidates based on skills, bio, and projects
- 📄 **Resume Parsing** - Upload PDF resumes and automatically extract profile information using OpenAI
- 💬 **Real-time Chat** - Direct messaging between job seekers and employers
- 🔔 **Push Notifications** - Get notified instantly when you receive messages
- 👥 **Dual Roles** - Switch between Seeker and Finder modes seamlessly
- 📊 **Dashboard** - Beautiful, intuitive interface for managing applications and jobs
- 🎨 **Modern UI/UX** - Clean, responsive design built with Tailwind CSS

## 🏗️ Project Structure

```
surge/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # React context providers
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utility functions
│   │   └── lib/           # Library configurations
│   └── supabase/          # Supabase Edge Functions
│
├── backend/                # Express backend server
│   ├── controllers/       # Request handlers
│   ├── services/          # Business logic
│   ├── routes/            # API route definitions
│   └── utils/             # Helper functions
│
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- OpenAI API key
- Google OAuth credentials (for Google Sign-In)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/campusconnect.git
cd campusconnect
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy your:
   - Project URL
   - Anon key
3. Run SQL scripts in **SQL Editor**:
   ```sql
   -- Run these in order:
   -- 1. setup_chat.sql - Creates messages table for chat
   -- 2. setup_notifications.sql - Adds notification preferences
   -- 3. setup_profile.sql - Adds profile fields
   ```
4. Create a Storage bucket named `resumes` (make it public)
5. Enable Google OAuth:
   - Go to **Authentication → Providers → Google**
   - Add Google OAuth credentials from Google Cloud Console
   - Add redirect URLs: `http://localhost:3000/**` and your production URL

### 3. Set Up Backend

```bash
cd backend
npm install
```

Create `.env` file:
```env
OPENAI_API_KEY=sk-your-openai-api-key
PORT=4000
```

Start the backend:
```bash
npm start
```

The backend runs on `http://localhost:4000`

### 4. Set Up Client

```bash
cd client
npm install
```

Create `.env` file:
```env
REACT_APP_SUPABASE_URL=your-supabase-project-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
REACT_APP_BACKEND_URL=http://localhost:4000
```

Start the development server:
```bash
npm start
```

The app opens at `http://localhost:3000`

## 📖 Documentation

### Client Documentation

See [client/README.md](./client/README.md) for detailed client setup and features.

### Backend Documentation

See [backend/README.md](./backend/README.md) for API endpoints and backend architecture.

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Supabase** - Authentication, Database, Realtime, Storage
- **React Router** - Navigation

### Backend
- **Express.js** - Web framework
- **OpenAI API** - GPT-3.5-turbo for resume parsing
- **pdfreader** - PDF text extraction
- **CORS** - Cross-origin resource sharing

## 🎯 Key Features Explained

### Smart Matching Algorithm

The matching algorithm analyzes:
- **Skills** (60% weight) - Exact and partial matches
- **Job Context** (20% weight) - Keywords from title and description
- **Profile Context** (10% weight) - Bio relevance
- **Projects** (10% weight) - Project descriptions and names

### Resume Parsing

1. User uploads PDF resume
2. Backend extracts text using `pdfreader`
3. OpenAI GPT-3.5-turbo parses the text
4. Extracts: name, skills, bio, projects
5. Auto-fills profile form

### Real-time Chat

- Supabase Realtime subscriptions
- Global message channel for all users
- Push notifications on new messages
- Unread message badges

## 📱 Available Scripts

### Client

```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
```

### Backend

```bash
npm start          # Start production server
npm run dev        # Start with auto-reload (if configured)
```

## 🔐 Environment Variables

### Client (.env)
```
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_ANON_KEY=
REACT_APP_BACKEND_URL=
```

### Backend (.env)
```
OPENAI_API_KEY=
PORT=4000
```

## 🚢 Deployment

### Frontend (Vercel/Netlify)

1. Build the project: `cd client && npm run build`
2. Deploy the `build` folder
3. Add environment variables in your hosting platform
4. Set `REACT_APP_BACKEND_URL` to your deployed backend URL

### Backend (Vercel/Heroku/Railway)

1. Deploy the `backend` folder
2. Add `OPENAI_API_KEY` environment variable
3. Update client's `REACT_APP_BACKEND_URL`

## 📝 License

This project is licensed under the MIT License.


---

Made with ❤️ for connecting talent with opportunities

