document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('#members-table tbody');
    const modal = document.getElementById('member-modal');
    const form = document.getElementById('member-form');
    const addBtn = document.getElementById('add-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const modalTitle = document.getElementById('modal-title');
    const totalMembersSpan = document.getElementById('total-members');

    const API_URL = '/api/members';

    // Helper to update member count
    function updateTotalMembers(count) {
        totalMembersSpan.textContent = count;
    }

    // Fetch and display members
    async function fetchMembers() {
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            renderTable(data);
            updateTotalMembers(data.length); // update count on fetch
            return data; // return members for live updates
        } catch (error) {
            console.error('Error fetching members:', error);
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading members</td></tr>';
            updateTotalMembers(0);
            return [];
        }
    }

    function renderTable(members) {
        tableBody.innerHTML = '';
        if (members.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No members found</td></tr>';
            return;
        }

        members.forEach(member => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${member.id}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div style="width: 32px; height: 32px; background: var(--accent-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                            ${member.photo ? `<img src="${member.photo.startsWith('images/') ? member.photo : '/uploads/' + member.photo}" style="width: 100%; height: 100%; object-fit: cover;">` : '<i class="fa-solid fa-user" style="color: var(--accent-color); font-size: 0.8rem;"></i>'}
                        </div>
                        <span style="font-weight: 500;">${member.name}</span>
                    </div>
                </td>
                <td>${member.businessname || '-'}</td>
                <td>${member.phoneno || '-'}</td>
                <td>${member.shopno || '-'}</td>
                <td><span style="background: var(--accent-light); color: var(--accent-color); padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.85rem; font-weight: 500;">${member.remarks || 'Member'}</span></td>
                <td class="actions">
                    <button type="button" class="btn btn-sm btn-edit edit-btn" data-id="${member.id}"><i class="fa-solid fa-pen"></i></button>
                    <button type="button" class="btn btn-sm btn-delete delete-btn" data-id="${member.id}"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Attach event listeners
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(btn.dataset.id));
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteMember(btn.dataset.id));
        });
    }

    // Modal handling
    function openModal() {
        modal.classList.add('active');
    }

    function closeModal() {
        modal.classList.remove('active');
        form.reset();
        document.getElementById('member-id').value = '';
        document.getElementById('photo-preview-container').style.display = 'none';
    }

    addBtn.addEventListener('click', () => {
        modalTitle.textContent = 'Add New Member';
        openModal();
    });

    cancelBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('member-id').value;

        const formData = new FormData();
        formData.append('name', document.getElementById('name').value);
        formData.append('businessname', document.getElementById('businessname').value);
        formData.append('phoneno', document.getElementById('phoneno').value);
        formData.append('emailid', document.getElementById('emailid').value);
        formData.append('shopno', document.getElementById('shopno').value);
        formData.append('remarks', document.getElementById('remarks').value);

        const photoInput = document.getElementById('photo');
        if (photoInput.files[0]) formData.append('photo', photoInput.files[0]);

        try {
            const method = id ? 'PUT' : 'POST';
            const url = id ? `${API_URL}/${id}` : API_URL;

            const response = await fetch(url, { method, body: formData });

            if (response.ok) {
                closeModal();
                const members = await fetchMembers(); // live update
                updateTotalMembers(members.length);
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Member saved successfully',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                console.error('Error saving member');
                Swal.fire('Error', 'Failed to save member', 'error');
            }
        } catch (error) {
            console.error('Error saving member:', error);
            Swal.fire('Error', 'An error occurred. Please check console.', 'error');
        }
    });

    // Edit member
    async function openEditModal(id) {
        try {
            const response = await fetch(`${API_URL}/${id}`);
            const member = await response.json();

            document.getElementById('member-id').value = member.id;
            document.getElementById('name').value = member.name;
            document.getElementById('businessname').value = member.businessname;
            document.getElementById('phoneno').value = member.phoneno;
            document.getElementById('emailid').value = member.emailid;
            document.getElementById('shopno').value = member.shopno;
            document.getElementById('remarks').value = member.remarks;

            const photoPreview = document.getElementById('photo-preview');
            const photoContainer = document.getElementById('photo-preview-container');
            if (member.photo) {
                photoPreview.src = member.photo.startsWith('images/') ? member.photo : '/uploads/' + member.photo;
                photoContainer.style.display = 'block';
            } else {
                photoContainer.style.display = 'none';
            }

            modalTitle.textContent = 'Edit Member';
            openModal();
        } catch (error) {
            console.error('Error fetching member details:', error);
            Swal.fire('Error', 'Could not fetch member details', 'error');
        }
    }

    // Delete member
    async function deleteMember(id) {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#cbd5e1',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });

                if (response.ok) {
                    await Swal.fire('Deleted!', 'Member has been deleted.', 'success');
                    const members = await fetchMembers(); // live update
                    updateTotalMembers(members.length);
                } else {
                    console.error('Error deleting member');
                    Swal.fire('Error!', 'Failed to delete member.', 'error');
                }
            } catch (error) {
                console.error('Error deleting member:', error);
                Swal.fire('Error!', 'An error occurred while deleting.', 'error');
            }
        }
    }

    // Initial fetch
    fetchMembers();
});
