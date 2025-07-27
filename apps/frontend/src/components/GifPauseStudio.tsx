import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Download, Plus, Trash2, Edit3, Copy, Settings } from 'lucide-react';

interface GifFrame {
  index: number;
  timestamp: number;
  duration: number;
  width: number;
  height: number;
}

interface PausedGifMeme {
  id: string;
  title: string;
  selectedFrame: GifFrame;
  textOverlays: any[];
  outputFormat: string;
  quality: number;
  width?: number;
  height?: number;
  url?: string;
  createdAt: string;
}

interface ExportOptions {
  format: 'png' | 'jpg' | 'webp' | 'gif' | 'mp4' | 'webm';
  quality: number;
  width?: number;
  height?: number;
  optimize?: boolean;
}

interface GifPauseStudioProps {
  gifId: string;
  gifUrl: string;
  gifTitle: string;
  onBack: () => void;
}

export const GifPauseStudio: React.FC<GifPauseStudioProps> = ({ 
  gifId, 
  gifUrl, 
  gifTitle, 
  onBack 
}) => {
  const [frames, setFrames] = useState<GifFrame[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pausedMeme, setPausedMeme] = useState<PausedGifMeme | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'png',
    quality: 90,
    optimize: true
  });
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const extractFrames = async () => {
    setIsExtracting(true);
    try {
      const response = await fetch(`/api/gifs/${gifId}/frames`);
      const data = await response.json();
      
      if (data.success) {
        setFrames(data.frames);
        setTotalDuration(data.frames.reduce((acc: number, frame: GifFrame) => acc + frame.duration, 0));
        console.log(`🎬 Extracted ${data.frames.length} frames from GIF`);
      }
    } catch (error) {
      console.error('Error extracting frames:', error);
    } finally {
      setIsExtracting(false);
    }
  };

  const createPausedMeme = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/gifs/${gifId}/pause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          frameIndex: selectedFrame,
          title: `${gifTitle} - Frame ${selectedFrame}`
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPausedMeme(data.pausedMeme);
        console.log(`⏸️ Created paused meme from frame ${selectedFrame}`);
      }
    } catch (error) {
      console.error('Error creating paused meme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPausedMeme = async () => {
    if (!pausedMeme) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/paused-memes/${pausedMeme.id}/render`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPausedMeme(data.meme);
        console.log(`🎨 Rendered paused meme`);
      }
    } catch (error) {
      console.error('Error rendering paused meme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportPausedMeme = async () => {
    if (!pausedMeme) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/paused-memes/${pausedMeme.id}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportOptions),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `paused-meme-${pausedMeme.id}.${exportOptions.format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log(`📦 Exported paused meme as ${exportOptions.format}`);
      }
    } catch (error) {
      console.error('Error exporting paused meme:', error);
    } finally {
      setIsLoading(false);
      setShowExportModal(false);
    }
  };

  const animateFrames = () => {
    if (!isPlaying || frames.length === 0) return;
    
    const nextFrame = (selectedFrame + 1) % frames.length;
    setSelectedFrame(nextFrame);
    setCurrentTime(frames[nextFrame].timestamp);
    
    animationRef.current = requestAnimationFrame(() => {
      setTimeout(animateFrames, frames[nextFrame].duration);
    });
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      setIsPlaying(true);
      animateFrames();
    }
  };

  const selectFrame = (frameIndex: number) => {
    setSelectedFrame(frameIndex);
    setCurrentTime(frames[frameIndex].timestamp);
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  useEffect(() => {
    extractFrames();
  }, [gifId]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              <span>←</span>
              <span>Back to GIF Studio</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-800">GIF Pause Studio</h1>
          </div>
          <div className="text-sm text-gray-600">
            {frames.length > 0 && (
              <span>{frames.length} frames • {Math.round(totalDuration)}ms duration</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">GIF Preview</h2>
              
              {isExtracting ? (
                <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Extracting frames...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <video
                    ref={videoRef}
                    src={gifUrl}
                    className="w-full h-64 object-contain bg-gray-100 rounded-lg"
                    loop
                    muted
                    onLoadedMetadata={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = currentTime / 1000;
                      }
                    }}
                  />
                  
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={togglePlayPause}
                      className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                    >
                      {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                      <span>{isPlaying ? 'Pause' : 'Play'}</span>
                    </button>
                    
                    <div className="text-sm text-gray-600">
                      Frame {selectedFrame + 1} of {frames.length}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {frames.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Frame Timeline</h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto">
                    {frames.map((frame, index) => (
                      <button
                        key={index}
                        onClick={() => selectFrame(index)}
                        className={`relative p-1 rounded border-2 transition-all ${
                          index === selectedFrame
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="w-full h-12 bg-gray-100 rounded flex items-center justify-center text-xs">
                          {index + 1}
                        </div>
                        <div className="absolute bottom-0 right-0 bg-purple-500 text-white text-xs px-1 rounded">
                          {frame.duration}ms
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={createPausedMeme}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50"
                  >
                    <Pause size={16} />
                    <span>Create Meme from Frame {selectedFrame + 1}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {pausedMeme ? (
              <>
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Meme Preview</h2>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={renderPausedMeme}
                        disabled={isLoading}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? 'Rendering...' : 'Render'}
                      </button>
                      <button
                        onClick={() => setShowExportModal(true)}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                      >
                        Export
                      </button>
                    </div>
                  </div>
                  
                  {pausedMeme.url ? (
                    <div className="space-y-4">
                      <img
                        src={pausedMeme.url}
                        alt={pausedMeme.title}
                        className="w-full h-64 object-contain bg-gray-100 rounded-lg"
                      />
                      <div className="text-sm text-gray-600">
                        <p><strong>Frame:</strong> {pausedMeme.selectedFrame.index + 1}</p>
                        <p><strong>Format:</strong> {pausedMeme.outputFormat.toUpperCase()}</p>
                        <p><strong>Quality:</strong> {pausedMeme.quality}%</p>
                        <p><strong>Size:</strong> {pausedMeme.width} × {pausedMeme.height}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                      <div className="text-center">
                        <p className="text-gray-600 mb-2">Meme not rendered yet</p>
                        <button
                          onClick={renderPausedMeme}
                          disabled={isLoading}
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                        >
                          {isLoading ? 'Rendering...' : 'Render Meme'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Text Overlays</h2>
                    <button className="flex items-center space-x-2 px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 transition-colors">
                      <Plus size={14} />
                      <span>Add Text</span>
                    </button>
                  </div>
                  
                  {pausedMeme.textOverlays.length > 0 ? (
                    <div className="space-y-2">
                      {pausedMeme.textOverlays.map((overlay, index) => (
                        <div key={overlay.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{overlay.text}</p>
                            <p className="text-sm text-gray-600">
                              Position: ({overlay.x}, {overlay.y}) • Size: {overlay.fontSize}px
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="p-1 text-blue-500 hover:bg-blue-50 rounded">
                              <Edit3 size={14} />
                            </button>
                            <button className="p-1 text-green-500 hover:bg-green-50 rounded">
                              <Copy size={14} />
                            </button>
                            <button className="p-1 text-red-500 hover:bg-red-50 rounded">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No text overlays added yet</p>
                      <p className="text-sm">Click "Add Text" to get started</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-center py-12">
                  <Pause size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Paused Meme Created</h3>
                  <p className="text-gray-500 mb-4">
                    Select a frame and click "Create Meme from Frame" to get started
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Export Options</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format
                </label>
                <select
                  value={exportOptions.format}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    format: e.target.value as ExportOptions['format']
                  })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="png">PNG - Lossless</option>
                  <option value="jpg">JPEG - Compressed</option>
                  <option value="webp">WebP - Modern</option>
                  <option value="gif">GIF - Animated</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality: {exportOptions.quality}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={exportOptions.quality}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    quality: parseInt(e.target.value)
                  })}
                  className="w-full"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="optimize"
                  checked={exportOptions.optimize}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    optimize: e.target.checked
                  })}
                  className="rounded"
                />
                <label htmlFor="optimize" className="text-sm text-gray-700">
                  Optimize for web
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={exportPausedMeme}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <Download size={16} />
                <span>{isLoading ? 'Exporting...' : 'Export'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 