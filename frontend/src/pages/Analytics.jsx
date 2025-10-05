import { useState, useEffect } from 'react';
import { getImages } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import './Analytics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function Analytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalImages: 0,
    helmetDetections: 0,
    vestDetections: 0,
    personDetections: 0,
    safeImages: 0,
    unsafeImages: 0
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch all images with detections
      const data = await getImages({ limit: 1000 });
      const images = data.images;

      let helmetCount = 0;
      let vestCount = 0;
      let personCount = 0;
      let safeCount = 0;
      let unsafeCount = 0;

      // Process each image to gather statistics
      for (const image of images) {
        // Fetch detailed detection data for each image
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${API_BASE}/images/${image.id}`);
        const imageData = await response.json();

        const hasHelmet = imageData.detections.some(d => d.label === 'helmet');
        const hasVest = imageData.detections.some(d => d.label === 'vest');
        const hasPerson = imageData.detections.some(d => d.label === 'person');

        if (hasHelmet) helmetCount++;
        if (hasVest) vestCount++;
        if (hasPerson) personCount++;

        if (hasHelmet && hasVest) {
          safeCount++;
        } else {
          unsafeCount++;
        }
      }

      setStats({
        totalImages: images.length,
        helmetDetections: helmetCount,
        vestDetections: vestCount,
        personDetections: personCount,
        safeImages: safeCount,
        unsafeImages: unsafeCount
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const ppeDetectionData = {
    labels: ['Helmet', 'Vest', 'Person'],
    datasets: [
      {
        label: 'Detections Count',
        data: [stats.helmetDetections, stats.vestDetections, stats.personDetections],
        backgroundColor: [
          'rgba(72, 187, 120, 0.8)',
          'rgba(237, 137, 54, 0.8)',
          'rgba(66, 153, 225, 0.8)'
        ],
        borderColor: [
          'rgb(72, 187, 120)',
          'rgb(237, 137, 54)',
          'rgb(66, 153, 225)'
        ],
        borderWidth: 2
      }
    ]
  };

  const safetyComplianceData = {
    labels: ['Safety Compliant', 'Safety Issues'],
    datasets: [
      {
        data: [stats.safeImages, stats.unsafeImages],
        backgroundColor: [
          'rgba(72, 187, 120, 0.8)',
          'rgba(245, 101, 101, 0.8)'
        ],
        borderColor: [
          'rgb(72, 187, 120)',
          'rgb(245, 101, 101)'
        ],
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  const complianceRate = stats.totalImages > 0
    ? ((stats.safeImages / stats.totalImages) * 100).toFixed(1)
    : 0;

  return (
    <div className="analytics-page">
      <h1>Safety Analytics Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Images</h3>
            <p className="stat-value">{stats.totalImages}</p>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <h3>Safety Compliant</h3>
            <p className="stat-value">{stats.safeImages}</p>
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-icon">⚠</div>
          <div className="stat-content">
            <h3>Safety Issues</h3>
            <p className="stat-value">{stats.unsafeImages}</p>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">%</div>
          <div className="stat-content">
            <h3>Compliance Rate</h3>
            <p className="stat-value">{complianceRate}%</p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h2>PPE Detection Statistics</h2>
          <div className="chart-container">
            <Bar data={ppeDetectionData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-card">
          <h2>Safety Compliance Overview</h2>
          <div className="chart-container">
            <Pie data={safetyComplianceData} options={chartOptions} />
          </div>
        </div>
      </div>

      <div className="summary-card">
        <h2>Summary</h2>
        <div className="summary-content">
          <div className="summary-item">
            <span className="summary-label">🪖 Helmet Detections:</span>
            <span className="summary-value">{stats.helmetDetections}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">🦺 Vest Detections:</span>
            <span className="summary-value">{stats.vestDetections}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">👤 Person Detections:</span>
            <span className="summary-value">{stats.personDetections}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
