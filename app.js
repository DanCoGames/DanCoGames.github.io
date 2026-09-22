
const $ = id => document.getElementById(id);

const state = {
    files: [],
    selected: 0,
    images: [],
    processed: []
};

const fileInput = $("fileInput");
const dropzone = $("dropzone");


// ========================================
// IMPORT IMAGES
// ========================================

fileInput.addEventListener("change", function (e) {
    addFiles(Array.from(e.target.files));
});

dropzone.addEventListener("dragover", function (e) {
    e.preventDefault();
    dropzone.classList.add("drag");
});

dropzone.addEventListener("dragleave", function (e) {
    e.preventDefault();
    dropzone.classList.remove("drag");
});

dropzone.addEventListener("drop", function (e) {
    e.preventDefault();
    dropzone.classList.remove("drag");

    addFiles(Array.from(e.dataTransfer.files));
});


function addFiles(files) {

    files = files.filter(function (file) {
        return file.type && file.type.startsWith("image/");
    });

    if (files.length === 0) {
        return;
    }

    state.files.push(...files);

    for (let i = 0; i < files.length; i++) {
        state.images.push(null);
    }

    renderList();

    // If this is the first image
    if (state.files.length === files.length) {
        state.selected = 0;
        loadSelected();
    }
}


// ========================================
// FILE LIST
// ========================================

function renderList() {

    $("imageCount").textContent = state.files.length;

    const list = $("fileList");

    list.innerHTML = "";

    state.files.forEach(function (file, index) {

        const item = document.createElement("div");

        item.className =
            "file-item" +
            (index === state.selected ? " active" : "");

        const name = document.createElement("span");
        name.className = "file-name";
        name.textContent = file.name;

        const removeButton = document.createElement("button");
        removeButton.className = "file-remove";
        removeButton.type = "button";
        removeButton.title = "Remove image";
        removeButton.setAttribute("aria-label", "Remove " + file.name);
        removeButton.textContent = "×";

        removeButton.addEventListener("click", function (event) {
            event.stopPropagation();
            removeImage(index);
        });

        item.appendChild(name);
        item.appendChild(removeButton);

        item.addEventListener("click", function () {

            state.selected = index;

            renderList();
            loadSelected();

        });

        list.appendChild(item);
    });
}


// ========================================
// REMOVE IMAGE
// ========================================

function removeImage(index) {

    if (index < 0 || index >= state.files.length) {
        return;
    }

    state.files.splice(index, 1);
    state.images.splice(index, 1);

    // Processed output belongs to the previous image set.
    state.processed = [];

    $("downloadBtn").disabled = true;
    $("progressBar").style.width = "0%";
    $("progressText").textContent = "Ready";

    if (state.files.length === 0) {

        state.selected = 0;

        renderList();

        $("previewCanvas").hidden = true;
        $("emptyPreview").style.display = "block";
        $("selectedName").textContent = "No image selected";

        return;
    }

    // Keep the selection on a valid image.
    if (index < state.selected) {
        state.selected--;
    } else if (index === state.selected) {
        state.selected = Math.min(state.selected, state.files.length - 1);
    }

    renderList();
    loadSelected();
}


// ========================================
// LOAD IMAGE
// ========================================

function loadSelected() {

    const file = state.files[state.selected];

    if (!file) {
        return;
    }

    $("selectedName").textContent = file.name;

    const image = new Image();

    image.onload = function () {

        state.images[state.selected] = image;

        updateRanges();
        updatePreview();
    };

    image.onerror = function () {

        console.error("Could not load image:", file.name);

    };

    image.src = URL.createObjectURL(file);
}


// ========================================
// CONTROLS
// ========================================

const width = $("width");
const height = $("height");
const lock = $("aspectLock");
const ratio = $("ratio");
const mode = $("mode");
const zoom = $("zoom");
const ox = $("offsetX");
const oy = $("offsetY");
const outputFormat = $("outputFormat");


// ========================================
// ASPECT RATIO
// ========================================

