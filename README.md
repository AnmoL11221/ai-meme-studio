# 🎭 AI Meme Studio

The ultimate meme creation platform combining **AI-powered generation** with **2,300+ worldwide templates**. Create original memes using specialized AI agents OR customize from the largest collection of internet meme templates.

## 🚀 Project Overview

AI Meme Studio offers two powerful ways to create memes:

1. **🤖 AI Meme Generation**: Specialized AI agents collaborate to create completely original memes from your concepts
2. **🌍 Template Library**: Choose from 2,300+ templates sourced from every major platform worldwide

### 🎪 The AI Comedy Troupe

- **🎨 The Set Designer**: Generates background scenes and environments
- **🎬 The Casting Director**: Creates characters and composites them into scenes
- **✍️ The Gag Writer**: Analyzes images and writes context-aware captions

### 🌍 Massive Template Collection

**2,300+ Templates** from every corner of the internet:
- **📱 TikTok** (500+ trending templates)
- **📷 Instagram** (300+ meme templates) 
- **🐦 Twitter** (200+ viral content)
- **😂 9GAG** (100+ community favorites)
- **🌍 Regional** (1,000+ from 20+ countries)
- **🔥 Plus**: Imgflip, Reddit, Know Your Meme, and more

## 🏗️ Architecture

### Monorepo Structure
```
ai-meme-studio/
├── apps/
│   ├── backend/          # Node.js + Fastify (The Meme Producer)
│   └── frontend/         # React + Vite (The Creative Studio)
├── packages/
│   └── shared-types/     # Shared TypeScript interfaces
└── ...config files
```

### Tech Stack
- **Full-Stack TypeScript** for type safety and developer efficiency
- **Backend**: Node.js + Fastify with WebSocket support
- **Frontend**: React + Vite + Tailwind CSS for modern UI
- **AI Integration**: OpenAI (GPT-4) + Stability AI (Stable Diffusion)
- **Database**: SQLite for meme storage with file system for images
- **Template Sources**: Multi-API aggregation from global platforms

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
# Create .env file in root directory
# Add your API keys:
OPENAI_API_KEY=your_actual_openai_key
STABILITY_AI_API_KEY=your_actual_stability_key
```

### 3. Build Shared Types
```bash
npm run build -w packages/shared-types
```

### 4. Start Development Servers

**🚀 One Command to Rule Them All:**
```bash
npm run dev
```

This starts both backend and frontend simultaneously with color-coded logs!

**Alternative - Start Individually:**
```bash
# Backend only
npm run dev:backend

# Frontend only  
npm run dev:frontend
```

### 5. Access the Application
- **🎨 Frontend**: http://localhost:5173
- **⚡ Backend API**: http://localhost:3001
- **📚 API Docs**: http://localhost:3001/docs

## 🎯 Current Implementation Status

### ✅ Fully Completed Features

**🌍 Massive Template System:**
- [x] 2,300+ templates from 12+ major sources
- [x] TikTok, Instagram, Twitter, 9GAG integrations
- [x] 20+ regional/cultural meme databases
- [x] Real-time template search and filtering
- [x] Category-based organization (30+ categories)
- [x] Pagination and infinite scroll support
- [x] Template gallery with grid/list views

**🤖 AI Meme Generation:**
- [x] Complete AI agent system (Set Designer, Casting Director, Gag Writer)
- [x] OpenAI GPT-4 integration for text generation
- [x] Stability AI integration for image generation
- [x] Advanced image composition and text overlay
- [x] Real-time WebSocket progress updates

**💾 Data & Storage:**
- [x] SQLite database for meme metadata
- [x] File system storage for generated images
- [x] Persistent meme gallery and history
- [x] Advanced caching and performance optimization

**🎨 User Interface:**
- [x] Modern React frontend with Tailwind CSS
- [x] Draggable text positioning with live preview
- [x] Color picker for custom text styling
- [x] Responsive design for all devices
- [x] Intuitive navigation and user experience

**⚡ Development Experience:**
- [x] Full TypeScript monorepo setup
- [x] Single-command development startup
- [x] Comprehensive API documentation
- [x] Error handling and fallback systems
- [x] Performance monitoring and logging

### 🚧 Advanced Features (Future)
- [ ] OAuth authentication system
- [ ] MCP server for Claude Desktop integration
- [ ] Advanced AI prompt engineering
- [ ] Social sharing and community features
- [ ] Mobile app development
- [ ] Advanced analytics and insights

## 🧪 Development Commands

```bash
# Install dependencies
npm install

# Start everything
npm run dev                    # Both backend + frontend (recommended)
npm run dev:both              # Alternative command

# Individual services
npm run dev:backend           # Backend only
npm run dev:frontend          # Frontend only

# Build for production
npm run build                 # All packages
npm run build:backend         # Backend only
npm run build:frontend        # Frontend only

# Code quality
npm run test                  # Run tests
npm run lint                  # Lint code
npm run clean                 # Clean build artifacts
```

## 🌟 Key Features

### 🤖 AI-Powered Generation
- **Fully Generative**: Every component created from scratch by AI
- **Multi-Agent System**: Specialized agents collaborate seamlessly
- **Real-Time Updates**: Watch your meme creation process live
- **Interactive Direction**: Guide the AI with feedback and preferences

### 🌍 Massive Template Library
- **Global Coverage**: Templates from every major platform and culture
- **Always Fresh**: Latest trends and viral content integrated
- **Smart Search**: Find exactly what you need instantly
- **Cultural Diversity**: Memes from 20+ countries and languages

### 🎨 Advanced Customization
- **Drag & Drop Text**: Position text anywhere with pixel precision
- **Color Customization**: Full color picker for text styling
- **Font Options**: Multiple fonts and text effects
- **Live Preview**: See changes in real-time

### ⚡ Performance & Reliability
- **Fast Loading**: Optimized for quick template browsing
- **Reliable Fallbacks**: System works even when APIs are down
- **Smart Caching**: Templates cached for instant access
- **Error Recovery**: Graceful handling of any issues

## 📊 Platform Statistics

- **🎯 Total Templates**: 2,300+ (and growing)
- **🌍 Global Sources**: 12+ major platforms
- **🏷️ Categories**: 30+ diverse categories
- **🌎 Regions**: 20+ countries represented
- **🔥 Languages**: Multiple language/cultural support
- **📱 Platforms**: TikTok, Instagram, Twitter, 9GAG, Reddit, and more

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**🚀 Ready to create viral memes? Join the AI revolution!**

Whether you want AI to generate something completely original or prefer to customize from thousands of proven templates, AI Meme Studio has you covered. Start creating today! 🎭✨ 