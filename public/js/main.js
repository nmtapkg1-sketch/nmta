document.addEventListener('DOMContentLoaded', () => {
    loadExecutives();
    loadMemberCount();


});

async function loadExecutives() {
    const grid = document.getElementById('exec-grid');

    try {
        const response = await fetch('/api/executive');
        const executives = await response.json();

        if (executives.length === 0) {
            grid.innerHTML = '<p class="text-center" style="grid-column: 1/-1; color: var(--text-secondary);">No executive members found.</p>';
            return;
        }

        grid.innerHTML = executives.map(exec => `
            <div class="exec-card">
                <div class="exec-img-wrapper">
                    ${exec.photo
                ? `<img src="${exec.photo.startsWith('images/') ? exec.photo : '/uploads/' + exec.photo}" alt="${exec.name}">`
                : `<i class="fa-solid fa-user exec-placeholder"></i>`
            }
                </div>
                <div class="exec-info">
                    <h3>${exec.name}</h3>
                    <div class="role">${exec.businessname || 'Executive Member'}</div>
                    ${exec.remarks ? `<div class="remarks" style="color: var(--accent-color); font-weight: 500; margin-bottom: 0.5rem;">${exec.remarks}</div>` : ''}
                    ${exec.phoneno ? `<div class="contact"><i class="fa-solid fa-phone"></i> ${exec.phoneno}</div>` : ''}
                    ${exec.emailid ? `<div class="contact"><i class="fa-solid fa-envelope"></i> ${exec.emailid}</div>` : ''}
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading executives:', error);
        grid.innerHTML = '<p class="text-center text-error" style="grid-column: 1/-1;">Failed to load executive team.</p>';
    }
}


async function loadMemberCount() {
    const countElement = document.getElementById('active-members-count');
    if (!countElement) return;

    try {
        const response = await fetch('/api/members');
        const members = await response.json();
        // Animate the number or just set it
        countElement.textContent = members.length + '+';
    } catch (error) {
        console.error('Error loading member count:', error);
        countElement.textContent = 'Error';
    }
}
