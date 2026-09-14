# Batch Screenshot Cleaner — Web Edition

A browser-based conversion of the uploaded Tkinter Batch Screenshot Cleaner.

## Run
Open `index.html` in a modern browser. For best results, serve the folder with any local static web server.

## Features
- PNG/JPG/JPEG/BMP/WebP multi-file selection
- Drag and drop
- Width and height
- Lock aspect ratio
- 1:1, 4:3, 16:9, 9:16, Custom
- Stretch / Fit / Fill
- Zoom 1x–3x
- Offset X/Y
- Live preview
- Batch PNG processing
- ZIP download (JSZip loaded from jsDelivr)
- Fully client-side image processing

## Note
The original Python app saves into a user-selected output folder. Browsers cannot silently write into arbitrary folders, so this version downloads processed files instead. The ZIP button packages all processed images together.
