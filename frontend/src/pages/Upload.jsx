import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadImage } from '../services/api';
import './Upload.css';

function Upload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const navigate = useNavigate();

  const processFile = (file) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG)');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const result = await uploadImage(formData);
      
      // Navigate to result page
      navigate(`/result/${result.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload image');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      processFile(file);
    }
  };

  return (
    <div className="upload-page">
      <h1>🛡️ Upload Image for PPE Detection</h1>
      <p className="subtitle">Upload an image to detect safety equipment (helmet, vest) with AI-powered analysis</p>

      <div 
        className={`upload-container ${isDragOver ? 'drag-over' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="upload-area">
          {!preview ? (
            <label className="file-input-label">
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleFileSelect}
                className="file-input"
              />
              <div className="upload-placeholder">
                <span className="upload-icon">{isDragOver ? '📤' : '📁'}</span>
                <p>{isDragOver ? 'Drop your image here' : 'Click to select an image or drag & drop'}</p>
                <p className="file-hint">JPEG, PNG (Max 10MB)</p>
              </div>
            </label>
          ) : (
            <div className="preview-container">
              <img src={preview} alt="Preview" className="preview-image" />
              <button onClick={handleReset} className="btn-reset">
                ✕ Remove
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️</span> {error}
          </div>
        )}

        {selectedFile && (
          <div className="file-info">
            <p><strong>Selected:</strong> {selectedFile.name}</p>
            <p><strong>Size:</strong> {(selectedFile.size / 1024).toFixed(2)} KB</p>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!selectedFile || loading}
          className="btn-upload"
        >
          {loading ? 'Processing...' : 'Upload & Detect PPE'}
        </button>
      </div>
    </div>
  );
}

export default Upload;
