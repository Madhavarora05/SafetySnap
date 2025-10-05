import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getImages, getLabels, deleteImage } from '../services/api';
import './History.css';

function History() {
  const [images, setImages] = useState([]);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    label: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 12
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchLabels();
  }, []);

  useEffect(() => {
    fetchImages();
  }, [filters]);

  const fetchLabels = async () => {
    try {
      const data = await getLabels();
      setLabels(data.labels);
    } catch (error) {
      console.error('Error fetching labels:', error);
    }
  };

  const fetchImages = async () => {
    setLoading(true);
    try {
      const data = await getImages(filters);
      setImages(data.images);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      await deleteImage(id);
      fetchImages(); // Refresh list
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="history-page">
      <h1>Upload History</h1>

      <div className="filters">
        <div className="filter-group">
          <label>Filter by Label:</label>
          <select
            value={filters.label}
            onChange={(e) => handleFilterChange('label', e.target.value)}
          >
            <option value="">All Labels</option>
            {labels.map(label => (
              <option key={label.id} value={label.name}>
                {label.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>From Date:</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>To Date:</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
          />
        </div>

        <button
          className="btn-clear"
          onClick={() => setFilters({ label: '', startDate: '', endDate: '', page: 1, limit: 12 })}
        >
          Clear Filters
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : images.length === 0 ? (
        <div className="no-results">
          <p>No images found</p>
          <Link to="/" className="btn-upload-link">Upload your first image</Link>
        </div>
      ) : (
        <>
          <div className="images-grid">
            {images.map(image => (
              <div key={image.id} className="image-card">
                <Link to={`/result/${image.id}`}>
                  <img
                    src={`http://localhost:3001/uploads/${image.filename}`}
                    alt={image.filename}
                    className="thumbnail"
                    onError={(e) => {
                      console.error('Failed to load thumbnail:', `http://localhost:3001/uploads/${image.filename}`);
                      e.target.style.display = 'none';
                    }}
                  />
                </Link>
                <div className="image-info">
                  <p className="filename">{image.filename}</p>
                  <p className="date">{new Date(image.upload_date).toLocaleDateString()}</p>
                  <p className="detection-count">
                    {image.detection_count} detection{image.detection_count !== 1 ? 's' : ''}
                  </p>
                  <div className="image-actions">
                    <Link to={`/result/${image.id}`} className="btn-view">
                      View Details
                    </Link>
                    <button
                      onClick={() => handleDelete(image.id)}
                      className="btn-delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination && pagination.total > pagination.limit && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(Math.max(1, filters.page - 1))}
                disabled={filters.page === 1}
              >
                Previous
              </button>
              <span>Page {filters.page} (Showing {pagination.limit} of {pagination.total})</span>
              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={images.length < pagination.limit}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default History;
