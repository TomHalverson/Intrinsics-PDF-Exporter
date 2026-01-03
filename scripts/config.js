/**
 * Configuration constants for Journal PDF Enhanced
 */

export const CONFIG = {
  // HTML2Canvas rendering options
  // CRITICAL: backgroundColor is null (transparent), not white!
  HTML2CANVAS_OPTIONS: {
    backgroundColor: null,  // KEY FIX - transparent, not white!
    scale: 2,              // Higher quality rendering
    useCORS: true,         // Allow cross-origin images
    allowTaint: false,     // Security setting
    logging: false,        // Disable console logs
    windowWidth: 800,      // Rendering width
    imageTimeout: 15000,   // Image load timeout (15 seconds)
    removeContainer: true  // Clean up after rendering
  },

  // PDF generation options
  PDF_OPTIONS: {
    format: 'a4',          // Page size
    orientation: 'portrait', // Page orientation
    unit: 'mm',            // Units for measurements
    compress: true,        // Compress PDF
    margin: {
      top: 10,
      right: 10,
      bottom: 10,
      left: 10
    }
  },

  // Color detection thresholds
  COLOR_THRESHOLDS: {
    lightThreshold: 0.5,   // Luminance threshold for light/dark detection
    contrastRatio: 4.5     // WCAG AA standard minimum contrast
  },

  // Rendering container options
  RENDER_CONTAINER: {
    width: 800,            // Container width in pixels
    backgroundColor: '#ffffff', // White background for PDF context
    position: 'absolute',
    left: '-9999px',       // Off-screen rendering
    top: '0'
  }
};
