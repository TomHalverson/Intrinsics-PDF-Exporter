# Intrinsics PDF Exporter

A Foundry VTT module that exports Journal Entries to PDF with proper color inversion and spacing preservation.

## Features

✅ **Fixes Yellow Text Issue** - Automatically detects and inverts light text on dark backgrounds
✅ **Preserves Spacing** - Uses DOM manipulation instead of string concatenation
✅ **Professional Output** - Black text on white background for optimal PDF readability
✅ **WCAG Compliant** - Uses proper luminance calculations for color detection
✅ **Easy to Use** - Simple "PDF" button on journal sheet headers
✅ **Compatible** - Works with Foundry VTT v11-13

## The Problem

The existing journal-to-PDF solutions have two critical issues:

1. **Yellow text on white background** - The underlying libraries hardcode `backgroundColor: "#ffffff"` in html2canvas options, making Foundry's light-colored text (designed for dark themes) nearly invisible

2. **Missing spaces** - Direct HTML string concatenation without proper normalization causes spaces to disappear between words

## The Solution

This module fixes both issues:

### Color Inversion
- Detects text color and background color using WCAG luminance calculations
- Automatically inverts light-on-dark color schemes to dark-on-light
- Configures html2canvas with `backgroundColor: null` (transparent) instead of white
- Results in readable black text on white PDF pages

### Spacing Preservation
- Uses proper DOM manipulation instead of string concatenation
- Normalizes whitespace by analyzing text nodes and elements
- Ensures spaces between inline elements are preserved
- Handles block vs inline elements correctly

## Installation

1. Copy the `intrinsics-pdf-exporter` folder to your Foundry modules directory:
   ```
   [Foundry Data]/modules/intrinsics-pdf-exporter/
   ```

2. Enable the module in Foundry VTT:
   - Go to "Manage Modules"
   - Check "Intrinsics PDF Exporter"
   - Click "Save Module Settings"

3. Refresh your browser

## Usage

1. Open any Journal Entry in Foundry VTT
2. Click the "PDF" button in the journal header (next to the minimize/close buttons)
3. The PDF will be generated and automatically downloaded
4. The PDF will have black text on white background, regardless of your Foundry theme

## Technical Details

### Module Structure

```
intrinsics-pdf-exporter/
├── module.json              # Module manifest
├── scripts/
│   ├── main.js             # Entry point, hooks
│   ├── pdf-generator.js    # Core PDF generation
│   ├── style-processor.js  # Color detection/inversion
│   ├── html-normalizer.js  # Spacing fixes
│   └── config.js           # Configuration
├── styles/
│   └── module.css          # PDF styles
├── lib/
│   ├── jspdf.umd.min.js   # jsPDF library
│   └── html2canvas.min.js # html2canvas library
├── lang/
│   └── en.json            # Localization
└── README.md
```

### Key Technical Solutions

#### 1. Background Color Fix

**Problem in existing module:**
```javascript
backgroundColor: "#ffffff"  // Hardcoded white
```

**Our solution:**
```javascript
backgroundColor: null  // Transparent - allows proper color control
```

#### 2. Color Inversion Algorithm

```javascript
// Calculate luminance using WCAG formula
function calculateLuminance(rgb) {
  const [r, g, b] = rgb.map(val => {
    val = val / 255;
    return val <= 0.03928
      ? val / 12.92
      : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Detect light-on-dark and invert
if (isLightOnDark(textColor, bgColor)) {
  element.style.color = '#000000';  // Convert to black
}
```

#### 3. Spacing Preservation

**Problem in existing module:**
```javascript
content += `<h1>${page.name}</h1>` + page.text.content;  // String concat
```

**Our solution:**
```javascript
const pageDiv = document.createElement('div');
const title = document.createElement('h1');
title.textContent = page.name;  // Proper DOM manipulation
pageDiv.appendChild(title);
normalizeWhitespace(pageDiv);  // Fix spacing
```

## Configuration

The module includes sensible defaults. Advanced users can modify [config.js](scripts/config.js):

```javascript
export const CONFIG = {
  HTML2CANVAS_OPTIONS: {
    backgroundColor: null,  // KEY FIX
    scale: 2,
    useCORS: true,
    windowWidth: 800
  },

  PDF_OPTIONS: {
    format: 'a4',
    orientation: 'portrait',
    margin: { top: 10, right: 10, bottom: 10, left: 10 }
  },

  COLOR_THRESHOLDS: {
    lightThreshold: 0.5,  // Luminance threshold
    contrastRatio: 4.5    // WCAG AA standard
  }
};
```

## Compatibility

- **Foundry VTT:** v11, v12, v13
- **System:** System-agnostic (works with all game systems)
- **Modules:** No known conflicts

## Dependencies

- jsPDF 2.5.1+ (bundled)
- html2canvas 1.4.1+ (bundled)

## Troubleshooting

### PDF is blank
- Check browser console for errors
- Ensure journal has pages with content
- Verify libraries loaded successfully

### Colors still wrong
- The module auto-detects colors; if detection fails, check browser console
- Luminance threshold can be adjusted in [config.js](scripts/config.js)

### Spacing still missing
- This may be due to complex HTML structures
- Report specific examples as issues for investigation

## API

Other modules can programmatically export journals:

```javascript
// Access the API
const api = game.modules.get('intrinsics-pdf-exporter').api;

// Export a journal
await api.exportJournalToPDF(journal);
```

## Development

### Building from Source

No build process required - pure ES6 modules.

### Testing

1. Create test journals with various formatting
2. Test with dark and light Foundry themes
3. Verify PDF output has black text on white background
4. Check spacing preservation in complex layouts

## Contributing

Issues and pull requests welcome at the repository.

## License

MIT License - see LICENSE file

## Credits

- **jsPDF** - PDF generation library
- **html2canvas** - HTML to canvas conversion
- **Foundry VTT Community** - Testing and feedback

## Changelog

### Version 1.0.0
- Initial release
- Fixes yellow text on white background issue
- Fixes missing spaces issue
- Auto-detects and inverts color schemes
- WCAG-compliant luminance calculations
- Compatible with Foundry v11-13

## Support

For issues, questions, or feature requests, please use the module repository's issue tracker.

---

**Made with ❤️ for the Foundry VTT community**
