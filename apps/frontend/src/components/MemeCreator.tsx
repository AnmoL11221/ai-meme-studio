import { useState } from 'react';
import { ArrowLeft, Download, Share, Sparkles } from 'lucide-react';
import { MemeTemplate } from '@ai-meme-studio/shared-types';

interface MemeCreatorProps {
  template: MemeTemplate;
  onBack: () => void;
}

export function MemeCreator({ template, onBack }: MemeCreatorProps) {
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdMeme, setCreatedMeme] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createMeme = async () => {
    if (!topText.trim() && !bottomText.trim()) {
      setError('Please enter at least some text for your meme');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/memes/create-from-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: template.id,
          topText: topText.trim() || undefined,
          bottomText: bottomText.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success && data.data.finalMeme) {
        setCreatedMeme(data.data.finalMeme.url);
      } else {
        throw new Error(data.error || 'Failed to create meme');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create meme');
    } finally {
      setIsCreating(false);
    }
  };

  const downloadMeme = () => {
    if (!createdMeme) return;

    // Convert base64 to blob and download
    const link = document.createElement('a');
    link.href = createdMeme;
    link.download = `meme-${template.name.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareMeme = async () => {
    if (!createdMeme) return;

    if (navigator.share) {
      try {
        // Convert base64 to blob for sharing
        const response = await fetch(createdMeme);
        const blob = await response.blob();
        const file = new File([blob], 'meme.png', { type: 'image/png' });

        await navigator.share({
          title: 'Check out this meme!',
          text: `Made with ${template.name} template`,
          files: [file],
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      } catch (err) {
        console.error('Error copying to clipboard:', err);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Your Meme</h1>
          <p className="text-gray-600">Using template: {template.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Template Preview */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Template Preview</h2>
              <p className="text-sm text-gray-500">Category: {template.category}</p>
            </div>
            
            <div className="p-4">
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={template.imageUrl}
                  alt={template.name}
                  className="w-full h-auto"
                />
                
                {/* Text overlays preview */}
                {topText && template.topTextPosition.width > 0 && (
                  <div
                    className="absolute flex items-center justify-center text-center"
                    style={{
                      left: `${(template.topTextPosition.x / template.topTextPosition.width) * 100}%`,
                      top: `${(template.topTextPosition.y / template.topTextPosition.height) * 100}%`,
                      width: `${(template.topTextPosition.width / 1000) * 100}%`,
                      height: `${(template.topTextPosition.height / 1000) * 100}%`,
                    }}
                  >
                    <span className="text-white font-bold text-lg drop-shadow-lg">
                      {topText}
                    </span>
                  </div>
                )}
                
                {bottomText && template.bottomTextPosition.width > 0 && (
                  <div
                    className="absolute flex items-center justify-center text-center"
                    style={{
                      left: `${(template.bottomTextPosition.x / template.bottomTextPosition.width) * 100}%`,
                      top: `${(template.bottomTextPosition.y / template.bottomTextPosition.height) * 100}%`,
                      width: `${(template.bottomTextPosition.width / 1000) * 100}%`,
                      height: `${(template.bottomTextPosition.height / 1000) * 100}%`,
                    }}
                  >
                    <span className="text-white font-bold text-lg drop-shadow-lg">
                      {bottomText}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Template Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Template Information</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Name:</span> {template.name}</div>
              <div><span className="font-medium">Category:</span> {template.category}</div>
              <div><span className="font-medium">Popularity:</span> {template.popularity}/100</div>
              <div>
                <span className="font-medium">Tags:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {template.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-white text-gray-600 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Meme Creation */}
        <div className="space-y-6">
          {/* Text Inputs */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Your Text</h2>
            
            <div className="space-y-4">
              {template.topTextPosition.width > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Top Text
                  </label>
                  <textarea
                    value={topText}
                    onChange={(e) => setTopText(e.target.value)}
                    placeholder="Enter top text..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={2}
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">{topText.length}/100 characters</p>
                </div>
              )}

              {template.bottomTextPosition.width > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bottom Text
                  </label>
                  <textarea
                    value={bottomText}
                    onChange={(e) => setBottomText(e.target.value)}
                    placeholder="Enter bottom text..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={2}
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">{bottomText.length}/100 characters</p>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={createMeme}
              disabled={isCreating || (!topText.trim() && !bottomText.trim())}
              className="w-full mt-6 px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating Meme...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Create Meme
                </>
              )}
            </button>
          </div>

          {/* Created Meme */}
          {createdMeme && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Meme is Ready!</h2>
              
              <div className="bg-gray-100 rounded-lg overflow-hidden mb-4">
                <img
                  src={createdMeme}
                  alt="Created meme"
                  className="w-full h-auto"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={downloadMeme}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                
                <button
                  onClick={shareMeme}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Share className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 