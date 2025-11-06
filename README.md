# Scrollable Screenshot Chrome Extension

A Chrome extension that allows you to capture screenshots of selected rectangular areas with automatic scrolling support.

## Features

- **Click and Drag Selection**: Draw a rectangular area by clicking and dragging on the page
- **Adjustable Corners**: Drag corner handles to fine-tune your selection
- **Scroll Support**: The selection area stays fixed while you scroll the page to adjust boundaries
- **Multi-viewport Capture**: Automatically captures content across multiple viewports for tall selections
- **Nested Scroll Container Support**: Works with single-page applications (SPAs) and nested scrollable containers
- **Smart Coordinate System**: Properly handles fixed headers and container-relative positioning
- **Easy Download**: Click the capture button to save your screenshot as a PNG file

## Installation

1. **Load Extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select this directory

2. **Pin the Extension** (optional): Click the puzzle icon in Chrome's toolbar and pin the "Scrollable Screenshot" extension for easy access.

## Usage

1. **Activate**: Click the extension icon in your browser toolbar
2. **Select Area**: Click and drag on the page to create a rectangular selection
3. **Adjust**: Drag the corner handles to fine-tune your selection
   - The page will scroll as you drag corners near the viewport edges
   - The selection coordinates are absolute, so scrolling won't affect your selection
4. **Capture**: Click the "Capture Screenshot" button in the control panel
5. **Save**: The screenshot will automatically download as a PNG file

### Keyboard Shortcuts

- **ESC**: Cancel the screenshot and close the overlay

### Tips

- The selection box shows the dimensions in pixels
- You can select areas larger than the current viewport
- The extension will automatically scroll and stitch together multiple captures for tall selections
- Works seamlessly with SPAs (Angular, React, Vue) that use nested scroll containers
- The selection box respects fixed headers and visually slides under them when scrolling

## Files

- [manifest.json](manifest.json) - Extension configuration
- [background.js](background.js) - Background service worker
- [content.js](content.js) - Main screenshot functionality
- [content.css](content.css) - Styling for the selection UI
- [create-icons.html](create-icons.html) - Icon generator utility

## Technical Details

### How It Works

1. **Injection**: When you click the extension icon, the content script and CSS are injected into the current tab
2. **Scroll Container Detection**: Automatically detects whether the page uses window scrolling or a nested scroll container
3. **Selection**: An overlay captures mouse events to create a rectangular selection
   - Uses container-relative coordinates for nested scroll containers
   - Properly accounts for fixed headers and container offsets
4. **Scrolling Capture**: The extension:
   - Saves your current scroll position
   - Scrolls through the selected area in viewport-sized chunks
   - Captures each visible portion using Chrome's `captureVisibleTab` API
   - Stitches the images together on a canvas with proper coordinate transformation
   - Restores your original scroll position
5. **Download**: The final image is converted to a blob and downloaded

### Permissions

- `activeTab`: Access the current tab to inject scripts and capture screenshots
- `scripting`: Inject content scripts dynamically
- `downloads`: Save the captured screenshot

## Browser Compatibility

- Chrome/Chromium (Manifest V3)
- Edge (Chromium-based)

## Limitations

- Can only capture visible content (not hidden elements)
- May have slight rendering delays during capture
- Maximum canvas size limitations may affect very large selections

## Development

To modify the extension:

1. Edit the relevant files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

## License

Free to use and modify for personal and commercial projects.
