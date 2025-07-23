import { useState } from 'react';
import { Sparkles, Zap, Users } from 'lucide-react';
import { MemeStudio } from './components/MemeStudio';
import './App.css';

function App() {
  const [showStudio, setShowStudio] = useState(false);

  if (showStudio) {
    return <MemeStudio />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Sparkles className="h-12 w-12 text-yellow-400" />
            <h1 className="text-5xl font-bold text-white">AI Meme Studio</h1>
            <Sparkles className="h-12 w-12 text-yellow-400" />
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Transform your creative ideas into completely original memes using our team of specialized AI agents. 
            No more stale templates - every meme is uniquely generated just for you.
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <Users className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">AI Comedy Troupe</h3>
            <p className="text-gray-300">
              Three specialized AI agents work together: Set Designer creates backgrounds, 
              Casting Director adds characters, and Gag Writer crafts perfect punchlines.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <Zap className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Fully Generative</h3>
            <p className="text-gray-300">
              Every visual element is generated on-demand by AI. No template libraries, 
              no recycled content - just infinite creative possibilities.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <Sparkles className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Watch It Build</h3>
            <p className="text-gray-300">
              See your meme come to life step-by-step as each AI agent completes their work. 
              The creative process is transparent and engaging.
            </p>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => setShowStudio(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all duration-200 transform hover:scale-105 shadow-2xl"
          >
            Start Creating Memes
          </button>
          <p className="text-gray-400 mt-4">
            Just describe your concept and watch the magic happen
          </p>
        </div>
      </div>
    </div>
  );
}

export default App; 