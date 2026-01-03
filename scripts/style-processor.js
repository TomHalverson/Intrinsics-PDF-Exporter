/**
 * Style Processor - Color detection and inversion for PDF readability
 * Solves the yellow text on white background problem
 */

import { CONFIG } from './config.js';

/**
 * Parse a CSS color string to RGB values
 * @param {string} color - CSS color string (rgb, rgba, hex, or named)
 * @returns {number[]} - [r, g, b] array with values 0-255
 */
export function parseColor(color) {
  // Handle rgba/rgb format
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return [
      parseInt(rgbMatch[1]),
      parseInt(rgbMatch[2]),
      parseInt(rgbMatch[3])
    ];
  }

  // Handle hex format
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    if (hex.length === 3) {
      // Short hex format (#fff)
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16)
      ];
    } else {
      // Full hex format (#ffffff)
      return [
        parseInt(hex.substr(0, 2), 16),
        parseInt(hex.substr(2, 2), 16),
        parseInt(hex.substr(4, 2), 16)
      ];
    }
  }

  // Handle named colors and transparent
  if (color === 'transparent' || color === 'rgba(0, 0, 0, 0)') {
    return [255, 255, 255]; // Default to white for transparent
  }

  // For other named colors, create a temporary element to get computed color
  const temp = document.createElement('div');
  temp.style.color = color;
  document.body.appendChild(temp);
  const computed = window.getComputedStyle(temp).color;
  document.body.removeChild(temp);

  return parseColor(computed);
}

/**
 * Calculate relative luminance using WCAG formula
 * @param {number[]} rgb - [r, g, b] array with values 0-255
 * @returns {number} - Luminance value between 0 and 1
 */
export function calculateLuminance(rgb) {
  const [r, g, b] = rgb.map(val => {
    val = val / 255;
    return val <= 0.03928
      ? val / 12.92
      : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 * @param {number} lum1 - Luminance of first color
 * @param {number} lum2 - Luminance of second color
 * @returns {number} - Contrast ratio
 */
export function calculateContrastRatio(lum1, lum2) {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Detect if text color is light on dark background
 * @param {string} textColor - CSS color string for text
 * @param {string} backgroundColor - CSS color string for background
 * @returns {boolean} - True if light text on dark background
 */
export function isLightOnDark(textColor, backgroundColor) {
  const textRGB = parseColor(textColor);
  const bgRGB = parseColor(backgroundColor);

  const textLuminance = calculateLuminance(textRGB);
  const bgLuminance = calculateLuminance(bgRGB);

  // If text is lighter than background, it's light-on-dark
  return textLuminance > bgLuminance;
}

/**
 * Invert a color for better PDF readability
 * @param {string} color - CSS color string to invert
 * @returns {string} - Inverted color as CSS string
 */
export function invertColor(color) {
  const rgb = parseColor(color);
  const luminance = calculateLuminance(rgb);

  // If it's a light color, convert to dark
  if (luminance > CONFIG.COLOR_THRESHOLDS.lightThreshold) {
    return '#000000'; // Black for readability
  }

  // If it's already dark, keep it dark
  return color;
}

/**
 * Get background color of an element, walking up the DOM tree if needed
 * @param {HTMLElement} element - The element to check
 * @returns {string} - Background color (defaults to white if transparent)
 */
export function getEffectiveBackgroundColor(element) {
  let current = element;
  const maxDepth = 10; // Prevent infinite loops
  let depth = 0;

  while (current && depth < maxDepth) {
    const computed = window.getComputedStyle(current);
    const bgColor = computed.backgroundColor;

    // If we found a non-transparent background, return it
    if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
      return bgColor;
    }

    current = current.parentElement;
    depth++;
  }

  // Default to white if no background found
  return '#ffffff';
}

/**
 * Invert colors in an element tree for PDF readability
 * This is the main function that fixes the yellow text problem
 * @param {HTMLElement} element - The root element to process
 */
export function invertColorsForPDF(element) {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_ELEMENT,
    null
  );

  const elementsToInvert = [];

  // Collect elements that need color inversion
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const computed = window.getComputedStyle(node);

    // Get text color and background color
    const textColor = computed.color;
    const bgColor = getEffectiveBackgroundColor(node);

    // Check if this is light text on dark background
    if (isLightOnDark(textColor, bgColor)) {
      elementsToInvert.push({
        element: node,
        originalColor: textColor,
        originalBackground: computed.backgroundColor
      });
    }
  }

  // Apply color inversions
  elementsToInvert.forEach(({ element, originalColor }) => {
    // Convert light text to dark text for PDF readability
    const invertedColor = invertColor(originalColor);
    element.style.color = invertedColor;

    // Remove dark backgrounds
    const bgColor = window.getComputedStyle(element).backgroundColor;
    if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
      const bgRGB = parseColor(bgColor);
      const bgLuminance = calculateLuminance(bgRGB);

      // If background is dark, make it transparent/white for PDF
      if (bgLuminance < CONFIG.COLOR_THRESHOLDS.lightThreshold) {
        element.style.backgroundColor = 'transparent';
      }
    }
  });

  console.log(`Journal PDF Enhanced | Inverted colors for ${elementsToInvert.length} elements`);
}

/**
 * Process all styles in an element for PDF rendering
 * @param {HTMLElement} element - The element to process
 */
export function processStylesForPDF(element) {
  // First, invert colors if needed
  invertColorsForPDF(element);

  // Ensure all text is visible
  ensureTextVisibility(element);

  // Fix any potential contrast issues
  fixContrastIssues(element);
}

/**
 * Ensure all text in the element is visible
 * @param {HTMLElement} element - The element to process
 */
function ensureTextVisibility(element) {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_ELEMENT,
    null
  );

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const computed = window.getComputedStyle(node);

    // Force visible text
    if (computed.visibility === 'hidden') {
      node.style.visibility = 'visible';
    }

    if (computed.opacity === '0') {
      node.style.opacity = '1';
    }
  }
}

/**
 * Fix contrast issues for better PDF readability
 * @param {HTMLElement} element - The element to process
 */
function fixContrastIssues(element) {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_ELEMENT,
    null
  );

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const computed = window.getComputedStyle(node);

    const textColor = computed.color;
    const bgColor = getEffectiveBackgroundColor(node);

    const textRGB = parseColor(textColor);
    const bgRGB = parseColor(bgColor);

    const textLum = calculateLuminance(textRGB);
    const bgLum = calculateLuminance(bgRGB);

    const contrast = calculateContrastRatio(textLum, bgLum);

    // If contrast is too low, force black text
    if (contrast < CONFIG.COLOR_THRESHOLDS.contrastRatio) {
      node.style.color = '#000000';
    }
  }
}
