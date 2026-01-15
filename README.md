# Intrinsics HTML Exporter

A Foundry VTT module that exports Journal Entries as standalone HTML files for easy PDF conversion.

## Features

✅ **Fast & Lightweight** - Instant export with no browser freezing
✅ **Print-Ready HTML** - Optimized for browser Print-to-PDF functionality
✅ **Readable Output** - Black text on white background with proper styling
✅ **No Dependencies** - No heavy libraries (jsPDF/html2canvas) needed
✅ **Easy to Use** - Simple "HTML" button on journal sheet headers
✅ **Better Quality** - Use external tools for superior PDF rendering
✅ **Compatible** - Works with Foundry VTT v11-13

## Why HTML Instead of PDF?

Previous approaches using html2canvas and jsPDF had critical performance issues:

### Problems with Direct PDF Generation:
1. **Browser Freezing** - html2canvas blocks the main thread, freezing Foundry completely
2. **Slow Performance** - Even small documents take 10+ seconds to render
3. **Poor Quality** - Canvas-based rendering produces pixelated text
4. **Memory Issues** - Large documents can crash the browser

### Benefits of HTML Export:
1. **Instant** - Export completes in milliseconds
2. **No Freezing** - Pure serialization, no rendering overhead
3. **Better PDFs** - Use professional tools (browser Print-to-PDF, Puppeteer, wkhtmltopdf)
4. **Editable** - Modify HTML/CSS before PDF conversion if needed
5. **Batch Processing** - Export multiple journals, convert them all at once

## Installation

1. Copy the `intrinsics-pdf-exporter` folder to your Foundry modules directory:
   ```
   [Foundry Data]/modules/intrinsics-pdf-exporter/
   ```

2. Enable the module in Foundry VTT:
   - Go to "Manage Modules"
   - Check "Intrinsics HTML Exporter"
   - Click "Save Module Settings"

3. Refresh your browser

## Usage

### Step 1: Export to HTML

1. Open any Journal Entry in Foundry VTT
2. Click the "HTML" button in the journal header
3. The HTML file will be downloaded instantly

### Step 2: Convert HTML to PDF

Choose your preferred method:

#### Option A: Browser Print-to-PDF (Easiest)
1. Open the downloaded HTML file in Chrome or Firefox
2. Press `Ctrl+P` (or `Cmd+P` on Mac)
3. Select "Save as PDF" as the destination
4. Adjust margins/scaling if needed
5. Click "Save"

#### Option B: Command-Line Tools (Best Quality)

**Using Puppeteer (Node.js):**
```bash
npm install -g puppeteer-cli
puppeteer print journal.html journal.pdf
```

**Using wkhtmltopdf:**
```bash
wkhtmltopdf journal.html journal.pdf
```

**Using Pandoc:**
```bash
pandoc journal.html -o journal.pdf
```

#### Option C: Online Converters
Upload the HTML file to services like:
- CloudConvert
- HTML2PDF
- Sejda

## Why This Works Better

The exported HTML includes:
- **Embedded CSS** - All styles included, no external dependencies
- **Print media queries** - Optimized for PDF output
- **Page breaks** - Proper pagination between journal pages
- **Print-safe colors** - Black text, readable tables
- **Responsive images** - Scaled to fit page width

## Technical Details

### Module Structure

```
intrinsics-pdf-exporter/
├── module.json              # Module manifest
├── scripts/
│   ├── main.js             # Entry point, hooks
│   ├── pdf-generator.js    # HTML export logic
│   └── config.js           # Configuration
├── styles/
│   └── module.css          # Module styles
├── lang/
│   └── en.json            # Localization
└── README.md
```

### How It Works

The module extracts journal content and creates a standalone HTML document:

```javascript
// 1. Extract journal pages
const pages = journal.pages;
let content = '';
pages.forEach(page => {
  content += `<div class="journal-page">
    <h1>${page.name}</h1>
    <div>${page.text.content}</div>
  </div>`;
});

// 2. Wrap in complete HTML document with embedded CSS
const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    /* Print-optimized styles */
    body { font-family: Georgia, serif; }
    .journal-page { page-break-after: always; }
  </style>
</head>
<body>${content}</body>
</html>`;

// 3. Download as .html file
const blob = new Blob([html], { type: 'text/html' });
// ... trigger download
```

### Embedded Styles

The exported HTML includes print-optimized CSS:
- **Font**: Georgia serif for readability
- **Colors**: Forced black text, white background
- **Page breaks**: Each journal page starts on new PDF page
- **Responsive**: Images scale to fit page width
- **Tables**: Proper borders and header styling

## Compatibility

- **Foundry VTT:** v11, v12, v13
- **System:** System-agnostic (works with all game systems)
- **Modules:** No known conflicts

## Dependencies

None! Pure JavaScript with no external libraries required.

## Troubleshooting

### HTML file won't open
- Ensure you're using a modern browser (Chrome, Firefox, Edge)
- Check that the file extension is `.html`

### PDF layout is wrong
- Try adjusting browser print settings (margins, scaling)
- Use "Print backgrounds" option if colors are missing
- Different PDF tools may produce different results

### Images missing in PDF
- Ensure images use absolute URLs or data URIs
- Some PDF converters don't support external image loading
- Try using browser Print-to-PDF which handles images best

### Content cut off
- Adjust page margins in print settings
- Try landscape orientation for wide content
- Use "Fit to page width" scaling option

## API

Other modules can programmatically export journals:

```javascript
// Access the API
const api = game.modules.get('intrinsics-pdf-exporter').api;

// Export a journal to HTML
await api.exportJournalToPDF(journal);
```

## Development

### Building from Source

No build process required - pure ES6 modules.

### Testing

1. Create test journals with various formatting (tables, images, headers)
2. Export to HTML and verify output
3. Test PDF conversion with multiple tools
4. Check page breaks and styling

## Recommended PDF Conversion Setup

For the best results, we recommend:

1. **For single conversions**: Browser Print-to-PDF (built-in, free, excellent quality)
2. **For batch conversions**: Puppeteer script (automated, consistent, high quality)
3. **For offline use**: wkhtmltopdf (standalone, fast, good quality)

### Sample Puppeteer Script

```javascript
const puppeteer = require('puppeteer');

async function convertToPDF(htmlPath, pdfPath) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
  });
  await browser.close();
}
```

## Contributing

Issues and pull requests welcome at the repository.

## License

MIT License - see LICENSE file

## Credits

- **Foundry VTT Community** - Testing and feedback
- **Puppeteer Team** - Excellent headless Chrome API
- **wkhtmltopdf Contributors** - Great offline PDF tool

## Changelog

### Version 2.0.0
- **BREAKING**: Changed to HTML export instead of direct PDF generation
- **Performance**: Instant export, no browser freezing
- **Quality**: Better PDF output using professional conversion tools
- **Simplicity**: Removed jsPDF and html2canvas dependencies
- Compatible with Foundry v11-13

### Version 1.0.0 (Deprecated)
- Direct PDF generation (had performance issues)
- Used html2canvas + jsPDF (caused browser freezing)

## Support

For issues, questions, or feature requests, please use the module repository's issue tracker.

---

**Made for the Foundry VTT community**
