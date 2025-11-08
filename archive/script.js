// AI Image Generator Pro JavaScript
class ImageGenerator {
    constructor() {
        // Main elements
        this.promptInput = document.getElementById('promptInput');
        this.generateButton = document.getElementById('generateButton');
        this.buttonText = document.getElementById('buttonText');
        this.spinner = document.getElementById('spinner');
        this.loadingContainer = document.getElementById('loadingContainer');
        this.errorContainer = document.getElementById('errorContainer');
        this.imageContainer = document.getElementById('imageContainer');
        this.placeholderContainer = document.getElementById('placeholderContainer');
        this.generatedImage = document.getElementById('generatedImage');
        this.errorMessage = document.getElementById('errorMessage');
        this.imagePrompt = document.getElementById('imagePrompt');
        
        // New feature elements
        this.randomPromptButton = document.getElementById('randomPromptButton');
        this.downloadButton = document.getElementById('downloadButton');
        this.editButton = document.getElementById('editButton');
        this.saveToGalleryButton = document.getElementById('saveToGalleryButton');
        this.galleryContainer = document.getElementById('galleryContainer');
        this.clearGalleryButton = document.getElementById('clearGalleryButton');
        
        // Editor elements
        this.editorModal = document.getElementById('editorModal');
        this.editorCanvas = document.getElementById('editorCanvas');
        this.closeEditor = document.getElementById('closeEditor');
        this.brightnessSlider = document.getElementById('brightnessSlider');
        this.contrastSlider = document.getElementById('contrastSlider');
        this.saturationSlider = document.getElementById('saturationSlider');
        this.blurSlider = document.getElementById('blurSlider');
        this.resetFilters = document.getElementById('resetFilters');
        this.applyFilters = document.getElementById('applyFilters');
        
        // State
        this.isLoading = false;
        this.currentImageData = null;
        this.currentPrompt = '';
        this.gallery = JSON.parse(localStorage.getItem('imageGallery') || '[]');
        this.editorContext = null;
        this.originalImageData = null;
        
        // Random prompts for inspiration
        this.randomPrompts = [
            "A serene Japanese garden with cherry blossoms and a koi pond",
            "A steampunk airship floating above Victorian London",
            "A mystical dragon perched on a crystal mountain peak",
            "A cozy library with floating books and magical glowing orbs",
            "A neon-lit cyberpunk street market in the rain",
            "A peaceful underwater city with coral architecture",
            "A majestic phoenix rising from golden flames",
            "A whimsical treehouse village connected by rope bridges",
            "A cosmic nebula with swirling galaxies and distant stars",
            "A medieval castle on a floating island in the clouds"
        ];
        
        this.init();
    }
    
