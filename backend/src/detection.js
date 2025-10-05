import sharp from 'sharp';
import fs from 'fs';
import crypto from 'crypto';
import { createCanvas, loadImage } from 'canvas';

/**
 * Advanced PPE Detection Service
 * Precise detection for helmets, vests, and full PPE kits
 * Supports green, yellow, dark blue helmets and high-visibility vests
 */

// PPE Color definitions based on safety standards
const PPE_COLORS = {
  helmet: {
    green: { r: [20, 120], g: [80, 180], b: [20, 100] },      // Safety green
    yellow: { r: [180, 255], g: [180, 255], b: [0, 100] },    // High-vis yellow
    darkBlue: { r: [0, 80], g: [0, 80], b: [80, 180] },       // Navy/dark blue
    orange: { r: [200, 255], g: [100, 180], b: [0, 80] }      // Safety orange
  },
  vest: {
    highVis: { r: [150, 255], g: [150, 255], b: [0, 120] },   // High-visibility yellow/green
    reflective: { saturation: [0, 0.3], brightness: [0.7, 1.0] } // Reflective strips
  }
};

// Get image dimensions and metadata
async function getImageInfo(imagePath) {
  const image = sharp(imagePath);
  const metadata = await image.metadata();
  return { 
    width: metadata.width, 
    height: metadata.height,
    channels: metadata.channels,
    hasAlpha: metadata.hasAlpha
  };
}

