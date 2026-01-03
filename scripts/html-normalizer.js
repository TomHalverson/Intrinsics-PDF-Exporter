/**
 * HTML Normalizer - Fixes spacing issues from HTML concatenation
 * Solves the missing spaces problem by using proper DOM manipulation
 */

/**
 * Normalize journal content to preserve spacing
 * @param {JournalEntry} journal - The journal entry to normalize
 * @returns {HTMLElement} - Normalized container element
 */
export function normalizeJournalContent(journal) {
  const container = document.createElement('div');
  container.id = 'pdf-content';
  container.className = 'journal-pdf-content';

  // Get all journal pages
  const pages = journal.pages || journal.collections?.pages;
  if (!pages) {
    console.warn('Journal PDF Enhanced | No pages found in journal');
    return container;
  }

  // Convert to array if it's a collection
  const pageArray = pages.contents || Array.from(pages.values()) || [];

  // Process each page
  pageArray.forEach((page, index) => {
    const pageDiv = createPageElement(page, index);
    container.appendChild(pageDiv);
  });

  return container;
}

/**
 * Create a page element with proper structure
 * @param {JournalEntryPage} page - The journal page
 * @param {number} index - Page index
 * @returns {HTMLElement} - Page container
 */
function createPageElement(page, index) {
  const pageDiv = document.createElement('div');
  pageDiv.className = 'journal-page';
  pageDiv.dataset.pageIndex = index;

  // Add page title
  const title = document.createElement('h1');
  title.className = 'journal-page-title';
  title.textContent = page.name || `Page ${index + 1}`;
  pageDiv.appendChild(title);

  // Add page content
  const content = document.createElement('div');
  content.className = 'journal-page-content';

  // Parse HTML content
  if (page.text?.content) {
    content.innerHTML = page.text.content;
    // Normalize whitespace in the parsed content
    normalizeWhitespace(content);
  }

  pageDiv.appendChild(content);

  return pageDiv;
}

/**
 * Normalize whitespace in an element tree
 * Ensures proper spacing between inline elements and text nodes
 * @param {HTMLElement} element - The element to normalize
 */
export function normalizeWhitespace(element) {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null
  );

  const nodesToFix = [];

  // Identify text nodes that need spacing
  while (walker.nextNode()) {
    const node = walker.currentNode;

    // Skip empty or whitespace-only nodes
    if (!node.textContent || node.textContent.trim() === '') {
      continue;
    }

    // Check if this text node needs leading space
    if (needsLeadingSpace(node)) {
      nodesToFix.push({ node, position: 'leading' });
    }

    // Check if this text node needs trailing space
    if (needsTrailingSpace(node)) {
      nodesToFix.push({ node, position: 'trailing' });
    }
  }

  // Apply fixes
  nodesToFix.forEach(({ node, position }) => {
    if (position === 'leading' && !node.textContent.match(/^\s/)) {
      node.textContent = ' ' + node.textContent;
    } else if (position === 'trailing' && !node.textContent.match(/\s$/)) {
      node.textContent = node.textContent + ' ';
    }
  });
}

/**
 * Check if a text node needs leading space
 * @param {Text} node - The text node
 * @returns {boolean} - True if needs leading space
 */
function needsLeadingSpace(node) {
  const prev = node.previousSibling;

  // No previous sibling, no need for space
  if (!prev) return false;

  // Previous sibling is an element
  if (prev.nodeType === Node.ELEMENT_NODE) {
    const tagName = prev.tagName.toLowerCase();

    // Block elements don't need trailing space
    const blockElements = ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'pre', 'hr', 'table', 'tr', 'td', 'th'];
    if (blockElements.includes(tagName)) {
      return false;
    }

    // Inline elements need space
    return true;
  }

  // Previous sibling is text, check if it ends with space
  if (prev.nodeType === Node.TEXT_NODE) {
    return !prev.textContent.match(/\s$/);
  }

  return false;
}

/**
 * Check if a text node needs trailing space
 * @param {Text} node - The text node
 * @returns {boolean} - True if needs trailing space
 */
function needsTrailingSpace(node) {
  const next = node.nextSibling;

  // No next sibling, no need for space
  if (!next) return false;

  // Next sibling is an element
  if (next.nodeType === Node.ELEMENT_NODE) {
    const tagName = next.tagName.toLowerCase();

    // Block elements don't need leading space
    const blockElements = ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'pre', 'hr', 'table', 'tr', 'td', 'th'];
    if (blockElements.includes(tagName)) {
      return false;
    }

    // Inline elements need space
    return true;
  }

  // Next sibling is text, check if it starts with space
  if (next.nodeType === Node.TEXT_NODE) {
    return !next.textContent.match(/^\s/);
  }

  return false;
}

/**
 * Clone an element with all computed styles
 * @param {HTMLElement} element - Element to clone
 * @returns {HTMLElement} - Cloned element with inline styles
 */
export function cloneWithStyles(element) {
  const clone = element.cloneNode(true);

  // Copy computed styles to inline styles
  const computed = window.getComputedStyle(element);
  Array.from(computed).forEach(key => {
    clone.style[key] = computed.getPropertyValue(key);
  });

  // Recursively copy styles for children
  const originalChildren = element.querySelectorAll('*');
  const clonedChildren = clone.querySelectorAll('*');

  for (let i = 0; i < originalChildren.length; i++) {
    const originalChild = originalChildren[i];
    const clonedChild = clonedChildren[i];
    const childComputed = window.getComputedStyle(originalChild);

    Array.from(childComputed).forEach(key => {
      clonedChild.style[key] = childComputed.getPropertyValue(key);
    });
  }

  return clone;
}
