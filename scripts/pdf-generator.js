/**
 * HTML Exporter - Export journal content as standalone HTML
 * Fast and simple - no browser freezing
 */

import { CONFIG } from './config.js';

/**
 * Export a journal entry to HTML
 * @param {JournalEntry} journal - The journal entry to export
 * @param {Object} options - Export options
 * @returns {Promise<void>}
 */
export async function exportJournalToPDF(journal, options = {}) {
  console.log('Intrinsics HTML Export | Starting export for:', journal.name);

  try {
    // Extract journal content
    console.log('Intrinsics HTML Export | Extracting content...');
    const content = await extractJournalContent(journal);

    // Create standalone HTML document
    console.log('Intrinsics HTML Export | Creating HTML document...');
    const html = createStandaloneHTML(journal.name, content);

    // Download the HTML file
    console.log('Intrinsics HTML Export | Saving file...');
    await downloadHTML(html, journal.name);

    console.log('Intrinsics HTML Export | Export completed successfully!');
  } catch (error) {
    console.error('Intrinsics HTML Export | Error during export:', error);
    throw error;
  }
}

/**
 * Extract journal content and convert images to base64
 * @param {JournalEntry} journal - The journal entry
 * @returns {Promise<string>} - HTML content with embedded images
 */
async function extractJournalContent(journal) {
  const pages = journal.pages || journal.collections?.pages;
  if (!pages) {
    throw new Error('No pages found in journal');
  }

  const pageArray = pages.contents || Array.from(pages.values()) || [];

  let html = '';

  for (const [index, page] of pageArray.entries()) {
    html += '<div class="journal-page">';
    html += `<h1 class="journal-page-title">${page.name || `Page ${index + 1}`}</h1>`;

    // Get page content and convert images to base64
    let content = page.text?.content || '';
    content = await convertImagesToBase64(content);

    html += `<div class="journal-page-content">${content}</div>`;
    html += '</div>';
  }

  return html;
}

/**
 * Convert all images in HTML to base64 data URIs
 * @param {string} html - HTML content
 * @returns {Promise<string>} - HTML with base64 images
 */
async function convertImagesToBase64(html) {
  // Create a temporary container to parse HTML
  const container = document.createElement('div');
  container.innerHTML = html;

  // Find all images
  const images = container.querySelectorAll('img');

  // Convert each image to base64
  for (const img of images) {
    const src = img.getAttribute('src');
    if (!src || src.startsWith('data:')) {
      continue; // Skip if already base64 or no src
    }

    try {
      const base64 = await fetchImageAsBase64(src);
      if (base64) {
        img.setAttribute('src', base64);
      }
    } catch (error) {
      console.warn('Failed to convert image to base64:', src, error);
      // Keep original src on failure
    }
  }

  return container.innerHTML;
}

/**
 * Fetch an image and convert to base64 data URI
 * @param {string} url - Image URL
 * @returns {Promise<string>} - Base64 data URI
 */
async function fetchImageAsBase64(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to fetch image:', url, error);
    return null;
  }
}

/**
 * Create a standalone HTML document with embedded CSS
 * @param {string} title - Document title
 * @param {string} content - HTML content
 * @returns {string} - Complete HTML document
 */
function createStandaloneHTML(title, content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    /* Print-friendly styles */
    body {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000000;
      background-color: #ffffff;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    /* Page breaks */
    .journal-page {
      page-break-after: always;
      margin-bottom: 40px;
    }

    .journal-page:last-child {
      page-break-after: auto;
    }

    /* Titles */
    .journal-page-title {
      font-size: 24pt;
      font-weight: bold;
      text-align: center;
      margin: 0 0 20px 0;
      padding-bottom: 10px;
      border-bottom: 2px solid #333333;
      color: #000000;
    }

    /* Content */
    .journal-page-content {
      color: #000000;
    }

    /* Force readable colors */
    .journal-page-content * {
      color: #000000 !important;
      background-color: transparent !important;
    }

    /* Tables */
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }

    th, td {
      border: 1px solid #333333;
      padding: 8px;
      text-align: left;
    }

    th {
      background-color: #f0f0f0 !important;
      font-weight: bold;
    }

    /* Images */
    img {
      max-width: 100%;
      height: auto;
    }

    /* Print styles */
    @media print {
      body {
        padding: 0;
      }

      .journal-page {
        page-break-after: always;
      }

      .journal-page:last-child {
        page-break-after: auto;
      }
    }

    /* Headings */
    h1, h2, h3, h4, h5, h6 {
      color: #000000 !important;
      margin-top: 1em;
      margin-bottom: 0.5em;
    }

    /* Links */
    a {
      color: #0066cc !important;
      text-decoration: underline;
    }

    @media print {
      a {
        color: #000000 !important;
      }
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
}

/**
 * Download HTML as a file
 * @param {string} html - HTML content
 * @param {string} journalName - Journal name for filename
 */
function downloadHTML(html, journalName) {
  const filename = `${sanitizeFilename(journalName)}.html`;

  // Create blob and download link
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });

  // Use saveDataToFile from Foundry's core utilities if available (better desktop support)
  if (typeof saveDataToFile === 'function') {
    saveDataToFile(blob, 'text/html', filename);
    return;
  }

  // Fallback: Traditional browser download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // Make the click more reliable
  document.body.appendChild(link);
  link.dispatchEvent(new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window
  }));

  // Cleanup after download starts
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 250);
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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
