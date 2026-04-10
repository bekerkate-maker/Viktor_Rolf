import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { collectionsAPI, samplesAPI, photosAPI, manufacturersAPI } from '../api';
import type { Collection, Sample } from '../types';
import AddSampleModal from '../components/AddSampleModal';
import EditSampleModal from '../components/EditSampleModal';
import ManufacturersModal from '../components/ManufacturersModal';
import { Plus } from 'lucide-react';

type Category = 'Mariage' | 'Eyewear Collection' | 'Ready to Wear';

let cachedCollections: Collection[] | null = null;
let collectionsCachePromise: Promise<any> | null = null;

const CATEGORY_MAP: Record<string, Category> = {
  'ready-to-wear': 'Ready to Wear',
  'rtw': 'Ready to Wear',
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
  
  // Use a more robust check for cachedCollections
  if (cachedCollections !== null) {
    return Promise.resolve(cachedCollections);
  }
  
  if (!collectionsCachePromise) {
    collectionsCachePromise = collectionsAPI.getAll()
      .then(res => {
        cachedCollections = res.data || [];
        return cachedCollections;
      })
      .catch(err => {
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
  const [manufacturerFilter, setManufacturerFilter] = useState<string>('All');
  const [showAddYearModal, setShowAddYearModal] = useState(false);
  const [newYear, setNewYear] = useState<number>(new Date().getFullYear() + 1);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [showAllSamples, setShowAllSamples] = useState(false);
  const [isEditingYears, setIsEditingYears] = useState(false);
  const [selectedSampleIds, setSelectedSampleIds] = useState<number[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [printSamples, setPrintSamples] = useState<Sample[]>([]);
  const [showManufacturersModal, setShowManufacturersModal] = useState(false);
  const [manufacturers, setManufacturers] = useState<string[]>([]);

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
      setSelectedSampleIds([]);
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

  // Load available manufacturers
  useEffect(() => {
    loadManufacturersFromDB();
  }, [samples]);

  const loadManufacturersFromDB = async () => {
    try {
      const res = await manufacturersAPI.getAll();
      const managed = res.data.map(m => m.name);
      
      const fromSamples = Array.from(new Set(samples.map(s => s.supplier_name).filter(Boolean)));
      const combined = Array.from(new Set([...managed, ...fromSamples])).sort();
      setManufacturers(combined as string[]);
    } catch (err) {
      console.error('Error loading manufacturers:', err);
      // Fallback
      const fromSamples = Array.from(new Set(samples.map(s => s.supplier_name).filter(Boolean))).sort();
      setManufacturers(fromSamples as string[]);
    }
  };

  const loadCollections = async () => {
    try {
      setLoading(true);
      const data = await fetchCollectionsCached();
      console.log('Total collections fetched:', data.length);
      
      // Convert selectedSeason to database format (SS or FW)
      const seasonCode = selectedSeason === 'Spring/Summer' ? 'SS' : 'FW';
      
      const filtered = data.filter((col: Collection) => {
        if (!col.category || !selectedCategory) return false;
        
        const dbCat = col.category.trim().toLowerCase();
        const selCat = selectedCategory.trim().toLowerCase();
        const isRtwMatch = (selCat === 'ready to wear' || selCat === 'rtw') && (dbCat === 'ready to wear' || dbCat === 'rtw');
        
        const catMatch = dbCat === selCat || isRtwMatch;
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
    if (collections.length === 0) {
      setSamples([]);
      return;
    }
    
    try {
      setLoading(true);
      console.log('Loading samples for collections:', collections.map(c => c.id));
      
      // Get samples from all collections in parallel for better performance
      const samplePromises = collections.map(collection => 
        samplesAPI.getByCollection(String(collection.id))
      );
      
      const responses = await Promise.all(samplePromises);
      const allSamples: Sample[] = responses.flatMap(res => res.data);
      
      console.log('All samples loaded:', allSamples.length);
      setSamples(allSamples);
    } catch (error) {
      console.error('Error loading samples:', error);
      setSamples([]); // Clear on error to avoid stale data
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category: Category) => {
    const slug = category.toLowerCase().replace(/ /g, '-');
    navigate(`/quality-control/${slug}`);
  };

  const loadAvailableYears = async (category: Category, forceRefresh = false) => {
    if (!category) return;
    
    try {
      setLoading(true);
      const data = await fetchCollectionsCached(forceRefresh);

      const selCat = category.trim().toLowerCase();
      
      const years = [...new Set(
        data
          .filter((col: Collection) => {
            if (!col.category) return false;
            const dbCat = col.category.trim().toLowerCase();
            const isRtwMatch = (selCat === 'ready to wear' || selCat === 'rtw') && (dbCat === 'ready to wear' || dbCat === 'rtw');
            return dbCat === selCat || isRtwMatch;
          })
          .map((col: Collection) => Number(col.year))
          .filter(year => !isNaN(year))
      )].sort((a, b) => b - a);

      console.log(`Available years for ${category}:`, years);

      if (years.length === 0 && !forceRefresh) {
        console.log(`No years found for ${category}, forcing refresh...`);
        return await loadAvailableYears(category, true);
      }

      setAvailableYears(years);
    } catch (error) {
      console.error('Error loading years:', error);
      setAvailableYears([]);
    } finally {
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

  const handleSelectSample = (e: React.ChangeEvent<HTMLInputElement>, id: number) => {
    e.stopPropagation();
    setSelectedSampleIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (filteredSamples: Sample[]) => {
    if (selectedSampleIds.length === filteredSamples.length && filteredSamples.length > 0) {
      setSelectedSampleIds([]);
    } else {
      setSelectedSampleIds(filteredSamples.map(s => s.id));
    }
  };

  const handleExportPDF = async () => {
    if (selectedSampleIds.length === 0) return;

    try {
      setIsExporting(true);
      const fullSamples = await Promise.all(
        selectedSampleIds.map(async (id) => {
          const sampleRes = await samplesAPI.getById(String(id));
          const photosRes = await photosAPI.getPhotos(String(id));
          return {
            ...sampleRes.data,
            photos: photosRes.data
          };
        })
      );
      setPrintSamples(fullSamples);
      
      // Wait for a bit (longer for images to load) to ensure the print view is rendered
      setTimeout(() => {
        window.print();
        setIsExporting(false);
        setPrintSamples([]); // Clear after printing
      }, 1000);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to generate PDF export.');
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className="no-print">
        <div className="quality-control-page luxury-font" style={{ padding: '0 24px' }}>
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
        <div className="samples-view" style={{ padding: '0 40px' }}>
          <div className="samples-header-with-add" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', minHeight: '60px', marginTop: '20px' }}>
            <div>
              <h2 className="section-title" style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                {selectedSeason === 'Spring/Summer' ? 'Spring Summer' : 'Fall Winter'} {selectedYear}
              </h2>
              <p className="section-subtitle" style={{ fontSize: '14px', color: '#666', margin: 0 }}>{samples.length} articles total</p>
            </div>

            {/* Centered Add Button */}
            <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 0 }}>
              <button className="add-button" onClick={() => setShowAddModal(true)} style={{ margin: 0 }}>+</button>
            </div>

            {/* Far Right Export Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', minWidth: '150px' }}>
              {selectedSampleIds.length > 0 && (
                <button 
                  className="btn btn-secondary" 
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    fontSize: 14,
                    fontWeight: 600,
                    borderRadius: 8,
                    background: '#fff',
                    border: '1px solid #111',
                    color: '#111',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#111';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.color = '#111';
                  }}
                >
                  {isExporting ? 'Preparing...' : `Export PDF (${selectedSampleIds.length})`}
                </button>
              )}
            </div>
          </div>
          {/* Manufacturer Filter */}
          <div style={{ margin: '24px 0 16px 0', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '12px' }}>
            <select
              id="manufacturer-filter"
              value={manufacturerFilter}
              onChange={e => setManufacturerFilter(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '14px', fontWeight: 500, borderRadius: '4px', border: '1px solid #ddd', background: '#fff' }}
            >
              <option value="All">Manufacturers</option>
              {manufacturers.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <button
              onClick={() => setShowManufacturersModal(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#666', padding: '4px', display: 'flex', alignItems: 'center' }}
              title="Manage Manufacturers List"
            >
              ✎
            </button>
          </div>
          {samples.length > 0 ? (
            <div className="samples-table">
              <div className="samples-table-header">
                <div className="samples-table-header-inner" style={{ gridTemplateColumns: '48px 140px 1.5fr 1fr 100px 120px' }}>
                  <div className="sample-col-check" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <input
                      type="checkbox"
                      checked={samples.filter(s => manufacturerFilter === 'All' || s.supplier_name === manufacturerFilter).length > 0 && selectedSampleIds.length === samples.filter(s => manufacturerFilter === 'All' || s.supplier_name === manufacturerFilter).length}
                      onChange={() => handleSelectAll(samples.filter(s => manufacturerFilter === 'All' || s.supplier_name === manufacturerFilter))}
                      style={{ cursor: 'pointer', width: 18, height: 18 }}
                    />
                  </div>
                  <div className="sample-col-number" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666' }}>Article Code</div>
                  <div className="sample-col-name" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666' }}>Art. Description</div>
                  <div className="sample-col-manufacturer" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666' }}>Manufacturer</div>
                  <div className="sample-col-type" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666' }}>Type</div>
                  <div className="sample-col-status" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666' }}>Status</div>
                </div>
                <div className="sample-col-actions"></div>
              </div>
              {samples
                .filter(sample => manufacturerFilter === 'All' || sample.supplier_name === manufacturerFilter)
                .length > 0 ? (
                samples
                  .filter(sample => manufacturerFilter === 'All' || sample.supplier_name === manufacturerFilter)
                  .map((sample) => (
                    <div key={sample.id} className="samples-table-row">
                      <div className="sample-row-link" style={{ gridTemplateColumns: '48px 140px 1.5fr 1fr 100px 120px', cursor: 'default' }}>
                        <div className="sample-col-check" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <input
                            type="checkbox"
                            checked={selectedSampleIds.includes(sample.id)}
                            onChange={(e) => handleSelectSample(e, sample.id)}
                            style={{ cursor: 'pointer', width: 18, height: 18 }}
                          />
                        </div>
                        <Link to={`/samples/${sample.id}`} style={{ display: 'contents', color: 'inherit', textDecoration: 'none' }}>
                          <div className="sample-col-number" style={{ fontSize: '14px', fontWeight: 500 }}>{sample.sample_code}</div>
                          <div className="sample-col-name" style={{ fontSize: '14px', fontWeight: 500 }}>{sample.name}</div>
                          <div className="sample-col-manufacturer" style={{ fontSize: '14px', fontWeight: 500 }}>{sample.supplier_name || '—'}</div>
                          <div className="sample-col-type" style={{ fontSize: '14px', fontWeight: 500 }}>{sample.product_type}</div>
                          <div className="sample-col-status" style={{ fontSize: '14px', fontWeight: 500 }}>
                            {sample.status !== 'Approved' && (
                              <span className={`badge ${getStatusBadgeClass(sample.status)}`} style={{ fontSize: '12px' }}>
                                {sample.status}
                              </span>
                            )}
                          </div>
                        </Link>
                      </div>
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
                <div className="samples-table-row" style={{ display: 'grid', gridTemplateColumns: '1fr 130px', alignItems: 'center', minHeight: 64, color: '#bbb' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '48px 140px 1.5fr 1fr 100px 120px', padding: '0 24px', alignItems: 'center' }}>
                    <div className="sample-col-check"></div>
                    <div className="sample-col-number"></div>
                    <div className="sample-col-name" style={{ textAlign: 'center' }}>Geen articles gevonden voor deze manufacturer</div>
                    <div className="sample-col-manufacturer"></div>
                    <div className="sample-col-type"></div>
                    <div className="sample-col-status"></div>
                  </div>
                  <div className="sample-col-actions"></div>
                </div>
              )}
            </div>
          ) : (
            <div className="samples-table">
              <div className="samples-table-header" style={{ display: 'grid', gridTemplateColumns: '1fr 130px', alignItems: 'center', minHeight: 48 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '48px 140px 1.5fr 1fr 100px 120px', padding: '0 24px' }}>
                  <div className="sample-col-check"></div>
                  <div className="sample-col-number" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666' }}>Art. Number</div>
                  <div className="sample-col-name" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666' }}>Art. Description</div>
                  <div className="sample-col-manufacturer" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666' }}>Manufacturer</div>
                  <div className="sample-col-type" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666' }}>Type</div>
                  <div className="sample-col-status" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666' }}>Status</div>
                </div>
                <div className="sample-col-actions"></div>
              </div>
              <div className="samples-table-row" style={{ display: 'grid', gridTemplateColumns: '1fr 130px', alignItems: 'center', minHeight: 64, color: '#bbb' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '48px 140px 1.5fr 1fr 100px 120px', padding: '0 24px', alignItems: 'center' }}>
                  <div className="sample-col-check"></div>
                  <div className="sample-col-number"></div>
                  <div className="sample-col-name" style={{ textAlign: 'center' }}>Geen articles gevonden</div>
                  <div className="sample-col-manufacturer"></div>
                  <div className="sample-col-type"></div>
                  <div className="sample-col-status"></div>
                </div>
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

      {/* Manufacturers Management Modal */}
      <ManufacturersModal
        isOpen={showManufacturersModal}
        onClose={() => setShowManufacturersModal(false)}
        onUpdate={loadManufacturersFromDB}
      />

      </div>
    </div>

      {/* Print View Section - Hidden in browser, shown in media print */}
      <div className="print-only-container">
        <style dangerouslySetInnerHTML={{ __html: `
          .print-only-container { display: none; }
          @media print {
            @page {
              size: A4;
              margin: 0;
            }
            body { 
              background: white !important; 
              font-family: 'Inter', sans-serif !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            /* Hide UI components but NOT the wrappers containing the print content */
            .no-print, nav, .top-nav, .page-header, .search-section, .category-selection, .year-selection, .season-selection, .samples-view, .modal-overlay, #status-filter { 
              display: none !important; 
            }
            /* Reset wrappers to 0 margin/padding to prevent blank space */
            .app-container, .main-layout, .main-content {
              margin: 0 !important;
              padding: 0 !important;
              min-height: 0 !important;
              background: none !important;
            }
            .print-only-container { display: block !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
            
            .print-page { 
              page-break-after: always; 
              padding: 15mm; 
              height: 297mm; 
              width: 210mm;
              display: flex;
              flex-direction: column;
              color: #111;
              box-sizing: border-box;
              overflow: hidden; /* Strict one-page */
            }

            .print-top-row {
              display: flex;
              gap: 15px;
              height: 240px; /* Adjusted from 180 to match new photo orientation */
              margin-bottom: 20px;
            }

            .print-photo-container {
              width: 180px; /* Brder */
              height: 240px; /* Taller */
              border: 1px solid #111;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
              background: #fff;
            }

            .print-info-container {
              flex: 1;
              border: 1px solid #111;
              padding: 15px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              font-size: 13px;
            }

            .print-middle-row {
              display: flex;
              gap: 15px;
              flex: 1;
              margin-bottom: 20px;
              min-height: 0;
            }

            .print-column {
              flex: 1;
              border: 1px solid #111;
              padding: 15px;
              display: flex;
              flex-direction: column;
              overflow: hidden;
            }

            .print-column-title {
              font-weight: 900;
              text-transform: uppercase;
              font-size: 14px;
              border-bottom: 2px solid #111;
              padding-bottom: 8px;
              margin-bottom: 15px;
              text-align: center;
            }

            .print-assessment-list {
              font-size: 11px;
              flex: 1;
              overflow: hidden;
            }

            .print-notes-container {
              height: 120px; /* Vastgesteld */
              border: 1px solid #111;
              padding: 15px;
              margin-bottom: 15px;
            }

            .print-footer-container {
              height: 90px;
              border: 1px solid #111;
              padding: 15px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              text-align: center;
            }
          }
        `}} />
        {printSamples.map(sample => {
          // Parse internal notes for checklist data
          let assessment: any = { fitChecks: {}, workChecks: {}, fitComments: {}, workComments: {} };
          try {
            const parsed = JSON.parse(sample.internal_notes || '{}');
            if (parsed && parsed._isJsonBlob) {
              assessment = parsed;
            }
          } catch (e) {}

          const mainPhoto = sample.photos?.find(p => p.is_main_photo) || (sample.photos && sample.photos[0]);

          return (
            <div key={sample.id} className="print-page">
              {/* TOP ROW */}
              <div className="print-top-row">
                <div className="print-photo-container">
                  {mainPhoto ? (
                    <img src={mainPhoto.file_path} alt="Article" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '10px', color: '#ccc' }}>FOTO</span>
                  )}
                </div>
                <div className="print-info-container">
                  <div className="print-info-item">
                    <span className="print-info-label">Article Identification: </span>
                    <span style={{ fontWeight: 800, fontSize: '16px' }}>{sample.sample_code}</span>
                  </div>
                  <div className="print-info-item">
                    <span className="print-info-label">Article Name: </span>
                    <span>{sample.name}</span>
                  </div>
                  <div className="print-info-item">
                    <span className="print-info-label">Category: </span>
                    <span>{sample.product_type}</span>
                  </div>
                  <div className="print-info-item">
                    <span className="print-info-label">Season: </span>
                    <span>{sample.season} {sample.year}</span>
                  </div>
                  <div className="print-info-item">
                    <span className="print-info-label">Manufacturer: </span>
                    <span style={{ fontWeight: 600 }}>{sample.supplier_name || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* MIDDLE ROW */}
              <div className="print-middle-row">
                {/* Fit Results */}
                <div className="print-column">
                  <div className="print-column-title">Fit Assessment</div>
                  <div className="print-assessment-list">
                    {Object.entries(assessment.fitChecks || {}).map(([key, value]) => {
                      if (value === 'approve' || !value) return null;
                      const label = value === 'reject' ? 'Rejected' : value === 'doubt' ? 'Review' : String(value);
                      return (
                        <div key={key} className="print-assessment-item">
                          <span className="print-assessment-status" style={{ color: value === 'reject' ? '#d32f2f' : '#f57c00' }}>
                            {label}
                          </span>
                          <span className="print-assessment-name">{key}</span>
                          {assessment.fitComments?.[key] && (
                            <span className="print-assessment-comment">{assessment.fitComments[key]}</span>
                          )}
                        </div>
                      );
                    })}
                    {Object.keys(assessment.fitChecks || {}).filter(k => assessment.fitChecks[k] && assessment.fitChecks[k] !== 'approve').length === 0 && (
                      <p style={{ textAlign: 'center', opacity: 0.5, marginTop: 20 }}>No issues reported.</p>
                    )}
                  </div>
                </div>

                {/* Manufacturer Results */}
                <div className="print-column">
                  <div className="print-column-title">Workmanship Assessment</div>
                  <div className="print-assessment-list">
                    {Object.entries(assessment.workChecks || {}).map(([key, value]) => {
                      if (value === 'approve' || !value) return null;
                      const label = value === 'reject' ? 'Rejected' : value === 'doubt' ? 'Review' : String(value);
                      return (
                        <div key={key} className="print-assessment-item" style={{ marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px dashed #eee' }}>
                          <span className="print-assessment-status" style={{ color: value === 'reject' ? '#d32f2f' : '#f57c00', float: 'right', fontWeight: 'bold' }}>
                            {label}
                          </span>
                          <span className="print-assessment-name" style={{ fontWeight: '500' }}>{key}</span>
                          {assessment.workComments?.[key] && (
                            <span className="print-assessment-comment" style={{ display: 'block', fontStyle: 'italic', fontSize: '10px', marginTop: '2px' }}>{assessment.workComments[key]}</span>
                          )}
                        </div>
                      );
                    })}
                    {Object.keys(assessment.workChecks || {}).filter(k => assessment.workChecks[k] && assessment.workChecks[k] !== 'approve').length === 0 && (
                      <p style={{ textAlign: 'center', opacity: 0.5, marginTop: 20 }}>No issues reported.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* BOTTOM ROW - Internal Notes */}
              <div className="print-notes-container">
                <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px', marginBottom: '8px', borderBottom: '1px solid #ddd', paddingBottom: '4px' }}>
                  Internal Notes & Final Remarks
                </div>
                <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                  {assessment.notes || (sample.internal_notes && !sample.internal_notes.includes('_isJsonBlob') ? sample.internal_notes : 'No final remarks.')}
                </div>
              </div>

              {/* FOOTER - Thank You */}
              <div className="print-footer-container" style={{ borderTop: '1px solid #111', background: '#fafafa' }}>
                <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Thank You</div>
                <div style={{ fontSize: '10px', color: '#333', maxWidth: '500px', margin: '0 auto', lineHeight: '1.5' }}>
                  We kindly ask you to review these quality control notes and apply the necessary adjustments for the next sample round. Best regards, Viktor & Rolf.
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default QualityControl;
