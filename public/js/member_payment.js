document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('payment-form');
    const memberSelect = document.getElementById('member-select');
    const nameInput = document.getElementById('name');
    const receiptInput = document.getElementById('receiptNo');
    const payBtn = document.getElementById('pay-btn');
    const btnText = payBtn.querySelector('.btn-text');
    const loader = payBtn.querySelector('.loader');
    const successMessage = document.getElementById('success-message');
    const downloadReceiptBtn = document.getElementById('download-receipt-btn');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');

    // Mobile Menu Toggle
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = mobileMenuBtn.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });
    }

    const MEMBERS_API_URL = '/api/members';
    const FINANCIAL_API_URL = '/api/financial_history';

    let financialRecords = [];

    // Initialize
    fetchMembers();
    generateReceiptNo();

    // Fetch members for dropdown
    async function fetchMembers() {
        try {
            const response = await fetch(MEMBERS_API_URL);
            const members = await response.json();

            memberSelect.innerHTML = '<option value="">-- Select Your Name --</option>';
            members.forEach(member => {
                const option = document.createElement('option');
                option.value = member.name;
                option.textContent = `${member.name} (${member.shopno || 'No Shop'})`;
                memberSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching members:', error);
            Swal.fire('Error', 'Failed to load members list', 'error');
        }
    }

    function generateReceiptNo() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        // Format: YYYYMMDDHHMMSS (e.g., 20251206143005)
        receiptInput.value = `${year}${month}${day}${hours}${minutes}${seconds}`;
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

    // Handle Payment Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Show loading state
        payBtn.disabled = true;
        btnText.style.display = 'none';
        loader.style.display = 'block';

        // Simulate payment processing (2 seconds)
        setTimeout(async () => {
            // In a real app, we would verify payment here
            // Then save the record to the database

            const paymentData = {
                name: nameInput.value,
                receiptNo: receiptInput.value,
                date: new Date().toISOString().split('T')[0],
                amount: document.getElementById('amount').value,
                fortheMonth: document.getElementById('fortheMonth').value,
                remarks: document.getElementById('remarks').value || 'Online Payment'
            };

            try {
                // Save to financial history
                const response = await fetch(FINANCIAL_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(paymentData)
                });

                if (response.ok) {
                    // Show success UI
                    form.style.display = 'none';
                    successMessage.style.display = 'block';

                    // Send Email Notification
                    sendEmailNotification(paymentData);

                    // Setup download button
                    downloadReceiptBtn.onclick = () => {
                        const params = new URLSearchParams({
                            name: paymentData.name,
                            receiptNo: paymentData.receiptNo,
                            date: paymentData.date,
                            amount: paymentData.amount,
                            fortheMonth: paymentData.fortheMonth,
                            remarks: paymentData.remarks
                        });
                        window.open(`receipt.html?${params.toString()}`, '_blank');
                    };
                } else {
                    throw new Error('Failed to save record');
                }
            } catch (error) {
                console.error('Payment error:', error);
                Swal.fire('Error', 'Payment recorded failed. Please contact support.', 'error');

                // Reset button
                payBtn.disabled = false;
                btnText.style.display = 'block';
                loader.style.display = 'none';
            }
        }, 2000);
    });

    // Email Notification Function using Backend API
    async function sendEmailNotification(data) {
        console.log('Sending Email via Backend...');

        const emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 20px; background-color: #ffffff;">
                <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #0f172a;">
                    <h1 style="color: #0f172a; margin: 0; font-size: 24px;">New Market Traders Association</h1>
                    <p style="color: #64748b; margin: 5px 0 0; font-size: 14px;">Pakyong, Sikkim - 737106</p>
                    <h2 style="color: #b45309; margin: 20px 0 0; text-transform: uppercase; letter-spacing: 2px;">Receipt</h2>
                    <p style="font-family: monospace; color: #334155; margin: 5px 0; font-weight: bold;">#${data.receiptNo}</p>
                </div>

                <div style="padding: 30px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Received From</td>
                            <td style="padding: 10px 0; text-align: right; color: #0f172a; font-weight: bold;">${data.name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Date of Payment</td>
                            <td style="padding: 10px 0; text-align: right; color: #0f172a; font-weight: bold;">${data.date}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Payment For</td>
                            <td style="padding: 10px 0; text-align: right; color: #0f172a; font-weight: bold;">${data.fortheMonth}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Payment Method</td>
                            <td style="padding: 10px 0; text-align: right; color: #0f172a; font-weight: bold;">Online / UPI</td>
                        </tr>
                    </table>

                    <div style="background-color: #f8fafc; border: 1px dashed #e2e8f0; padding: 20px; text-align: center; margin: 20px 0;">
                        <div style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Amount Paid</div>
                        <div style="color: #0f172a; font-size: 32px; font-weight: bold;">₹${data.amount}</div>
                    </div>

                    <div style="margin-top: 20px;">
                        <div style="color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold;">Remarks</div>
                        <div style="color: #334155; font-style: italic; margin-top: 5px;">${data.remarks}</div>
                    </div>
                </div>

                <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px;">
                    <p style="color: #64748b; font-size: 12px; font-style: italic; margin: 0;">
                        This is a <strong style="color: #b45309;">System Generated Receipt</strong>. No signature is required.
                    </p>
                    <p style="color: #94a3b8; font-size: 10px; margin-top: 5px; font-family: monospace;">Generated on: ${new Date().toLocaleString()}</p>
                </div>
            </div>
        `;

        const emailData = {
            // to: 'admin@nmta.com', // Handled by backend (defaults to self)
            subject: `Payment Received: ${data.receiptNo} - ${data.name}`,
            body: emailBody
        };

        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailData)
            });

            if (response.ok) {
                console.log('Email sent successfully!');
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
                Toast.fire({
                    icon: 'success',
                    title: 'Email notification sent to Admin'
                });
            } else {
                throw new Error('Server responded with error');
            }
        } catch (error) {
            console.error('Failed to send email:', error);
        }
    }
});
