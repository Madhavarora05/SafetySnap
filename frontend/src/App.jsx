import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Upload from './pages/Upload';
import History from './pages/History';
import Result from './pages/Result';
import Analytics from './pages/Analytics';
import './App.css';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <div className="app">
            <div className="navbar">
      <div className="nav-container">
        <h1 className="logo">🛡️ SafetySnap</h1>
        <nav>
          <ul className="nav-links">
            <li><NavLink to="/upload">📤 Upload</NavLink></li>
            <li><NavLink to="/history">📜 History</NavLink></li>
            <li><NavLink to="/analytics">📊 Analytics</NavLink></li>
          </ul>
        </nav>
      </div>
    </div>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Upload />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/history" element={<History />} />
            <Route path="/result/:id" element={<Result />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>&copy; 2025 SafetySnap - PPE Detection System</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
