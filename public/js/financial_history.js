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

    const yearFilter = document.getElementById('yearFilter');
    const monthFilter = document.getElementById('monthFilter');
    const totalAmountBox = document.getElementById('totalAmount');

    const API_URL = '/api/financial_history';
    const MEMBERS_API_URL = '/api/members';

    let membersList = [];
    let financialRecords = [];

    // ================= FETCH MEMBERS =================
    async function fetchMembers() {
        try {
            const response = await fetch(MEMBERS_API_URL);
            membersList = await response.json();
            populateMemberSelect(membersList);
        } catch (error) {
            Swal.fire("Error", "Failed to load members", "error");
        }
    }

    function populateMemberSelect(members) {
        memberSelect.innerHTML = '<option value="">-- Select a Member --</option>';
        members.forEach(member => {
            const option = document.createElement('option');
            option.value = member.name;
            option.textContent = `${member.name} (${member.shopno || "No Shop"})`;
            memberSelect.appendChild(option);
        });
    }

    memberSelect.addEventListener('change', e => {
        nameInput.value = e.target.value || "";
    });

    // ================= SEARCH =================
    searchInput.addEventListener('input', applyAllFilters);

    // ================= YEAR & MONTH FILTER =================
    yearFilter.addEventListener('change', applyAllFilters);
    monthFilter.addEventListener('change', applyAllFilters);

    // ================= PRINT =================
    printHistoryBtn.addEventListener('click', () => window.print());

    // ================= FETCH RECORDS =================
    async function fetchRecords() {
        try {
            const response = await fetch(API_URL);
            financialRecords = await response.json();
            applyAllFilters(); // render with filters applied
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="8">Error loading records</td></tr>`;
        }
    }

    // ================= TOTAL AMOUNT =================
    function updateTotal(records) {
        const total = records.reduce((sum, r) => sum + Number(r.amount || 0), 0);
        totalAmountBox.textContent = "₹ " + total.toLocaleString();
    }

    // ================= FILTER + SEARCH COMBINED =================
    function applyAllFilters() {
        let filtered = [...financialRecords];

        const searchTerm = searchInput.value.toLowerCase().trim();
        const yearVal = yearFilter.value;
        const monthVal = monthFilter.value;

        filtered = filtered.filter(r => {
            const matchSearch =
                !searchTerm ||
                r.name.toLowerCase().includes(searchTerm) ||
                r.receiptNo.toLowerCase().includes(searchTerm) ||
                (r.amount && r.amount.toString().includes(searchTerm)) ||
                (r.fortheMonth && r.fortheMonth.toLowerCase().includes(searchTerm));

            const matchYear = !yearVal || r.date.startsWith(yearVal);
            const matchMonth = !monthVal || r.date.split("-")[1] === monthVal.padStart(2, "0");

            return matchSearch && matchYear && matchMonth;
        });

        renderTable(filtered);
        updateTotal(filtered);
    }

    // ================= TABLE RENDERING =================
    function renderTable(records) {
        tableBody.innerHTML = "";

        if (records.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8">No records found</td></tr>`;
            return;
        }

        records.forEach(record => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${record.id}</td>
                <td><b>${record.name}</b></td>
                <td>${record.receiptNo}</td>
                <td>${record.date}</td>
                <td>₹${record.amount}</td>
                <td>${record.fortheMonth || "-"}</td>
                <td>${record.remarks || "-"}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-edit edit-btn" data-id="${record.id}">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn btn-sm btn-delete delete-btn" data-id="${record.id}">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                    <button class="btn btn-sm btn-receipt receipt-btn"
                        onclick="generateReceipt('${record.name}', '${record.receiptNo}', '${record.date}', '${record.amount}', '${record.fortheMonth}', '${record.remarks}')">
                        <i class="fa-solid fa-print"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        document.querySelectorAll(".edit-btn").forEach(btn =>
            btn.addEventListener("click", () => openEditModal(btn.dataset.id))
        );

        document.querySelectorAll(".delete-btn").forEach(btn =>
            btn.addEventListener("click", () => deleteRecord(btn.dataset.id))
        );
    }

    // ================= MODAL HANDLING =================
    function openModal() { modal.classList.add("active"); }
    function closeModal() {
        modal.classList.remove("active");
        form.reset();
        document.getElementById("record-id").value = "";
    }
    cancelBtn.addEventListener("click", closeModal);

    modal.addEventListener("click", e => {
        if (e.target === modal) closeModal();
    });

    addBtn.addEventListener('click', () => {
        modalTitle.textContent = "Add Record";
        document.getElementById("date").valueAsDate = new Date();
        document.getElementById("receiptNo").value = getNextReceiptNo();
        openModal();
    });

    function getNextReceiptNo() {
        if (financialRecords.length === 0) return 1001;
        let max = Math.max(...financialRecords.map(r => parseInt(r.receiptNo.replace(/\D/g, ""))));
        return (isNaN(max) ? 1001 : max + 1);
    }

    // ================= SAVE RECORD =================
    form.addEventListener('submit', async e => {
        e.preventDefault();

        const id = document.getElementById("record-id").value;
        const formData = {
            name: document.getElementById("name").value,
            receiptNo: document.getElementById("receiptNo").value,
            date: document.getElementById("date").value,
            amount: document.getElementById("amount").value,
            fortheMonth: document.getElementById("fortheMonth").value,
            remarks: document.getElementById("remarks").value
        };

        const method = id ? "PUT" : "POST";
        const url = id ? `${API_URL}/${id}` : API_URL;

        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            closeModal();
            fetchRecords();
            Swal.fire("Success", "Record saved", "success");
        } else Swal.fire("Error", "Failed to save record", "error");
    });

    // ================= LOAD EDIT FORM =================
    async function openEditModal(id) {
        const response = await fetch(`${API_URL}/${id}`);
        const record = await response.json();

        document.getElementById("record-id").value = record.id;
        document.getElementById("name").value = record.name;
        memberSelect.value = record.name;
        document.getElementById("receiptNo").value = record.receiptNo;
        document.getElementById("date").value = record.date;
        document.getElementById("amount").value = record.amount;
        document.getElementById("fortheMonth").value = record.fortheMonth;
        document.getElementById("remarks").value = record.remarks;

        modalTitle.textContent = "Edit Record";
        openModal();
    }

    // ================= DELETE =================
    async function deleteRecord(id) {
        const result = await Swal.fire({
            title: "Delete?",
            text: "This cannot be undone",
            icon: "warning",
            showCancelButton: true
        });

        if (result.isConfirmed) {
            const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
            if (response.ok) {
                Swal.fire("Deleted", "", "success");
                fetchRecords();
            }
        }
    }

    // Initial load
    fetchMembers();
    fetchRecords();
});

// Global receipt generator
window.generateReceipt = function (name, receiptNo, date, amount, fortheMonth, remarks) {
    const params = new URLSearchParams({
        name, receiptNo, date, amount,
        fortheMonth: fortheMonth || "",
        remarks: remarks || ""
    });
    window.open(`receipt.html?${params.toString()}`, "_blank");
};
