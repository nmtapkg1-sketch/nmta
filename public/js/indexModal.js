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

    // Submit Form
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        statusDiv.textContent = 'Sending...';
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error('Failed to send message');

            statusDiv.style.color = 'green';
            statusDiv.textContent = 'Message sent successfully!';
            form.reset();

            setTimeout(() => {
                modal.style.display = 'none';
                clearStatus();
            }, 2000);
        } catch (err) {
            console.error(err);
            statusDiv.style.color = 'red';
            statusDiv.textContent = 'Failed to send message. Please try again.';
        }
    });

    function clearStatus() {
        statusDiv.textContent = '';
        statusDiv.style.color = 'inherit';
    }
});
