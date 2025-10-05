import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import db from '../database.js';
import { detectPPE, generateDetectionHash } from '../detection.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/jpg').split(',');
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG and PNG images are allowed.'));
    }
  }
});

// Generate file hash for duplicate detection
function generateFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(fileBuffer).digest('hex');
}

// POST /api/images - Upload image and detect PPE (with idempotency support)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: { 
          code: 'FIELD_REQUIRED', 
          field: 'image', 
          message: 'Image file is required' 
        } 
      });
    }

    const { filename, path: filepath } = req.file;
    const fileHash = generateFileHash(filepath);
    const idempotencyKey = req.headers['idempotency-key'];

    // Check for idempotency key if provided
    if (idempotencyKey) {
      const existingRequest = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM images WHERE idempotency_key = ?', [idempotencyKey], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (existingRequest) {
        // Delete the newly uploaded duplicate file
        fs.unlinkSync(filepath);
        
        // Return existing result
        const existingDetections = await new Promise((resolve, reject) => {
          db.all('SELECT * FROM detections WHERE image_id = ?', [existingRequest.id], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });

        return res.status(200).json({
          id: existingRequest.id,
          filename: existingRequest.filename,
          detections_hash: existingRequest.detections_hash,
          detections: existingDetections.map(d => ({
            label: d.label,
            confidence: parseFloat(d.confidence).toFixed(2),
            bbox: {
              x: d.bbox_x,
              y: d.bbox_y,
              width: d.bbox_width,
              height: d.bbox_height
            }
          })),
          message: 'Idempotent request - returning existing results'
        });
      }
    }

    // Check for duplicate file
    const existingImage = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM images WHERE file_hash = ?', [fileHash], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingImage) {
      // Delete the newly uploaded duplicate file
      fs.unlinkSync(filepath);
      
      // Return existing image data
      const existingDetections = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM detections WHERE image_id = ?', [existingImage.id], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      return res.status(200).json({
        id: existingImage.id,
        filename: existingImage.filename,
        detections_hash: existingImage.detections_hash,
        detections: existingDetections.map(d => ({
          label: d.label,
          confidence: parseFloat(d.confidence).toFixed(2),
          bbox: {
            x: d.bbox_x,
            y: d.bbox_y,
            width: d.bbox_width,
            height: d.bbox_height
          }
        })),
        message: 'Duplicate file detected, returning existing results'
      });
    }

    const imageId = uuidv4();

    // Perform PPE detection
    const detections = await detectPPE(filepath);
    const detectionsHash = generateDetectionHash(detections);

    // Insert image record with hashes and idempotency key
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO images (id, filename, filepath, processed, detections_hash, file_hash, idempotency_key) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [imageId, filename, filepath, 1, detectionsHash, fileHash, idempotencyKey],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Insert detections with normalized bbox values (0-1)
    const insertDetection = db.prepare(
      'INSERT INTO detections (image_id, label, confidence, bbox_x, bbox_y, bbox_width, bbox_height) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    for (const detection of detections) {
      await new Promise((resolve, reject) => {
        insertDetection.run(
          [
            imageId,
            detection.label,
            detection.confidence,
            detection.bbox.x,
            detection.bbox.y,
            detection.bbox.width,
            detection.bbox.height
          ],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    insertDetection.finalize();

    res.status(201).json({
      id: imageId,
      filename,
      detections_hash: detectionsHash,
      detections: detections.map(d => ({
        label: d.label,
        confidence: parseFloat(d.confidence).toFixed(2),
        bbox: d.bbox // Already normalized (0-1)
      })),
      message: 'Image uploaded and processed successfully'
    });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ 
      error: { 
        code: 'PROCESSING_ERROR', 
        message: 'Failed to process image', 
        details: error.message 
      } 
    });
  }
});

// GET /api/images - List images with filters and pagination
router.get('/', (req, res) => {
  const { label, from, to, limit = 10, offset = 0 } = req.query;
  const parsedLimit = parseInt(limit);
  const parsedOffset = parseInt(offset);

  let query = `
    SELECT DISTINCT i.id, i.filename, i.filepath, i.upload_date, i.processed, i.detections_hash,
           COUNT(d.id) as detection_count
    FROM images i
    LEFT JOIN detections d ON i.id = d.image_id
  `;

  const conditions = [];
  const params = [];

  if (label) {
    conditions.push('d.label = ?');
    params.push(label);
  }

  if (from) {
    conditions.push('DATE(i.upload_date) >= DATE(?)');
    params.push(from);
  }

  if (to) {
    conditions.push('DATE(i.upload_date) <= DATE(?)');
    params.push(to);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' GROUP BY i.id ORDER BY i.upload_date DESC LIMIT ? OFFSET ?';
  params.push(parsedLimit, parsedOffset);

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching images:', err);
      return res.status(500).json({ error: 'Failed to fetch images' });
    }

    // Get total count
    let countQuery = 'SELECT COUNT(DISTINCT i.id) as total FROM images i LEFT JOIN detections d ON i.id = d.image_id';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }

    db.get(countQuery, params.slice(0, -2), (err, countRow) => {
      if (err) {
        console.error('Error counting images:', err);
        return res.status(500).json({ error: 'Failed to count images' });
      }

      res.json({
        images: rows,
        total: countRow.total,
        limit: parsedLimit,
        offset: parsedOffset
      });
    });
  });
});

// GET /api/images/:id - Get image detection details
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM images WHERE id = ?', [id], (err, image) => {
    if (err) {
      console.error('Error fetching image:', err);
      return res.status(500).json({ error: 'Failed to fetch image' });
    }

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    db.all('SELECT * FROM detections WHERE image_id = ?', [id], (err, detections) => {
      if (err) {
        console.error('Error fetching detections:', err);
        return res.status(500).json({ error: 'Failed to fetch detections' });
      }

      res.json({
        ...image,
        detections: detections.map(d => ({
          id: d.id,
          label: d.label,
          confidence: d.confidence.toFixed(2),
          bbox: {
            x: d.bbox_x,
            y: d.bbox_y,
            width: d.bbox_width,
            height: d.bbox_height
          }
        }))
      });
    });
  });
});

// DELETE /api/images/:id - Delete an image
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT filepath FROM images WHERE id = ?', [id], (err, image) => {
    if (err) {
      console.error('Error fetching image:', err);
      return res.status(500).json({ error: 'Failed to fetch image' });
    }

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete file from disk
    if (fs.existsSync(image.filepath)) {
      fs.unlinkSync(image.filepath);
    }

    // Delete from database (detections will be deleted due to CASCADE)
    db.run('DELETE FROM images WHERE id = ?', [id], (err) => {
      if (err) {
        console.error('Error deleting image:', err);
        return res.status(500).json({ error: 'Failed to delete image' });
      }

      res.json({ message: 'Image deleted successfully' });
    });
  });
});

export default router;
