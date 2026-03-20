import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { collectionsAPI, samplesAPI } from '../api';
import type { Collection, Sample } from '../types';
import AddSampleModal from '../components/AddSampleModal';
import EditSampleModal from '../components/EditSampleModal';
import { Plus } from 'lucide-react';

type Category = 'Mariage' | 'Eyewear Collection' | 'Ready to Wear';

let cachedCollections: Collection[] | null = null;
let collectionsCachePromise: Promise<any> | null = null;

const CATEGORY_MAP: Record<string, Category> = {
  'ready-to-wear': 'Ready to Wear',
  'eyewear-collection': 'Eyewear Collection',
  'mariage': 'Mariage'
};

const SEASON_MAP_REVERSE: Record<string, string> = {
  'ss': 'Spring/Summer',
  'fw': 'Fall/Winter'
};

const SEASON_MAP: Record<string, string> = {
  'Spring/Summer': 'ss',
  'Fall/Winter': 'fw'
};

export function fetchCollectionsCached(force = false) {
  if (force) {
    cachedCollections = null;
    collectionsCachePromise = null;
  }
  if (cachedCollections) {
    return Promise.resolve(cachedCollections);
  }
  if (!collectionsCachePromise) {
    collectionsCachePromise = collectionsAPI.getAll().then(res => {
      cachedCollections = res.data;
      return cachedCollections;
    }).catch(err => {
      collectionsCachePromise = null;
      throw err;
    });
  }
  return collectionsCachePromise;
}

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

  // Prefetch collections on mount so navigating to years is instant
  useEffect(() => {
    fetchCollectionsCached().catch(console.error);
  }, []);

  const [searchResults, setSearchResults] = useState<{ collections: Collection[], samples: Sample[] }>({ collections: [], samples: [] });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showAddYearModal, setShowAddYearModal] = useState(false);
  const [newYear, setNewYear] = useState<number>(new Date().getFullYear() + 1);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [showAllSamples, setShowAllSamples] = useState(false);
  const [isEditingYears, setIsEditingYears] = useState(false);

  // Initialize and Sync State from URL params
  useEffect(() => {
    // 1. Sync Category
    const newCategory = params.category ? CATEGORY_MAP[params.category.toLowerCase()] : null;
    if (newCategory !== selectedCategory) {
      setSelectedCategory(newCategory);
    }

    // 2. Sync Year
    const newYearVal = params.year ? parseInt(params.year) : null;
    if (newYearVal !== selectedYear) {
      setSelectedYear(newYearVal);
    }

    // 3. Sync Season
    const newSeasonVal = params.season ? SEASON_MAP_REVERSE[params.season.toLowerCase()] : null;
    if (newSeasonVal !== selectedSeason) {
      setSelectedSeason(newSeasonVal);
    }
  }, [params.category, params.year, params.season]);

  // Load available years whenever selectedCategory changes
  useEffect(() => {
    if (selectedCategory) {
      loadAvailableYears(selectedCategory);
    } else {
      setAvailableYears([]);
    }
  }, [selectedCategory]);

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
      const filtered = response.data.filter((col: any) => {
        const catMatch = col.category && selectedCategory &&
          col.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase();

        const yearMatch = Number(col.year) === Number(selectedYear);
        const seasonMatch = col.season === seasonCode;

        return catMatch && yearMatch && seasonMatch;
      });
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
    const slug = category.toLowerCase().replace(/ /g, '-');
    navigate(`/quality-control/${slug}`);
  };

  const loadAvailableYears = async (category: Category, forceRefresh = false) => {
    try {
      setLoading(true);
      const data = await fetchCollectionsCached(forceRefresh);

      const years = [...new Set(
        data
          .filter((col: Collection) => 
            col.category && col.category.trim().toLowerCase() === category.trim().toLowerCase()
          )
          .map((col: Collection) => col.year)
      )].sort((a, b) => (b as number) - (a as number));

      if (years.length === 0 && !forceRefresh) {
        return loadAvailableYears(category, true);
      }

      setAvailableYears(years as number[]);
      setLoading(false);
    } catch (error) {
      console.error('Error loading years:', error);
      setAvailableYears([]);
      setLoading(false);
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
      await loadAvailableYears(selectedCategory, true);
      setShowAddYearModal(false);
      setNewYear(new Date().getFullYear() + 1);
    } catch (error) {
      console.error('Error creating year:', error);
      alert('Failed to create year collections');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteYear = async (yearToDelete: number) => {
    if (!selectedCategory) return;

    if (!window.confirm(`Are you sure you want to delete the year ${yearToDelete} for ${selectedCategory}? This will permanently delete all collections and samples in this year.`)) {
      return;
    }

    try {
      setLoading(true);

      // Fetch all collections to find the ones matching category and year
      const response = await collectionsAPI.getAll();
      const collectionsToDelete = response.data.filter((c: any) =>
        c.category && c.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase() &&
        Number(c.year) === Number(yearToDelete)
      );

      // Delete them
      for (const col of collectionsToDelete) {
        await collectionsAPI.delete(String(col.id));
      }

      // Refresh years
      await loadAvailableYears(selectedCategory, true);

      if (selectedYear === yearToDelete) {
        setSelectedYear(null);
        setSelectedSeason(null);
      }
    } catch (error: any) {
      console.error('Error deleting year:', error);
      alert(`Failed to delete year. It might be linked to existing data.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSeasonSelect = (year: number, season: string) => {
    const category = selectedCategory || 'Ready to Wear';
    const categorySlug = category.toLowerCase().replace(/ /g, '-');
    const seasonSlug = SEASON_MAP[season] || 'ss';
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

  const handleDeleteSample = async (e: React.MouseEvent, sample: Sample) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm(`Are you sure you want to delete style ${sample.sample_code} (${sample.name})?`)) {
      return;
    }

    try {
      await samplesAPI.delete(String(sample.id));
      // Reload samples after successful delete
      await loadSamples();
    } catch (error: any) {
      console.error('Error deleting sample:', error);
      alert(`Failed to delete style: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleEditSample = (e: React.MouseEvent, sample: Sample) => {
    e.preventDefault();
    e.stopPropagation();
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

  const handleBack = () => {
    if (selectedYear && selectedSeason) {
      const slug = selectedCategory!.toLowerCase().replace(/ /g, '-');
      navigate(`/quality-control/${slug}/${selectedYear}`);
    } else if (selectedYear) {
      const slug = selectedCategory!.toLowerCase().replace(/ /g, '-');
      navigate(`/quality-control/${slug}`);
    } else {
      navigate('/quality-control');
    }
  };

  return (
    <div>
      {/* Terug knop - links boven, onder de navbar */}
      {selectedCategory && (
        <div style={{ paddingTop: 32, paddingLeft: 0 }}>
          <div
            onClick={handleBack}
            style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '2px',
              color: '#999',
              textTransform: 'uppercase',
              cursor: 'pointer',
              marginBottom: 48,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#111'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#999'}
          >
            ← Back
          </div>
        </div>
      )}

      <div className="page-header" style={{ marginTop: selectedCategory ? 16 : 48 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Quality Control</h1>
        <p className="page-subtitle">
          {!selectedCategory ? 'Select category and collection to review articles' :
            !selectedYear ? `Select ${selectedCategory} year` :
              'Review articles'}
        </p>
      </div>

      {/* Search Bar */}
      {!selectedCategory && (
        <div className="search-section">
          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Search collections or styles..."
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
                          setSelectedCategory(collection.category as Category);
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
                  <h3 className="search-results-title">Articles ({searchResults.samples.length})</h3>
                  <div className="samples-grid">
                    {searchResults.samples.slice(0, showAllSamples ? undefined : 12).map((sample) => (
                      <Link
                        key={sample.id}
                        to={`/samples/${sample.id}`}
                        className="sample-card"
                      >
                        <div className="sample-card-header">
                          <span className="sample-code">{sample.sample_code}</span>
                          {sample.status !== 'Approved' && (
                            <span className={`badge ${getStatusBadgeClass(sample.status)}`}>
                              {sample.status}
                            </span>
                          )}
                        </div>
                        <div className="sample-card-name">{sample.name}</div>
                        <div className="sample-card-meta">
                          {sample.product_type}
                        </div>
                      </Link>
                    ))}
                  </div>
                  {searchResults.samples.length > 12 && (
                    <button
                      onClick={() => setShowAllSamples(!showAllSamples)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        margin: '24px auto 0',
                        padding: '10px 20px',
                        background: '#fff',
                        border: '1px solid #ddd',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 500,
                        color: '#333',
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
                      {showAllSamples ? (
                        <>Show less</>
                      ) : (
                        <>+ {searchResults.samples.length - 12} more articles</>
                      )}
                    </button>
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
            <div className="category-card-wrapper">
              <div
                className="category-card"
                onClick={() => handleCategorySelect('Ready to Wear')}
              >
                <div className="category-icon">👔</div>
                <h3>Ready to Wear</h3>
                <p>RTW Collection</p>
              </div>
              {/* 3 Fashion photos onder Ready to Wear */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 0,
                marginTop: 0,
              }}>
                <div style={{
                  height: 200,
                  backgroundImage: 'url(/model_front_AW_GREEN_DRESS_195481.jpg.webp)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center top',
                }} />
                <div style={{
                  height: 200,
                  backgroundImage: 'url(/model_front_WT0140039425_4998RTW_FW25MAINDENIM_model.jpg.webp)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center top',
                }} />
                <div style={{
                  height: 200,
                  backgroundImage: 'url(/model_front_WO0060099425_3759RTW_FW25MAINDENIM_model.jpg.webp)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center top',
                }} />
              </div>
            </div>
            <div className="category-card-wrapper">
              <div
                className="category-card"
                onClick={() => handleCategorySelect('Eyewear Collection')}
              >
                <div className="category-icon">🕶️</div>
                <h3>Eyewear Collection</h3>
                <p>Eyewear Collection</p>
              </div>
              {/* 3 Eyewear photos */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 0,
                marginTop: 0,
              }}>
                <div style={{
                  height: 200,
                  backgroundImage: 'url(/VR_Limited-Edition-No6_33135311_Model-scaled.jpg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }} />
                <div style={{
                  height: 200,
                  backgroundImage: 'url(/vr1.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }} />
                <div style={{
                  height: 200,
                  backgroundImage: 'url(/vr2.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }} />
              </div>
            </div>
            <div className="category-card-wrapper">
              <div
                className="category-card"
                onClick={() => handleCategorySelect('Mariage')}
              >
                <div className="category-icon">💍</div>
                <h3>Mariage</h3>
                <p>Bridal Collection</p>
              </div>
              {/* 3 Fashion photos onder Mariage */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 0,
                marginTop: 0,
              }}>
                <div style={{
                  height: 200,
                  backgroundImage: 'url(/VRM342-F.jpg.webp)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center top',
                }} />
                <div style={{
                  height: 200,
                  backgroundImage: 'url(/VRM368-F.jpg.webp)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center top',
                }} />
                <div style={{
                  height: 200,
                  backgroundImage: 'url(/VRM450_B.jpg.webp)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center top',
                }} />
              </div>
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
            {(availableYears.length > 0 ? availableYears : [])
              .sort((a, b) => b - a)
              .map((year) => (
                <div key={year} style={{ position: 'relative' }}>
                  <div
                    className="year-card"
                    onClick={() => {
                      const slug = selectedCategory!.toLowerCase().replace(/ /g, '-');
                      navigate(`/quality-control/${slug}/${year}`);
                    }}
                  >
                    <h3>{year}</h3>
                  </div>
                  {isEditingYears && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteYear(year);
                      }}
                      style={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: '#ff4d4f',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                      title="Delete Year"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 120 }}>
            <button
              onClick={() => setIsEditingYears(!isEditingYears)}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: 14,
                color: '#666',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#111';
                e.currentTarget.style.color = '#111';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#ccc';
                e.currentTarget.style.color = '#666';
              }}
            >
              {isEditingYears ? 'Done Editing' : 'Edit Years'}
            </button>
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
              <p className="section-subtitle">{samples.length} articles total</p>
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
                <div className="samples-table-header-inner">
                  <div className="sample-col-number">Article Number</div>
                  <div className="sample-col-name">Article Description</div>
                  <div className="sample-col-type">Type</div>
                  <div className="sample-col-status">Status</div>
                </div>
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
                        <div className="sample-col-number">{sample.sample_code}</div>
                        <div className="sample-col-name">{sample.name}</div>
                        <div className="sample-col-type">{sample.product_type}</div>
                        <div className="sample-col-status">
                          {sample.status !== 'Approved' && (
                            <span className={`badge ${getStatusBadgeClass(sample.status)}`}>
                              {sample.status}
                            </span>
                          )}
                        </div>
                      </Link>
                      <div className="sample-col-actions">
                        <button
                          className="sample-action-btn"
                          onClick={(e) => handleEditSample(e, sample)}
                          title="Edit article"
                        >
                          ✎
                        </button>
                        <button
                          className="sample-action-btn sample-action-delete"
                          onClick={(e) => handleDeleteSample(e, sample)}
                          title="Delete article"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="samples-table-row" style={{ display: 'grid', gridTemplateColumns: '130px 1.5fr 1fr 1fr 130px', alignItems: 'center', minHeight: 48, color: '#bbb' }}>
                  <div className="sample-col-number"></div>
                  <div className="sample-col-name" style={{ textAlign: 'center' }}>Geen articles gevonden voor deze status</div>
                  <div className="sample-col-type"></div>
                  <div className="sample-col-status"></div>
                  <div className="sample-col-actions"></div>
                </div>
              )}
            </div>
          ) : (
            <div className="samples-table">
              <div className="samples-table-header" style={{ display: 'grid', gridTemplateColumns: '130px 1.5fr 1fr 1fr 130px', alignItems: 'center', minHeight: 48 }}>
                <div className="sample-col-number" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>Article Number</div>
                <div className="sample-col-name" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>Article Description</div>
                <div className="sample-col-type" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>Type</div>
                <div className="sample-col-status" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>Status</div>
                <div className="sample-col-actions" style={{ display: 'flex', alignItems: 'center', height: '100%' }}></div>
              </div>
              <div className="samples-table-row" style={{ display: 'grid', gridTemplateColumns: '130px 1.5fr 1fr 1fr 130px', alignItems: 'center', minHeight: 48, color: '#bbb' }}>
                <div className="sample-col-number"></div>
                <div className="sample-col-name" style={{ textAlign: 'center', display: 'flex', alignItems: 'center', height: '100%' }}>Geen articles gevonden</div>
                <div className="sample-col-type"></div>
                <div className="sample-col-status"></div>
                <div className="sample-col-actions"></div>
              </div>
            </div>
          )}
        </div>
      )}
      {selectedCategory && selectedYear && selectedSeason && loading && (
        <div className="loading">Loading articles...</div>
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
