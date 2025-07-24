import { useState } from 'react';
import { Sparkles, Image, Bot, ArrowLeft } from 'lucide-react';
import { MemeTemplate } from '@ai-meme-studio/shared-types';
import { TemplateGallery } from './components/TemplateGallery';
import { EnhancedMemeCreator } from './components/EnhancedMemeCreator';
import { MemeStudio } from './components/MemeStudio';
import { OptimizedAIMemeCreator } from './components/OptimizedAIMemeCreator';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'gallery' | 'creator' | 'ai-studio' | 'optimized-ai'>('home');
  const [selectedTemplate, setSelectedTemplate] = useState<MemeTemplate | null>(null);

  const handleTemplateSelect = (template: MemeTemplate) => {
    setSelectedTemplate(template);
    setCurrentView('creator');
  };

  const handleBackToGallery = () => {
    setSelectedTemplate(null);
    setCurrentView('gallery');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'gallery':
        return <TemplateGallery onSelectTemplate={handleTemplateSelect} />;
      
      case 'creator':
        if (!selectedTemplate) return null;
        return <EnhancedMemeCreator template={selectedTemplate} onBack={handleBackToGallery} />;
      
      case 'ai-studio':
        return <MemeStudio onBack={() => setCurrentView('home')} />;
      
      case 'optimized-ai':
        return <OptimizedAIMemeCreator onBack={() => setCurrentView('home')} />;
      
      default:
        return renderHomePage();
    }
  };

  const renderHomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Sparkles className="h-12 w-12 text-yellow-400" />
            <h1 className="text-5xl font-bold text-white">AI Meme Studio</h1>
            <Sparkles className="h-12 w-12 text-yellow-400" />
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Create memes using popular templates or let AI generate completely custom content
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div 
            onClick={() => setCurrentView('gallery')}
            className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center cursor-pointer hover:bg-white/20 transition-all group"
          >
            <Image className="h-16 w-16 text-blue-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-semibold text-white mb-4">Template Gallery</h3>
            <p className="text-gray-300 mb-6">
              Browse 100+ popular meme templates from the internet. Add your own text to classic formats like Drake, Distracted Boyfriend, and more.
            </p>
            <div className="bg-blue-500 text-white px-6 py-2 rounded-lg inline-block">
              Browse Templates
            </div>
          </div>

          <div 
            onClick={() => setCurrentView('optimized-ai')}
            className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center cursor-pointer hover:bg-white/20 transition-all group"
          >
            <Bot className="h-16 w-16 text-purple-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-semibold text-white mb-4">AI Studio</h3>
            <p className="text-gray-300 mb-6">
              Generate cohesive, professional meme images with AI. Single unified generation creates better results than separate background + character merging.
            </p>
            <div className="bg-purple-500 text-white px-6 py-2 rounded-lg inline-block">
              Generate AI Memes
            </div>
          </div>

          <div 
            onClick={() => setCurrentView('ai-studio')}
            className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center cursor-pointer hover:bg-white/20 transition-all group"
          >
            <Bot className="h-16 w-16 text-green-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-semibold text-white mb-4">Legacy AI Studio</h3>
            <p className="text-gray-300 mb-6">
              Original multi-agent system with separate background, character, and text generation. May have blending issues.
            </p>
            <div className="bg-green-500 text-white px-6 py-2 rounded-lg inline-block">
              Try Legacy AI
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-yellow-400 mb-2">100+</div>
            <div className="text-gray-300">Popular Templates</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-400 mb-2">10</div>
            <div className="text-gray-300">Categories</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-400 mb-2">∞</div>
            <div className="text-gray-300">AI Possibilities</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Global Header with Navigation */}
      {currentView !== 'home' && (
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentView('home')}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            
            <div 
              onClick={() => setCurrentView('home')}
              className="cursor-pointer"
            >
              <h1 className="text-2xl font-bold text-white">🎭 AI Meme Studio</h1>
            </div>
            
            <div className="w-32"></div>
          </div>
        </div>
      )}
      
      {/* Content */}
      {currentView === 'home' ? renderHomePage() : (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="container mx-auto py-8">
            {renderContent()}
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 