/**
 * Artwork Window Application Module
 * Simple file manager window for artwork
 */

class ArtworkApp {
    constructor() {
        this.windowId = 'artwork-window';
        this.dockItemId = 'artwork-dock-item';
        this.window = null;
        this.dockItem = null;
        this.imagesLoaded = false;

        // List of images in pages/artwork directory
        this.images = [
            'you_met_me_at_a_very_strange_time_in_my_life.png',
            'cypherpunk.png',
            'princelessprincess.png',
            'rubedo.png'
        ];

        this.init();
    }

    init() {
        this.window = document.getElementById(this.windowId);
        this.dockItem = document.getElementById(this.dockItemId);

        if (!this.window) {
            return;
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Setup dock item click handler
        if (this.dockItem) {
            this.dockItem.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.open();
                return false;
            });
        }
    }

    loadImages() {
        const fileList = this.window.querySelector('.file-list');
        if (!fileList) return;

        // Always clear existing content
        fileList.innerHTML = '';

        // Create image items for each image
        this.images.forEach(imageName => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.style.cursor = 'pointer';

            // Add click handler to open image
            fileItem.addEventListener('click', () => {
                this.openImage(`pages/artwork/${imageName}`);
            });

            const img = document.createElement('img');
            img.src = `pages/artwork/${imageName}`;
            img.alt = imageName;
            img.style.width = '100%';
            img.style.height = 'auto';
            img.style.maxHeight = '120px';
            img.style.objectFit = 'contain';
            img.style.borderRadius = '4px';
            img.style.marginBottom = '8px';

            const fileName = document.createElement('div');
            fileName.className = 'file-name';
            fileName.textContent = imageName;

            fileItem.appendChild(img);
            fileItem.appendChild(fileName);
            fileList.appendChild(fileItem);
        });

        this.imagesLoaded = true;
    }

    openImage(imageSrc) {
        // Create modal overlay if it doesn't exist
        let modal = document.getElementById('artwork-image-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'artwork-image-modal';
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            modal.style.zIndex = '10000';
            modal.style.cursor = 'pointer';
            modal.style.opacity = '0';
            modal.style.transition = 'opacity 0.3s ease';

            // Close on click
            modal.addEventListener('click', () => {
                this.closeImage();
            });

            // Close on Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.style.display !== 'none') {
                    this.closeImage();
                }
            });

            document.body.appendChild(modal);
        }

        // Create or update image element
        let img = modal.querySelector('img');
        if (!img) {
            img = document.createElement('img');
            img.style.maxWidth = '90%';
            img.style.maxHeight = '90%';
            img.style.objectFit = 'contain';
            img.style.borderRadius = '8px';
            img.style.boxShadow = '0 0 40px rgba(168, 85, 247, 0.5)';
            img.style.cursor = 'default';
            // Prevent image clicks from closing the modal
            img.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            modal.appendChild(img);
        }

        img.src = imageSrc;
        modal.style.display = 'flex';

        // Animate in
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
        });
    }

    closeImage() {
        const modal = document.getElementById('artwork-image-modal');
        if (modal) {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    }

    open() {
        if (!this.window) return;

        // Load images when opening
        this.loadImages();

        // Use window manager if available
        if (window.WindowManager) {
            window.WindowManager.open(this.window, this.dockItem);
        } else {
            // Fallback
            const dockItems = document.querySelectorAll('.dock-item');
            dockItems.forEach(di => di.classList.remove('active'));
            if (this.dockItem) {
                this.dockItem.classList.add('active');
            }

            this.window.style.display = 'block';
            this.window.style.opacity = '0';
            this.window.style.transform = 'translate(-50%, -50%) scale(0.9)';

            void this.window.offsetHeight;

            requestAnimationFrame(() => {
                this.window.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                this.window.style.opacity = '1';
                this.window.style.transform = 'translate(-50%, -50%) scale(1)';
            });

            if (window.bringToFront) {
                window.bringToFront(this.window);
            }
        }
    }

    close() {
        if (this.dockItem) {
            this.dockItem.classList.remove('active');
        }
    }
}

// Expose class constructor for testing
window.ArtworkAppClass = ArtworkApp;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.ArtworkApp = new ArtworkApp();
    });
} else {
    window.ArtworkApp = new ArtworkApp();
}

// Expose open function globally for onclick handlers
window.openArtworkWindow = function() {
    if (window.ArtworkApp) {
        window.ArtworkApp.open();
    }
};
