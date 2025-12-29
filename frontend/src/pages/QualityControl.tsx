import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collectionsAPI, samplesAPI } from '../api';
import type { Collection, Sample } from '../types';
import AddSampleModal from '../components/AddSampleModal';
import EditSampleModal from '../components/EditSampleModal';

type Category = 'Mariage' | 'Haute Couture' | 'Ready to Wear';

function QualityControl() {
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
        const response = await samplesAPI.getByCollection(collection.id);
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
  };

  const handleSeasonSelect = (year: number, season: string) => {
    // Auto-select Ready to Wear if no category selected
    if (!selectedCategory) {
      setSelectedCategory('Ready to Wear');
    }
    setSelectedYear(year);
    setSelectedSeason(season);
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
      await samplesAPI.delete(sample.id);
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
      <div className="page-header">
        {selectedCategory && (
          <button 
            className="back-arrow-button"
            onClick={() => {
              if (selectedYear && selectedSeason) {
                // From samples view, go back to season selection
                setSelectedSeason(null);
              } else if (selectedYear) {
                // From season selection, go back to year selection
                setSelectedYear(null);
              } else {
                // From year selection, go back to category selection
                setSelectedCategory(null);
              }
            }}
          >
            ←
          </button>
        )}
        <h1 className="page-title">Quality Control</h1>
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
                      to={`/collections/${sample.collection_id}/samples/${sample.id}`}
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
          <h2 className="section-title">{selectedCategory}</h2>
          <div className="year-grid">
            {[2026, 2025, 2024, 2023, 2022].map((year) => (
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
      {selectedCategory && selectedYear && selectedSeason && (
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

          {loading ? (
            <div className="loading">Loading samples...</div>
          ) : samples.length > 0 ? (
            <div className="samples-table">
              <div className="samples-table-header">
                <div className="sample-col-number">Number</div>
                <div className="sample-col-name">Sample Name</div>
                <div className="sample-col-round">Round</div>
                <div className="sample-col-type">Type</div>
                <div className="sample-col-status">Status</div>
                <div className="sample-col-actions"></div>
              </div>
              {samples.map((sample) => (
                <div key={sample.id} className="samples-table-row">
                  <Link to={`/collections/${sample.collection_id}/samples/${sample.id}`} className="sample-row-link">
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
              ))}
            </div>
          ) : (
            <div className="empty-state">No samples found for this collection</div>
          )}
        </div>
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
