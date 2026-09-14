
const $ = id => document.getElementById(id);

const state = {
    files: [],
    selected: 0,
    images: [],
    processed: []
};

const fileInput = $("fileInput");
const dropzone = $("dropzone");


// ==============================
// FILE INPUT
// ==============================

fileInput.addEventListener("change", e => {
    addFiles([...e.target.files]);
});

["dragenter", "dragover"].forEach(type => {
    dropzone.addEventListener(type, e => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add("drag");
    });
});

["dragleave", "drop"].forEach(type => {
    dropzone.addEventListener(type, e => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove("drag");
    });
});

dropzone.addEventListener("drop", e => {
    addFiles([...e.dataTransfer.files]);
});


// ==============================
// ADD FILES
// ==============================

function addFiles(files) {

    files = files.filter(file =>
        file.type.startsWith("image/")
    );

    if (!files.length) return;

    state.files.push(...files);
    state.images.push(...files.map(() => null));

    renderList();

    if (state.files.length === files.length) {
        state.selected = 0;
        loadSelected();
    }
}


// ==============================
// FILE LIST
// ==============================

function renderList() {

    $("imageCount").textContent = state.files.length;

    const list = $("fileList");

    list.innerHTML = "";

    state.files.forEach((file, index) => {

        const item = document.createElement("div");

        item.className =
            "file-item" +
            (index === state.selected ? " active" : "");

        item.textContent = file.name;

        item.title = file.name;

        item.addEventListener("click", () => {

            state.selected = index;

            renderList();

            loadSelected();
        });

        list.appendChild(item);
    });
}


// ==============================
// LOAD SELECTED IMAGE
// ==============================

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

    img.onerror = () => {
        alert("Could not load this image.");
    };

    img.src = URL.createObjectURL(file);
}


// ==============================
// CONTROLS
// ==============================

const width = $("width");
const height = $("height");
const lock = $("aspectLock");
const ratio = $("ratio");
const mode = $("mode");
const zoom = $("zoom");
const ox = $("offsetX");
const oy = $("offsetY");
const outputFormat = $("outputFormat");


// ==============================
// ASPECT RATIO
// ==============================

ratio.addEventListener("change", () => {

    if (
        ratio.value !== "custom" &&
        lock.checked
    ) {

        height.value = Math.max(
            1,
            Math.round(
                Number(width.value) /
                Number(ratio.value)
            )
        );

        updateRanges();
        updatePreview();
    }
});


width.addEventListener("input", () => {

    if (
        lock.checked &&
        ratio.value !== "custom"
    ) {

        height.value = Math.max(
            1,
            Math.round(
                Number(width.value) /
                Number(ratio.value)
            )
        );
    }

    updateRanges();
    updatePreview();
});


height.addEventListener("input", () => {

    if (
        lock.checked &&
        ratio.value !== "custom"
    ) {

        width.value = Math.max(
            1,
            Math.round(
                Number(height.value) *
                Number(ratio.value)
            )
        );
    }

    updateRanges();
    updatePreview();
});


[mode, zoom, ox, oy].forEach(element => {

    element.addEventListener("input", () => {

        updateRanges();
        updatePreview();

    });

});


// ==============================
// UPDATE RANGES
// ==============================

function updateRanges() {

    const w = Math.max(
        1,
        Number(width.value) || 1
    );

    const h = Math.max(
        1,
        Number(height.value) || 1
    );

    const z = Math.max(
        1,
        Number(zoom.value)
    );


    ox.max = Math.max(
        0,
        Math.floor(w - w / z)
    );

    oy.max = Math.max(
        0,
        Math.floor(h - h / z)
    );


    ox.value = Math.min(
        Number(ox.value),
        Number(ox.max)
    );

    oy.value = Math.min(
        Number(oy.value),
        Number(oy.max)
    );


    $("zoomOut").textContent =
        Number(zoom.value).toFixed(1) + "×";

    $("xOut").textContent = ox.value;

    $("yOut").textContent = oy.value;


    $("previewDimensions").textContent =
        `${w} × ${h}`;
}


// ==============================
// TRANSFORM IMAGE
// ==============================

function transform(
    source,
    w,
    h,
    resizeMode,
    zoomAmount,
    offsetX,
    offsetY
) {

    const canvas =
        document.createElement("canvas");

    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");


    // Important for JPG
    // JPG cannot contain transparency.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);


    const sw = source.naturalWidth;
    const sh = source.naturalHeight;


    // ==========================
    // STRETCH
    // ==========================

    if (resizeMode === "stretch") {

        ctx.drawImage(
            source,
            0,
            0,
            w,
            h
        );

        return applyZoom(
            canvas,
            w,
            h,
            zoomAmount,
            offsetX,
            offsetY
        );
    }


    // ==========================
    // FIT
    // ==========================

    if (resizeMode === "fit") {

        const scale = Math.min(
            w / sw,
            h / sh
        );

        const dw = sw * scale;
        const dh = sh * scale;

        ctx.drawImage(
            source,
            (w - dw) / 2,
            (h - dh) / 2,
            dw,
            dh
        );

        return applyZoom(
            canvas,
            w,
            h,
            zoomAmount,
            offsetX,
            offsetY
        );
    }


    // ==========================
    // FILL
    // ==========================

    const targetRatio = w / h;
    const sourceRatio = sw / sh;

    let cropWidth;
    let cropHeight;
    let cropX;
    let cropY;


    if (sourceRatio > targetRatio) {

        cropHeight = sh;
        cropWidth = sh * targetRatio;

        cropX = (sw - cropWidth) / 2;
        cropY = 0;

    } else {

        cropWidth = sw;
        cropHeight = sw / targetRatio;

        cropX = 0;
        cropY = (sh - cropHeight) / 2;
    }


    ctx.drawImage(
        source,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        w,
        h
    );


    return applyZoom(
        canvas,
        w,
        h,
        zoomAmount,
        offsetX,
        offsetY
    );
}


// ==============================
// APPLY ZOOM
// ==============================

function applyZoom(
    canvas,
    w,
    h,
    zoomAmount,
    offsetX,
    offsetY
) {

    if (zoomAmount <= 1) {
        return canvas;
    }


    const cropW = w / zoomAmount;
    const cropH = h / zoomAmount;


    const x = Math.max(
        0,
        Math.min(
            Number(offsetX),
            w - cropW
        )
    );


    const y = Math.max(
        0,
        Math.min(
            Number(offsetY),
            h - cropH
        )
    );


    const result =
        document.createElement("canvas");

    result.width = w;
    result.height = h;


    const ctx = result.getContext("2d");

    ctx.drawImage(
        canvas,
        x,
        y,
        cropW,
        cropH,
        0,
        0,
        w,
        h
    );


    return result;
}


// ==============================
// PREVIEW
// ==============================

function updatePreview() {

    const image =
        state.images[state.selected];

    if (!image) return;


    const canvas = transform(
        image,
        Number(width.value),
        Number(height.value),
        mode.value,
        Number(zoom.value),
        Number(ox.value),
        Number(oy.value)
    );


    const preview =
        $("previewCanvas");

    const maxSize = 600;

    const scale = Math.min(
        maxSize / canvas.width,
        maxSize / canvas.height,
        1
    );


    preview.width = canvas.width;
    preview.height = canvas.height;

    preview.style.width =
        canvas.width * scale + "px";

    preview.style.height =
        canvas.height * scale + "px";


    const ctx =
        preview.getContext("2d");

    ctx.clearRect(
        0,
        0,
        preview.width,

