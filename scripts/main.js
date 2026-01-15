/**
 * Intrinsics HTML Exporter - Main Entry Point
 * Exports journal entries as standalone HTML files for PDF conversion
 */

import { exportJournalToPDF } from './pdf-generator.js';

// Module constants
const MODULE_ID = 'intrinsics-pdf-exporter';
const MODULE_NAME = 'Intrinsics HTML Exporter';

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
  console.log(`${MODULE_NAME} | Ready to export journals to HTML`);
});

/**
 * Add "Export to HTML" button to journal sheet headers
 */
Hooks.on('getJournalSheetHeaderButtons', (app, buttons) => {
  // Add export button at the beginning of the buttons array
  buttons.unshift({
    label: 'HTML',
    class: 'export-html',
    icon: 'fas fa-file-code',
    onclick: () => handleExportClick(app)
  });
});

// Track if export is in progress to prevent multiple simultaneous exports
let exportInProgress = false;

/**
 * Handle export button click
 * @param {JournalSheet} app - The journal sheet application
 */
async function handleExportClick(app) {
  // Prevent multiple simultaneous exports
  if (exportInProgress) {
    ui.notifications.warn(`${MODULE_NAME}: Export already in progress, please wait...`);
    return;
  }

  const journal = app.object;

  console.log(`${MODULE_NAME} | Export button clicked for journal:`, journal.name);

  // Verify journal has pages
  const pages = journal.pages || journal.collections?.pages;
  if (!pages || pages.size === 0) {
    ui.notifications.warn(`${MODULE_NAME}: Journal has no pages to export`);
    return;
  }

  exportInProgress = true;

  try {
    // Show progress notification
    ui.notifications.info(`Exporting "${journal.name}" to HTML...`);

    // Export to HTML (instant, no delay needed)
    await exportJournalToPDF(journal);

    // Show success notification with instructions
    ui.notifications.success(`HTML exported: ${journal.name}.html - Open in browser and use Print to PDF`);

  } catch (error) {
    console.error(`${MODULE_NAME} | Export failed:`, error);
    ui.notifications.error(`HTML export failed: ${error.message}. Check console for details.`);
  } finally {
    exportInProgress = false;
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
