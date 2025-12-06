/**
 * Ultra-Modern Image Modal/Lightbox
 * Features: Keyboard navigation, touch gestures, zoom controls, smooth animations
 */

class ImageModal {
    constructor() {
        this.modal = null;
        this.currentIndex = 0;
        this.images = [];
        this.zoomLevel = 1;
        this.init();
    }

    init() {
        // Create modal structure
        this.createModal();

        // Find all images that should open in modal
        this.collectImages();

        // Attach event listeners
        this.attachEventListeners();
    }

    createModal() {
        const modalHTML = `
            <div class="image-modal" id="imageModal">
                <div class="image-modal-backdrop"></div>
                <button class="image-modal-close" id="modalClose" aria-label="Close">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <div class="image-modal-counter" id="modalCounter">1 / 1</div>
                <div class="image-modal-container">
                    <button class="image-modal-nav image-modal-prev" id="modalPrev" aria-label="Previous">
                        <i class="fa-solid fa-chevron-left"></i>
                    </button>
                    <div class="image-modal-image-wrapper">
                        <img class="image-modal-image" id="modalImage" src="" alt="">
                        <div class="image-modal-loader" id="modalLoader" style="display: none;"></div>
                    </div>
                    <button class="image-modal-nav image-modal-next" id="modalNext" aria-label="Next">
                        <i class="fa-solid fa-chevron-right"></i>
                    </button>
                    <div class="image-modal-caption" id="modalCaption" style="display: none;">
                        <h3 id="modalCaptionTitle"></h3>
                        <p id="modalCaptionText"></p>
                    </div>
                </div>
                <div class="image-modal-zoom-controls">
                    <button class="zoom-btn" id="zoomOut" aria-label="Zoom Out">
                        <i class="fa-solid fa-minus"></i>
                    </button>
                    <button class="zoom-btn" id="zoomReset" aria-label="Reset Zoom">
                        <i class="fa-solid fa-expand"></i>
                    </button>
                    <button class="zoom-btn" id="zoomIn" aria-label="Zoom In">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('imageModal');
    }

    collectImages() {
        // Collect all gallery images
        const galleryImages = document.querySelectorAll('.gallery-img');
        galleryImages.forEach((img, index) => {
            const parent = img.closest('.gallery-item');
            const title = parent?.querySelector('.gallery-info h3')?.textContent || '';
            const description = parent?.querySelector('.gallery-info p')?.textContent || '';

            this.images.push({
                src: img.src,
                alt: img.alt,
                title: title,
                description: description,
                element: img
            });

            // Add click event to open modal
            img.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openModal(index);
            });

            // Make parent clickable too
            if (parent) {
                parent.addEventListener('click', () => this.openModal(index));
            }
        });

        // Collect executive images
        const execImages = document.querySelectorAll('.exec-img-wrapper img');
        execImages.forEach((img) => {
            const parent = img.closest('.exec-card');
            const title = parent?.querySelector('.exec-info h3')?.textContent || '';
            const role = parent?.querySelector('.role')?.textContent || '';

            this.images.push({
                src: img.src,
                alt: img.alt,
                title: title,
                description: role,
                element: img
            });

            const imgIndex = this.images.length - 1;
            img.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openModal(imgIndex);
            });
        });

        // Collect president image
        const presidentImage = document.querySelector('.president-img img');
        if (presidentImage) {
            const title = document.querySelector('.president-content h3')?.textContent || '';
            const role = document.querySelector('.president-content .role')?.textContent || '';

            this.images.push({
                src: presidentImage.src,
                alt: presidentImage.alt,
                title: title,
                description: role,
                element: presidentImage
            });

            const imgIndex = this.images.length - 1;
            presidentImage.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openModal(imgIndex);
            });
        }
    }

    attachEventListeners() {
        // Close button
        document.getElementById('modalClose').addEventListener('click', () => this.closeModal());

        // Backdrop click
        this.modal.querySelector('.image-modal-backdrop').addEventListener('click', () => this.closeModal());

        // Navigation buttons
        document.getElementById('modalPrev').addEventListener('click', () => this.navigate(-1));
        document.getElementById('modalNext').addEventListener('click', () => this.navigate(1));

        // Zoom controls
        document.getElementById('zoomIn').addEventListener('click', () => this.zoom(0.2));
        document.getElementById('zoomOut').addEventListener('click', () => this.zoom(-0.2));
        document.getElementById('zoomReset').addEventListener('click', () => this.resetZoom());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.modal.classList.contains('active')) return;

            switch (e.key) {
                case 'Escape':
                    this.closeModal();
                    break;
                case 'ArrowLeft':
                    this.navigate(-1);
                    break;
                case 'ArrowRight':
                    this.navigate(1);
                    break;
                case '+':
                case '=':
                    this.zoom(0.2);
                    break;
                case '-':
                case '_':
                    this.zoom(-0.2);
                    break;
                case '0':
                    this.resetZoom();
                    break;
            }
        });

        // Touch gestures for mobile
        let touchStartX = 0;
        let touchEndX = 0;

        this.modal.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        this.modal.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        });
    }

    openModal(index) {
        this.currentIndex = index;
        this.displayImage();
        this.modal.classList.add('active');
        document.body.classList.add('modal-open');

        // Add smooth animation
        setTimeout(() => {
            this.modal.querySelector('.image-modal-container').style.transform = 'scale(1) translateY(0)';
        }, 10);
    }

    closeModal() {
        this.modal.classList.remove('active');
        document.body.classList.remove('modal-open');
        this.resetZoom();
    }

    displayImage() {
        const imageData = this.images[this.currentIndex];
        const modalImage = document.getElementById('modalImage');
        const modalLoader = document.getElementById('modalLoader');
        const modalCaption = document.getElementById('modalCaption');
        const modalCaptionTitle = document.getElementById('modalCaptionTitle');
        const modalCaptionText = document.getElementById('modalCaptionText');
        const modalCounter = document.getElementById('modalCounter');

        // Show loader
        modalLoader.style.display = 'block';
        modalImage.style.opacity = '0';

        // Update counter
        modalCounter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;

        // Load image
        const img = new Image();
        img.onload = () => {
            modalImage.src = imageData.src;
            modalImage.alt = imageData.alt;
            modalLoader.style.display = 'none';
            modalImage.style.opacity = '1';

            // Show caption if available
            if (imageData.title || imageData.description) {
                modalCaptionTitle.textContent = imageData.title;
                modalCaptionText.textContent = imageData.description;
                modalCaption.style.display = 'block';
            } else {
                modalCaption.style.display = 'none';
            }
        };
        img.src = imageData.src;

        // Update navigation buttons
        this.updateNavButtons();
    }

    navigate(direction) {
        this.currentIndex += direction;

        // Loop around
        if (this.currentIndex < 0) {
            this.currentIndex = this.images.length - 1;
        } else if (this.currentIndex >= this.images.length) {
            this.currentIndex = 0;
        }

        this.resetZoom();
        this.displayImage();
    }

    updateNavButtons() {
        const prevBtn = document.getElementById('modalPrev');
        const nextBtn = document.getElementById('modalNext');

        // Enable both buttons for looping
        prevBtn.classList.remove('disabled');
        nextBtn.classList.remove('disabled');
    }

    zoom(delta) {
        this.zoomLevel = Math.max(0.5, Math.min(3, this.zoomLevel + delta));
        const modalImage = document.getElementById('modalImage');
        modalImage.style.transform = `scale(${this.zoomLevel})`;
        modalImage.style.transition = 'transform 0.3s ease';
    }

    resetZoom() {
        this.zoomLevel = 1;
        const modalImage = document.getElementById('modalImage');
        modalImage.style.transform = 'scale(1)';
    }

    handleSwipe(startX, endX) {
        const minSwipeDistance = 50;
        const diff = startX - endX;

        if (Math.abs(diff) > minSwipeDistance) {
            if (diff > 0) {
                // Swipe left - next image
                this.navigate(1);
            } else {
                // Swipe right - previous image
                this.navigate(-1);
            }
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ImageModal();
});
