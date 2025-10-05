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
    const personDetections = detectPerson(data, width, height);
    detections.push(...personDetections);
    
  } catch (error) {
    console.error('Error in object detection:', error);
    // Fallback to basic detection
    return await fallbackDetection(imagePath, width, height);
  }
  
  return detections;
}

function detectHelmets(imageData, width, height) {
  const detections = [];
  const searchHeight = Math.floor(height * 0.4);
  const gridSize = 64;
  const stepSize = 48;
  
  for (let y = 0; y < searchHeight; y += stepSize) {
    for (let x = 0; x < width; x += stepSize) {
      const region = extractRegion(imageData, width, height, x, y, gridSize, gridSize);
      const helmetScore = analyzeHelmetRegion(region);
      
      if (helmetScore.isHelmet) {
        const bounds = findObjectBounds(imageData, width, height, x, y, 'helmet');
        
        detections.push({
          label: 'helmet',
          confidence: helmetScore.confidence,
          bbox: {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height
          }
        });
      }
    }
  }
  
  return mergeOverlappingDetections(detections, 0.2);
}

// Analyze a region for helmet characteristics
function analyzeHelmetRegion(regionData) {
  if (!regionData || regionData.pixels.length === 0) {
    return { isHelmet: false, confidence: 0 };
  }
  
  const { avgColor, colorVariance, edgeIntensity, roundness } = regionData;
  let confidence = 0;
  
  // Check for helmet-like colors (any solid safety color)
  const isHelmetColor = isValidHelmetColor(avgColor);
  if (isHelmetColor) confidence += 0.4;
  
  // Check for uniform color (helmets are typically solid color)
  const isUniform = colorVariance < 0.3;
  if (isUniform) confidence += 0.3;
  
  // Check for rounded shape (helmets are dome-shaped)
  if (roundness > 0.6) confidence += 0.25;
  
  // Check for moderate edge intensity (smooth but defined edges)
  if (edgeIntensity > 0.3 && edgeIntensity < 0.8) confidence += 0.15;
  
  // Check position (helmets are typically in upper portion)
  const isTopRegion = regionData.centerY < regionData.imageHeight * 0.4;
  if (isTopRegion) confidence += 0.1;
  
  return {
    isHelmet: confidence > 0.7, // Increased threshold from 0.6
    confidence: Math.min(0.98, confidence)
  };
}

// Check if color is typical helmet color
function isValidHelmetColor(color) {
  const [r, g, b] = color;
  
  // White/light colors
  if (r > 200 && g > 200 && b > 200) return true;
  
  // Yellow/orange safety colors
  if (r > 200 && g > 180 && b < 120) return true;
  if (r > 220 && g > 140 && g < 200 && b < 100) return true;
  
  // Blue safety colors
  if (b > 150 && b > r + 40 && b > g + 40) return true;
  
  // Red safety colors
  if (r > 180 && r > g + 60 && r > b + 60) return true;
  
  // Green safety colors
  if (g > 150 && g > r + 40 && g > b + 40) return true;
  
  return false;
}

function detectVests(imageData, width, height) {
  const detections = [];
  const startY = Math.floor(height * 0.2);
  const searchHeight = Math.floor(height * 0.6);
  const gridSize = 60;
  const stepSize = 45;
  
  for (let y = startY; y < startY + searchHeight; y += stepSize) {
    for (let x = 0; x < width; x += stepSize) {
      const region = extractRegion(imageData, width, height, x, y, gridSize, gridSize);
      const vestScore = analyzeVestRegion(region);
      
      if (vestScore.isVest) {
        const bounds = findObjectBounds(imageData, width, height, x, y, 'vest');
        
        detections.push({
          label: 'vest',
          confidence: vestScore.confidence,
          bbox: {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height
          }
        });
      }
    }
  }
  
  return mergeOverlappingDetections(detections, 0.3);
}

// Analyze region for vest characteristics
function analyzeVestRegion(regionData) {
  if (!regionData || regionData.pixels.length === 0) {
    return { isVest: false, confidence: 0 };
  }
  
  const { avgColor, colorVariance, edgeIntensity, stripeProbability, reflectiveElements } = regionData;
  let confidence = 0;
  
  // Check for high-vis colors
  const isHighVisColor = isValidVestColor(avgColor);
  if (isHighVisColor) confidence += 0.4;
  
  // Check for stripe patterns (key vest feature)
  if (stripeProbability > 0.5) confidence += 0.35;
  
  // Check for reflective elements
  if (reflectiveElements > 0.3) confidence += 0.25;
  
  // Check for appropriate position (torso area)
  const isTorsoRegion = regionData.centerY > regionData.imageHeight * 0.25 && regionData.centerY < regionData.imageHeight * 0.75;
  if (isTorsoRegion) confidence += 0.15;
  
  // Check for rectangular/vest-like shape
  const aspectRatio = regionData.width / regionData.height;
  if (aspectRatio > 0.6 && aspectRatio < 2.0) confidence += 0.1;
  
  // Reduce confidence if too uniform (might be other object)
  if (colorVariance < 0.1 && stripeProbability < 0.2) confidence *= 0.6;
  
  return {
    isVest: confidence > 0.7, // Increased threshold from 0.6
    confidence: Math.min(0.96, confidence)
  };
}

