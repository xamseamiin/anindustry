
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Define types locally if not imported to ensure self-containment or import if shared types exist
interface InvoiceItem {
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

interface InvoiceData {
    invoiceNumber: string;
    date: string;
    time: string;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    cashierName: string;
    paymentMethod: string;
    subtotal: number;
    tax: number;
    total: number;
    paidAmount?: number; // New
    balanceDue?: number; // New
    items: InvoiceItem[];
    companyName?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyEmail?: string;
    notes?: string;
}

export const generateInvoicePDF = (data: InvoiceData, action: 'download' | 'print' = 'download') => {
    // 1. Setup Document
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;

    // --- COLORS ---
    const primaryColor = [52, 152, 219] as [number, number, number]; // Revlo Blue (#3498DB) - Matching App Theme
    const accentColor = [46, 204, 113] as [number, number, number]; // Green
    const dangerColor = [231, 76, 60] as [number, number, number]; // Red
    const secondaryColor = [44, 62, 80] as [number, number, number]; // Dark Blue/Gray
    const lightGray = [245, 245, 245] as [number, number, number];

    // --- HEADER SECTION ---

    // Top Brand Bar
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 8, 'F');

    // Company Logo / Name (Left)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(...secondaryColor);
    doc.text('Revlo.', margin, 35);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    const companyInfoY = 42;
    doc.text(data.companyName || 'Revlo Solutions', margin, companyInfoY);
    doc.text(data.companyAddress || 'Mogadishu, Somalia', margin, companyInfoY + 5);
    doc.text(data.companyPhone || '+252 61 000 0000', margin, companyInfoY + 10);

    // Invoice Title & Meta (Right)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(36);
    doc.setTextColor(230, 230, 230); // Very light Watermark
    doc.text('INVOICE', pageWidth - margin, 35, { align: 'right' });

    doc.setTextColor(...secondaryColor);
    doc.setFontSize(10);

    // Align meta info properly to avoid overlap
    const metaLabelX = pageWidth - margin - 50;
    const metaValueX = pageWidth - margin;
    let metaY = 45;

    // Invoice #
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice #:', metaLabelX, metaY);
    doc.setFont('helvetica', 'normal');
    doc.text(data.invoiceNumber, metaValueX, metaY, { align: 'right' });

    // Date
    metaY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', metaLabelX, metaY);
    doc.setFont('helvetica', 'normal');
    doc.text(data.date, metaValueX, metaY, { align: 'right' });

    // Time
    metaY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Time:', metaLabelX, metaY);
    doc.setFont('helvetica', 'normal');
    doc.text(data.time, metaValueX, metaY, { align: 'right' });

    // Status Badge (Visual only text)
    if (data.balanceDue && data.balanceDue > 0) {
        metaY += 8;
        doc.setTextColor(...dangerColor);
        doc.setFont('helvetica', 'bold');
        doc.text('UNPAID / BALANCE DUE', metaValueX, metaY, { align: 'right' });
    } else {
        metaY += 8;
        doc.setTextColor(...accentColor);
        doc.setFont('helvetica', 'bold');
        doc.text('PAID', metaValueX, metaY, { align: 'right' });
    }

    // --- DIVIDER ---
    doc.setDrawColor(230);
    doc.line(margin, 70, pageWidth - margin, 70);

    // --- BILL TO & INFO SECTION ---
    const infoY = 82;
    const columnGap = 10;
    const colWidth = (pageWidth - (margin * 2) - columnGap) / 2;

