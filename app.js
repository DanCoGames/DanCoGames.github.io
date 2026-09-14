const $ = id => document.getElementById(id);

const state = {
  files: [],
  selected: 0,
  images: [],
  processed: []
};

const fileInput = $("fileInput");
const dropzone = $("dropzone");

fileInput.addEventListener("change", e => {
  addFiles([...e.target.files]);
});

["dragenter", "dragover"].forEach(x =>
  dropzone.addEventListener(x, e => {
    e.preventDefault();
    dropzone.classList.add("drag");
  })
);

["dragleave", "drop"].forEach(x =>
  dropzone.addEventListener(x, e => {
    e.preventDefault();
    dropzone.classList.remove("drag");
  })
);

dropzone.addEventListener("drop", e => {
  addFiles([...e.dataTransfer.files]);
});

function addFiles(files) {
  files = files.filter(f => f.type.startsWith("image/"));

  state.files.push(...files);
  state.images.push(...files.map(() => null));

  renderList();

  if (state.files.length && !state.images[state.selected]) {
    loadSelected();
  }
}

function renderList() {
  $("imageCount").textContent = state.files.length;

  const list = $("fileList");
  list.innerHTML = "";

  state.files.forEach((f, i) => {
    const el = document.createElement("div");

    el.className =
      "file-item" + (i === state.selected ? " active" : "");

    el.textContent = f.name;

    el.onclick = () => {
      state.selected = i;
      renderList();
      loadSelected();
    };

    list.appendChild(el);
  });
}

function loadSelected() {
  const file = state.files[state.selected];

  if (!file) return;

  $("selectedName").textContent = file.name;

  const img = new Image();

  img.onload = () => {
    state.images[state.selected] = img;
    updateRanges();
    updatePreview();
  };

  img.src = URL.createObjectURL(file);
}

const width = $("width");
const height = $("height");
const lock = $("aspectLock");
const ratio = $("ratio");
const mode = $("mode");
const zoom = $("zoom");
const ox = $("offsetX");
const oy = $("offsetY");
const outputFormat = $("outputFormat");

ratio.addEventListener("change", () => {
  if (ratio.value !== "custom" && lock.checked) {
    height.value = Math.max(
      1,
      Math.round(+width.value / +ratio.value)
    );

    updateRanges();
    updatePreview();
  }
});

width.addEventListener("input", () => {
  if (lock.checked && ratio.value !== "custom") {
    height.value = Math.max(
      1,
      Math.round(+width.value / +ratio.value)
    );
  }

  updateRanges();
  updatePreview();
});

height.addEventListener("input", () => {
  if (lock.checked && ratio.value !== "custom") {
    width.value = Math.max(
      1,
      Math.round(+height.value * +ratio.value)
    );
  }

  updateRanges();
  updatePreview();
});

[mode, zoom, ox, oy].forEach(x =>
  x.addEventListener("input", () => {
    updateRanges();
    updatePreview();
  })
);

function updateRanges() {
  const w = Math.max(1, +width.value || 1);
  const h = Math.max(1, +height.value || 1);
  const z = Math.max(1, +zoom.value);

  ox.max = Math.max(0, Math.floor(w - w / z));
  oy.max = Math.max(0, Math.floor(h - h / z));

  ox.value = Math.min(+ox.value, +ox.max);
  oy.value = Math.min(+oy.value, +oy.max);

  $("zoomOut").textContent =
    Number(zoom.value).toFixed(1) + "×";

  $("xOut").textContent = ox.value;
  $("yOut").textContent = oy.value;

  $("previewDimensions").textContent =
    `${w} × ${h}`;
}

function transform(src, w, h, m, z, x, y) {
  const c = document.createElement("canvas");

  c.width = w;
  c.height = h;

  const ctx = c.getContext("2d");

  let sx = 0;
  let sy = 0;
  let sw = src.naturalWidth;
  let sh = src.naturalHeight;

  if (m === "stretch") {
    ctx.drawImage(src, 0, 0, w, h);
    return c;
  }

  if (m === "fit") {
    const s = Math.min(w / sw, h / sh);

    const dw = sw * s;
    const dh = sh * s;

    // White background for JPG/WebP/PNG compatibility
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);

    ctx.drawImage(
      src,
      (w - dw) / 2,
      (h - dh) / 2,
      dw,
      dh
    );
  } else {
    const target = w / h;
    const source = sw / sh;

    if (source > target) {
      sh = sw / target;
      sx = (src.naturalWidth - sh * target) / 2;
      sw = sh * target;
    } else {
      sw = sh * target;
      sw = Math.min(sw, src.naturalWidth);

      sh = sw / target;
      sy = (src.naturalHeight - sh) / 2;
    }

    ctx.drawImage(
      src,
      sx,
      sy,
      sw,
      sh,
      0,
      0,
      w,
      h
    );
  }

  if (z !== 1) {
    const cw = w / z;
    const ch = h / z;

    const tx = Math.max(
      0,
      Math.min(+x, w - cw)
    );

    const ty = Math.max(
      0,
      Math.min(+y, h - ch)
    );

    const temp = document.createElement("canvas");

    temp.width = w;
    temp.height = h;

    temp
      .getContext("2d")
      .drawImage(
        c,
        tx,
        ty,
        cw,
        ch,
        0,
        0,
        w,
        h
      );

    return temp;
  }

  return c;
}

