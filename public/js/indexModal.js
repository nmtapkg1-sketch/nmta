document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const contactBtn = document.getElementById('contact-us-btn');
    const modal = document.getElementById('contact-modal');
    const closeBtn = modal.querySelector('.close-btn');
    const form = document.getElementById('contact-form');
    const statusDiv = document.getElementById('form-status');

    // Open Modal
    contactBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
    });

    // Close Modal on 'X'
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        clearStatus();
        form.reset();
    });

    // Close Modal on click outside modal content
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            clearStatus();
            form.reset();
        }
    });

    let isSubmitting = false;

    // Submit Form
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (isSubmitting) return;
        isSubmitting = true;

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
        statusDiv.textContent = '';
        statusDiv.className = '';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!result.success) throw new Error(result.error || 'Failed to send message');

            statusDiv.className = 'status-success';
            statusDiv.innerHTML = '<i class="fa-solid fa-check-circle"></i> Message sent successfully!';
            form.reset();

            setTimeout(() => {
                modal.style.display = 'none';
                clearStatus();
            }, 3000);

        } catch (err) {
            console.error(err);
            statusDiv.className = 'status-error';
            statusDiv.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${err.message || 'Failed to send message.'}`;
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            isSubmitting = false;
        }
    });

    function clearStatus() {
        statusDiv.textContent = '';
        statusDiv.style.color = 'inherit';
    }
});
