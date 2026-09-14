<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CropVert — DanCo Tools</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<header class="topbar">
  <div class="brand"><span class="brand-mark">D</span><div><strong>DanCo Tools</strong><small>Batch Screenshot Cleaner</small></div></div>
  <div class="top-actions"><button id="clearBtn" class="ghost">Clear All</button></div>
</header>

<main class="app">
  <aside class="sidebar">
    <section class="panel">
      <div class="panel-title"><h2>Images</h2><span id="imageCount">0</span></div>
      <label class="dropzone" id="dropzone">
        <input id="fileInput" type="file" accept="image/png,image/jpeg,image/bmp,image/webp" multiple>
        <span class="upload-icon">＋</span>
        <b>Drop images here</b>
        <small>or click to browse</small>
      </label>
      <div id="fileList" class="file-list"></div>
    </section>
  </aside>

  <section class="preview-area">
    <div class="preview-head">
      <div><h1>Live Preview</h1><span id="selectedName">No image selected</span></div>
      <div class="dimensions" id="previewDimensions">512 × 512</div>
    </div>
    <div class="preview-wrap">
      <div id="emptyPreview" class="empty-preview"><div>🖼️</div><p>Add images to start editing</p></div>
      <canvas id="previewCanvas" hidden></canvas>
    </div>
  </section>

  <aside class="controls">
    <section class="panel">
      <h2>Output Size</h2>
      <div class="two-col">
        <label>Width<input id="width" type="number" min="1" value="512"></label>
        <label>Height<input id="height" type="number" min="1" value="512"></label>
      </div>
      <label class="check"><input id="aspectLock" type="checkbox"> <span>Lock Aspect Ratio</span></label>
      <label>Aspect Ratio<select id="ratio">
        <option value="1">1:1</option><option value="1.3333333333">4:3</option>
        <option value="1.7777777778">16:9</option><option value="0.5625">9:16</option>
        <option value="custom">Custom</option>
      </select></label>
    </section>

    <section class="panel">
      <h2>Resize Mode</h2>
      <select id="mode"><option value="fill">Fill</option><option value="fit">Fit</option><option value="stretch">Stretch</option></select>
    </section>

    <section class="panel">
      <h2>Position</h2>
      <label>Zoom <output id="zoomOut">1.0×</output><input id="zoom" type="range" min="1" max="3" step=".1" value="1"></label>
      <label>Offset X <output id="xOut">0</output><input id="offsetX" type="range" min="0" max="0" value="0"></label>
      <label>Offset Y <output id="yOut">0</output><input id="offsetY" type="range" min="0" max="0" value="0"></label>
    </section>

    <section class="panel action-panel">
      <div class="progress"><div id="progressBar"></div></div>
      <div id="progressText">Ready</div>
      <button id="processBtn" class="primary">Process All Images</button>
      <button id="downloadBtn" class="secondary" disabled>Download ZIP</button>
    </section>
  </aside>
</main>
<script src="app.js"></script>
</body>
</html>