    init() {
        // Main generation events
        this.generateButton.addEventListener('click', () => this.generateImage());
        this.promptInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.isLoading && this.promptInput.value.trim()) {
                this.generateImage();
            }
        });
        this.promptInput.addEventListener('input', () => this.updateButtonState());
        
        // Template buttons
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.promptInput.value = btn.dataset.prompt;
                this.updateButtonState();
            });
        });
        
        // Random prompt button
        this.randomPromptButton.addEventListener('click', () => this.setRandomPrompt());
        
        // Image action buttons
        this.downloadButton.addEventListener('click', () => this.downloadImage());
        this.editButton.addEventListener('click', () => this.openEditor());
        this.saveToGalleryButton.addEventListener('click', () => this.saveToGallery());
        
        // Gallery management
        this.clearGalleryButton.addEventListener('click', () => this.clearGallery());
        
        // Editor events
        this.closeEditor.addEventListener('click', () => this.closeEditorModal());
        this.resetFilters.addEventListener('click', () => this.resetEditorFilters());
        this.applyFilters.addEventListener('click', () => this.applyAndDownload());
        
        // Editor sliders
        [this.brightnessSlider, this.contrastSlider, this.saturationSlider, this.blurSlider].forEach(slider => {
            slider.addEventListener('input', () => this.updateEditorPreview());
        });
        
        // Close modal on outside click
        this.editorModal.addEventListener('click', (e) => {
            if (e.target === this.editorModal) {
                this.closeEditorModal();
            }
        });
        
        // Initialize UI
        this.updateButtonState();
        this.renderGallery();
    }
    
    updateButtonState() {
        const hasPrompt = this.promptInput.value.trim().length > 0;
        this.generateButton.disabled = !hasPrompt || this.isLoading;
    }
    
    showLoading() {
        this.isLoading = true;
        this.buttonText.textContent = '';
        this.spinner.classList.remove('hidden');
        this.loadingContainer.classList.remove('hidden');
        this.errorContainer.classList.add('hidden');
        this.imageContainer.classList.add('hidden');
        this.placeholderContainer.classList.add('hidden');
        this.promptInput.disabled = true;
        this.updateButtonState();
    }
    
    hideLoading() {
        this.isLoading = false;
        this.buttonText.textContent = 'Generate Image';
        this.spinner.classList.add('hidden');
        this.loadingContainer.classList.add('hidden');
        this.promptInput.disabled = false;
        this.updateButtonState();
    }
    
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorContainer.classList.remove('hidden');
        this.imageContainer.classList.add('hidden');
        this.placeholderContainer.classList.add('hidden');
    }
    
    showImage(imageUrl, prompt) {
        this.generatedImage.src = imageUrl;
        this.imagePrompt.textContent = prompt;
        this.imageContainer.classList.remove('hidden');
        this.errorContainer.classList.add('hidden');
        this.placeholderContainer.classList.add('hidden');
    }
    
    showPlaceholder() {
        this.placeholderContainer.classList.remove('hidden');
        this.errorContainer.classList.add('hidden');
        this.imageContainer.classList.add('hidden');
    }
    
    async generateImage() {
        const prompt = this.promptInput.value.trim();
        if (!prompt) return;
        
        this.showLoading();
        this.currentPrompt = prompt;
        
        try {
            // Call our backend API instead of directly calling Google's API
            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt })
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || `Server error: ${response.status}`);
            }
            
            if (result.success && result.imageUrl) {
                this.currentImageData = result.imageUrl;
                this.hideLoading();
                this.showImage(result.imageUrl, prompt);
            } else {
                throw new Error('Invalid response from server');
            }
            
        } catch (error) {
            console.error('Error generating image:', error);
            this.hideLoading();
            this.showError(error.message || 'Failed to generate image. Please try again.');
        }
    }
    
    setRandomPrompt() {
        const randomIndex = Math.floor(Math.random() * this.randomPrompts.length);
        this.promptInput.value = this.randomPrompts[randomIndex];
        this.updateButtonState();
    }
    
    downloadImage() {
        if (!this.currentImageData) return;
        
        const link = document.createElement('a');
        link.download = `ai-generated-${Date.now()}.png`;
        link.href = this.currentImageData;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    saveToGallery() {
        if (!this.currentImageData || !this.currentPrompt) return;
        
        const imageItem = {
            id: Date.now(),
            imageUrl: this.currentImageData,
            prompt: this.currentPrompt,
            timestamp: new Date().toISOString()
        };
        
        this.gallery.unshift(imageItem);
        
        // Keep only last 20 images
        if (this.gallery.length > 20) {
            this.gallery = this.gallery.slice(0, 20);
        }
        
        localStorage.setItem('imageGallery', JSON.stringify(this.gallery));
        this.renderGallery();
    }
    
    clearGallery() {
        if (confirm('Are you sure you want to clear all saved images?')) {
            this.gallery = [];
            localStorage.removeItem('imageGallery');
            this.renderGallery();
        }
    }
    
    renderGallery() {
        if (this.gallery.length === 0) {
            this.galleryContainer.innerHTML = `
                <div class="gallery-empty">
                    <p>No saved images yet. Generate and save some images to see them here!</p>
                </div>
            `;
            return;
        }
        
        this.galleryContainer.innerHTML = this.gallery.map(item => `
            <div class="gallery-item" data-id="${item.id}">
                <img src="${item.imageUrl}" alt="Generated image" />
                <div class="gallery-item-overlay">
                    <p>${item.prompt.substring(0, 50)}${item.prompt.length > 50 ? '...' : ''}</p>
                </div>
                <div class="gallery-item-actions">
                    <button class="gallery-action-btn" onclick="imageGenerator.downloadGalleryImage('${item.imageUrl}', '${item.prompt}')" title="Download">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7,10 12,15 17,10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                    </button>
                    <button class="gallery-action-btn" onclick="imageGenerator.removeFromGallery(${item.id})" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3,6 5,6 21,6"/>
                            <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    downloadGalleryImage(imageUrl, prompt) {
        const link = document.createElement('a');
        link.download = `${prompt.substring(0, 30).replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.png`;
        link.href = imageUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    removeFromGallery(id) {
        this.gallery = this.gallery.filter(item => item.id !== id);
        localStorage.setItem('imageGallery', JSON.stringify(this.gallery));
        this.renderGallery();
    }
    
    openEditor() {
        if (!this.currentImageData) return;
        
        this.editorModal.classList.remove('hidden');
        
        const img = new Image();
        img.onload = () => {
            const canvas = this.editorCanvas;
            const ctx = canvas.getContext('2d');
            
            // Set canvas size to image size (with max dimensions)
            const maxSize = 500;
            let { width, height } = img;
            
            if (width > height) {
                if (width > maxSize) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            ctx.drawImage(img, 0, 0, width, height);
            this.originalImageData = ctx.getImageData(0, 0, width, height);
            this.editorContext = ctx;
            
            this.resetEditorFilters();
        };
        img.src = this.currentImageData;
    }
    
    closeEditorModal() {
        this.editorModal.classList.add('hidden');
    }
    
    resetEditorFilters() {
        this.brightnessSlider.value = 100;
        this.contrastSlider.value = 100;
        this.saturationSlider.value = 100;
        this.blurSlider.value = 0;
        this.updateEditorPreview();
    }
    
    updateEditorPreview() {
        if (!this.editorContext || !this.originalImageData) return;
        
        const canvas = this.editorCanvas;
        const ctx = this.editorContext;
        
        // Reset to original
        ctx.putImageData(this.originalImageData, 0, 0);
        
        // Apply filters
        const brightness = this.brightnessSlider.value;
        const contrast = this.contrastSlider.value;
        const saturation = this.saturationSlider.value;
        const blur = this.blurSlider.value;
        
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`;
        
        // Redraw with filters
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        tempCtx.putImageData(this.originalImageData, 0, 0);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(tempCanvas, 0, 0);
        
        // Reset filter for future operations
        ctx.filter = 'none';
    }
    
    applyAndDownload() {
        if (!this.editorContext) return;
        
        const canvas = this.editorCanvas;
        const link = document.createElement('a');
        link.download = `edited-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.closeEditorModal();
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.imageGenerator = new ImageGenerator();
});
