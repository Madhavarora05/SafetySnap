import express from 'express';
import db from '../database.js';

const router = express.Router();

// GET /api/labels - Get all available labels
router.get('/', (req, res) => {
  db.all('SELECT * FROM labels ORDER BY name', (err, labels) => {
    if (err) {
      console.error('Error fetching labels:', err);
      return res.status(500).json({ error: 'Failed to fetch labels' });
    }

    res.json({ labels });
  });
});

export default router;
