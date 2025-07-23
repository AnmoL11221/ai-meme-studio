import { useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';

interface MemeStudioProps {
  onBack?: () => void;
}

export function MemeStudio({ onBack }: MemeStudioProps) {
  const [concept, setConcept] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim()) return;
    
    setIsCreating(true);
    console.log('Creating meme with concept:', concept);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        <header className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-white">AI Meme Studio</h1>
        </header>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Describe Your Meme Concept
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <textarea
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="e.g., 'A robot having an existential crisis in the rain'"
                  className="w-full h-32 p-4 rounded-lg bg-white/20 text-white placeholder-gray-300 border border-white/30 focus:border-purple-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={!concept.trim() || isCreating}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Send className="h-5 w-5" />
                {isCreating ? 'Creating...' : 'Create Meme'}
              </button>
            </form>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Creation Process
            </h2>
            <div className="space-y-4">
              <div className="text-gray-300 text-center py-8">
                Enter a concept to start the creative process
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 