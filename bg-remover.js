// ========================================
// BACKGROUND REMOVER LOGIC
// ========================================

const bgFileInput = document.getElementById('bgFileInput');
const bgDropzone = document.getElementById('bgDropzone');
const previewImage = document.getElementById('previewImage');
const bgEmptyPreview = document.getElementById('bgEmptyPreview');
const bgPreviewArea = document.getElementById('bgPreviewArea');
const processBtn = document.getElementById('processBtn');
const downloadBtn = document.getElementById('downloadBtn');
const imageStatus = document.getElementById('imageStatus');
const previewStatus = document.getElementById('previewStatus');
const loadingText = document.getElementById('loadingText');

let currentFile = null;
let processedBlob = null;

// ========================================
// HANDLE UPLOADS & DRAG/DROP
// ========================================

bgFileInput.addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
        loadImage(e.target.files[0]);
    }
});

bgDropzone.addEventListener('dragover', function(e) {
    e.preventDefault();
    bgDropzone.classList.add('drag');
});

bgDropzone.addEventListener('dragleave', function(e) {
    e.preventDefault();
    bgDropzone.classList.remove('drag');
});

bgDropzone.addEventListener('drop', function(e) {
    e.preventDefault();
    bgDropzone.classList.remove('drag');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith("image/")) {
            loadImage(file);
        }
    }
});

function loadImage(file) {
    currentFile = file;
    processedBlob = null; // reset output

    // Update UI
    imageStatus.textContent = "1 image loaded";
    previewStatus.textContent = "Original Image";
    processBtn.disabled = false;
    downloadBtn.disabled = true;
    
    // Show original image
    previewImage.src = URL.createObjectURL(file);
    previewImage.style.display = 'block';
    bgEmptyPreview.style.display = 'none';
    bgPreviewArea.classList.remove('transparent-bg'); // Remove checkered background
}

// ========================================
// PROCESS (REMOVE BACKGROUND)
// ========================================

processBtn.addEventListener('click', async function() {
    if (!currentFile) return;

    // UI Loading state
    processBtn.disabled = true;
    processBtn.textContent = "Processing...";
    loadingText.style.display = "block";

    try {
        // Run imgly AI Background removal
        processedBlob = await imglyRemoveBackground(currentFile);
        
        // Show result
        previewImage.src = URL.createObjectURL(processedBlob);
        bgPreviewArea.classList.add('transparent-bg'); // Add checkered background to see transparency
        
        previewStatus.textContent = "Background Removed!";
        downloadBtn.disabled = false;
    } catch (error) {
        console.error("AI Error:", error);
        alert("Something went wrong while removing the background. Check console for details.");
    } finally {
        // Reset UI state
        processBtn.disabled = false;
        processBtn.textContent = "Remove Background";
        loadingText.style.display = "none";
    }
});

// ========================================
// DOWNLOAD RESULT
// ========================================

downloadBtn.addEventListener('click', function() {
    if (!processedBlob) return;

    const originalName = currentFile.name.replace(/\.[^/.]+$/, "");
    const newName = originalName + "-nobg.png";

    const url = URL.createObjectURL(processedBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = newName;
    
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    setTimeout(() => URL.revokeObjectURL(url), 1000);
});
