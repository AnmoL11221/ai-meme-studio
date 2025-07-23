# 🎭 AI Meme Studio

Transform your creative ideas into completely original memes using our team of specialized AI agents. No more stale templates - every meme is uniquely generated just for you.

## 🚀 Project Overview

The AI Meme Studio is an interactive web application where users direct a team of specialized AI agents to generate completely original memes. Instead of using existing templates, the user provides a creative concept, and our AI agents collaborate to generate a unique visual scene and fitting punchline.

### 🎪 The Comedy Troupe (AI Agents)

- **🎨 The Set Designer**: Generates background scenes (e.g., "a futuristic city street at night in the rain")
- **🎬 The Casting Director**: Creates main characters and composites them onto backgrounds 
- **✍️ The Gag Writer**: Analyzes the final image and concept to write clever, context-aware captions

## 🏗️ Architecture

### Monorepo Structure
```
ai-meme-studio/
├── apps/
│   ├── backend/          # Node.js + Fastify (The Meme Producer - MCP)
│   └── frontend/         # React + Vite (The Creative Studio)
├── packages/
│   └── shared-types/     # Shared TypeScript interfaces
└── ...config files
```

### Tech Stack
- **Full-Stack TypeScript** for type safety and developer efficiency
- **Backend**: Node.js + Fastify for high performance API
- **Frontend**: React + Vite + Tailwind CSS for modern UI
- **AI Integration**: OpenAI (text) + Stability AI (images)

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm 9+
- OpenAI API key ([get here](https://platform.openai.com/api-keys))
- Stability AI API key ([get here](https://platform.stability.ai/account/keys))

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Environment Variables
```bash
# Copy the example env file
cp env.example .env

# Edit .env and add your API keys
# OPENAI_API_KEY=your_actual_openai_key
# STABILITY_AI_API_KEY=your_actual_stability_key
```

### 3. Build Shared Types
```bash
npm run build -w packages/shared-types
```

### 4. Start Development Servers

#### Option A: Start everything at once
```bash
npm run dev
```

#### Option B: Start individually
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend  
npm run dev:frontend
```

### 5. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/docs

## 🎯 Current Implementation Status

### ✅ Completed
- [x] Monorepo structure setup
- [x] TypeScript configuration across all packages
- [x] Shared types package with core interfaces
- [x] Backend foundation with Fastify
- [x] Frontend foundation with React + Vite
- [x] Basic API endpoints and WebSocket setup
- [x] Landing page and basic UI components

### 🚧 In Progress
- [ ] AI agent implementations (Set Designer, Casting Director, Gag Writer)
- [ ] Image generation and composition logic
- [ ] Real-time WebSocket updates for creation process
- [ ] Enhanced UI for step-by-step visualization

### 📋 Planned Features
- [ ] User feedback between creation steps
- [ ] Meme gallery and sharing capabilities
- [ ] Advanced customization options
- [ ] Performance optimizations and caching

## 🧪 Development Commands

```bash
# Install dependencies
npm install

# Start development servers
npm run dev                    # All services
npm run dev:backend           # Backend only
npm run dev:frontend          # Frontend only

# Build for production
npm run build                 # All packages
npm run build:backend         # Backend only
npm run build:frontend        # Frontend only

# Run tests
npm run test

# Lint code
npm run lint

# Clean build artifacts
npm run clean
```

## 🌟 Key Features

- **Fully Generative**: Every visual component is AI-generated on-demand
- **Multi-Agent Collaboration**: Specialized AI agents work together seamlessly
- **Step-by-Step Visualization**: Watch your meme come to life in real-time
- **Interactive Direction**: Provide feedback and guidance during creation
- **Modern Tech Stack**: Built with the latest tools for performance and maintainability

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Ready to create some amazing memes? Let's build the future of meme generation together! 🚀** 