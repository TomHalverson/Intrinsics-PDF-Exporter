/**
 * PDF Generator - Core PDF generation with proper html2canvas configuration
 * This fixes both the yellow text and missing spaces issues
 */

import { CONFIG } from './config.js';
import { normalizeJournalContent } from './html-normalizer.js';
import { processStylesForPDF } from './style-processor.js';

/**
 * Export a journal entry to PDF
 * @param {JournalEntry} journal - The journal entry to export
 * @param {Object} options - Export options
 * @returns {Promise<void>}
 */
export async function exportJournalToPDF(journal, options = {}) {
  console.log('Journal PDF Enhanced | Starting PDF export for:', journal.name);

  try {
    // Step 1: Normalize journal HTML (fixes spacing issues)
    const normalizedContent = normalizeJournalContent(journal);

    // Step 2: Create temporary render container
    const container = createRenderContainer(normalizedContent);

    // Step 3: Process styles for PDF (fixes color issues)
    processStylesForPDF(container);

    // Step 4: Generate PDF
    await generatePDF(container, journal, options);

    // Step 5: Cleanup
    document.body.removeChild(container);

    console.log('Journal PDF Enhanced | PDF export completed successfully');
  } catch (error) {
    console.error('Journal PDF Enhanced | Error during PDF export:', error);
    throw error;
  }
}

/**
 * Create a temporary off-screen render container
 * @param {HTMLElement} content - The content to render
 * @returns {HTMLElement} - The container element
 */
function createRenderContainer(content) {
  const container = document.createElement('div');
  container.id = 'pdf-render-container';

  // Apply container styles
  Object.assign(container.style, {
    position: CONFIG.RENDER_CONTAINER.position,
    left: CONFIG.RENDER_CONTAINER.left,
    top: CONFIG.RENDER_CONTAINER.top,
    width: `${CONFIG.RENDER_CONTAINER.width}px`,
    backgroundColor: CONFIG.RENDER_CONTAINER.backgroundColor,
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#000000'
  });

  // Append content
  container.appendChild(content);

  // Attach to DOM (required for computed styles and rendering)
  document.body.appendChild(container);

  return container;
}

/**
 * Generate PDF from rendered container
 * @param {HTMLElement} container - The container element
 * @param {JournalEntry} journal - The journal entry
 * @param {Object} options - Export options
 * @returns {Promise<void>}
 */
async function generatePDF(container, journal, options = {}) {
  // Ensure jsPDF is loaded
  if (typeof window.jspdf === 'undefined') {
    throw new Error('jsPDF library not loaded');
  }

  // Ensure html2canvas is loaded
  if (typeof window.html2canvas === 'undefined') {
    throw new Error('html2canvas library not loaded');
  }

  const { jsPDF } = window.jspdf;

  // Create PDF instance
  const pdf = new jsPDF({
    orientation: CONFIG.PDF_OPTIONS.orientation,
    unit: CONFIG.PDF_OPTIONS.unit,
    format: CONFIG.PDF_OPTIONS.format,
    compress: CONFIG.PDF_OPTIONS.compress
  });

  // Get PDF dimensions
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin = CONFIG.PDF_OPTIONS.margin.top;
  const contentWidth = pdfWidth - (margin * 2);
  const contentHeight = pdfHeight - (margin * 2);

  try {
    // CRITICAL FIX: Use html2canvas with backgroundColor: null
    const canvas = await window.html2canvas(container, {
      ...CONFIG.HTML2CANVAS_OPTIONS,
      backgroundColor: null,  // CRITICAL: transparent, not white!
      width: CONFIG.RENDER_CONTAINER.width,
      windowWidth: CONFIG.RENDER_CONTAINER.width
    });

    // Calculate dimensions
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    // Convert canvas to image data
    const imgData = canvas.toDataURL('image/png');

    // Add first page
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
    heightLeft -= contentHeight;

    // Add additional pages if content is longer than one page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= contentHeight;
    }

    // Save PDF
    const filename = `${sanitizeFilename(journal.name)}.pdf`;
    pdf.save(filename);

    console.log(`Journal PDF Enhanced | PDF saved as: ${filename}`);
  } catch (error) {
    console.error('Journal PDF Enhanced | Error generating PDF:', error);
    throw error;
  }
}

/**
 * Sanitize filename for safe file saving
 * @param {string} filename - The filename to sanitize
 * @returns {string} - Sanitized filename
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
}

/**
 * Alternative approach: Use jsPDF's html() method
 * This is simpler but less customizable
 * @param {HTMLElement} container - The container element
 * @param {JournalEntry} journal - The journal entry
 * @returns {Promise<void>}
 */
export async function exportJournalToPDFAlternative(journal) {
  console.log('Journal PDF Enhanced | Using alternative PDF export method');

  try {
    // Normalize and process content
    const normalizedContent = normalizeJournalContent(journal);
    const container = createRenderContainer(normalizedContent);
    processStylesForPDF(container);

    // Ensure jsPDF is loaded
    if (typeof window.jspdf === 'undefined') {
      throw new Error('jsPDF library not loaded');
    }

    const { jsPDF } = window.jspdf;

    // Create PDF instance
    const pdf = new jsPDF({
      orientation: CONFIG.PDF_OPTIONS.orientation,
      unit: 'pt',
      format: CONFIG.PDF_OPTIONS.format
    });

    // Use jsPDF's html() method with proper options
    await pdf.html(container, {
      callback: function(doc) {
        const filename = `${sanitizeFilename(journal.name)}.pdf`;
        doc.save(filename);
        console.log(`Journal PDF Enhanced | PDF saved as: ${filename}`);
      },
      x: CONFIG.PDF_OPTIONS.margin.left,
      y: CONFIG.PDF_OPTIONS.margin.top,
      width: 600,
      windowWidth: 800,
      html2canvas: {
        ...CONFIG.HTML2CANVAS_OPTIONS,
        backgroundColor: null  // CRITICAL FIX
      }
    });

    // Cleanup
    document.body.removeChild(container);

  } catch (error) {
    console.error('Journal PDF Enhanced | Error during alternative PDF export:', error);
    throw error;
  }
}

/**
 * Show export progress notification
 * @param {string} message - Progress message
 */
function showProgress(message) {
  if (ui?.notifications) {
    ui.notifications.info(message);
  }
}

/**
 * Show export error notification
 * @param {string} message - Error message
 */
function showError(message) {
  if (ui?.notifications) {
    ui.notifications.error(message);
  }
}

/**
 * Show export success notification
 * @param {string} message - Success message
 */
function showSuccess(message) {
  if (ui?.notifications) {
    ui.notifications.success(message);
  }
}
