import { useState, useEffect } from 'react';
import { Search, Filter, Star, Grid, List } from 'lucide-react';
import { MemeTemplate } from '@ai-meme-studio/shared-types';

interface TemplateGalleryProps {
  onSelectTemplate: (template: MemeTemplate) => void;
}

export function TemplateGallery({ onSelectTemplate }: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<MemeTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<MemeTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const TEMPLATES_PER_PAGE = 20;

  // Fetch templates and categories with pagination
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Build query parameters
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: TEMPLATES_PER_PAGE.toString()
        });
        
        if (selectedCategory !== 'all') {
          params.append('category', selectedCategory);
        }

        // Fetch templates and categories in parallel
        const [templatesResponse, categoriesResponse] = await Promise.all([
          fetch(`/api/templates?${params.toString()}`),
          fetch('/api/templates/categories')
        ]);

        if (!templatesResponse.ok || !categoriesResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const templatesData = await templatesResponse.json();
        const categoriesData = await categoriesResponse.json();

        if (templatesData.success && categoriesData.success) {
          setTemplates(templatesData.data);
          setFilteredTemplates(templatesData.data);
          setCategories(['all', ...categoriesData.data]);
          
          // Update pagination state
          setTotalPages(templatesData.meta.totalPages);
          setHasNextPage(templatesData.meta.hasNextPage);
          setHasPrevPage(templatesData.meta.hasPrevPage);
        } else {
          throw new Error('Invalid response data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load templates');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentPage, selectedCategory]);

  // Filter templates based on search and category
  useEffect(() => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query)) ||
        template.category.toLowerCase().includes(query)
      );
    }

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedCategory]);

  const handleTemplateClick = (template: MemeTemplate) => {
    onSelectTemplate(template);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading templates from the internet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Templates</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Meme Template Gallery</h1>
        <p className="text-gray-600">
          Choose from {templates.length} popular meme templates from the internet
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search templates, categories, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Filters and View Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Results Count and Page Info */}
          <div className="text-sm text-gray-500">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} on page {currentPage} of {totalPages}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-purple-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-purple-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Templates Grid/List */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600">
            {searchQuery 
              ? `No templates match "${searchQuery}". Try a different search term.`
              : 'No templates available in this category.'
            }
          </p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'
            : 'space-y-4'
        }>
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              viewMode={viewMode}
              onClick={() => handleTemplateClick(template)}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && !error && totalPages > 1 && (
        <div className="mt-12 flex justify-center items-center gap-4">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={!hasPrevPage}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
          
          <div className="flex items-center gap-2">
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, currentPage - 2) + i;
              if (pageNum > totalPages) return null;
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    pageNum === currentPage
                      ? 'bg-purple-500 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="text-gray-500">...</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>
          
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!hasNextPage}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {/* Template Count Summary */}
      {!isLoading && !error && (
        <div className="mt-8 text-center text-gray-600">
          <p className="text-lg font-semibold">🌍 Massive Global Collection</p>
          <p className="text-sm">
            Showing page {currentPage} of {totalPages} • 
            {TEMPLATES_PER_PAGE} templates per page • 
            Sourced from worldwide meme communities
          </p>
        </div>
      )}
    </div>
  );
}

interface TemplateCardProps {
  template: MemeTemplate;
  viewMode: 'grid' | 'list';
  onClick: () => void;
}

function TemplateCard({ template, viewMode, onClick }: TemplateCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (viewMode === 'list') {
    return (
      <div
        onClick={onClick}
        className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
      >
        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          {!imageError ? (
            <img
              src={template.imageUrl}
              alt={template.name}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`w-full h-full object-cover transition-opacity ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
              🖼️
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
          <p className="text-sm text-gray-500 capitalize">{template.category}</p>
          <div className="flex items-center gap-2 mt-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600">{template.popularity}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 2).map(tag => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
    >
      <div className="aspect-square bg-gray-100 overflow-hidden">
        {!imageError ? (
          <img
            src={template.imageUrl}
            alt={template.name}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
            🖼️
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate mb-1">{template.name}</h3>
        <p className="text-sm text-gray-500 capitalize mb-2">{template.category}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600">{template.popularity}</span>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 2).map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 