import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getImageById } from '../services/api';
import './Result.css';

function Result() {
  const { id } = useParams();
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchImageData();
  }, [id]);

  const fetchImageData = async () => {
    setLoading(true);
    try {
      const data = await getImageById(id);
      setImageData(data);
    } catch (err) {
      setError('Failed to load image details');
      console.error('Error fetching image:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (imageData && canvasRef.current) {
      drawDetections();
    }
  }, [imageData]);

  const drawDetections = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Draw bounding boxes
      if (imageData.detections && imageData.detections.length > 0) {
        imageData.detections.forEach(detection => {
          const { bbox, label, confidence } = detection;
          
          // Convert normalized coordinates (0-1) to actual pixel coordinates
          const x = bbox.x * img.width;
          const y = bbox.y * img.height;
          const width = bbox.width * img.width;
          const height = bbox.height * img.height;
          
          // Set color based on label
          let color;
          switch (label) {
            case 'helmet':
              color = '#48bb78'; // green
              break;
            case 'vest':
              color = '#ed8936'; // orange
              break;
            case 'person':
              color = '#4299e1'; // blue
              break;
            default:
              color = '#a0aec0'; // gray
          }

          // Draw rectangle
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, width, height);

          // Draw label background
          ctx.fillStyle = color;
          const text = `${label} (${(confidence * 100).toFixed(0)}%)`;
          ctx.font = '14px Arial';
          const textWidth = ctx.measureText(text).width;
          const textHeight = 25;
          
          // Position label above the box, or inside if there's not enough space
          const labelY = y > textHeight ? y - 5 : y + textHeight;
          const labelBgY = y > textHeight ? y - textHeight : y;
          
          ctx.fillRect(x, labelBgY, textWidth + 10, textHeight);

          // Draw label text
          ctx.fillStyle = 'white';
          ctx.fillText(text, x + 5, labelY);
        });
      }
    };

    img.onerror = () => {
      console.error('Failed to load image for canvas drawing');
      console.error('Image path:', `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'}/uploads/${imageData.filename}`);
    };

    img.src = `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'}/uploads/${imageData.filename}`;
  };

  if (loading) {
    return <div className="loading">Loading image details...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error">{error}</p>
        <Link to="/history" className="btn-back">Back to History</Link>
      </div>
    );
  }

  const helmetDetected = imageData.detections.some(d => d.label === 'helmet');
  const vestDetected = imageData.detections.some(d => d.label === 'vest');
  const safetyCompliant = helmetDetected && vestDetected;

  return (
    <div className="result-page">
      <div className="result-header">
        <h1>Detection Results</h1>
        <Link to="/history" className="btn-back">← Back to History</Link>
      </div>

      <div className="result-container">
        <div className="image-section">
          <canvas ref={canvasRef} className="result-canvas" />
          <div className={`safety-status ${safetyCompliant ? 'safe' : 'unsafe'}`}>
            <span className="status-icon">{safetyCompliant ? '✓' : '⚠'}</span>
            <span className="status-text">
              {safetyCompliant ? 'Safety Compliant' : 'Safety Issues Detected'}
            </span>
          </div>
        </div>

        <div className="details-section">
          <div className="info-card">
            <h2>Image Information</h2>
            <div className="info-row">
              <span className="info-label">Filename:</span>
              <span className="info-value">{imageData.filename}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Upload Date:</span>
              <span className="info-value">
                {new Date(imageData.upload_date).toLocaleString()}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Detections:</span>
              <span className="info-value">{imageData.detections.length}</span>
            </div>
          </div>

          <div className="info-card">
            <h2>PPE Detection Details</h2>
            <div className="ppe-status">
              <div className={`ppe-item ${helmetDetected ? 'detected' : 'not-detected'}`}>
                <span className="ppe-icon">🪖</span>
                <span>Helmet: {helmetDetected ? 'Detected' : 'Not Detected'}</span>
              </div>
              <div className={`ppe-item ${vestDetected ? 'detected' : 'not-detected'}`}>
                <span className="ppe-icon">🦺</span>
                <span>Vest: {vestDetected ? 'Detected' : 'Not Detected'}</span>
              </div>
            </div>
          </div>

          <div className="info-card">
            <h2>All Detections</h2>
            <div className="detections-list">
              {imageData.detections.map((detection, index) => (
                <div key={index} className="detection-item">
                  <span className={`detection-label label-${detection.label}`}>
                    {detection.label}
                  </span>
                  <span className="detection-confidence">
                    {(detection.confidence * 100).toFixed(1)}% confidence
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Result;