// Main PPE detection function
async function analyzeImageForPPE(imagePath) {
  try {
    const { width, height } = await getImageInfo(imagePath);
    const detections = await detectPPEObjects(imagePath, width, height);
    
    // Analyze detection results
    const hasHelmet = detections.some(d => d.label === 'helmet');
    const hasVest = detections.some(d => d.label === 'vest');
    const hasPerson = detections.some(d => d.label === 'person');
    const hasFullPPE = hasHelmet && hasVest;
    
    return { 
      hasHelmet, 
      hasHighVisVest: hasVest, 
      hasFullPPE,
      hasPerson,
      detections,
      confidence: {
        helmet: hasHelmet ? Math.max(...detections.filter(d => d.label === 'helmet').map(d => d.confidence)) : 0,
        vest: hasVest ? Math.max(...detections.filter(d => d.label === 'vest').map(d => d.confidence)) : 0,
        person: hasPerson ? Math.max(...detections.filter(d => d.label === 'person').map(d => d.confidence)) : 0
      },
      width, 
      height 
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    return { 
      hasHelmet: false, 
      hasHighVisVest: false, 
      hasFullPPE: false,
      hasPerson: false,
      detections: [],
      confidence: { helmet: 0, vest: 0, person: 0 },
      width: 800, 
      height: 600 
    };
  }
}

// Advanced PPE object detection
async function detectPPEObjects(imagePath, width, height) {
  const detections = [];
  
  try {
    const img = await loadImage(imagePath);
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    
    const imageData = ctx.getImageData(0, 0, width, height);
    
    // Detect person first to establish context
    const personDetections = await detectPerson(imageData, width, height);
    detections.push(...personDetections);
    
    // Detect helmets with precise color and shape analysis
    const helmetDetections = await detectHelmets(imageData, width, height);
    detections.push(...helmetDetections);
    
    // Detect high-visibility vests
    const vestDetections = await detectVests(imageData, width, height);
    detections.push(...vestDetections);
    
    // Detect full PPE kits (protective suits with caps)
    const fullPPEDetections = await detectFullPPE(imageData, width, height);
    detections.push(...fullPPEDetections);
    
    return filterAndMergeDetections(detections);
    
  } catch (error) {
    console.error('Error in PPE detection:', error);
    return [];
  }
}

// Detect person in image using body shape and skin tone analysis
async function detectPerson(imageData, width, height) {
  const detections = [];
  const data = imageData.data;
  
  // Look for human-like proportions and skin tones
  const personRegions = findPersonRegions(data, width, height);
  
  for (const region of personRegions) {
    if (region.confidence > 0.6) {
      detections.push({
        label: 'person',
        confidence: region.confidence,
        bbox: {
          x: region.x / width,
          y: region.y / height,
          width: region.width / width,
          height: region.height / height
        }
      });
    }
  }
  
  return detections;
}

// Precise helmet detection for safety colors
async function detectHelmets(imageData, width, height) {
  const detections = [];
  const data = imageData.data;
  
  // Focus on upper portion of image where helmets are typically located
  const searchHeight = Math.floor(height * 0.5);
  const blockSize = 32;
  const stride = 16;
  
  for (let y = 0; y < searchHeight; y += stride) {
    for (let x = 0; x < width - blockSize; x += stride) {
      const region = extractImageRegion(data, width, height, x, y, blockSize, blockSize);
      const helmetAnalysis = analyzeHelmetRegion(region, blockSize);
      
      if (helmetAnalysis.isHelmet && helmetAnalysis.confidence > 0.7) {
        // Refine bounding box
        const refinedBounds = refineHelmetBounds(data, width, height, x, y, blockSize);
        
        detections.push({
          label: 'helmet',
          confidence: helmetAnalysis.confidence,
          color: helmetAnalysis.color,
          bbox: {
            x: refinedBounds.x / width,
            y: refinedBounds.y / height,
            width: refinedBounds.width / width,
            height: refinedBounds.height / height
          }
        });
      }
    }
  }
  
  return mergeOverlappingDetections(detections, 0.3);
}

// Detect high-visibility vests
async function detectVests(imageData, width, height) {
  const detections = [];
  const data = imageData.data;
  
  // Focus on torso area where vests are worn
  const searchStartY = Math.floor(height * 0.2);
  const searchHeight = Math.floor(height * 0.6);
  const blockSize = 48;
  const stride = 24;
  
  for (let y = searchStartY; y < searchStartY + searchHeight; y += stride) {
    for (let x = 0; x < width - blockSize; x += stride) {
      const region = extractImageRegion(data, width, height, x, y, blockSize, blockSize);
      const vestAnalysis = analyzeVestRegion(region, blockSize);
      
      if (vestAnalysis.isVest && vestAnalysis.confidence > 0.65) {
        const refinedBounds = refineVestBounds(data, width, height, x, y, blockSize);
        
        detections.push({
          label: 'vest',
          confidence: vestAnalysis.confidence,
          color: vestAnalysis.color,
          bbox: {
            x: refinedBounds.x / width,
            y: refinedBounds.y / height,
            width: refinedBounds.width / width,
            height: refinedBounds.height / height
          }
        });
      }
    }
  }
  
  return mergeOverlappingDetections(detections, 0.4);
}

// Detect full PPE kits (protective suits with integrated caps)
async function detectFullPPE(imageData, width, height) {
  const detections = [];
  const data = imageData.data;
  
  // Look for full-body coverage patterns typical of PPE suits
  const fullBodyRegions = findFullBodyPPE(data, width, height);
  
  for (const region of fullBodyRegions) {
    if (region.confidence > 0.7) {
      // Check if it has both helmet/cap and vest components
      const hasHeadCovering = region.hasHeadCovering;
      const hasBodyCovering = region.hasBodyCovering;
      
      if (hasHeadCovering && hasBodyCovering) {
        // Add both helmet and vest detections for full PPE
        detections.push({
          label: 'helmet',
          confidence: region.headConfidence,
          bbox: region.headBbox
        });
        
        detections.push({
          label: 'vest',
          confidence: region.bodyConfidence,
          bbox: region.bodyBbox
        });
      }
    }
  }
  
  return detections;
}

// Analyze region for helmet characteristics
function analyzeHelmetRegion(regionPixels, blockSize) {
  if (!regionPixels || regionPixels.length === 0) {
    return { isHelmet: false, confidence: 0 };
  }
  
  const colorAnalysis = analyzeColors(regionPixels);
  const shapeAnalysis = analyzeShape(regionPixels, blockSize);
  
  let confidence = 0;
  let detectedColor = 'unknown';
  
  // Check for helmet colors
  for (const [colorName, colorRange] of Object.entries(PPE_COLORS.helmet)) {
    if (isColorInRange(colorAnalysis.dominant, colorRange)) {
      confidence += 0.4;
      detectedColor = colorName;
      break;
    }
  }
  
  // Check for helmet-like shape (rounded, solid)
  if (shapeAnalysis.roundness > 0.6) confidence += 0.3;
  if (shapeAnalysis.uniformity > 0.7) confidence += 0.2;
  if (shapeAnalysis.edgeDensity > 0.5) confidence += 0.1;
  
  return {
    isHelmet: confidence > 0.7,
    confidence: Math.min(confidence, 0.95),
    color: detectedColor
  };
}

// Analyze region for vest characteristics
function analyzeVestRegion(regionPixels, blockSize) {
  if (!regionPixels || regionPixels.length === 0) {
    return { isVest: false, confidence: 0 };
  }
  
  const colorAnalysis = analyzeColors(regionPixels);
  const patternAnalysis = analyzePattern(regionPixels, blockSize);
  
  let confidence = 0;
  let detectedColor = 'unknown';
  
  // Check for high-visibility colors
  if (isColorInRange(colorAnalysis.dominant, PPE_COLORS.vest.highVis)) {
    confidence += 0.4;
    detectedColor = 'high-vis';
  }
  
  // Check for reflective stripes pattern
  if (patternAnalysis.hasReflectiveStripes) confidence += 0.3;
  if (patternAnalysis.hasHorizontalStripes) confidence += 0.2;
  if (colorAnalysis.brightness > 0.6) confidence += 0.1;
  
  return {
    isVest: confidence > 0.65,
    confidence: Math.min(confidence, 0.95),
    color: detectedColor
  };
}

// Extract image region for analysis
function extractImageRegion(data, width, height, x, y, w, h) {
  const pixels = [];
  const endX = Math.min(x + w, width);
  const endY = Math.min(y + h, height);
  
  for (let py = y; py < endY; py++) {
    for (let px = x; px < endX; px++) {
      const idx = (py * width + px) * 4;
      if (idx + 3 < data.length) {
        pixels.push({
          r: data[idx],
          g: data[idx + 1],
          b: data[idx + 2],
          a: data[idx + 3]
        });
      }
    }
  }
  
  return pixels;
}

// Analyze colors in a pixel region
function analyzeColors(pixels) {
  if (pixels.length === 0) return { dominant: { r: 0, g: 0, b: 0 }, brightness: 0 };
  
  let totalR = 0, totalG = 0, totalB = 0;
  let brightness = 0;
  
  for (const pixel of pixels) {
    totalR += pixel.r;
    totalG += pixel.g;
    totalB += pixel.b;
    brightness += (pixel.r + pixel.g + pixel.b) / 3;
  }
  
  const count = pixels.length;
  return {
    dominant: {
      r: Math.round(totalR / count),
      g: Math.round(totalG / count),
      b: Math.round(totalB / count)
    },
    brightness: brightness / count / 255
  };
}

// Analyze shape characteristics
function analyzeShape(pixels, blockSize) {
  // Simplified shape analysis
  const nonZeroPixels = pixels.filter(p => p.r + p.g + p.b > 30);
  const coverage = nonZeroPixels.length / pixels.length;
  
  // Basic roundness estimation
  const centerPixels = pixels.slice(
    Math.floor(pixels.length * 0.3), 
    Math.floor(pixels.length * 0.7)
  );
  const centerCoverage = centerPixels.filter(p => p.r + p.g + p.b > 30).length / centerPixels.length;
  
  return {
    roundness: centerCoverage > coverage * 0.8 ? 0.8 : 0.4,
    uniformity: coverage,
    edgeDensity: coverage > 0.6 ? 0.7 : 0.3
  };
}

// Analyze pattern characteristics for vests
function analyzePattern(pixels, blockSize) {
  // Look for reflective stripe patterns
  const rows = [];
  const pixelsPerRow = Math.sqrt(pixels.length);
  
  for (let i = 0; i < pixels.length; i += pixelsPerRow) {
    const row = pixels.slice(i, i + pixelsPerRow);
    const avgBrightness = row.reduce((sum, p) => sum + (p.r + p.g + p.b) / 3, 0) / row.length;
    rows.push(avgBrightness);
  }
  
  // Detect alternating bright/dark patterns (reflective stripes)
  let stripePatterns = 0;
  for (let i = 1; i < rows.length - 1; i++) {
    if (rows[i] > rows[i-1] + 50 && rows[i] > rows[i+1] + 50) {
      stripePatterns++;
    }
  }
  
  return {
    hasReflectiveStripes: stripePatterns >= 2,
    hasHorizontalStripes: stripePatterns >= 1,
    stripeCount: stripePatterns
  };
}

// Check if color is within specified range
function isColorInRange(color, range) {
  return color.r >= range.r[0] && color.r <= range.r[1] &&
         color.g >= range.g[0] && color.g <= range.g[1] &&
         color.b >= range.b[0] && color.b <= range.b[1];
}

// Find person regions using basic body detection
function findPersonRegions(data, width, height) {
  // Simplified person detection - look for skin tones and human proportions
  const regions = [];
  const blockSize = 64;
  const stride = 32;
  
  for (let y = 0; y < height - blockSize; y += stride) {
    for (let x = 0; x < width - blockSize; x += stride) {
      const region = extractImageRegion(data, width, height, x, y, blockSize, blockSize);
      const skinToneScore = analyzeSkinTone(region);
      
      if (skinToneScore > 0.6) {
        regions.push({
          x, y, width: blockSize, height: blockSize,
          confidence: skinToneScore
        });
      }
    }
  }
  
  return regions;
}

// Analyze for skin tone presence
function analyzeSkinTone(pixels) {
  if (pixels.length === 0) return 0;
  
  let skinPixels = 0;
  for (const pixel of pixels) {
    // Basic skin tone detection (simplified)
    if (pixel.r > 95 && pixel.g > 40 && pixel.b > 20 &&
        pixel.r > pixel.g && pixel.r > pixel.b &&
        pixel.r - pixel.g > 15) {
      skinPixels++;
    }
  }
  
  return skinPixels / pixels.length;
}

// Find full body PPE patterns
function findFullBodyPPE(data, width, height) {
  const regions = [];
  
  // Look for large uniform colored regions that might be protective suits
  const largeBlockSize = 96;
  const stride = 48;
  
  for (let y = 0; y < height - largeBlockSize; y += stride) {
    for (let x = 0; x < width - largeBlockSize; x += stride) {
      const region = extractImageRegion(data, width, height, x, y, largeBlockSize, largeBlockSize);
      const uniformity = analyzeUniformity(region);
      
      if (uniformity.score > 0.7) {
        // Check if it's a PPE suit color (typically blue protective suits)
        const isDarkBlue = isColorInRange(uniformity.color, PPE_COLORS.helmet.darkBlue);
        const isLightBlue = uniformity.color.b > uniformity.color.r && 
                           uniformity.color.b > uniformity.color.g &&
                           uniformity.color.b > 100;
        
        if (isDarkBlue || isLightBlue) {
          regions.push({
            x, y, width: largeBlockSize, height: largeBlockSize,
            confidence: uniformity.score,
            hasHeadCovering: y < height * 0.3,
            hasBodyCovering: y > height * 0.2,
            headConfidence: y < height * 0.3 ? 0.8 : 0.3,
            bodyConfidence: y > height * 0.2 ? 0.8 : 0.3,
            headBbox: {
              x: x / width,
              y: y / height,
              width: largeBlockSize / width,
              height: (largeBlockSize * 0.3) / height
            },
            bodyBbox: {
              x: x / width,
              y: (y + largeBlockSize * 0.3) / height,
              width: largeBlockSize / width,
              height: (largeBlockSize * 0.7) / height
            }
          });
        }
      }
    }
  }
  
  return regions;
}

// Analyze color uniformity in a region
function analyzeUniformity(pixels) {
  if (pixels.length === 0) return { score: 0, color: { r: 0, g: 0, b: 0 } };
  
  const avgColor = analyzeColors(pixels).dominant;
  let variance = 0;
  
  for (const pixel of pixels) {
    const diff = Math.abs(pixel.r - avgColor.r) + 
                 Math.abs(pixel.g - avgColor.g) + 
                 Math.abs(pixel.b - avgColor.b);
    variance += diff;
  }
  
  const avgVariance = variance / pixels.length;
  const uniformityScore = Math.max(0, 1 - avgVariance / 150);
  
  return {
    score: uniformityScore,
    color: avgColor
  };
}

// Refine helmet bounding box
function refineHelmetBounds(data, width, height, x, y, blockSize) {
  // Expand search area slightly
  const expandedSize = Math.floor(blockSize * 1.5);
  const startX = Math.max(0, x - blockSize * 0.25);
  const startY = Math.max(0, y - blockSize * 0.25);
  
  return {
    x: startX,
    y: startY,
    width: Math.min(expandedSize, width - startX),
    height: Math.min(expandedSize, height - startY)
  };
}

// Refine vest bounding box
function refineVestBounds(data, width, height, x, y, blockSize) {
  // Vests are typically wider than they are tall
  const expandedWidth = Math.floor(blockSize * 1.8);
  const expandedHeight = Math.floor(blockSize * 1.2);
  const startX = Math.max(0, x - blockSize * 0.4);
  const startY = Math.max(0, y - blockSize * 0.1);
  
  return {
    x: startX,
    y: startY,
    width: Math.min(expandedWidth, width - startX),
    height: Math.min(expandedHeight, height - startY)
  };
}

// Merge overlapping detections
function mergeOverlappingDetections(detections, overlapThreshold) {
  if (detections.length <= 1) return detections;
  
  const merged = [];
  const used = new Set();
  
  for (let i = 0; i < detections.length; i++) {
    if (used.has(i)) continue;
    
    const current = detections[i];
    const overlapping = [current];
    used.add(i);
    
    for (let j = i + 1; j < detections.length; j++) {
      if (used.has(j)) continue;
      
      const overlap = calculateOverlap(current.bbox, detections[j].bbox);
      if (overlap > overlapThreshold && current.label === detections[j].label) {
        overlapping.push(detections[j]);
        used.add(j);
      }
    }
    
    // Merge overlapping detections
    if (overlapping.length > 1) {
      const bestDetection = overlapping.reduce((best, det) => 
        det.confidence > best.confidence ? det : best
      );
      merged.push(bestDetection);
    } else {
      merged.push(current);
    }
  }
  
  return merged;
}

// Calculate bounding box overlap
function calculateOverlap(bbox1, bbox2) {
  const x1 = Math.max(bbox1.x, bbox2.x);
  const y1 = Math.max(bbox1.y, bbox2.y);
  const x2 = Math.min(bbox1.x + bbox1.width, bbox2.x + bbox2.width);
  const y2 = Math.min(bbox1.y + bbox1.height, bbox2.y + bbox2.height);
  
  if (x2 <= x1 || y2 <= y1) return 0;
  
  const intersection = (x2 - x1) * (y2 - y1);
  const area1 = bbox1.width * bbox1.height;
  const area2 = bbox2.width * bbox2.height;
  const union = area1 + area2 - intersection;
  
  return intersection / union;
}

// Filter and merge all detections
function filterAndMergeDetections(detections) {
  // Remove low confidence detections
  const filtered = detections.filter(d => d.confidence > 0.6);
  
  // Group by label and merge overlapping
  const byLabel = {};
  for (const detection of filtered) {
    if (!byLabel[detection.label]) byLabel[detection.label] = [];
    byLabel[detection.label].push(detection);
  }
  
  const merged = [];
  for (const [label, labelDetections] of Object.entries(byLabel)) {
    const mergedForLabel = mergeOverlappingDetections(labelDetections, 0.3);
    merged.push(...mergedForLabel);
  }
  
  return merged.sort((a, b) => b.confidence - a.confidence);
}

// Generate detection hash for caching
export function generateDetectionHash(detections) {
  const hashData = detections.map(d => ({
    label: d.label,
    confidence: d.confidence.toFixed(2),
    bbox: {
      x: d.bbox.x.toFixed(3),
      y: d.bbox.y.toFixed(3),
      width: d.bbox.width.toFixed(3),
      height: d.bbox.height.toFixed(3)
    }
  }));
  
  return crypto.createHash('md5').update(JSON.stringify(hashData)).digest('hex');
}

// Main export function
export async function detectPPE(imagePath) {
  const analysis = await analyzeImageForPPE(imagePath);
  return analysis.detections;
}

export { analyzeImageForPPE };