function getOutputSettings() {
  const format = outputFormat.value;

  if (format === "jpeg") {
    return {
      mime: "image/jpeg",
      extension: ".jpg",
      quality: 0.92
    };
  }

  if (format === "webp") {
    return {
      mime: "image/webp",
      extension: ".webp",
      quality: 0.92
    };
  }

  return {
    mime: "image/png",
    extension: ".png",
    quality: undefined
  };
}

function canvasToBlob(canvas, settings) {
  return new Promise(resolve => {
    canvas.toBlob(
      resolve,
      settings.mime,
      settings.quality
    );
  });
}

function getOutputName(originalName, extension) {
  return originalName.replace(/\.[^.]+$/, "") + extension;
}

function updatePreview() {
  const img = state.images[state.selected];

  if (!img) return;

  const c = transform(
    img,
    +width.value,
    +height.value,
    mode.value,
    +zoom.value,
    +ox.value,
    +oy.value
  );

  const canvas = $("previewCanvas");

  const max = 600;

  const s = Math.min(
    max / c.width,
    max / c.height,
    1
  );

  canvas.width = c.width;
  canvas.height = c.height;

  canvas.style.width = c.width * s + "px";
  canvas.style.height = c.height * s + "px";

  canvas
    .getContext("2d")
    .drawImage(c, 0, 0);

  canvas.hidden = false;

  $("emptyPreview").style.display = "none";
}

$("processBtn").onclick = async () => {
  if (!state.files.length) {
    alert("Add at least one image.");
    return;
  }

  state.processed = [];

  $("progressBar").style.width = "0%";
  $("progressText").textContent = "Processing...";

  const settings = getOutputSettings();

  for (let i = 0; i < state.files.length; i++) {

    if (!state.images[i]) {
      await new Promise(resolve => {
        const im = new Image();

        im.onload = () => {
          state.images[i] = im;
          resolve();
        };

        im.src = URL.createObjectURL(
          state.files[i]
        );
      });
    }

    const c = transform(
      state.images[i],
      +width.value,
      +height.value,
      mode.value,
      +zoom.value,
      +ox.value,
      +oy.value
    );

    const blob = await canvasToBlob(
      c,
      settings
    );

    state.processed.push({
      name: getOutputName(
        state.files[i].name,
        settings.extension
      ),
      blob
    });

    const pct =
      ((i + 1) / state.files.length) * 100;

    $("progressBar").style.width =
      pct + "%";

    $("progressText").textContent =
      `Processed ${i + 1} of ${state.files.length}`;

    await new Promise(r => setTimeout(r, 0));
  }

  $("downloadBtn").disabled = false;

  $("progressText").textContent =
    "All images processed!";
};

$("downloadBtn").onclick = async () => {
  if (!state.processed.length) return;

  if (typeof JSZip === "undefined") {
    state.processed.forEach((x, i) =>
      setTimeout(
        () => downloadBlob(x.blob, x.name),
        i * 150
      )
    );

    return;
  }

  const zip = new JSZip();

  state.processed.forEach(x => {
    zip.file(x.name, x.blob);
  });

  const blob = await zip.generateAsync({
    type: "blob"
  });

  downloadBlob(
    blob,
    "cropvert-images.zip"
  );
};

function downloadBlob(blob, name) {
  const a = document.createElement("a");

  a.href = URL.createObjectURL(blob);
  a.download = name;

  a.click();

  setTimeout(
    () => URL.revokeObjectURL(a.href),
    1000
  );
}

$("clearBtn").onclick = () => {
  state.files = [];
  state.images = [];
  state.processed = [];
  state.selected = 0;

  renderList();

  $("previewCanvas").hidden = true;

  $("emptyPreview").style.display = "block";

  $("selectedName").textContent =
    "No image selected";

  $("downloadBtn").disabled = true;

  $("progressBar").style.width = "0%";

  $("progressText").textContent = "Ready";

  fileInput.value = "";
};

updateRanges();

// Load JSZip
const s = document.createElement("script");

s.src =
  "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";

document.head.appendChild(s);
```
