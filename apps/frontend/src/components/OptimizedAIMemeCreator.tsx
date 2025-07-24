import React, { useState, useRef } from 'react';
import { MemeCreationState, MemeCreationStatus } from '@ai-meme-studio/shared-types';
import axios from 'axios';

interface OptimizedAIMemeCreatorProps {
  onBack: () => void;
  onMemeCreated?: (meme: MemeCreationState) => void;
}

interface TextElement {
  id: string;
  content: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontWeight: string;
  isDragging: boolean;
}

export function OptimizedAIMemeCreator({ onBack, onMemeCreated }: OptimizedAIMemeCreatorProps) {
  const [concept, setConcept] = useState('');
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMeme, setGeneratedMeme] = useState<MemeCreationState | null>(null);
  const [suggestedCaptions, setSuggestedCaptions] = useState<string[]>([]);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [isAddingText, setIsAddingText] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleGenerate = async () => {
    if (!concept.trim() || !description.trim()) {
      alert('Please provide both a concept and description for your meme');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await axios.post('http://localhost:3001/api/memes/create-optimized', {
        concept: concept.trim(),
        description: description.trim()
      });

      if (response.data.success) {
        const memeState = response.data.data;
        
        const pollForCompletion = async () => {
          const statusResponse = await axios.get(`http://localhost:3001/api/memes/${memeState.id}/status`);
          const updatedMeme = statusResponse.data.data;
          
          if (updatedMeme.status === MemeCreationStatus.COMPLETED && updatedMeme.finalMeme) {
            setGeneratedMeme(updatedMeme);
            setSuggestedCaptions(updatedMeme.captions || []);
            setIsGenerating(false);
            if (onMemeCreated) {
              onMemeCreated(updatedMeme);
            }
          } else if (updatedMeme.status === MemeCreationStatus.FAILED) {
            setIsGenerating(false);
            alert('Meme generation failed: ' + (updatedMeme.error || 'Unknown error'));
          } else {
            setTimeout(pollForCompletion, 2000);
          }
        };
        
        setTimeout(pollForCompletion, 2000);
      } else {
        throw new Error(response.data.error || 'Failed to create meme');
      }
    } catch (error) {
      setIsGenerating(false);
      console.error('Error generating meme:', error);
      alert('Failed to generate meme: ' + (error as Error).message);
    }
  };

  const addTextElement = (content: string) => {
    const newElement: TextElement = {
      id: `text-${Date.now()}`,
      content,
      x: 50,
      y: 50,
      fontSize: 32,
      color: '#FFFFFF',
      fontWeight: 'bold',
      isDragging: false
    };
    setTextElements([...textElements, newElement]);
    setSelectedTextId(newElement.id);
    setIsAddingText(false);
  };

  const updateTextElement = (id: string, updates: Partial<TextElement>) => {
    setTextElements(textElements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const deleteTextElement = (id: string) => {
    setTextElements(textElements.filter(el => el.id !== id));
    setSelectedTextId(null);
  };

  const handleMouseDown = (e: React.MouseEvent, textId: string) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const textElement = textElements.find(el => el.id === textId);
    if (!textElement) return;

    const offsetX = e.clientX - rect.left - textElement.x;
    const offsetY = e.clientY - rect.top - textElement.y;
    
    setDragOffset({ x: offsetX, y: offsetY });
    setSelectedTextId(textId);
    updateTextElement(textId, { isDragging: true });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const draggingElement = textElements.find(el => el.isDragging);
    if (!draggingElement || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, rect.width - 100));
    const newY = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, rect.height - 30));

    updateTextElement(draggingElement.id, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setTextElements(textElements.map(el => ({ ...el, isDragging: false })));
  };

  const saveMemeWithText = async () => {
    if (!generatedMeme || textElements.length === 0) return;

    try {
      const textsData = textElements.map(el => ({
        content: el.content,
        x: el.x,
        y: el.y,
        fontSize: el.fontSize,
        color: el.color,
        fontWeight: el.fontWeight
      }));

      const response = await axios.post('http://localhost:3001/api/memes/add-text', {
        memeId: generatedMeme.id,
        texts: textsData
      });

      if (response.data.success) {
        setGeneratedMeme(response.data.data);
        alert('Text added successfully!');
      }
    } catch (error) {
      console.error('Error adding text:', error);
      alert('Failed to add text to meme');
    }
  };

  const selectedText = textElements.find(el => el.id === selectedTextId);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">🤖 AI Meme Creator</h2>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>

      {!generatedMeme ? (
        <div className="space-y-6">
          <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">✨ Create AI Memes</h3>
            <p className="text-gray-600">
              Our optimized system generates single, beautiful images instead of merging separate backgrounds and characters.
              The result is a cohesive, professional-looking meme perfect for adding your text!
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meme Concept *
            </label>
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="e.g., 'Procrastination', 'Monday Morning', 'Coding Life'"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isGenerating}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the image you want (e.g., 'A tired person sitting at a desk with coffee, looking stressed at a computer screen with a deadline approaching')"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isGenerating}
            />
            <p className="text-sm text-gray-500 mt-1">
              💡 Tip: Be specific about emotions, setting, and details for better results
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !concept.trim() || !description.trim()}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isGenerating ? '🎨 Generating Your AI Meme...' : '🎨 Generate AI Meme Image'}
          </button>

          {isGenerating && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Creating your AI meme image...</p>
              <p className="text-sm text-gray-500 mt-2">✨ Generating a single, cohesive image perfect for text overlay</p>
              <p className="text-sm text-gray-500">⏱️ This usually takes 10-20 seconds</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">🎨 Your Generated Meme</h3>
                <button
                  onClick={() => {
                    setGeneratedMeme(null);
                    setTextElements([]);
                    setSuggestedCaptions([]);
                    setConcept('');
                    setDescription('');
                  }}
                  className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  🔄 Generate New
                </button>
              </div>
              
              <div 
                ref={canvasRef}
                className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-crosshair bg-white"
                style={{ aspectRatio: '1/1', maxHeight: '500px' }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img
                  src={`http://localhost:3001${generatedMeme.finalMeme?.url}`}
                  alt="Generated meme"
                  className="w-full h-full object-cover"
                />
                
                {textElements.map((textEl) => (
                  <div
                    key={textEl.id}
                    className={`absolute cursor-move select-none ${
                      selectedTextId === textEl.id ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                    }`}
                    style={{
                      left: textEl.x,
                      top: textEl.y,
                      fontSize: textEl.fontSize,
                      color: textEl.color,
                      fontWeight: textEl.fontWeight,
                      fontFamily: 'Impact, Arial Black, sans-serif',
                      textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
                      userSelect: 'none',
                      textTransform: 'uppercase'
                    }}
                    onMouseDown={(e) => handleMouseDown(e, textEl.id)}
                  >
                    {textEl.content}
                  </div>
                ))}
                
                {textElements.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10">
                    <p className="text-gray-600 text-center">
                      👆 Click "Add Text" or use suggested captions<br/>
                      <span className="text-sm">Your text will appear here and be draggable</span>
                    </p>
                  </div>
                )}
              </div>
              
              {textElements.length > 0 && (
                <button
                  onClick={saveMemeWithText}
                  className="w-full mt-4 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  💾 Save Meme with Text
                </button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-3">➕ Add Text</h4>
              {!isAddingText ? (
                <button
                  onClick={() => setIsAddingText(true)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Add Custom Text
                </button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Enter your text"
                    className="w-full px-3 py-2 border rounded-lg"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement;
                        if (target.value.trim()) {
                          addTextElement(target.value.trim());
                          target.value = '';
                        }
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const input = document.querySelector('input[placeholder="Enter your text"]') as HTMLInputElement;
                        if (input?.value.trim()) {
                          addTextElement(input.value.trim());
                          input.value = '';
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setIsAddingText(false)}
                      className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {suggestedCaptions.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">💡 AI Suggested Captions</h4>
                <div className="space-y-2">
                  {suggestedCaptions.map((caption, index) => (
                    <button
                      key={index}
                      onClick={() => addTextElement(caption)}
                      className="w-full text-left px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-sm"
                    >
                      "{caption}"
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Click any suggestion to add it to your meme
                </p>
              </div>
            )}

            {selectedText && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">🎨 Text Properties</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Content</label>
                    <input
                      type="text"
                      value={selectedText.content}
                      onChange={(e) => updateTextElement(selectedText.id, { content: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Font Size</label>
                    <input
                      type="range"
                      min="16"
                      max="72"
                      value={selectedText.fontSize}
                      onChange={(e) => updateTextElement(selectedText.id, { fontSize: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <span className="text-sm text-gray-600">{selectedText.fontSize}px</span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={selectedText.color}
                        onChange={(e) => updateTextElement(selectedText.id, { color: e.target.value })}
                        className="w-16 h-10 border rounded-lg"
                      />
                      <div className="flex gap-1 flex-1">
                                                 {['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00'].map(color => (
                           <button
                             key={color}
                             onClick={() => updateTextElement(selectedText.id, { color })}
                             className="w-8 h-8 rounded border-2 border-gray-300"
                             style={{ backgroundColor: color }}
                             aria-label={`Set text color to ${color}`}
                             title={`Set text color to ${color}`}
                           />
                         ))}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => deleteTextElement(selectedText.id)}
                    className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    🗑️ Delete Text
                  </button>
                </div>
              </div>
            )}

            {textElements.length > 0 && (
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  💡 <strong>Tip:</strong> Drag text elements to reposition them. Click a text to select and edit its properties.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 