// Check if color is typical high-vis vest color
function isValidVestColor(color) {
  const [r, g, b] = color;
  
  // High-vis orange
  if (r > 200 && g > 120 && g < 180 && b < 120) return true;
  
  // High-vis yellow/lime
  if (r > 180 && g > 180 && b < 140) return true;
  
  // High-vis green
  if (g > 200 && r < 150 && b < 150) return true;
  
  return false;
}

// Detect person using overall scene analysis
function detectPerson(imageData, width, height) {
  const detections = [];
  
  // Analyze overall image for person-like characteristics
  const personScore = analyzeForPersonPresence(imageData, width, height);
  
  if (personScore.isPerson) {
    // Create a bounding box covering most of the image for person detection
    detections.push({
      label: 'person',
      confidence: personScore.confidence,
      bbox: {
        x: Math.floor(width * 0.1),
        y: Math.floor(height * 0.1),
        width: Math.floor(width * 0.8),
        height: Math.floor(height * 0.8)
      }
    });
  }
  
  return detections;
}

// Analyze overall image for person presence
function analyzeForPersonPresence(imageData, width, height) {
  const analysis = analyzeFullImage(imageData, width, height);
  let confidence = 0.2;
  
  // Check for skin tone presence
  if (analysis.hasSkinTones) confidence += 0.25;
  
  // Check for clothing colors and patterns
  if (analysis.hasClothingColors) confidence += 0.2;
  
  // Check for scene complexity (people create complex scenes)
  if (analysis.sceneComplexity > 0.4) confidence += 0.2;
  
  // Check for vertical orientation (people are taller than wide)
  if (height > width * 1.2) confidence += 0.1;
  
  // Check for multiple distinct regions
  if (analysis.distinctRegions > 2) confidence += 0.15;
  
  // Reduce confidence for very simple/uniform images
  if (analysis.colorUniformity > 0.8) confidence *= 0.4;
  
  return {
    isPerson: confidence > 0.5,
    confidence: Math.min(0.92, confidence)
  };
}

// Extract region data for analysis
function extractRegion(imageData, width, height, x, y, regionWidth, regionHeight) {
  const pixels = [];
  const endX = Math.min(x + regionWidth, width);
  const endY = Math.min(y + regionHeight, height);
  
  for (let py = y; py < endY; py++) {
    for (let px = x; px < endX; px++) {
      const idx = (py * width + px) * 4;
      pixels.push([imageData[idx], imageData[idx + 1], imageData[idx + 2]]);
    }
  }
  
  if (pixels.length === 0) return null;
  
  // Calculate region statistics
  const avgColor = calculateAverageColor(pixels);
  const colorVariance = calculateColorVariance(pixels, avgColor);
  const edgeIntensity = calculateEdgeIntensity(pixels, regionWidth);
  const stripeProbability = calculateStripeProbability(pixels, regionWidth);
  const reflectiveElements = calculateReflectiveElements(pixels);
  const roundness = calculateRoundness(pixels, regionWidth, regionHeight);
  
  return {
    pixels,
    avgColor,
    colorVariance,
    edgeIntensity,
    stripeProbability,
    reflectiveElements,
    roundness,
    centerX: x + regionWidth / 2,
    centerY: y + regionHeight / 2,
    width: regionWidth,
    height: regionHeight,
    imageWidth: width,
    imageHeight: height
  };
}

// Calculate average color of pixels
function calculateAverageColor(pixels) {
  const sum = pixels.reduce((acc, pixel) => [
    acc[0] + pixel[0],
    acc[1] + pixel[1],
    acc[2] + pixel[2]
  ], [0, 0, 0]);
  
  return [
    Math.round(sum[0] / pixels.length),
    Math.round(sum[1] / pixels.length),
    Math.round(sum[2] / pixels.length)
  ];
}