    // Col 1: Bill To
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(150);
    doc.text('BILL TO', margin, infoY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text(data.customerName || 'Walk-in Customer', margin, infoY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80);
    let customerInfoY = infoY + 13;
    if (data.customerPhone) {
        doc.text(data.customerPhone, margin, customerInfoY);
        customerInfoY += 5;
    }
    if (data.customerEmail) {
        doc.text(data.customerEmail, margin, customerInfoY);
    }

    // Col 2: Payment Details
    const col2X = margin + colWidth + columnGap;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text('PAYMENT DETAILS', col2X, infoY);

    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.text(`Payment Method:`, col2X, infoY + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(data.paymentMethod, col2X + 30, infoY + 7);

    doc.setFont('helvetica', 'bold');
    doc.text(`Cashier:`, col2X, infoY + 13);
    doc.setFont('helvetica', 'normal');
    doc.text(data.cashierName, col2X + 30, infoY + 13);

    // --- ITEMS TABLE ---
    const tableStartY = Math.max(customerInfoY + 15, infoY + 30);

    // @ts-ignore
    autoTable(doc, {
        startY: tableStartY,
        head: [['Item Description', 'Qty', 'Unit Price', 'Total']],
        body: data.items.map(item => [
            item.productName,
            item.quantity,
            `ETB ${item.unitPrice.toLocaleString()}`,
            `ETB ${item.total.toLocaleString()}`
        ]),
        theme: 'grid',
        headStyles: {
            fillColor: secondaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'left',
            cellPadding: 6
        },
        columnStyles: {
            0: { cellWidth: 'auto', valign: 'middle' },
            1: { cellWidth: 20, halign: 'center', valign: 'middle' },
            2: { cellWidth: 35, halign: 'right', valign: 'middle' },
            3: { cellWidth: 35, halign: 'right', fontStyle: 'bold', valign: 'middle' }
        },
        styles: {
            fontSize: 10,
            cellPadding: 5,
            lineColor: [230, 230, 230],
            lineWidth: 0.1,
        },
        alternateRowStyles: {
            fillColor: [250, 250, 253]
        }
    });

    // --- TOTALS SECTION ---
    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY + 10;
    const totalsLabelX = pageWidth - margin - 50;
    const totalsValueX = pageWidth - margin;

    doc.setFontSize(10);
    doc.setTextColor(80);

    // Subtotal
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', totalsLabelX, finalY);
    doc.text(`ETB ${data.subtotal.toLocaleString()}`, totalsValueX, finalY, { align: 'right' });

    // Tax
    doc.text('Tax (15%):', totalsLabelX, finalY + 6);
    doc.text(`ETB ${data.tax.toLocaleString()}`, totalsValueX, finalY + 6, { align: 'right' });

    // Divider
    doc.setDrawColor(200);
    doc.line(totalsLabelX, finalY + 10, pageWidth - margin, finalY + 10);

    // Grand Total
    const totalY = finalY + 18;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Total:', totalsLabelX, totalY);
    doc.text(`ETB ${data.total.toLocaleString()}`, totalsValueX, totalY, { align: 'right' });

    let currentY = totalY + 10;

    // Paid Amount & Balance (If relevant)
    if (data.paidAmount !== undefined || data.balanceDue !== undefined) {

        const paid = data.paidAmount !== undefined ? data.paidAmount : data.total;
        const noteBalance = data.balanceDue !== undefined ? data.balanceDue : (data.total - paid);

        // Paid Amount
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...accentColor); // Green
        doc.text('Paid Amount:', totalsLabelX, currentY);
        doc.text(`ETB ${paid.toLocaleString()}`, totalsValueX, currentY, { align: 'right' });

        currentY += 7;

        // Balance Due (if any)
        if (noteBalance > 0) {
            // Highlight background for debt
            doc.setFillColor(255, 235, 238); // Light Red background
            doc.rect(totalsLabelX - 5, currentY - 5, 60, 10, 'F');

            doc.setTextColor(...dangerColor); // Red Text
            doc.text('Balance Due:', totalsLabelX, currentY);
            doc.text(`ETB ${noteBalance.toLocaleString()}`, totalsValueX, currentY, { align: 'right' });
        }
    }

    // --- FOOTER ---
    const footerY = pageHeight - 30;

    // Notes Section
    if (data.notes) {
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.setFont('helvetica', 'bold');
        doc.text('Notes:', margin, finalY + 10);

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        // Split text to fit width
        const splitNotes = doc.splitTextToSize(data.notes, 100);
        doc.text(splitNotes, margin, finalY + 16);
    }

    // Thank you message
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150);
    doc.text('Powered by Revlo', pageWidth / 2, footerY + 5, { align: 'center' });

    // Save or Print
    if (action === 'print') {
        doc.autoPrint();
        window.open(doc.output('bloburl'), '_blank');
    } else {
        doc.save(`Invoice_${data.invoiceNumber}.pdf`);
    }
};
