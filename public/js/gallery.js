// Gallery Lightbox Functionality
document.addEventListener('DOMContentLoaded', () => {
    // Create lightbox elements
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.id = 'gallery-lightbox';

    const lightboxContent = `
        <span class="lightbox-close">&times;</span>
        <span class="lightbox-prev">&#10094;</span>
        <span class="lightbox-next">&#10095;</span>
        <div class="lightbox-image-container">
            <img class="lightbox-image" id="lightbox-img" src="" alt="">
            <div class="lightbox-caption"></div>
        </div>
        <div class="lightbox-counter"></div>
    `;

    lightbox.innerHTML = lightboxContent;
    document.body.appendChild(lightbox);

    // Get all gallery images
    const galleryImages = document.querySelectorAll('.gallery-img');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.querySelector('.lightbox-caption');
    const lightboxClose = document.querySelector('.lightbox-close');
    const lightboxPrev = document.querySelector('.lightbox-prev');
    const lightboxNext = document.querySelector('.lightbox-next');
    const lightboxCounter = document.querySelector('.lightbox-counter');

    let currentIndex = 0;

    // Function to open lightbox
    function openLightbox(index) {
        currentIndex = index;
        const img = galleryImages[currentIndex];
        const caption = img.alt;

        lightboxImg.src = img.src;
        lightboxCaption.textContent = caption;
        lightboxCounter.textContent = `${currentIndex + 1} / ${galleryImages.length}`;

        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Function to close lightbox
    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Function to show next image
    function showNext() {
        currentIndex = (currentIndex + 1) % galleryImages.length;
        openLightbox(currentIndex);
    }

    // Function to show previous image
    function showPrev() {
        currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
        openLightbox(currentIndex);
    }

    // Add click event to all gallery images
    galleryImages.forEach((img, index) => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => openLightbox(index));
    });

    // Close button
    lightboxClose.addEventListener('click', closeLightbox);

    // Next/Previous buttons
    lightboxNext.addEventListener('click', showNext);
    lightboxPrev.addEventListener('click', showPrev);

    // Close on background click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (lightbox.classList.contains('active')) {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') showNext();
            if (e.key === 'ArrowLeft') showPrev();
        }
    });
});
