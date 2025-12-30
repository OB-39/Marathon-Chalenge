import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Submission } from '../types/database';

// Extend jsPDF with autotable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
        getNumberOfPages: () => number;
    }
}

export const exportSubmissionsToPDF = (submissions: Submission[]) => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation

    // Add Title
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('Marathon Challenge - Rapport des Soumissions', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Généré le: ${new Date().toLocaleString()}`, 14, 30);

    // Prepare Table Data
    const sortedData = [...submissions].sort((a, b) => {
        const nameA = a.profile?.full_name || '';
        const nameB = b.profile?.full_name || '';
        if (nameA !== nameB) return nameA.localeCompare(nameB);
        return a.day_number - b.day_number;
    });

    const tableRows = sortedData.map(s => [
        s.profile?.full_name || 'N/A',
        `Jour ${s.day_number}`,
        s.platform.toUpperCase(),
        s.post_link,
        s.content_text || 'Pas de description'
    ]);

    doc.autoTable({
        startY: 40,
        head: [['Candidat', 'Jour', 'Plateforme', 'Lien du Post', 'Description']],
        body: tableRows,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 }, // Blue-500
        columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 15 },
            2: { cellWidth: 20 },
            3: { cellWidth: 50 },
            4: { cellWidth: 'auto' }
        },
        alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
        margin: { top: 40 },
        didDrawPage: (data: any) => {
            // Footer
            const pageCount = doc.getNumberOfPages();
            doc.setFontSize(10);
            const pageSize = doc.internal.pageSize;
            const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
            doc.text('Page ' + pageCount, data.settings.margin.left, pageHeight - 10);
        }
    });

    // Save PDF
    doc.save(`Marathon_Challenge_Soumissions_${new Date().toISOString().split('T')[0]}.pdf`);
};
