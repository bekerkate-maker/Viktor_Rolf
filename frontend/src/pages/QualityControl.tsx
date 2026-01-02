import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { collectionsAPI, samplesAPI } from '../api';
import type { Collection, Sample } from '../types';
import AddSampleModal from '../components/AddSampleModal';
import EditSampleModal from '../components/EditSampleModal';
import { Plus } from 'lucide-react';

type Category = 'Mariage' | 'Haute Couture' | 'Ready to Wear';

function QualityControl() {
  const params = useParams<{ category?: string; year?: string; season?: string }>();
  const navigate = useNavigate();
  
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ collections: Collection[], samples: Sample[] }>({ collections: [], samples: [] });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showAddYearModal, setShowAddYearModal] = useState(false);
  const [newYear, setNewYear] = useState<number>(new Date().getFullYear() + 1);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // Initialize from URL params
  useEffect(() => {
    if (params.category && params.year && params.season) {
      const categoryMap: Record<string, Category> = {
        'ready-to-wear': 'Ready to Wear',
        'haute-couture': 'Haute Couture',
        'mariage': 'Mariage'
      };
      const seasonMap: Record<string, string> = {
        'ss': 'Spring/Summer',
        'fw': 'Fall/Winter'
      };
      setSelectedCategory(categoryMap[params.category] || null);
      setSelectedYear(parseInt(params.year));
      setSelectedSeason(seasonMap[params.season] || null);
    }
  }, [params.category, params.year, params.season]);

  // Load collections when category, year and season are selected
  useEffect(() => {
    if (selectedCategory && selectedYear && selectedSeason) {
      loadCollections();
    } else {
      setCollections([]);
      setSamples([]);
    }
  }, [selectedCategory, selectedYear, selectedSeason]);

  // Load samples when we have the data
  useEffect(() => {
    if (collections.length > 0) {
      loadSamples();
    } else {
      setSamples([]);
    }
  }, [collections]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const response = await collectionsAPI.getAll();
      console.log('All collections:', response.data);
      // Convert selectedSeason to database format (SS or FW)
      const seasonCode = selectedSeason === 'Spring/Summer' ? 'SS' : 'FW';
      console.log('Filtering by:', { category: selectedCategory, year: selectedYear, seasonCode });
      const filtered = response.data.filter((col: any) => 
        col.category === selectedCategory && 
        col.year === selectedYear &&
        col.season === seasonCode
      );
      console.log('Filtered collections:', filtered);
      setCollections(filtered);
      setLoading(false);
    } catch (error) {
      console.error('Error loading collections:', error);
      setLoading(false);
    }
  };

  const loadSamples = async () => {
    try {
      setLoading(true);
      console.log('Loading samples for collections:', collections);
      // Get samples from all collections for this category/year/season
      const allSamples: Sample[] = [];
      for (const collection of collections) {
  const response = await samplesAPI.getByCollection(String(collection.id));
        console.log(`Samples for collection ${collection.id}:`, response.data);
        allSamples.push(...response.data);
      }
      console.log('All samples loaded:', allSamples);
      setSamples(allSamples);
      setLoading(false);
    } catch (error) {
      console.error('Error loading samples:', error);
      setLoading(false);
    }
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setSelectedYear(null);
    setSelectedSeason(null);
    loadAvailableYears(category);
  };

  const loadAvailableYears = async (category: Category) => {
    try {
      const response = await collectionsAPI.getAll();
      const years = [...new Set(
        response.data
          .filter((col: Collection) => col.category === category)
          .map((col: Collection) => col.year)
      )].sort((a, b) => b - a);
      setAvailableYears(years as number[]);
    } catch (error) {
      console.error('Error loading years:', error);
    }
  };

  const handleAddYear = async () => {
    if (!selectedCategory || !newYear) return;
    
    try {
      setLoading(true);
      // Create SS collection
      await collectionsAPI.create({
        name: `${selectedCategory} SS${String(newYear).slice(-2)}`,
        season: 'SS',
        year: newYear,
        category: selectedCategory,
        status: 'Active'
      });
      // Create FW collection
      await collectionsAPI.create({
        name: `${selectedCategory} FW${String(newYear).slice(-2)}`,
        season: 'FW',
        year: newYear,
        category: selectedCategory,
        status: 'Active'
      });
      
      // Refresh available years
      await loadAvailableYears(selectedCategory);
      setShowAddYearModal(false);
      setNewYear(new Date().getFullYear() + 1);
    } catch (error) {
      console.error('Error creating year:', error);
      alert('Failed to create year collections');
    } finally {
      setLoading(false);
    }
  };

  const handleSeasonSelect = (year: number, season: string) => {
    // Auto-select Ready to Wear if no category selected
    const category = selectedCategory || 'Ready to Wear';
    if (!selectedCategory) {
      setSelectedCategory('Ready to Wear');
    }
    setSelectedYear(year);
    setSelectedSeason(season);
    
    // Navigate to URL with parameters
    const categorySlug = category.toLowerCase().replace(/ /g, '-');
    const seasonSlug = season === 'Spring/Summer' ? 'ss' : 'fw';
    navigate(`/quality-control/${categorySlug}/${year}/${seasonSlug}`);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults({ collections: [], samples: [] });
      return;
    }

    try {
      setLoading(true);
      const [collectionsRes, samplesRes] = await Promise.all([
        collectionsAPI.getAll(),
        samplesAPI.getAll()
      ]);

      const filteredCollections = collectionsRes.data.filter((col: Collection) =>
        col.name.toLowerCase().includes(query.toLowerCase())
      );

      const filteredSamples = samplesRes.data.filter((sample: Sample) =>
        sample.name.toLowerCase().includes(query.toLowerCase()) ||
        sample.sample_code.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults({ collections: filteredCollections, samples: filteredSamples });
      setLoading(false);
    } catch (error) {
      console.error('Search error:', error);
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults({ collections: [], samples: [] });
  };

  const handleDeleteSample = async (sample: Sample) => {
    if (!window.confirm(`Are you sure you want to delete ${sample.name}?`)) {
      return;
    }

    try {
  await samplesAPI.delete(String(sample.id));
      // Reload samples after successful delete
      await loadSamples();
    } catch (error: any) {
      console.error('Error deleting sample:', error);
      alert(`Failed to delete sample: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleEditSample = (sample: Sample) => {
    setSelectedSample(sample);
    setShowEditModal(true);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Approved': return 'badge-approved';
      case 'Rejected': return 'badge-rejected';
      case 'Changes Needed': return 'badge-pending';
      case 'In Review': return 'badge-progress';
      default: return 'badge-pending';
    }
  };

  return (
    <div>
      {/* Terug knop - links boven, onder de navbar */}
      {selectedCategory && (
        <div style={{ paddingTop: 16, paddingLeft: 0 }}>
          <button 
            onClick={() => {
              if (selectedYear && selectedSeason) {
                setSelectedSeason(null);
              } else if (selectedYear) {
                setSelectedYear(null);
              } else {
                setSelectedCategory(null);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid #ddd',
              background: '#fff',
              cursor: 'pointer',
              fontSize: 18,
              color: '#111',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f5f5f5';
              e.currentTarget.style.borderColor = '#111';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.borderColor = '#ddd';
            }}
          >
            ←
          </button>
        </div>
      )}
      
      <div className="page-header" style={{ marginTop: selectedCategory ? 16 : 48 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Quality Control</h1>
        <p className="page-subtitle">
          {!selectedCategory ? 'Select category and collection to review samples' :
           !selectedYear ? `Select ${selectedCategory} year` :
           !selectedSeason ? `Select ${selectedYear} season` :
           'Review samples'}
        </p>
      </div>

      {/* Search Bar */}
      {!selectedCategory && (
        <div className="search-section">
          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Search collections or samples..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={clearSearch}>×</button>
            )}
          </div>

        {/* Search Results */}
        {searchQuery && searchResults.collections.length === 0 && searchResults.samples.length === 0 && !loading && (
          <div className="search-empty">No results found for "{searchQuery}"</div>
        )}

        {searchQuery && (searchResults.collections.length > 0 || searchResults.samples.length > 0) && (
          <div className="search-results">
            {searchResults.collections.length > 0 && (
              <div className="search-results-section">
                <h3 className="search-results-title">Collections ({searchResults.collections.length})</h3>
                <div className="collections-list">
                  {searchResults.collections.map((collection) => (
                    <div
                      key={collection.id}
                      className="collection-item"
                      onClick={() => {
                        clearSearch();
                        setSelectedCategory(collection.category);
                        setSelectedYear(collection.year);
                        setSelectedSeason(collection.season);
                      }}
                    >
                      <div>
                        <div className="collection-item-name">{collection.name}</div>
                        <div className="collection-item-meta">
                          {collection.season} {collection.year} · {collection.category}
                        </div>
                      </div>
                      <div className="collection-item-arrow">→</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchResults.samples.length > 0 && (
              <div className="search-results-section">
                <h3 className="search-results-title">Samples ({searchResults.samples.length})</h3>
                <div className="samples-grid">
                  {searchResults.samples.slice(0, 12).map((sample) => (
                    <Link
                      key={sample.id}
                      to={`/samples/${sample.id}`}
                      className="sample-card"
                    >
                      <div className="sample-card-header">
                        <span className="sample-code">{sample.sample_code}</span>
                        <span className={`badge ${getStatusBadgeClass(sample.status)}`}>
                          {sample.status}
                        </span>
                      </div>
                      <div className="sample-card-name">{sample.name}</div>
                      <div className="sample-card-meta">
                        {sample.sample_round} · {sample.product_type}
                      </div>
                    </Link>
                  ))}
                </div>
                {searchResults.samples.length > 12 && (
                  <p className="search-more">+ {searchResults.samples.length - 12} more samples</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* Category Selection */}
      {!selectedCategory && !searchQuery && (
        <div className="category-selection">
          <h2 className="section-title">Select Category</h2>
          <div className="category-grid">
            <div 
              className="category-card"
              onClick={() => handleCategorySelect('Ready to Wear')}
            >
              <div className="category-icon">�</div>
              <h3>Ready to Wear</h3>
              <p>RTW Collection</p>
            </div>
            <div 
              className="category-card"
              onClick={() => handleCategorySelect('Haute Couture')}
            >
              <div className="category-icon">👗</div>
              <h3>Haute Couture</h3>
              <p>Couture Collection</p>
            </div>
            <div 
              className="category-card"
              onClick={() => handleCategorySelect('Mariage')}
            >
              <div className="category-icon">�</div>
              <h3>Mariage</h3>
              <p>Bridal Collection</p>
            </div>
          </div>
        </div>
      )}

      {/* Year Selection */}
      {selectedCategory && !selectedYear && !searchQuery && (
        <div className="year-selection">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 className="section-title" style={{ margin: 0 }}>{selectedCategory}</h2>
            <button
              onClick={() => setShowAddYearModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '1px solid #ddd',
                background: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#111';
                e.currentTarget.style.borderColor = '#111';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.borderColor = '#ddd';
                e.currentTarget.style.color = '#111';
              }}
              title="Add new year"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="year-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 16,
            width: '100%'
          }}>
            {(availableYears.length > 0 ? availableYears : [2026, 2025, 2024, 2023, 2022])
              .sort((a, b) => b - a)
              .map((year) => (
              <div
                key={year}
                className="year-card"
                onClick={() => setSelectedYear(year)}
              >
                <h3>{year}</h3>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Year Modal */}
      {showAddYearModal && (
        <div className="modal-overlay" onClick={() => setShowAddYearModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400, padding: 24 }}>
            <div className="modal-header" style={{ marginBottom: 20 }}>
              <h2 style={{ margin: 0 }}>Add New Year</h2>
              <button className="modal-close" onClick={() => setShowAddYearModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '0 0 20px 0' }}>
              <p style={{ marginBottom: 16, color: '#666' }}>
                This will create SS and FW collections for {selectedCategory}.
              </p>
              <div className="form-group">
                <label className="form-label">Year</label>
                <input
                  type="number"
                  className="form-input"
                  value={newYear}
                  onChange={(e) => setNewYear(parseInt(e.target.value))}
                  min={2020}
                  max={2030}
                  style={{ width: '100%', padding: '10px 12px', fontSize: 16 }}
                />
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowAddYearModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddYear} disabled={loading}>
                {loading ? 'Creating...' : 'Create Year'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Season Selection (SS/FW) for selected year */}
      {selectedCategory && selectedYear && !selectedSeason && !searchQuery && (
        <div className="season-selection">
          <h2 className="section-title">{selectedYear}</h2>
          <div className="season-list">
            <div className="season-bar" onClick={() => handleSeasonSelect(selectedYear, 'Spring/Summer')}>
              <div className="season-bar-left">
                <div className="season-bar-code">SS{String(selectedYear).slice(-2)}</div>
                <div className="season-bar-details">
                  <div className="season-bar-name">Spring Summer Collection</div>
                  <div className="season-bar-category">{selectedCategory}</div>
                </div>
              </div>
              <div className="season-bar-arrow">→</div>
            </div>
            <div className="season-bar" onClick={() => handleSeasonSelect(selectedYear, 'Fall/Winter')}>
              <div className="season-bar-left">
                <div className="season-bar-code">FW{String(selectedYear).slice(-2)}</div>
                <div className="season-bar-details">
                  <div className="season-bar-name">Fall Winter Collection</div>
                  <div className="season-bar-category">{selectedCategory}</div>
                </div>
              </div>
              <div className="season-bar-arrow">→</div>
            </div>
          </div>
        </div>
      )}

      {/* Samples Grid */}
      {selectedCategory && selectedYear && selectedSeason && !loading && collections.length > 0 && (
        <div className="samples-view">
          <div className="samples-header-with-add">
            <div>
              <h2 className="section-title">
                {selectedSeason === 'Spring/Summer' ? 'Spring Summer' : 'Fall Winter'} {selectedYear}
              </h2>
              <p className="section-subtitle">{samples.length} samples total</p>
            </div>
            <button className="add-button" onClick={() => setShowAddModal(true)}>+</button>
          </div>
          {/* Status Filter */}
          <div style={{ margin: '16px 0' }}>
            <label htmlFor="status-filter" style={{ marginRight: 8 }}>Filter op status:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '4px 12px', fontSize: '1rem' }}
            >
              <option value="All">Alle</option>
              <option value="In Review">In Review</option>
              <option value="Changes Needed">Changes Needed</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          {samples.length > 0 ? (
            <div className="samples-table">
              <div className="samples-table-header">
                <div className="sample-col-number">Number</div>
                <div className="sample-col-name">Sample Name</div>
                <div className="sample-col-round">Round</div>
                <div className="sample-col-type">Type</div>
                <div className="sample-col-status">Status</div>
                <div className="sample-col-actions"></div>
              </div>
              {samples
                .filter(sample => statusFilter === 'All' || sample.status === statusFilter)
                .length > 0 ? (
                samples
                  .filter(sample => statusFilter === 'All' || sample.status === statusFilter)
                  .map((sample) => (
                    <div key={sample.id} className="samples-table-row">
                      <Link to={`/samples/${sample.id}`} className="sample-row-link">
                        <div className="sample-col-number">{sample.sample_code.split('-').pop()}</div>
                        <div className="sample-col-name">{sample.name}</div>
                        <div className="sample-col-round">{sample.sample_round}</div>
                        <div className="sample-col-type">{sample.product_type}</div>
                        <div className="sample-col-status">
                          <span className={`badge ${getStatusBadgeClass(sample.status)}`}>
                            {sample.status}
                          </span>
                        </div>
                      </Link>
                      <div className="sample-col-actions">
                        <button 
                          className="sample-action-btn"
                          onClick={(e) => {
                            e.preventDefault();
                            handleEditSample(sample);
                          }}
                          title="Edit sample"
                        >
                          ✎
                        </button>
                        <button 
                          className="sample-action-btn sample-action-delete"
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteSample(sample);
                          }}
                          title="Delete sample"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="samples-table-row" style={{display: 'grid', gridTemplateColumns: '80px 1.5fr 1fr 1fr 1fr 80px', alignItems: 'center', minHeight: 48, color: '#bbb'}}>
                  <div className="sample-col-number"></div>
                  <div className="sample-col-name" style={{textAlign: 'center'}}>Geen samples gevonden voor deze status</div>
                  <div className="sample-col-round"></div>
                  <div className="sample-col-type"></div>
                  <div className="sample-col-status"></div>
                  <div className="sample-col-actions"></div>
                </div>
              )}
            </div>
          ) : (
            <div className="samples-table">
              <div className="samples-table-header" style={{display: 'grid', gridTemplateColumns: '80px 1.5fr 1fr 1fr 1fr 80px', alignItems: 'center', minHeight: 48}}>
                <div className="sample-col-number" style={{display: 'flex', alignItems: 'center', height: '100%'}}>Number</div>
                <div className="sample-col-name" style={{display: 'flex', alignItems: 'center', height: '100%'}}>Sample Name</div>
                <div className="sample-col-round" style={{display: 'flex', alignItems: 'center', height: '100%'}}>Round</div>
                <div className="sample-col-type" style={{display: 'flex', alignItems: 'center', height: '100%'}}>Type</div>
                <div className="sample-col-status" style={{display: 'flex', alignItems: 'center', height: '100%'}}>Status</div>
                <div className="sample-col-actions" style={{display: 'flex', alignItems: 'center', height: '100%'}}></div>
              </div>
              <div className="samples-table-row" style={{display: 'grid', gridTemplateColumns: '80px 1.5fr 1fr 1fr 1fr 80px', alignItems: 'center', minHeight: 48, color: '#bbb'}}>
                <div className="sample-col-number"></div>
                <div className="sample-col-name" style={{textAlign: 'center', display: 'flex', alignItems: 'center', height: '100%'}}>Geen samples gevonden</div>
                <div className="sample-col-round"></div>
                <div className="sample-col-type"></div>
                <div className="sample-col-status"></div>
                <div className="sample-col-actions"></div>
              </div>
            </div>
          )}
        </div>
      )}
      {selectedCategory && selectedYear && selectedSeason && loading && (
        <div className="loading">Loading samples...</div>
      )}

      {/* Add Sample Modal */}
      <AddSampleModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        collections={collections}
        onSampleAdded={() => {
          loadSamples();
        }}
      />

      {/* Edit Sample Modal */}
      <EditSampleModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedSample(null);
        }}
        sample={selectedSample}
        onSampleUpdated={() => {
          loadSamples();
        }}
      />
    </div>
  );
}

export default QualityControl;