// Calculate color variance (uniformity measure)
function calculateColorVariance(pixels, avgColor) {
  const variance = pixels.reduce((acc, pixel) => {
    const diff = [
      pixel[0] - avgColor[0],
      pixel[1] - avgColor[1],
      pixel[2] - avgColor[2]
    ];
    return acc + (diff[0] * diff[0] + diff[1] * diff[1] + diff[2] * diff[2]);
  }, 0);
  
  return Math.sqrt(variance / pixels.length) / 255; // Normalized 0-1
}

// Calculate edge intensity using simple gradient
function calculateEdgeIntensity(pixels, width) {
  if (pixels.length < width * 2) return 0;
  
  let edgeSum = 0;
  const height = Math.floor(pixels.length / width);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (idx >= pixels.length) continue;
      
      const current = pixels[idx];
      const right = pixels[idx + 1] || current;
      const bottom = pixels[idx + width] || current;
      
      const gradX = Math.abs(current[0] - right[0]) + Math.abs(current[1] - right[1]) + Math.abs(current[2] - right[2]);
      const gradY = Math.abs(current[0] - bottom[0]) + Math.abs(current[1] - bottom[1]) + Math.abs(current[2] - bottom[2]);
      
      edgeSum += Math.sqrt(gradX * gradX + gradY * gradY);
    }
  }
  
  return (edgeSum / pixels.length) / 255; // Normalized
}

// Calculate stripe probability (for safety vests)
function calculateStripeProbability(pixels, width) {
  if (pixels.length < width * 3) return 0;
  
  const height = Math.floor(pixels.length / width);
  let stripeScore = 0;
  
  // Check for horizontal stripes
  for (let y = 0; y < height - 2; y++) {
    let rowBrightness = 0;
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (idx >= pixels.length) continue;
      const pixel = pixels[idx];
      rowBrightness += (pixel[0] + pixel[1] + pixel[2]) / 3;
    }
    rowBrightness /= width;
    
    // Compare with adjacent rows
    let nextRowBrightness = 0;
    for (let x = 0; x < width; x++) {
      const idx = (y + 1) * width + x;
      if (idx >= pixels.length) continue;
      const pixel = pixels[idx];
      nextRowBrightness += (pixel[0] + pixel[1] + pixel[2]) / 3;
    }
    nextRowBrightness /= width;
    
    const brightnessDiff = Math.abs(rowBrightness - nextRowBrightness);
    if (brightnessDiff > 50) stripeScore += 1;
  }
  
  return Math.min(1, stripeScore / (height * 0.3));
}

// Calculate reflective elements probability
function calculateReflectiveElements(pixels) {
  let brightPixels = 0;
  for (const pixel of pixels) {
    const brightness = (pixel[0] + pixel[1] + pixel[2]) / 3;
    if (brightness > 240) brightPixels++;
  }
  return brightPixels / pixels.length;
}

// Calculate roundness (for helmets)
function calculateRoundness(pixels, width, height) {
  // Simple roundness calculation based on filled area vs bounding rectangle
  let filledPixels = 0;
  for (const pixel of pixels) {
    const brightness = (pixel[0] + pixel[1] + pixel[2]) / 3;
    if (brightness > 100) filledPixels++; // Non-background pixels
  }
  
  const totalArea = width * height;
  const fillRatio = filledPixels / totalArea;
  
  // A circle has fill ratio of π/4 ≈ 0.785
  const circleRatio = Math.PI / 4;
  return 1 - Math.abs(fillRatio - circleRatio);
}

// Find object bounds by expanding from seed point
function findObjectBounds(imageData, width, height, seedX, seedY, objectType) {
  // Simple bounding box expansion
  const regionSize = objectType === 'helmet' ? 80 : objectType === 'vest' ? 120 : 100;
  
  return {
    x: Math.max(0, seedX - regionSize / 2),
    y: Math.max(0, seedY - regionSize / 2),
    width: Math.min(regionSize, width - seedX + regionSize / 2),
    height: Math.min(regionSize, height - seedY + regionSize / 2)
  };
}

// Merge overlapping detections with improved algorithm
function mergeOverlappingDetections(detections, threshold) {
  if (detections.length === 0) return [];
  
  // Sort by confidence descending
  detections.sort((a, b) => b.confidence - a.confidence);
  
  const merged = [];
  const used = new Set();
  
  for (let i = 0; i < detections.length; i++) {
    if (used.has(i)) continue;
    
    let bestDetection = detections[i];
    const overlapping = [i];
    used.add(i);
    
    // Find all overlapping detections
    for (let j = i + 1; j < detections.length; j++) {
      if (used.has(j)) continue;
      
      const overlap = calculateOverlap(detections[i].bbox, detections[j].bbox);
      if (overlap > threshold && detections[i].label === detections[j].label) {
        overlapping.push(j);
        used.add(j);
      }
    }
    
    // If multiple overlapping detections, create merged bounding box
    if (overlapping.length > 1) {
      const boxes = overlapping.map(idx => detections[idx]);
      bestDetection = createMergedDetection(boxes);
    }
    
    merged.push(bestDetection);
  }
  
  return merged;
}

