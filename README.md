# AI Meme Studio

A comprehensive meme creation platform with AI-powered generation, extensive template library, and advanced GIF editing capabilities with Tenor API integration.

## Features

### 🎨 AI Meme Generation
- **Multi-Agent System**: Collaborative AI agents (Gag Writer, Casting Director, Set Designer) work together to create memes
- **Optimized Generation**: Unified image generation with improved prompts and text overlay
- **Template-Based Creation**: Create memes from popular templates with custom text
- **Real-time Progress**: Live updates during meme creation process
- **Professional Quality**: High-quality meme-ready images with proper text areas

### 🖼️ Template Gallery (80+ Templates)
- **Comprehensive Collection**: 80+ popular meme templates from classic to modern
- **Categories**: Organized by reaction, relationship, decision, mockery, opinion, surprise, intelligence, disaster, success, lifestyle, animals, philosophy, education, friendship, mischief, awkward, confession, advice, motivation, extreme, positive, negative, fantasy, sarcasm, conspiracy, presentation, hiding, planning, politics
- **Search & Filter**: Find templates by name, tags, or category with real-time search
- **Pagination**: Browse through extensive template library with 50 templates per page
- **Popularity Ranking**: Templates sorted by popularity and trending status
- **Responsive Grid**: Up to 7 columns on large screens for optimal browsing

### 🎬 GIF Studio with Tenor API Integration
- **Tenor API Integration**: Access millions of GIFs from Tenor's vast library
- **Real-time Search**: Search Tenor's entire GIF collection instantly
- **Trending Content**: Access currently trending GIFs with one click
- **Advanced Text Editor**: Full text overlay editor with fonts, colors, and effects
- **Drag & Drop**: Intuitive text positioning and layer management
- **Real-time Preview**: See changes instantly as you edit
- **Export Options**: Download in multiple formats (GIF, MP4, WebM)
- **Smart Filtering**: Automatic content filtering and quality validation
- **Source Selection**: Choose between "All Sources" or "Tenor Only" search

### 🔧 MCP (Model Context Protocol) Support
- **Claude Desktop Integration**: Use as a tool in Claude Desktop
- **Remote Access**: Generate memes and browse templates via MCP
- **Seamless Workflow**: Integrate meme creation into your AI workflow
- **Multiple Methods**: generateMeme, listTemplates, createMemeFromTemplate

## Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-meme-studio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Create a `.env` file in the `apps/backend` directory:
   ```env
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Stability AI Configuration  
   STABILITY_API_KEY=your_stability_api_key_here
   
   # Tenor API Configuration (for GIF Studio)
   TENOR_API_KEY=your_tenor_api_key_here
   
   # Optional: GIPHY API (fallback)
   GIPHY_API_KEY=your_giphy_api_key_here
   ```

   **Getting API Keys:**
   - **OpenAI**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
   - **Stability AI**: Get from [Stability AI Platform](https://platform.stability.ai/)
   - **Tenor API**: Get from [Google Cloud Console](https://console.cloud.google.com/) (Tenor is now part of Google)

4. **Start the development servers**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start individually
   npm run dev:backend  # Backend only
   npm run dev:frontend # Frontend only
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## Tenor API Integration

The GIF Studio now includes full Tenor API integration, providing access to millions of high-quality GIFs:

### Features
- **Real-time Search**: Search Tenor's entire GIF library with instant results
- **Trending GIFs**: Access currently trending content with one-click button
- **Category Browsing**: Browse by reactions, animals, sports, work, celebration, etc.
- **High-Quality Formats**: Multiple resolution options (full, medium, tiny)
- **Smart Filtering**: Automatic content filtering and quality checks
- **Source Selection**: Choose between searching all sources or Tenor only
- **Visual Indicators**: Special badges and styling for Tenor content

### Setup
1. Get a Tenor API key from Google Cloud Console
2. Add `TENOR_API_KEY=your_key_here` to your `.env` file
3. Restart the backend server

### Usage
- Use the "Tenor Only" search option to search exclusively in Tenor's library
- Click "Trending from Tenor" to see currently popular GIFs
- All Tenor GIFs are marked with a special gradient badge for easy identification
- Mixed search combines your curated collection with Tenor results

## Template Gallery Expansion

The template gallery has been significantly expanded with 80+ carefully curated meme templates:

### Template Categories
- **Top Tier Classics** (95-100 popularity): Drake Pointing, Distracted Boyfriend, Woman Yelling at Cat
- **Classic Internet Memes** (80-90 popularity): One Does Not Simply, Grumpy Cat, Success Kid
- **Modern Classics** (75-85 popularity): Roll Safe, Hide the Pain Harold, Matrix Morpheus
- **Social Media Era** (70-80 popularity): Socially Awkward Penguin, Confession Bear, Courage Wolf
- **Pop Culture References** (65-75 popularity): Simpsons, Family Guy, Lord of the Rings
- **Modern Internet Culture** (60-70 popularity): Gru, Politics, Entertainment

### Features
- **Category Counts**: Shows template count for each category
- **Enhanced Grid**: Up to 7 columns on large screens
- **Improved Search**: Real-time search across names, tags, and categories
- **Better Pagination**: 50 templates per page for efficient browsing

## MCP (Model Context Protocol) Setup

### For Claude Desktop Users

1. **Configure Claude Desktop**
   
   Add this to your `claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "ai-meme-studio": {
         "command": "/usr/bin/node",
         "args": ["/path/to/your/ai-meme-studio/apps/backend/mcp-server.js"]
       }
     }
   }
   ```
   
   **Note**: Replace `/usr/bin/node` with the output of `which node` on your terminal to get the correct Node.js path for your system.

2. **Start the backend**
   ```bash
   npm run dev:backend
   ```

3. **Available MCP Methods**
   - `generateMeme(concept, description)` - Create AI-generated memes
   - `listTemplates(page?, limit?, sort?, source?)` - Browse meme templates
   - `createMemeFromTemplate(templateId, topText?, bottomText?, customText?)` - Create from template

### Example Usage in Claude Desktop
```
@ai-meme-studio generateMeme concept="programmer debugging" description="A developer trying to fix a bug at 3 AM"
@ai-meme-studio listTemplates page=1 limit=10 sort=popularity
@ai-meme-studio createMemeFromTemplate templateId="drake-pointing" topText="AI" bottomText="Humans"
```

## API Endpoints

### Meme Generation
- `POST /api/memes` - Create new meme
- `GET /api/memes/:id` - Get meme status
- `GET /api/memes` - List all memes

### Templates
- `GET /api/templates` - List templates with pagination
- `GET /api/templates/categories` - Get available categories
- `GET /api/templates/search/:query` - Search templates

### GIF Studio
- `GET /api/gifs` - List GIFs with pagination
- `GET /api/gifs/search/:query` - Search all GIFs
- `GET /api/gifs/tenor/search/:query` - Search Tenor GIFs specifically
- `GET /api/gifs/tenor/trending` - Get trending Tenor GIFs
- `GET /api/gifs/categories` - Get GIF categories

### GIF Editor
- `POST /api/gifs/:id/edit` - Create editable GIF
- `GET /api/edited-gifs/:id` - Get edited GIF
- `POST /api/edited-gifs/:id/text` - Add text overlay
- `PUT /api/edited-gifs/:id/text/:overlayId` - Update text overlay
- `DELETE /api/edited-gifs/:id/text/:overlayId` - Remove text overlay
- `POST /api/edited-gifs/:id/render` - Render final GIF
- `GET /api/edited-gifs/:id/export` - Export GIF

### MCP Endpoints
- `POST /mcp/describe` - Get available MCP methods
- `POST /mcp/invoke` - Execute MCP methods

## Development

### Project Structure
```
ai-meme-studio/
├── apps/
│   ├── backend/          # Fastify API server
│   │   ├── src/
│   │   │   ├── agents/   # AI agents for meme generation
│   │   │   ├── routes/   # API routes
│   │   │   ├── services/ # Business logic
│   │   │   └── server.ts # Main server file
│   │   └── mcp-server.js # MCP protocol handler
│   └── frontend/         # React frontend
│       ├── src/
│       │   ├── components/
│       │   └── App.tsx
│       └── package.json
├── packages/
│   └── shared-types/     # Shared TypeScript types
└── package.json
```

### Key Technologies
- **Backend**: Fastify, TypeScript, OpenAI API, Stability AI, Tenor API
- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **AI**: Multi-agent system with specialized roles
- **Image Processing**: Sharp, SVG manipulation
- **GIF Processing**: Advanced text overlay and effects
- **MCP**: Model Context Protocol for Claude Desktop integration

### Development Commands
```bash
# Start development servers
npm run dev              # Start both backend + frontend
npm run dev:backend      # Backend only
npm run dev:frontend     # Frontend only

# Build for production
npm run build

# Utilities
npm run clean            # Clean build artifacts
npm run lint             # Check code quality
```

## Recent Updates

### v2.0 - Major Feature Expansion
- **Tenor API Integration**: Access to millions of GIFs from Tenor
- **Template Gallery Expansion**: 80+ meme templates across 28 categories
- **Enhanced Search**: Real-time search with source selection
- **Improved UI**: Better grid layouts and visual indicators
- **MCP Integration**: Full Claude Desktop support

### v1.5 - GIF Studio Enhancements
- **Advanced Text Editor**: Full text overlay editor with fonts and colors
- **Drag & Drop**: Intuitive text positioning and layer management
- **Export Options**: Multiple format support (GIF, MP4, WebM)
- **Real-time Preview**: Instant preview of changes

### v1.0 - Core Features
- **AI Meme Generation**: Multi-agent system for original meme creation
- **Template Gallery**: Classic meme template collection
- **Basic GIF Studio**: Curated GIF collection with editing capabilities

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines
- Use TypeScript for all new code
- Follow existing code style and patterns
- Add proper error handling and user feedback
- Test on both desktop and mobile
- Update documentation for new features

## License

MIT License - see LICENSE file for details. 