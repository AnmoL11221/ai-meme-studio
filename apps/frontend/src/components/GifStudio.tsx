import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, Search, Filter, Sparkles, Download, Edit3, Play, Pause, Heart, Share2 } from 'lucide-react';

interface GifTemplate {
  id: string;
  title: string;
  gifUrl: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  duration?: number;
  size?: number;
  tags: string[];
  category: string;
  source: string;
  popularity: number;
  trending?: boolean;
  isAnimated: boolean;
}

interface GifStudioProps {
  onBack: () => void;
}

export const GifStudio: React.FC<GifStudioProps> = ({ onBack }) => {
  const [gifs, setGifs] = useState<GifTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalGifs, setTotalGifs] = useState(0);
  const [selectedGif, setSelectedGif] = useState<GifTemplate | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const GIFS_PER_PAGE = 24;

  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const debouncedSearch = useCallback((query: string) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      setSearchQuery(query);
      setCurrentPage(1);
      setSelectedCategory('all');
    }, 300);

    setSearchTimeout(timeout);
  }, [searchTimeout]);

  useEffect(() => {
    fetchGifs();
  }, [selectedCategory, currentPage, searchQuery]);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const fetchGifs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = `/api/gifs?page=${currentPage}&limit=${GIFS_PER_PAGE}`;
      
      if (selectedCategory !== 'all') {
        url += `&category=${selectedCategory}`;
      }
      
      if (searchQuery.trim()) {
        url = `/api/gifs/search/${encodeURIComponent(searchQuery)}?limit=${GIFS_PER_PAGE}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch GIFs: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setGifs(result.data || []);
        if (result.meta) {
          setTotalPages(result.meta.totalPages || Math.ceil((result.meta.total || result.data.length) / GIFS_PER_PAGE));
          setTotalGifs(result.meta.total || result.data.length);
        } else {
          // Handle search results without meta
          setTotalPages(Math.ceil(result.data.length / GIFS_PER_PAGE));
          setTotalGifs(result.data.length);
        }
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error fetching GIFs:', error);
      setError(error instanceof Error ? error.message : 'Failed to load GIFs');
      setGifs([]);
      setTotalPages(1);
      setTotalGifs(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/gifs/categories');
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const result = await response.json();

      if (result.success) {
        setCategories(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback categories
      setCategories(['reaction', 'celebration', 'animals', 'sports', 'entertainment', 'love', 'work', 'food', 'general']);
    }
  };

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    setSearchQuery('');
  }, []);

  const handleEditGif = async (gif: GifTemplate) => {
    try {
      const response = await fetch(`/api/gifs/${gif.id}/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Edited ${gif.title}`
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setSelectedGif(gif);
        setShowEditor(true);
      } else {
        console.error('Failed to create editable GIF:', result.error);
        alert('Failed to create editable GIF. Please try again.');
      }
    } catch (error) {
      console.error('Error creating editable GIF:', error);
      alert('Error creating editable GIF. Please check your connection.');
    }
  };

  const toggleFavorite = useCallback((gifId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(gifId)) {
        newFavorites.delete(gifId);
      } else {
        newFavorites.add(gifId);
      }
      // Save to localStorage
      localStorage.setItem('gifStudioFavorites', JSON.stringify([...newFavorites]));
      return newFavorites;
    });
  }, []);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gifStudioFavorites');
      if (saved) {
        setFavorites(new Set(JSON.parse(saved)));
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  }, []);

  const formatFileSize = useCallback((bytes?: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }, []);

  const formatDuration = useCallback((ms?: number) => {
    if (!ms) return 'Unknown';
    return `${(ms / 1000).toFixed(1)}s`;
  }, []);

  // Memoized pagination component
  const PaginationComponent = useMemo(() => {
    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i);
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
      } else {
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    };

    return (
      <div className="flex justify-center items-center space-x-2 mt-12">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          Previous
        </button>
        
        <div className="flex space-x-1">
          {getVisiblePages().map((page, index) => 
            typeof page === 'number' ? (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-purple-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ) : (
              <span key={`dots-${index}`} className="px-3 py-2 text-gray-400">
                {page}
              </span>
            )
          )}
        </div>

        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          Next
        </button>
      </div>
    );
  }, [currentPage, totalPages]);

  if (showEditor && selectedGif) {
    return <GifEditor gif={selectedGif} onBack={() => setShowEditor(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-purple-500">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
                <span className="font-medium">Back to Studio</span>
              </button>
              <div className="h-8 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-3">
                <Sparkles className="h-8 w-8 text-purple-600" />
                <h1 className="text-3xl font-bold text-gray-800">GIF Studio</h1>
              </div>
            </div>
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              {totalGifs} GIFs available
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for GIFs by title, tags, or category..."
                onChange={(e) => debouncedSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              >
                <option value="all">All Categories ({totalGifs})</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-lg text-gray-600">Loading awesome GIFs...</span>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading GIFs</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchGifs}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : gifs.length === 0 ? (
          <div className="text-center py-20">
            <Sparkles className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No GIFs found</h3>
            <p className="text-gray-500">
              {searchQuery ? 'Try a different search term' : 'Try selecting a different category'}
            </p>
          </div>
        ) : (
          <>
            {/* Results Info */}
            <div className="mb-6 text-sm text-gray-600">
              {searchQuery ? (
                <p>Found {totalGifs} GIFs for "{searchQuery}"</p>
              ) : selectedCategory !== 'all' ? (
                <p>Showing {totalGifs} GIFs in {selectedCategory}</p>
              ) : (
                <p>Showing page {currentPage} of {totalPages} ({totalGifs} total GIFs)</p>
              )}
            </div>

            {/* GIF Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {gifs.map((gif) => (
                <GifCard
                  key={gif.id}
                  gif={gif}
                  onEdit={() => handleEditGif(gif)}
                  onToggleFavorite={() => toggleFavorite(gif.id)}
                  isFavorite={favorites.has(gif.id)}
                  formatFileSize={formatFileSize}
                  formatDuration={formatDuration}
                />
              ))}
            </div>

            {/* Pagination */}
            {PaginationComponent}
          </>
        )}
      </div>
    </div>
  );
};

interface GifCardProps {
  gif: GifTemplate;
  onEdit: () => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
  formatFileSize: (bytes?: number) => string;
  formatDuration: (ms?: number) => string;
}

const GifCard: React.FC<GifCardProps> = ({ 
  gif, 
  onEdit, 
  onToggleFavorite, 
  isFavorite, 
  formatFileSize, 
  formatDuration 
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const displayUrl = isPlaying ? gif.gifUrl : (gif.previewUrl || gif.thumbnailUrl || gif.gifUrl);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: gif.title,
          text: `Check out this GIF: ${gif.title}`,
          url: gif.gifUrl,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(gif.gifUrl);
        alert('GIF URL copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <div className="group relative bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Trending Badge */}
      {gif.trending && (
        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
          🔥 Trending
        </div>
      )}

      {/* Source Badge */}
      <div className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full capitalize">
        {gif.source}
      </div>

      {/* GIF Preview */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {!imageError ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              </div>
            )}
            <img
              src={displayUrl}
              alt={gif.title}
              className={`w-full h-full object-cover transition-all duration-300 ${
                imageLoaded ? 'opacity-100 group-hover:scale-105' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              loading="lazy"
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <div className="text-center">
              <Sparkles className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Failed to load</p>
            </div>
          </div>
        )}

        {/* Overlay Controls */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPlaying(!isPlaying);
              }}
              className="p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className={`p-2 rounded-full hover:bg-opacity-100 transition-all ${
                isFavorite 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white bg-opacity-80 text-gray-700'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all"
              title="Share GIF"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-all"
              title="Edit GIF"
            >
              <Edit3 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* GIF Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 truncate mb-2" title={gif.title}>
          {gif.title}
        </h3>
        
        <div className="space-y-1 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Size:</span>
            <span>{gif.width}×{gif.height}</span>
          </div>
          {gif.size && (
            <div className="flex justify-between">
              <span>File:</span>
              <span>{formatFileSize(gif.size)}</span>
            </div>
          )}
          {gif.duration && (
            <div className="flex justify-between">
              <span>Duration:</span>
              <span>{formatDuration(gif.duration)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Type:</span>
            <span>{gif.isAnimated ? 'Animated' : 'Static'}</span>
          </div>
        </div>

        {/* Tags */}
        {gif.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {gif.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {gif.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{gif.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Category Badge */}
        <div className="mt-3 flex justify-between items-center">
          <span className="inline-block px-2 py-1 bg-purple-100 text-purple-600 text-xs font-medium rounded-full capitalize">
            {gif.category}
          </span>
          <div className="text-xs text-gray-400">
            ❤️ {gif.popularity}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced GIF Editor placeholder with more features
const GifEditor: React.FC<{ gif: GifTemplate; onBack: () => void }> = ({ gif, onBack }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [editedGif, setEditedGif] = useState<any>(null);
  const [textOverlays, setTextOverlays] = useState<any[]>([]);
  const [selectedOverlay, setSelectedOverlay] = useState<any>(null);
  const [fonts, setFonts] = useState<any[]>([]);
  const [colorPalettes, setColorPalettes] = useState<any[]>([]);
  const [textPresets, setTextPresets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string>(gif.gifUrl);

  useEffect(() => {
    initializeEditor();
  }, []);

  const initializeEditor = async () => {
    try {
      setLoading(true);
      
      const [fontsRes, palettesRes, presetsRes, editedGifRes] = await Promise.all([
        fetch('/api/gif-fonts'),
        fetch('/api/gif-color-palettes'),
        fetch('/api/gif-text-presets'),
        fetch(`/api/gifs/${gif.id}/edit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: `Edited ${gif.title}` })
        })
      ]);

      const [fontsData, palettesData, presetsData, editedGifData] = await Promise.all([
        fontsRes.json(),
        palettesRes.json(),
        presetsRes.json(),
        editedGifRes.json()
      ]);

      if (fontsData.success) setFonts(fontsData.data);
      if (palettesData.success) setColorPalettes(palettesData.data);
      if (presetsData.success) setTextPresets(presetsData.data);
      if (editedGifData.success) {
        setEditedGif(editedGifData.data);
        setTextOverlays(editedGifData.data.textOverlays || []);
      }
    } catch (error) {
      console.error('Failed to initialize editor:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTextOverlay = async () => {
    try {
      const response = await fetch(`/api/edited-gifs/${editedGif.id}/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'New Text',
          x: 50,
          y: 50,
          width: 200,
          height: 60,
          fontSize: 24,
          fontFamily: 'Impact, Charcoal, sans-serif',
          color: '#FFFFFF',
          strokeColor: '#000000',
          strokeWidth: 2,
          opacity: 1,
          rotation: 0,
          fontWeight: 'bold',
          textAlign: 'center',
          backgroundColor: 'transparent',
          backgroundColorOpacity: 0
        })
      });

      const result = await response.json();
      if (result.success) {
        setTextOverlays(prev => [...prev, result.data]);
        setSelectedOverlay(result.data);
      }
    } catch (error) {
      console.error('Failed to add text overlay:', error);
    }
  };

  const updateTextOverlay = async (overlayId: string, updates: any) => {
    try {
      const response = await fetch(`/api/edited-gifs/${editedGif.id}/text/${overlayId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const result = await response.json();
      if (result.success) {
        setTextOverlays(prev => prev.map(o => o.id === overlayId ? result.data : o));
        setSelectedOverlay(result.data);
      }
    } catch (error) {
      console.error('Failed to update text overlay:', error);
    }
  };

  const removeTextOverlay = async (overlayId: string) => {
    try {
      const response = await fetch(`/api/edited-gifs/${editedGif.id}/text/${overlayId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        setTextOverlays(prev => prev.filter(o => o.id !== overlayId));
        if (selectedOverlay?.id === overlayId) {
          setSelectedOverlay(null);
        }
      }
    } catch (error) {
      console.error('Failed to remove text overlay:', error);
    }
  };

  const applyTextPreset = async (overlayId: string, presetId: string) => {
    try {
      const response = await fetch(`/api/edited-gifs/${editedGif.id}/text/${overlayId}/preset/${presetId}`, {
        method: 'POST'
      });

      const result = await response.json();
      if (result.success) {
        setTextOverlays(prev => prev.map(o => o.id === overlayId ? result.data : o));
        setSelectedOverlay(result.data);
      }
    } catch (error) {
      console.error('Failed to apply text preset:', error);
    }
  };

  const reorderTextOverlays = async (overlayIds: string[]) => {
    try {
      const response = await fetch(`/api/edited-gifs/${editedGif.id}/text/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overlayIds })
      });

      const result = await response.json();
      if (result.success) {
        // Update the order in the backend
        console.log('Text overlays reordered successfully');
      }
    } catch (error) {
      console.error('Failed to reorder text overlays:', error);
    }
  };

  const renderGif = async () => {
    try {
      const response = await fetch(`/api/edited-gifs/${editedGif.id}/render`, {
        method: 'POST'
      });

      const result = await response.json();
      if (result.success && result.data.url) {
        setPreviewUrl(result.data.url);
      }
    } catch (error) {
      console.error('Failed to render GIF:', error);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/edited-gifs/${editedGif.id}/export`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${editedGif.title.replace(/[^a-zA-Z0-9]/g, '-')}.gif`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-lg text-gray-600">Loading editor...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg border-b-4 border-purple-500">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Gallery</span>
              </button>
              <div className="h-8 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-800">🎬 GIF Editor</h1>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={renderGif}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Render Preview
              </button>
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {isDownloading ? 'Downloading...' : 'Download'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Preview Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Preview</h2>
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={previewUrl}
                  alt={gif.title}
                  className="w-full h-auto"
                />
                                 {textOverlays.map((overlay) => (
                   <div
                     key={overlay.id}
                     className={`absolute cursor-move ${
                       selectedOverlay?.id === overlay.id ? 'ring-2 ring-purple-500' : ''
                     }`}
                     style={{
                       left: overlay.x,
                       top: overlay.y,
                       width: overlay.width,
                       height: overlay.height,
                       transform: `rotate(${overlay.rotation || 0}deg)`,
                       userSelect: 'none'
                     }}
                     onClick={() => setSelectedOverlay(overlay)}
                     draggable
                     onDragStart={(e) => {
                       e.dataTransfer.setData('text/plain', overlay.id);
                       e.dataTransfer.effectAllowed = 'move';
                     }}
                     onDragOver={(e) => {
                       e.preventDefault();
                       e.dataTransfer.dropEffect = 'move';
                     }}
                     onDrop={(e) => {
                       e.preventDefault();
                       const draggedId = e.dataTransfer.getData('text/plain');
                       if (draggedId !== overlay.id) {
                         // Reorder overlays
                         const draggedIndex = textOverlays.findIndex(o => o.id === draggedId);
                         const targetIndex = textOverlays.findIndex(o => o.id === overlay.id);
                         if (draggedIndex !== -1 && targetIndex !== -1) {
                           const newOverlays = [...textOverlays];
                           const [draggedOverlay] = newOverlays.splice(draggedIndex, 1);
                           newOverlays.splice(targetIndex, 0, draggedOverlay);
                           setTextOverlays(newOverlays);
                           
                           // Update the order in the backend
                           const newOrder = newOverlays.map(o => o.id);
                           reorderTextOverlays(newOrder);
                         }
                       }
                     }}
                     onMouseDown={(e) => {
                       if (e.button !== 0) return; // Only left mouse button
                       
                       const startX = e.clientX;
                       const startY = e.clientY;
                       const startOverlayX = overlay.x;
                       const startOverlayY = overlay.y;
                       
                       const handleMouseMove = (moveEvent: MouseEvent) => {
                         const deltaX = moveEvent.clientX - startX;
                         const deltaY = moveEvent.clientY - startY;
                         
                         updateTextOverlay(overlay.id, {
                           x: startOverlayX + deltaX,
                           y: startOverlayY + deltaY
                         });
                       };
                       
                       const handleMouseUp = () => {
                         document.removeEventListener('mousemove', handleMouseMove);
                         document.removeEventListener('mouseup', handleMouseUp);
                       };
                       
                       document.addEventListener('mousemove', handleMouseMove);
                       document.addEventListener('mouseup', handleMouseUp);
                     }}
                   >
                     <div
                       className="w-full h-full flex items-center justify-center text-center p-2"
                       style={{
                         fontFamily: overlay.fontFamily,
                         fontSize: overlay.fontSize,
                         color: overlay.color,
                         fontWeight: overlay.fontWeight,
                         fontStyle: overlay.fontStyle,
                         textAlign: overlay.textAlign,
                         letterSpacing: overlay.letterSpacing,
                         lineHeight: overlay.lineHeight,
                         opacity: overlay.opacity,
                         textShadow: overlay.textShadow ? 
                           `${overlay.textShadow.x}px ${overlay.textShadow.y}px ${overlay.textShadow.blur}px ${overlay.textShadow.color}` : 
                           undefined,
                         backgroundColor: overlay.backgroundColor || 'transparent',
                         borderRadius: overlay.borderRadius,
                         padding: overlay.padding ? 
                           `${overlay.padding.top}px ${overlay.padding.right}px ${overlay.padding.bottom}px ${overlay.padding.left}px` : 
                           undefined,
                         border: overlay.border ? 
                           `${overlay.border.width}px ${overlay.border.style} ${overlay.border.color}` : 
                           'none'
                       }}
                     >
                       {overlay.text}
                     </div>
                   </div>
                 ))}
              </div>
            </div>
          </div>

          {/* Editor Panel */}
          <div className="space-y-6">
            {/* Text Overlays List */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Text Overlays</h3>
                <button
                  onClick={addTextOverlay}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  + Add Text
                </button>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {textOverlays.map((overlay) => (
                  <div
                    key={overlay.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedOverlay?.id === overlay.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedOverlay(overlay)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{overlay.text}</p>
                        <p className="text-xs text-gray-500">
                          {overlay.fontFamily.split(',')[0]} • {overlay.fontSize}px
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTextOverlay(overlay.id);
                        }}
                        className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
                {textOverlays.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No text overlays yet</p>
                )}
              </div>
            </div>

            {/* Text Editor */}
            {selectedOverlay && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Text Editor</h3>
                
                <div className="space-y-4">
                  {/* Text Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Text Content
                    </label>
                    <textarea
                      value={selectedOverlay.text}
                      onChange={(e) => updateTextOverlay(selectedOverlay.id, { text: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  {/* Font Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Font Family
                    </label>
                    <select
                      value={selectedOverlay.fontFamily}
                      onChange={(e) => updateTextOverlay(selectedOverlay.id, { fontFamily: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {fonts.map((font) => (
                        <option key={font.name} value={font.family}>
                          {font.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Font Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Font Size: {selectedOverlay.fontSize}px
                    </label>
                    <input
                      type="range"
                      min="12"
                      max="120"
                      value={selectedOverlay.fontSize}
                      onChange={(e) => updateTextOverlay(selectedOverlay.id, { fontSize: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  {/* Color Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Text Color
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={selectedOverlay.color}
                        onChange={(e) => updateTextOverlay(selectedOverlay.id, { color: e.target.value })}
                        className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <div className="flex-1 grid grid-cols-4 gap-1">
                        {colorPalettes[0]?.colors.slice(0, 8).map((color: string, index: number) => (
                          <button
                            key={index}
                            onClick={() => updateTextOverlay(selectedOverlay.id, { color })}
                            className="w-8 h-8 rounded border border-gray-300"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Stroke Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stroke Color
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={selectedOverlay.strokeColor}
                        onChange={(e) => updateTextOverlay(selectedOverlay.id, { strokeColor: e.target.value })}
                        className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={selectedOverlay.strokeWidth}
                        onChange={(e) => updateTextOverlay(selectedOverlay.id, { strokeWidth: parseInt(e.target.value) })}
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-500 w-8 text-center">
                        {selectedOverlay.strokeWidth}
                      </span>
                    </div>
                  </div>

                  {/* Text Presets */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quick Styles
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {textPresets.slice(0, 4).map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => applyTextPreset(selectedOverlay.id, preset.id)}
                          className="p-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Position Controls */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        X Position
                      </label>
                      <input
                        type="number"
                        value={selectedOverlay.x}
                        onChange={(e) => updateTextOverlay(selectedOverlay.id, { x: parseInt(e.target.value) })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Y Position
                      </label>
                      <input
                        type="number"
                        value={selectedOverlay.y}
                        onChange={(e) => updateTextOverlay(selectedOverlay.id, { y: parseInt(e.target.value) })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Rotation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rotation: {selectedOverlay.rotation || 0}°
                    </label>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={selectedOverlay.rotation || 0}
                      onChange={(e) => updateTextOverlay(selectedOverlay.id, { rotation: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  {/* Opacity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Opacity: {Math.round((selectedOverlay.opacity || 1) * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={selectedOverlay.opacity || 1}
                      onChange={(e) => updateTextOverlay(selectedOverlay.id, { opacity: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* GIF Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">GIF Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Title:</span>
                  <span>{gif.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Dimensions:</span>
                  <span>{gif.width} × {gif.height}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Category:</span>
                  <span className="capitalize">{gif.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Text Overlays:</span>
                  <span>{textOverlays.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 