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
        
        // Generation settings
        this.widthInput = document.getElementById('widthInput');
        this.heightInput = document.getElementById('heightInput');
        this.modelSelect = document.getElementById('modelSelect');
        this.seedInput = document.getElementById('seedInput');
        this.randomizeSeedCheckbox = document.getElementById('randomizeSeedCheckbox');
        this.autoCropCheckbox = document.getElementById('autoCropCheckbox');

        // Social / feedback / caption elements
        this.likeButton = document.getElementById('likeButton');
        this.dislikeButton = document.getElementById('dislikeButton');
        this.likeCountEl = document.getElementById('likeCount');
        this.dislikeCountEl = document.getElementById('dislikeCount');
        this.captionInput = document.getElementById('captionInput');
        this.shareXButton = document.getElementById('shareXButton');
        this.shareFBButton = document.getElementById('shareFBButton');
        this.shareWAButton = document.getElementById('shareWAButton');
        this.copyLinkButton = document.getElementById('copyLinkButton');
        
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
        this.currentLikes = 0;
        this.currentDislikes = 0;
        this.feedbackStats = this.loadFeedbackStats();
        
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
        
        // Feedback and share events
        this.likeButton.addEventListener('click', () => this.onFeedback('like'));
        this.dislikeButton.addEventListener('click', () => this.onFeedback('dislike'));
        this.shareXButton.addEventListener('click', () => this.shareTo('x'));
        this.shareFBButton.addEventListener('click', () => this.shareTo('fb'));
        this.shareWAButton.addEventListener('click', () => this.shareTo('wa'));
        this.copyLinkButton.addEventListener('click', () => this.copyCaption());

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
        
        // Gather generation settings
        const width = parseInt(this.widthInput?.value || '512', 10) || 512;
        const height = parseInt(this.heightInput?.value || '512', 10) || 512;
        const model = this.selectModelByPreference(this.modelSelect?.value || 'flux');
        const randomizeSeed = !!(this.randomizeSeedCheckbox && this.randomizeSeedCheckbox.checked);
        const manualSeed = this.seedInput?.value ? parseInt(this.seedInput.value, 10) : undefined;
        const seed = randomizeSeed || manualSeed === undefined || Number.isNaN(manualSeed)
          ? Math.floor(Math.random() * 1_000_000)
          : manualSeed;
        const shouldAutoCrop = !!(this.autoCropCheckbox && this.autoCropCheckbox.checked);

        try {
            // Call our backend API
            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, width, height, model, seed })
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || `Server error: ${response.status}`);
            }
            
            if (result.success && result.imageUrl) {
                const processed = shouldAutoCrop
                  ? await this.autoCropBottomStrip(result.imageUrl)
                  : result.imageUrl;
                this.currentImageData = processed;
                this.hideLoading();
                this.showImage(processed, prompt);
                // Reset and suggest caption
                this.currentLikes = 0;
                this.currentDislikes = 0;
                this.updateFeedbackUI();
                this.captionInput.value = this.suggestCaption(prompt);
                // Remember which model generated this image for feedback attribution
                this.currentModelUsed = model;
            } else {
                throw new Error('Invalid response from server');
            }
            
        } catch (error) {
            console.error('Error generating image:', error);
            this.hideLoading();
            this.showError(error.message || 'Failed to generate image. Please try again.');
        }
    }
    
    // Auto-crop a small bottom strip to remove typical watermark lines.
    // By default, crop 6% of the image height from the bottom.
    async autoCropBottomStrip(dataUrl, cropRatio = 0.06) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const cropH = Math.round(img.height * Math.min(Math.max(cropRatio, 0), 0.2));
                const targetW = img.width;
                const targetH = img.height - cropH;
                canvas.width = targetW;
                canvas.height = targetH;
                ctx.drawImage(img, 0, 0, targetW, targetH, 0, 0, targetW, targetH);
                try {
                    const out = canvas.toDataURL('image/png');
                    resolve(out);
                } catch (e) {
                    resolve(dataUrl);
                }
            };
            img.onerror = () => resolve(dataUrl);
            img.src = dataUrl;
        });
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

    // ----- Feedback & Captions -----
    onFeedback(type) {
        if (!this.currentImageData) return;
        if (type === 'like') this.currentLikes += 1;
        if (type === 'dislike') this.currentDislikes += 1;
        this.updateFeedbackUI();
        this.updateFeedbackStats(this.currentModelUsed || 'flux', type);
    }

    updateFeedbackUI() {
        if (this.likeCountEl) this.likeCountEl.textContent = String(this.currentLikes);
        if (this.dislikeCountEl) this.dislikeCountEl.textContent = String(this.currentDislikes);
    }

    suggestCaption(prompt) {
        const trimmed = (prompt || '').trim();
        if (!trimmed) return 'AI-generated image.';
        // Simple patterns for a nicer caption
        const now = new Date();
        const dateStr = now.toLocaleDateString();
        const endings = ['vibes', 'aesthetic', 'concept', 'style', 'vision'];
        const ending = endings[Math.floor(Math.random() * endings.length)];
        return `${trimmed} — ${ending}. Generated on ${dateStr}.`;
    }

    copyCaption() {
        const text = this.captionInput?.value || '';
        if (!navigator.clipboard) return;
        navigator.clipboard.writeText(text).catch(() => {});
    }

    shareTo(platform) {
        const text = encodeURIComponent(this.captionInput?.value || this.currentPrompt || 'Check this out!');
        let url = '';
        if (platform === 'x') {
            url = `https://twitter.com/intent/tweet?text=${text}`;
        } else if (platform === 'fb') {
            url = `https://www.facebook.com/sharer/sharer.php?u=&quote=${text}`;
        } else if (platform === 'wa') {
            url = `https://api.whatsapp.com/send?text=${text}`;
        }
        if (url) window.open(url, '_blank');
    }

    // ----- Gallery overrides (store caption/feedback) -----
    saveToGallery() {
        if (!this.currentImageData || !this.currentPrompt) return;

        const imageItem = {
            id: Date.now(),
            imageUrl: this.currentImageData,
            prompt: this.currentPrompt,
            caption: this.captionInput?.value || this.suggestCaption(this.currentPrompt),
            likes: this.currentLikes || 0,
            dislikes: this.currentDislikes || 0,
            model: this.currentModelUsed || 'flux',
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
                    <p>${(item.caption || item.prompt).substring(0, 50)}${(item.caption || item.prompt).length > 50 ? '...' : ''}</p>
                </div>
                <div class="gallery-item-actions">
                    <button class="gallery-action-btn" onclick="imageGenerator.downloadGalleryImage('${item.imageUrl}', '${(item.prompt || '').replace(/'/g, "\'")}')" title="Download">
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

    // ----- Preference learning (client-side heuristic) -----
    loadFeedbackStats() {
        const raw = localStorage.getItem('feedbackStats');
        if (raw) {
            try { return JSON.parse(raw); } catch {}
        }
        return { modelScores: { 'flux': 0, 'flux-realism': 0, 'sdxl': 0, 'turbo': 0 } };
    }

    persistFeedbackStats() {
        localStorage.setItem('feedbackStats', JSON.stringify(this.feedbackStats));
    }

    updateFeedbackStats(model, type) {
        if (!this.feedbackStats) this.feedbackStats = this.loadFeedbackStats();
        if (!this.feedbackStats.modelScores) this.feedbackStats.modelScores = { 'flux': 0, 'flux-realism': 0, 'sdxl': 0, 'turbo': 0 };
        const delta = type === 'like' ? 1 : type === 'dislike' ? -1 : 0;
        this.feedbackStats.modelScores[model] = (this.feedbackStats.modelScores[model] || 0) + delta;
        this.persistFeedbackStats();
    }

    selectModelByPreference(defaultModel) {
        const scores = (this.feedbackStats && this.feedbackStats.modelScores) || {};
        const models = ['flux', 'flux-realism', 'sdxl', 'turbo'];
        // 20% chance to explore randomly
        if (Math.random() < 0.2) {
            return models[Math.floor(Math.random() * models.length)];
        }
        // Otherwise, pick the highest scored model, fallback to default
        let best = defaultModel;
        let bestScore = -Infinity;
        models.forEach(m => {
            const s = (typeof scores[m] === 'number') ? scores[m] : (m === defaultModel ? 0 : -0.1);
            if (s > bestScore) { bestScore = s; best = m; }
        });
        return best;
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.imageGenerator = new ImageGenerator();
});