ratio.addEventListener("change", function () {

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


width.addEventListener("input", function () {

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


height.addEventListener("input", function () {

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


[mode, zoom, ox, oy].forEach(function (element) {

    element.addEventListener("input", function () {

        updateRanges();
        updatePreview();

    });

});


// ========================================
// RANGE VALUES
// ========================================

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
        Number(zoom.value) || 1
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
        w + " × " + h;
}


// ========================================
// TRANSFORM
// ========================================

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

    const ctx =
        canvas.getContext("2d");


    // White background.
    // This is important when exporting JPG.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);


    const sw = source.naturalWidth;
    const sh = source.naturalHeight;


    // ------------------------------------
    // STRETCH
    // ------------------------------------

    if (resizeMode === "stretch") {

        ctx.drawImage(
            source,
            0,
            0,
            w,
            h
        );

    }


    // ------------------------------------
    // FIT
    // ------------------------------------

    else if (resizeMode === "fit") {

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

    }


    // ------------------------------------
    // FILL
    // ------------------------------------

    else {

        const targetRatio = w / h;
        const sourceRatio = sw / sh;

        let cropWidth;
        let cropHeight;
        let cropX;
        let cropY;


        if (sourceRatio > targetRatio) {

            cropHeight = sh;
            cropWidth = sh * targetRatio;

            cropX =
                (sw - cropWidth) / 2;

            cropY = 0;

        } else {

            cropWidth = sw;
            cropHeight = sw / targetRatio;

            cropX = 0;

            cropY =
                (sh - cropHeight) / 2;
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
    }


    // ------------------------------------
    // ZOOM
    // ------------------------------------

    if (zoomAmount > 1) {

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


        result
            .getContext("2d")
            .drawImage(
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


    return canvas;
}


// ========================================
// PREVIEW
// ========================================

function updatePreview() {

    const image =
        state.images[state.selected];

    if (!image) {
        return;
    }


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


    const max = 600;

    const scale = Math.min(
        max / canvas.width,
        max / canvas.height,
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
        preview.height
    );

    ctx.drawImage(
        canvas,
        0,
        0
    );


    preview.hidden = false;

    $("emptyPreview").style.display =
        "none";
}


// ========================================
// OUTPUT FORMAT
// ========================================

function getFormat() {

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


// ========================================
// CANVAS TO BLOB
// ========================================

function canvasToBlob(
    canvas,
    mime,
    quality
) {

    return new Promise(function (resolve) {

        canvas.toBlob(
            function (blob) {
                resolve(blob);
            },
            mime,
            quality
        );

    });
}


// ========================================
// PROCESS
// ========================================

$("processBtn").addEventListener(
    "click",
    async function () {

        if (state.files.length === 0) {

            alert(
                "Please add at least one image."
            );

            return;
        }


        state.processed = [];

        $("progressBar").style.width =
            "0%";

        $("progressText").textContent =
            "Processing...";


        const format =
            getFormat();


        try {

            for (
                let i = 0;
                i < state.files.length;
                i++
            ) {

                // Load image if not already loaded
                if (!state.images[i]) {

                    await new Promise(
                        function (resolve, reject) {

                            const img =
                                new Image();

                            img.onload =
                                function () {

                                    state.images[i] =
                                        img;

                                    resolve();
                                };

                            img.onerror =
                                function () {

                                    reject(
                                        new Error(
                                            "Unable to load " +
                                            state.files[i].name
                                        )
                                    );
                                };

                            img.src =
                                URL.createObjectURL(
                                    state.files[i]
                                );
                        }
                    );
                }


                const canvas = transform(
                    state.images[i],
                    Number(width.value),
                    Number(height.value),
                    mode.value,
                    Number(zoom.value),
                    Number(ox.value),
                    Number(oy.value)
                );


                const blob =
                    await canvasToBlob(
                        canvas,
                        format.mime,
                        format.quality
                    );


                if (!blob) {

                    throw new Error(
                        "The browser could not create " +
                        format.mime
                    );
                }


                const original =
                    state.files[i].name;


                const baseName =
                    original.replace(
                        /\.[^/.]+$/,
                        ""
                    );


                state.processed.push({

                    name:
                        baseName +
                        format.extension,

                    blob: blob
                });


                const percent =
                    ((i + 1) /
                    state.files.length) *
                    100;


                $("progressBar").style.width =
                    percent + "%";


                $("progressText").textContent =
                    "Processed " +
                    (i + 1) +
                    " of " +
                    state.files.length;
            }


            $("downloadBtn").disabled =
                false;


            $("progressText").textContent =
                "All images processed!";


        } catch (error) {

            console.error(error);

            $("progressText").textContent =
                "Conversion failed";

            alert(
                "Conversion failed:\n\n" +
                error.message
            );
        }
    }
);


// ========================================
// DOWNLOAD ZIP
// ========================================

$("downloadBtn").addEventListener(
    "click",
    async function () {

        if (
            state.processed.length === 0
        ) {
            return;
        }


        // JSZip available
        if (
            typeof JSZip !==
            "undefined"
        ) {

            $("progressText").textContent =
                "Creating ZIP...";


            const zip =
                new JSZip();


            state.processed.forEach(
                function (file) {

                    zip.file(
                        file.name,
                        file.blob
                    );

                }
            );


            const blob =
                await zip.generateAsync({
                    type: "blob"
                });


            downloadBlob(
                blob,
                "CropVert-images.zip"
            );


            $("progressText").textContent =
                "ZIP downloaded!";


            return;
        }


        // Fallback if JSZip doesn't load
        state.processed.forEach(
            function (file, index) {

                setTimeout(
                    function () {

                        downloadBlob(
                            file.blob,
                            file.name
                        );

                    },
                    index * 200
                );
            }
        );
    }
);


// ========================================
// DOWNLOAD
// ========================================

function downloadBlob(
    blob,
    filename
) {

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download = filename;

    document.body.appendChild(link);

    link.click();

    link.remove();


    setTimeout(
        function () {

            URL.revokeObjectURL(url);

        },
        1000
    );
}


// ========================================
// CLEAR
// ========================================

$("clearBtn").addEventListener(
    "click",
    function () {

        state.files = [];
        state.images = [];
        state.processed = [];
        state.selected = 0;


        renderList();


        $("previewCanvas").hidden =
            true;


        $("emptyPreview").style.display =
            "block";


        $("selectedName").textContent =
            "No image selected";


        $("downloadBtn").disabled =
            true;


        $("progressBar").style.width =
            "0%";


        $("progressText").textContent =
            "Ready";


        fileInput.value = "";
    }
);


// ========================================
// JSZIP
// ========================================

const jszip =
    document.createElement("script");

jszip.src =
    "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";

document.head.appendChild(jszip);


// ========================================
// START
// ========================================

updateRanges();

