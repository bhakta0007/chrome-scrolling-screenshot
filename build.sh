#!/bin/bash

# Chrome Extension Build Script
# Creates a production zip package for Chrome Web Store submission

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[BUILD]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if jq is installed for JSON parsing
if command -v jq &> /dev/null; then
    USE_JQ=true
else
    USE_JQ=false
    print_warning "jq not found. Using grep/sed for JSON parsing. Install jq for better reliability."
fi

# Read version from manifest.json
MANIFEST_FILE="manifest.json"

if [ ! -f "$MANIFEST_FILE" ]; then
    print_error "manifest.json not found!"
    exit 1
fi

print_status "Reading version from $MANIFEST_FILE"

if [ "$USE_JQ" = true ]; then
    VERSION=$(jq -r '.version' "$MANIFEST_FILE")
    NAME=$(jq -r '.name' "$MANIFEST_FILE" | tr '[:upper:]' '[:upper:]' | tr ' ' '-' | tr -d '[[:space:]]')
else
    # Fallback to grep/sed parsing
    VERSION=$(grep '"version"' "$MANIFEST_FILE" | sed 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
    NAME=$(grep '"name"' "$MANIFEST_FILE" | sed 's/.*"name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' | tr '[:upper:]' '[:upper:]' | tr ' ' '-' | tr -d '[[:space:]]')
fi

if [ -z "$VERSION" ] || [ "$VERSION" = "null" ]; then
    print_error "Could not extract version from $MANIFEST_FILE"
    exit 1
fi

# Clean up name for filename
FILENAME_NAME="scrollable-screenshot"
ZIP_FILENAME="${FILENAME_NAME}-v${VERSION}.zip"

print_status "Building version: $VERSION"
print_status "Output filename: $ZIP_FILENAME"

# Check if required files exist
REQUIRED_FILES=("manifest.json" "background.js" "content.js" "content.css" "icons/")

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -e "$file" ]; then
        print_error "Required file/directory not found: $file"
        exit 1
    fi
done

# Check if PNG icons exist
REQUIRED_ICONS=("icons/icon16.png" "icons/icon48.png" "icons/icon128.png")

for icon in "${REQUIRED_ICONS[@]}"; do
    if [ ! -f "$icon" ]; then
        print_warning "Icon not found: $icon. Make sure PNG icons are generated."
    fi
done

# Remove existing zip file if it exists
if [ -f "$ZIP_FILENAME" ]; then
    print_status "Removing existing $ZIP_FILENAME"
    rm -f "$ZIP_FILENAME"
fi

# Create the zip package
print_status "Creating zip package..."

zip -r "$ZIP_FILENAME" \
    manifest.json \
    background.js \
    content.js \
    content.css \
    icons/ \
    -x "*.DS_Store" \
    -x "*.md" \
    -x "*.html" \
    -x "generate-icons.js" \
    -x "*.svg" \
    -x "build.sh" \
    -x ".*" \
    -x "__MACOSX/*"

# Check if zip was created successfully
if [ -f "$ZIP_FILENAME" ]; then
    # Get file size
    FILE_SIZE=$(ls -lh "$ZIP_FILENAME" | awk '{print $5}')

    print_success "Build completed successfully!"
    echo
    echo -e "${GREEN}Package created: ${ZIP_FILENAME}${NC}"
    echo -e "${GREEN}File size: ${FILE_SIZE}${NC}"
    echo
    print_status "Package contents:"
    unzip -l "$ZIP_FILENAME"
    echo
    print_status "Ready for Chrome Web Store submission!"
    echo
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Upload $ZIP_FILENAME to Chrome Web Store Developer Dashboard"
    echo "2. Follow the steps in CHROME_WEB_STORE_GUIDE.md"
    echo
else
    print_error "Build failed! Zip file was not created."
    exit 1
fi