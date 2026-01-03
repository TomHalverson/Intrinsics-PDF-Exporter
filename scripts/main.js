/**
 * Intrinsics PDF Exporter - Main Entry Point
 * Fixes yellow text and missing spaces in PDF exports
 */

import { exportJournalToPDF } from './pdf-generator.js';

// Module constants
const MODULE_ID = 'intrinsics-pdf-exporter';
const MODULE_NAME = 'Intrinsics PDF Exporter';

/**
 * Initialize module
 */
Hooks.once('init', function() {
  console.log(`${MODULE_NAME} | Initializing module`);

  // Register module settings (if needed in future)
  registerSettings();

  console.log(`${MODULE_NAME} | Module initialized`);
});

/**
 * Module ready - called when Foundry is fully loaded
 */
Hooks.once('ready', function() {
  console.log(`${MODULE_NAME} | Module ready`);

  // Verify required libraries are loaded
  if (typeof window.jspdf === 'undefined') {
    console.error(`${MODULE_NAME} | jsPDF library not loaded!`);
    ui.notifications.error(`${MODULE_NAME}: jsPDF library failed to load`);
  }

  if (typeof window.html2canvas === 'undefined') {
    console.error(`${MODULE_NAME} | html2canvas library not loaded!`);
    ui.notifications.error(`${MODULE_NAME}: html2canvas library failed to load`);
  }

  // Show ready notification
  console.log(`${MODULE_NAME} | Ready to export journals to PDF`);
});

/**
 * Add "Export to PDF" button to journal sheet headers
 */
Hooks.on('getJournalSheetHeaderButtons', (app, buttons) => {
  // Add export button at the beginning of the buttons array
  buttons.unshift({
    label: 'PDF',
    class: 'export-pdf-enhanced',
    icon: 'fas fa-file-pdf',
    onclick: () => handleExportClick(app)
  });
});

/**
 * Handle export button click
 * @param {JournalSheet} app - The journal sheet application
 */
async function handleExportClick(app) {
  const journal = app.object;

  console.log(`${MODULE_NAME} | Export button clicked for journal:`, journal.name);

  // Verify journal has pages
  const pages = journal.pages || journal.collections?.pages;
  if (!pages || pages.size === 0) {
    ui.notifications.warn(`${MODULE_NAME}: Journal has no pages to export`);
    return;
  }

  try {
    // Show progress notification
    ui.notifications.info(`Generating PDF for "${journal.name}"...`);

    // Export to PDF
    await exportJournalToPDF(journal);

    // Show success notification
    ui.notifications.success(`PDF exported successfully: ${journal.name}.pdf`);

  } catch (error) {
    console.error(`${MODULE_NAME} | Export failed:`, error);
    ui.notifications.error(`PDF export failed: ${error.message}`);
  }
}

/**
 * Register module settings
 */
function registerSettings() {
  // Future settings can be added here
  // Example:
  // game.settings.register(MODULE_ID, 'someetting', {
  //   name: 'Setting Name',
  //   hint: 'Setting description',
  //   scope: 'client',
  //   config: true,
  //   type: Boolean,
  //   default: true
  // });
}

/**
 * Expose public API
 * Other modules can access this via: game.modules.get('journal-pdf-enhanced').api
 */
Hooks.once('ready', function() {
  const module = game.modules.get(MODULE_ID);
  if (module) {
    module.api = {
      exportJournalToPDF,
      version: module.version
    };
  }
});

// Log module version on startup
console.log(`${MODULE_NAME} | Version ${game.modules.get(MODULE_ID)?.version || '1.0.0'} loaded`);
