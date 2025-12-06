document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('#financial-table tbody');
    const modal = document.getElementById('record-modal');
    const form = document.getElementById('record-form');
    const addBtn = document.getElementById('add-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const modalTitle = document.getElementById('modal-title');
    const memberSelect = document.getElementById('member-select');
    const nameInput = document.getElementById('name');
    const searchInput = document.getElementById('searchInput');
    const printHistoryBtn = document.getElementById('printHistoryBtn');

    const API_URL = '/api/financial_history';
    const MEMBERS_API_URL = '/api/members';

    let membersList = [];
    let financialRecords = [];

    // Fetch members for dropdown
    async function fetchMembers() {
        try {
            const response = await fetch(MEMBERS_API_URL);
            membersList = await response.json();
            populateMemberSelect(membersList);
        } catch (error) {
            console.error('Error fetching members:', error);
            Swal.fire('Error', 'Failed to load members list', 'error');
        }
    }

    function populateMemberSelect(members) {
        memberSelect.innerHTML = '<option value="">-- Select a Member --</option>';
        members.forEach(member => {
            const option = document.createElement('option');
            option.value = member.name; // Using name as value since that's what we store
            option.textContent = `${member.name} (${member.shopno || 'No Shop'})`;
            option.dataset.memberId = member.id;
            memberSelect.appendChild(option);
        });
    }

    // Handle member selection
    memberSelect.addEventListener('change', (e) => {
        const selectedName = e.target.value;
        if (selectedName) {
            nameInput.value = selectedName;
        } else {
            nameInput.value = '';
        }
    });

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterRecords(searchTerm);
    });

    function filterRecords(searchTerm) {
        if (!searchTerm) {
            renderTable(financialRecords);
            return;
        }

        const filtered = financialRecords.filter(record =>
            record.name.toLowerCase().includes(searchTerm) ||
            record.receiptNo.toLowerCase().includes(searchTerm) ||
            record.date.includes(searchTerm) ||
            (record.remarks && record.remarks.toLowerCase().includes(searchTerm))
        );
        renderTable(filtered);
    }

    // Print functionality
    printHistoryBtn.addEventListener('click', () => {
        window.print();
    });

    // Fetch and display records
    async function fetchRecords() {
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            financialRecords = data; // Store records globally
            renderTable(data);
        } catch (error) {
            console.error('Error fetching records:', error);
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Error loading records</td></tr>';
        }
    }

    function renderTable(records) {
        tableBody.innerHTML = '';
        if (records.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center">No records found</td></tr>';
            return;
        }

        records.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.id}</td>
                <td><span style="font-weight: 500;">${record.name}</span></td>
                <td>${record.receiptNo}</td>
                <td>${record.date}</td>
                <td>₹${record.amount}</td>
                <td>${record.fortheMonth || '-'}</td>
                <td>${record.remarks || '-'}</td>
                <td class="actions">
                    <button type="button" class="btn btn-sm btn-edit edit-btn" data-id="${record.id}"><i class="fa-solid fa-pen"></i></button>
                    <button type="button" class="btn btn-sm btn-delete delete-btn" data-id="${record.id}"><i class="fa-solid fa-trash"></i></button>
                    <button type="button" class="btn btn-sm btn-receipt receipt-btn" onclick="generateReceipt('${record.name}', '${record.receiptNo}', '${record.date}', '${record.amount}', '${record.fortheMonth}', '${record.remarks}')"><i class="fa-solid fa-print"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Attach event listeners
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(btn.dataset.id));
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteRecord(btn.dataset.id));
        });
    }

    // Modal handling
    function openModal() {
        modal.classList.add('active');
    }

    function closeModal() {
        modal.classList.remove('active');
        form.reset();
        document.getElementById('record-id').value = '';
    }

    addBtn.addEventListener('click', () => {
        modalTitle.textContent = 'Add Record';
        // Set default date to today
        document.getElementById('date').valueAsDate = new Date();

        // Auto-generate receipt number
        const nextReceiptNo = getNextReceiptNo();
        document.getElementById('receiptNo').value = nextReceiptNo;

        openModal();
    });

    function getNextReceiptNo() {
        if (!financialRecords || financialRecords.length === 0) {
            return 1001; // Start from 1001 if no records
        }

        let maxReceiptNo = 0;
        financialRecords.forEach(record => {
            // Remove any non-numeric characters if present (e.g. "REC-1001")
            // This is a simple implementation assuming mostly numeric receipt numbers
            const num = parseInt(record.receiptNo.replace(/\D/g, ''));
            if (!isNaN(num) && num > maxReceiptNo) {
                maxReceiptNo = num;
            }
        });

        return maxReceiptNo > 0 ? maxReceiptNo + 1 : 1001;
    }

    cancelBtn.addEventListener('click', closeModal);

    // Close modal on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('record-id').value;
        const formData = {
            name: document.getElementById('name').value,
            receiptNo: document.getElementById('receiptNo').value,
            date: document.getElementById('date').value,
            amount: document.getElementById('amount').value,
            fortheMonth: document.getElementById('fortheMonth').value,
            remarks: document.getElementById('remarks').value
        };

        try {
            const method = id ? 'PUT' : 'POST';
            const url = id ? `${API_URL}/${id}` : API_URL;

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                closeModal();
                fetchRecords();
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Record saved successfully',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                console.error('Error saving record');
                Swal.fire('Error', 'Failed to save record', 'error');
            }
        } catch (error) {
            console.error('Error saving record:', error);
            Swal.fire('Error', 'An error occurred. Please check console.', 'error');
        }
    });

    // Edit record
    async function openEditModal(id) {
        try {
            const response = await fetch(`${API_URL}/${id}`);
            const record = await response.json();

            document.getElementById('record-id').value = record.id;
            document.getElementById('name').value = record.name;
            document.getElementById('receiptNo').value = record.receiptNo;
            document.getElementById('date').value = record.date;
            document.getElementById('amount').value = record.amount;
            document.getElementById('fortheMonth').value = record.fortheMonth;
            document.getElementById('remarks').value = record.remarks;

            // Set the dropdown value based on the name
            // This assumes names are unique enough or we just match by name string
            memberSelect.value = record.name;

            // If name doesn't match any option (e.g. deleted member), we might want to handle that
            // But for now, if it's not in the list, the dropdown will show "Select Member" 
            // while the readonly input still shows the correct name.
            // To ensure the dropdown reflects "custom" or "legacy" names, we could add a temporary option,
            // but the requirement is to fetch from DB.

            modalTitle.textContent = 'Edit Record';
            openModal();
        } catch (error) {
            console.error('Error fetching record details:', error);
            Swal.fire('Error', 'Could not fetch record details', 'error');
        }
    }

    // Delete record
    async function deleteRecord(id) {
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
                const response = await fetch(`${API_URL}/${id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    await Swal.fire(
                        'Deleted!',
                        'Record has been deleted.',
                        'success'
                    );
                    fetchRecords();
                } else {
                    console.error('Error deleting record');
                    Swal.fire('Error', 'Failed to delete record', 'error');
                }
            } catch (error) {
                console.error('Error deleting record:', error);
                Swal.fire('Error', 'An error occurred while deleting', 'error');
            }
        }
    }

    // Initial fetch
    fetchMembers();
    fetchRecords();
});

// Make generateReceipt global so onclick works
window.generateReceipt = function (name, receiptNo, date, amount, fortheMonth, remarks) {
    const params = new URLSearchParams({
        name,
        receiptNo,
        date,
        amount,
        fortheMonth: fortheMonth || '',
        remarks: remarks || ''
    });
    window.open(`receipt.html?${params.toString()}`, '_blank');
};
