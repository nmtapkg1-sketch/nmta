// member_payment.js - Complete Updated Code with Direct PDF Download

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



    async function loadLogoBase64(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            // Remove crossOrigin for local images
            img.onload = function () {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL("image/png"));
            };
            img.onerror = reject;
            img.src = url; // Use "/images/nmta_logo_modern.png"
        });
    }




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

    let currentPaymentData = null;

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

    // Number to words converter
    function numberToWords(num) {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

        if (num === 0) return 'Zero';

        function convertLessThanThousand(n) {
            if (n === 0) return '';
            if (n < 10) return ones[n];
            if (n < 20) return teens[n - 10];
            if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
            return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
        }

        if (num < 1000) return convertLessThanThousand(num);
        if (num < 100000) {
            return convertLessThanThousand(Math.floor(num / 1000)) + ' Thousand' +
                (num % 1000 !== 0 ? ' ' + convertLessThanThousand(num % 1000) : '');
        }
        if (num < 10000000) {
            return convertLessThanThousand(Math.floor(num / 100000)) + ' Lakh' +
                (num % 100000 !== 0 ? ' ' + numberToWords(num % 100000) : '');
        }
        return convertLessThanThousand(Math.floor(num / 10000000)) + ' Crore' +
            (num % 10000000 !== 0 ? ' ' + numberToWords(num % 10000000) : '');
    }

    async function generateReceiptPDF(paymentData) {
        try {
            if (typeof window.jspdf === "undefined") {
                Swal.fire("Error", "PDF library not loaded. Refresh the page.", "error");
                return false;
            }

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
                compress: true,
            });

            const pageWidth = 210;
            const pageHeight = 297;
            const margin = 22;
            const contentWidth = pageWidth - margin * 2;

            // Convert amount to words
            const rupees = Math.floor(paymentData.amount);
            const paise = Math.round((paymentData.amount - rupees) * 100);
            let amountInWords = numberToWords(rupees) + " Rupees";
            if (paise > 0) amountInWords += " and " + numberToWords(paise) + " Paise";
            amountInWords += " Only";

            // ==========================
            // HEADER
            // ==========================
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, pageWidth, 60, "F");

            // LOAD LOGO AS BASE64
            async function loadLogoBase64(url) {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = "Anonymous";
                    img.onload = function () {
                        const canvas = document.createElement("canvas");
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext("2d");
                        ctx.drawImage(img, 0, 0);
                        resolve(canvas.toDataURL("image/png"));
                    };
                    img.onerror = reject;
                    img.src = url;
                });
            }

            try {
                const logoBase64 = await loadLogoBase64("/images/nmta_logo_modern.png");
                pdf.addImage(logoBase64, "PNG", margin - 5, 12, 28, 28);
            } catch (err) {
                console.warn("Logo could not be loaded, proceeding without it.", err);
            }


            // Title
            pdf.setTextColor(20, 20, 20);
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(20);
            pdf.text("New Market Traders Association", pageWidth / 2, 22, { align: "center" });

            // Subtext
            pdf.setFontSize(10);
            pdf.setTextColor(120, 120, 120);
            pdf.text("Regd No: 123456789", pageWidth / 2, 30, { align: "center" });
            pdf.text("Pakyong, Sikkim - 737106", pageWidth / 2, 35, { align: "center" });

            pdf.setDrawColor(230, 230, 230);
            pdf.line(margin, 48, pageWidth - margin, 48);

            pdf.setFontSize(11);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(0, 122, 255);
            pdf.text("OFFICIAL RECEIPT", pageWidth / 2, 57, { align: "center" });

            // ==========================
            // RECEIPT NUMBER STRIP
            // ==========================
            let yPos = 75;
            pdf.setTextColor(120, 120, 120);
            pdf.setFontSize(9);
            pdf.text("Receipt Number", margin, yPos);

            pdf.setTextColor(30, 30, 30);
            pdf.setFontSize(15);
            pdf.setFont("helvetica", "bold");
            pdf.text(paymentData.receiptNo, margin, yPos + 9);

            // PAID badge
            pdf.setFillColor(0, 122, 255);
            pdf.roundedRect(pageWidth - margin - 25, yPos - 4, 25, 10, 3, 3, "F");

            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(9);
            pdf.setFont("helvetica", "bold");
            pdf.text("PAID", pageWidth - margin - 12, yPos + 3, { align: "center" });

            // ==========================
            // DETAILS CARD
            // ==========================
            yPos += 22;

            pdf.setDrawColor(230, 230, 230);
            pdf.setFillColor(255, 255, 255);
            pdf.roundedRect(margin, yPos, contentWidth, 48, 4, 4, "FD");

            let textY = yPos + 10;
            const labelColor = [130, 130, 135];
            const valueColor = [40, 40, 45];
            const colSplit = pageWidth / 2;

            pdf.setTextColor(...labelColor);
            pdf.setFontSize(9);
            pdf.text("RECEIVED FROM", margin + 5, textY);
            pdf.text("PAYMENT DATE", colSplit + 5, textY);

            pdf.setTextColor(...valueColor);
            pdf.setFontSize(12);
            pdf.setFont("helvetica", "bold");
            pdf.text(paymentData.name, margin + 5, textY + 7);
            pdf.text(paymentData.date, colSplit + 5, textY + 7);

            textY += 20;
            pdf.setTextColor(...labelColor);
            pdf.setFontSize(9);
            pdf.text("PAYMENT FOR", margin + 5, textY);
            pdf.text("PAYMENT METHOD", colSplit + 5, textY);

            pdf.setTextColor(...valueColor);
            pdf.setFontSize(12);
            pdf.setFont("helvetica", "bold");
            pdf.text(paymentData.fortheMonth, margin + 5, textY + 7);
            pdf.text("Online / UPI", colSplit + 5, textY + 7);

            yPos += 60;

            // ==========================
            // AMOUNT CARD
            // ==========================
            pdf.setDrawColor(0, 122, 255);
            pdf.setFillColor(250, 250, 255);
            pdf.roundedRect(margin, yPos, contentWidth, 50, 6, 6, "FD");

            pdf.setTextColor(120, 120, 120);
            pdf.setFontSize(10);
            pdf.text("AMOUNT PAID", pageWidth / 2, yPos + 12, { align: "center" });

            pdf.setTextColor(0, 0, 0);
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(28);
            pdf.text(`Rs. ${parseFloat(paymentData.amount).toFixed(2)}`, pageWidth / 2, yPos + 30, { align: "center" });


            pdf.setTextColor(120, 120, 120);
            pdf.setFont("helvetica", "italic");
            pdf.setFontSize(9);
            pdf.text(amountInWords, pageWidth / 2, yPos + 42, { align: "center" });

            yPos += 65;

            // ==========================
            // REMARKS
            // ==========================
            if (paymentData.remarks && paymentData.remarks !== "None") {
                pdf.setFontSize(9);
                pdf.setTextColor(130, 130, 135);
                pdf.text("REMARKS", margin, yPos);

                pdf.setFontSize(10);
                pdf.setTextColor(40, 40, 45);
                const remarksText = pdf.splitTextToSize(paymentData.remarks, contentWidth);
                pdf.text(remarksText, margin, yPos + 8);

                yPos += 25;
            }

            // ==========================
            // FOOTER
            // ==========================
            yPos = pageHeight - 40;

            pdf.setDrawColor(230, 230, 230);
            pdf.line(margin, yPos, pageWidth - margin, yPos);

            pdf.setFontSize(9);
            pdf.setTextColor(120, 120, 120);
            pdf.setFont("helvetica", "bold");
            pdf.text(
                "This is a system-generated receipt and does not require a signature.",
                pageWidth / 2,
                yPos + 10,
                { align: "center" }
            );

            pdf.setFont("helvetica", "italic");
            pdf.text(
                "Generated on: " + paymentData.generatedDate,
                pageWidth / 2,
                yPos + 18,
                { align: "center" }
            );

            // WATERMARK
            pdf.setGState(new pdf.GState({ opacity: 0.03 }));
            pdf.setFontSize(75);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(0, 0, 0);
            pdf.text("NMTA", pageWidth / 2, pageHeight / 2, { align: "center", angle: 45 });
            pdf.setGState(new pdf.GState({ opacity: 1 }));

            pdf.save(`NMTA_Receipt_${paymentData.receiptNo}.pdf`);
            return true;

        } catch (error) {
            Swal.fire("Error", "Failed to generate PDF: " + error.message, "error");
            return false;
        }
    }



    // Handle Payment Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Show loading state
        payBtn.disabled = true;
        btnText.style.display = 'none';
        loader.style.display = 'block';

        // Simulate payment processing (2 seconds)
        setTimeout(async () => {
            const now = new Date();
            const paymentData = {
                name: nameInput.value,
                receiptNo: receiptInput.value,
                date: now.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                }),
                amount: parseFloat(document.getElementById('amount').value),
                fortheMonth: document.getElementById('fortheMonth').value,
                remarks: document.getElementById('remarks').value || 'Online Payment',
                generatedDate: now.toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                })
            };

            try {
                // Save to financial history
                const response = await fetch(FINANCIAL_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: paymentData.name,
                        receiptNo: paymentData.receiptNo,
                        date: new Date().toISOString().split('T')[0],
                        amount: paymentData.amount,
                        fortheMonth: paymentData.fortheMonth,
                        remarks: paymentData.remarks
                    })
                });

                if (response.ok) {
                    // Store payment data globally
                    currentPaymentData = paymentData;

                    // Show success UI
                    form.style.display = 'none';
                    successMessage.style.display = 'block';

                    // Send Email Notification
                    sendEmailNotification(paymentData);



                } else {
                    throw new Error('Failed to save record');
                }
            } catch (error) {
                console.error('Payment error:', error);
                Swal.fire('Error', 'Payment recording failed. Please contact support.', 'error');

                // Reset button
                payBtn.disabled = false;
                btnText.style.display = 'block';
                loader.style.display = 'none';
            }
        }, 2000);
    });

    // Handle download receipt button in success message
    downloadReceiptBtn.addEventListener('click', () => {
        if (currentPaymentData) {
            generateReceiptPDF(currentPaymentData);
        } else {
            Swal.fire('Error', 'Payment data not found. Please try again.', 'error');
        }
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
                    <p style="color: #94a3b8; font-size: 10px; margin-top: 5px; font-family: monospace;">Generated on: ${data.generatedDate}</p>
                </div>
            </div>
        `;

        const emailData = {
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