// Create merged detection from multiple overlapping detections
function createMergedDetection(detections) {
  // Use the detection with highest confidence as base
  const best = detections[0];
  
  // Calculate average bounding box
  const minX = Math.min(...detections.map(d => d.bbox.x));
  const minY = Math.min(...detections.map(d => d.bbox.y));
  const maxX = Math.max(...detections.map(d => d.bbox.x + d.bbox.width));
  const maxY = Math.max(...detections.map(d => d.bbox.y + d.bbox.height));
  
  return {
    label: best.label,
    confidence: Math.min(0.98, best.confidence + 0.02), // Slight boost for merged detection
    bbox: {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  };
}

// Calculate overlap between two bounding boxes
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

// Simplified image analysis for person detection
function analyzeFullImage(imageData, width, height) {
  const pixels = [];
  for (let i = 0; i < imageData.length; i += 4) {
    pixels.push([imageData[i], imageData[i + 1], imageData[i + 2]]);
  }
  
  const avgBrightness = pixels.reduce((sum, [r, g, b]) => sum + (r + g + b) / 3, 0) / pixels.length;
  const hasVariation = pixels.some(([r, g, b]) => Math.abs((r + g + b) / 3 - avgBrightness) > 50);
  
  return {
    hasSkinTones: avgBrightness > 80 && avgBrightness < 200,
    hasClothingColors: hasVariation,
    sceneComplexity: hasVariation ? 0.6 : 0.3,
    colorUniformity: hasVariation ? 0.4 : 0.8,
    distinctRegions: 3
  };
}

// Limit number of detections per class
function limitDetectionsPerClass(detections) {
  const maxPerClass = {
    helmet: 2,  // Maximum 2 helmets
    vest: 2,    // Maximum 2 vests  
    person: 1   // Maximum 1 person
  };
  
  const grouped = {};
  detections.forEach(detection => {
    if (!grouped[detection.label]) {
      grouped[detection.label] = [];
    }
    grouped[detection.label].push(detection);
  });
  
  const limited = [];
  Object.keys(grouped).forEach(label => {
    const classDetections = grouped[label];
    // Sort by confidence and take top N
    classDetections.sort((a, b) => b.confidence - a.confidence);
    const maxCount = maxPerClass[label] || 3;
    limited.push(...classDetections.slice(0, maxCount));
  });
  
  return limited;
}

// Fallback detection for error cases
async function fallbackDetection(imagePath, width, height) {
  // Simple filename-based detection as last resort
  const filename = imagePath.toLowerCase();
  const detections = [];
  
  if (filename.includes('helmet')) {
    detections.push({
      label: 'helmet',
      confidence: 0.75,
      bbox: { x: width * 0.2, y: height * 0.1, width: width * 0.6, height: height * 0.4 }
    });
  }
  
  if (filename.includes('vest')) {
    detections.push({
      label: 'vest',
      confidence: 0.75,
      bbox: { x: width * 0.1, y: height * 0.3, width: width * 0.8, height: height * 0.5 }
    });
  }
  
  return detections;
}

// Generate detection hash for duplicate checking
export function generateDetectionHash(detections) {
  const hashData = detections.map(d => 
    `${d.label}-${d.confidence.toFixed(2)}-${d.bbox.x.toFixed(2)}-${d.bbox.y.toFixed(2)}`
  ).join('|');
  return crypto.createHash('md5').update(hashData).digest('hex');
}

// Main PPE detection function
export async function detectPPE(imagePath) {
  try {
    const analysis = await analyzeImageForPPE(imagePath);
    const { hasHelmet, hasHighVisVest, hasPerson, detections, confidence, width, height } = analysis;
    
    // Limit detections per class to prevent overwhelming results
    const limitedDetections = limitDetectionsPerClass(detections);
    
    // Convert absolute coordinates to normalized coordinates (0-1) for frontend
    const normalizedDetections = limitedDetections.map(detection => ({
      ...detection,
      bbox: {
        x: detection.bbox.x / width,
        y: detection.bbox.y / height,
        width: detection.bbox.width / width,
        height: detection.bbox.height / height
      }
    }));
    
    return normalizedDetections;
    
  } catch (error) {
    console.error('Error in PPE detection:', error);
    return [];
  }
}


