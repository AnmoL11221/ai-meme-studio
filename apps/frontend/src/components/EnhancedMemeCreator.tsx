import { useState, useRef, useCallback } from 'react';
import { ArrowLeft, Download, Share, Sparkles, Palette, Type, Bold, Italic } from 'lucide-react';
import { MemeTemplate } from '@ai-meme-studio/shared-types';

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  stroke: boolean;
  strokeColor: string;
  strokeWidth: number;
}

interface EnhancedMemeCreatorProps {
  template: MemeTemplate;
  onBack: () => void;
}

export function EnhancedMemeCreator({ template, onBack }: EnhancedMemeCreatorProps) {
  const [textElements, setTextElements] = useState<TextElement[]>([
    {
      id: '1',
      text: 'Top Text',
      x: 50,
      y: 50,
      fontSize: 32,
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontStyle: 'normal',
      stroke: true,
      strokeColor: '#000000',
      strokeWidth: 2
    },
    {
      id: '2',
      text: 'Bottom Text',
      x: 50,
      y: 350,
      fontSize: 32,
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontStyle: 'normal',
      stroke: true,
      strokeColor: '#000000',
      strokeWidth: 2
    }
  ]);
  
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isCreating, setIsCreating] = useState(false);
  const [createdMeme, setCreatedMeme] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    const element = textElements.find(el => el.id === elementId);
    if (!element) return;

    setSelectedElement(elementId);
    setIsDragging(true);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left - element.x,
        y: e.clientY - rect.top - element.y
      });
    }
  }, [textElements]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedElement) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const newX = Math.max(0, Math.min(rect.width - 200, e.clientX - rect.left - dragOffset.x));
    const newY = Math.max(0, Math.min(rect.height - 50, e.clientY - rect.top - dragOffset.y));

    setTextElements(prev => 
      prev.map(el => 
        el.id === selectedElement 
          ? { ...el, x: newX, y: newY }
          : el
      )
    );
  }, [isDragging, selectedElement, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const updateTextElement = (id: string, updates: Partial<TextElement>) => {
    setTextElements(prev => 
      prev.map(el => 
        el.id === id 
          ? { ...el, ...updates }
          : el
      )
    );
  };

  const addTextElement = () => {
    const newElement: TextElement = {
      id: Date.now().toString(),
      text: 'New Text',
      x: 100,
      y: 200,
      fontSize: 32,
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontStyle: 'normal',
      stroke: true,
      strokeColor: '#000000',
      strokeWidth: 2
    };
    setTextElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
  };

  const removeTextElement = (id: string) => {
    setTextElements(prev => prev.filter(el => el.id !== id));
    if (selectedElement === id) {
      setSelectedElement(null);
    }
  };

  const createMeme = async () => {
    if (textElements.filter(el => el.text.trim()).length === 0) {
      setError('Please add at least some text for your meme');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // For now, use the original API with top/bottom text
      const topElement = textElements.find(el => el.y < 200);
      const bottomElement = textElements.find(el => el.y >= 200);

      const response = await fetch('/api/memes/create-from-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: template.id,
          topText: topElement?.text?.trim() || undefined,
          bottomText: bottomElement?.text?.trim() || undefined,
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
    const link = document.createElement('a');
    link.href = createdMeme;
    link.download = `meme-${template.name.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedElementData = textElements.find(el => el.id === selectedElement);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enhanced Meme Creator</h1>
          <p className="text-gray-600">Template: {template.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Template Canvas */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Meme Canvas</h2>
              <p className="text-sm text-gray-500">Drag text elements to position them</p>
            </div>
            
            <div className="p-4">
              <div 
                ref={canvasRef}
                className="relative bg-gray-100 rounded-lg overflow-hidden cursor-crosshair"
                style={{ aspectRatio: '1' }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img
                  src={template.imageUrl}
                  alt={template.name}
                  className="w-full h-full object-contain"
                  draggable={false}
                />
                
                {/* Text overlays */}
                {textElements.map((element) => (
                  <div
                    key={element.id}
                    className={`absolute cursor-move select-none ${
                      selectedElement === element.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    style={{
                      left: element.x,
                      top: element.y,
                      fontSize: element.fontSize,
                      color: element.color,
                      fontWeight: element.fontWeight,
                      fontStyle: element.fontStyle,
                      textShadow: element.stroke ? 
                        `${element.strokeWidth}px ${element.strokeWidth}px 0 ${element.strokeColor}, 
                         -${element.strokeWidth}px -${element.strokeWidth}px 0 ${element.strokeColor}, 
                         ${element.strokeWidth}px -${element.strokeWidth}px 0 ${element.strokeColor}, 
                         -${element.strokeWidth}px ${element.strokeWidth}px 0 ${element.strokeColor}` : 
                        'none',
                      fontFamily: 'Arial, sans-serif',
                      lineHeight: '1.2',
                      maxWidth: '300px',
                      wordWrap: 'break-word'
                    }}
                    onMouseDown={(e) => handleMouseDown(e, element.id)}
                    onClick={() => setSelectedElement(element.id)}
                  >
                    {element.text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Created Meme Display */}
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
              </div>
            </div>
          )}
        </div>

        {/* Text Controls */}
        <div className="space-y-6">
          {/* Text Elements List */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Text Elements</h2>
              <button
                onClick={addTextElement}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
              >
                Add Text
              </button>
            </div>
            
            <div className="space-y-3">
              {textElements.map((element) => (
                <div
                  key={element.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedElement === element.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedElement(element.id)}
                >
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={element.text}
                      onChange={(e) => updateTextElement(element.id, { text: e.target.value })}
                      className="flex-1 bg-transparent border-none focus:outline-none font-medium"
                      placeholder="Enter text..."
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTextElement(element.id);
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Element Controls */}
          {selectedElementData && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Text Properties</h3>
              
              <div className="space-y-4">
                {/* Font Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
                  <input
                    type="range"
                    min="12"
                    max="72"
                    value={selectedElementData.fontSize}
                    onChange={(e) => updateTextElement(selectedElementData.id, { fontSize: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-500 text-center">{selectedElementData.fontSize}px</div>
                </div>

                {/* Text Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedElementData.color}
                      onChange={(e) => updateTextElement(selectedElementData.id, { color: e.target.value })}
                      className="w-12 h-8 rounded border border-gray-300"
                    />
                    <span className="text-sm text-gray-600">{selectedElementData.color}</span>
                  </div>
                </div>

                {/* Font Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Font Style</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateTextElement(selectedElementData.id, { 
                        fontWeight: selectedElementData.fontWeight === 'bold' ? 'normal' : 'bold' 
                      })}
                      className={`flex items-center gap-1 px-3 py-1 rounded text-sm border transition-colors ${
                        selectedElementData.fontWeight === 'bold'
                          ? 'bg-gray-800 text-white border-gray-800'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Bold className="w-3 h-3" />
                      Bold
                    </button>
                    <button
                      onClick={() => updateTextElement(selectedElementData.id, { 
                        fontStyle: selectedElementData.fontStyle === 'italic' ? 'normal' : 'italic' 
                      })}
                      className={`flex items-center gap-1 px-3 py-1 rounded text-sm border transition-colors ${
                        selectedElementData.fontStyle === 'italic'
                          ? 'bg-gray-800 text-white border-gray-800'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Italic className="w-3 h-3" />
                      Italic
                    </button>
                  </div>
                </div>

                {/* Text Stroke */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Text Stroke</label>
                    <input
                      type="checkbox"
                      checked={selectedElementData.stroke}
                      onChange={(e) => updateTextElement(selectedElementData.id, { stroke: e.target.checked })}
                      className="rounded"
                    />
                  </div>
                  
                  {selectedElementData.stroke && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selectedElementData.strokeColor}
                          onChange={(e) => updateTextElement(selectedElementData.id, { strokeColor: e.target.value })}
                          className="w-8 h-6 rounded border border-gray-300"
                        />
                        <span className="text-sm text-gray-600">Stroke Color</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="6"
                        value={selectedElementData.strokeWidth}
                        onChange={(e) => updateTextElement(selectedElementData.id, { strokeWidth: parseInt(e.target.value) })}
                        className="w-full"
                      />
                      <div className="text-sm text-gray-500 text-center">Width: {selectedElementData.strokeWidth}px</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Create Button */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={createMeme}
              disabled={isCreating}
              className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
        </div>
      </div>
    </div>
  );
} 