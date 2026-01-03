import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Submission, Profile } from '../types/database';

// Extend jsPDF with autotable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
        getNumberOfPages: () => number;
        lastAutoTable: { finalY: number };
    }
}

interface DailyReportData {
    submissions: Submission[];
    profiles: Profile[];
    date: Date;
}

// Helper function to get max score based on day number
const getMaxScoreForDay = (dayNumber: number): number => {
    return dayNumber >= 4 && dayNumber <= 15 ? 20 : 10;
};

export const exportDailyReportToPDF = (data: DailyReportData) => {
    const doc = new jsPDF('p', 'mm', 'a4'); // Portrait orientation
    const { submissions, profiles, date } = data;

    // Colors
    const primaryColor: [number, number, number] = [59, 130, 246]; // Blue-500
    const successColor: [number, number, number] = [34, 197, 94]; // Green-500
    const warningColor: [number, number, number] = [251, 146, 60]; // Orange-500
    const dangerColor: [number, number, number] = [239, 68, 68]; // Red-500
    const darkColor: [number, number, number] = [15, 23, 42]; // Slate-900

    let yPos = 20;

    // ============================================
    // HEADER
    // ============================================
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('MARATHON CHALLENGE', 105, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Rapport Journalier', 105, 28, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Date: ${date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 105, 35, { align: 'center' });

    yPos = 50;

    // ============================================
    // STATISTIQUES GLOBALES
    // ============================================
    doc.setFontSize(16);
    doc.setTextColor(...darkColor);
    doc.setFont('helvetica', 'bold');
    doc.text('Statistiques du Jour', 14, yPos);
    yPos += 10;

    const todaySubmissions = submissions.filter(s => {
        const submissionDate = new Date(s.created_at!);
        return submissionDate.toDateString() === date.toDateString();
    });

    const validatedToday = todaySubmissions.filter(s => s.status === 'validated').length;
    const pendingToday = todaySubmissions.filter(s => s.status === 'pending').length;
    const rejectedToday = todaySubmissions.filter(s => s.status === 'rejected').length;
    const totalParticipants = profiles.length;
    const activeToday = todaySubmissions.length;
    const participationRate = totalParticipants > 0 ? ((activeToday / totalParticipants) * 100).toFixed(1) : '0';

    // Stats Cards
    const stats = [
        { label: 'Soumissions du jour', value: todaySubmissions.length.toString(), color: primaryColor },
        { label: 'Validées', value: validatedToday.toString(), color: successColor },
        { label: 'En attente', value: pendingToday.toString(), color: warningColor },
        { label: 'Rejetées', value: rejectedToday.toString(), color: dangerColor },
    ];

    stats.forEach((stat, index) => {
        const x = 14 + (index % 2) * 95;
        const y = yPos + Math.floor(index / 2) * 25;

        doc.setFillColor(...stat.color);
        doc.roundedRect(x, y, 90, 20, 3, 3, 'F');

        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'normal');
        doc.text(stat.label, x + 5, y + 8);

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(stat.value, x + 5, y + 16);
    });

    yPos += 55;

    // Taux de participation
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(14, yPos, 182, 15, 3, 3, 'F');
    doc.setFontSize(11);
    doc.setTextColor(...darkColor);
    doc.setFont('helvetica', 'bold');
    doc.text(`Taux de participation: ${participationRate}% (${activeToday}/${totalParticipants} participants)`, 20, yPos + 10);

    yPos += 25;

    // ============================================
    // DÉTAIL DES SOUMISSIONS DU JOUR
    // ============================================
    if (todaySubmissions.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor(...darkColor);
        doc.setFont('helvetica', 'bold');
        doc.text('Soumissions du Jour', 14, yPos);
        yPos += 5;

        const tableData = todaySubmissions.map(s => {
            const statusEmoji = s.status === 'validated' ? 'Valide' : s.status === 'pending' ? 'Attente' : 'Refuse';
            const score = s.score_awarded ? `${s.score_awarded}/${getMaxScoreForDay(s.day_number)}` : '-';
            return [
                s.profile?.full_name || 'N/A',
                `Jour ${s.day_number}`,
                s.platform.toUpperCase(),
                statusEmoji,
                score,
                new Date(s.created_at!).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            ];
        });

        autoTable(doc, {
            startY: yPos,
            head: [['Participant', 'Jour', 'Plateforme', 'Statut', 'Score', 'Heure']],
            body: tableData,
            styles: {
                fontSize: 9,
                cellPadding: 3,
                overflow: 'linebreak',
            },
            headStyles: {
                fillColor: primaryColor,
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center'
            },
            columnStyles: {
                0: { cellWidth: 45 },
                1: { cellWidth: 20, halign: 'center' },
                2: { cellWidth: 30, halign: 'center' },
                3: { cellWidth: 20, halign: 'center' },
                4: { cellWidth: 20, halign: 'center' },
                5: { cellWidth: 25, halign: 'center' }
            },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 14, right: 14 }
        });

        yPos = doc.lastAutoTable.finalY + 15;
    }

    // ============================================
    // CLASSEMENT DES PARTICIPANTS
    // ============================================
    if (yPos > 250) {
        doc.addPage();
        yPos = 20;
    }

    doc.setFontSize(16);
    doc.setTextColor(...darkColor);
    doc.setFont('helvetica', 'bold');
    doc.text('Top 10 Participants', 14, yPos);
    yPos += 5;

    const sortedProfiles = [...profiles]
        .sort((a, b) => (b.total_points || 0) - (a.total_points || 0))
        .slice(0, 10);

    const leaderboardData = sortedProfiles.map((p, index) => {
        const validatedCount = submissions.filter(s => s.user_id === p.id && s.status === 'validated').length;
        const medal = (index + 1).toString();
        return [
            medal,
            p.full_name || p.email,
            p.university || 'N/A',
            `${validatedCount}/15`,
            (p.total_points || 0).toString()
        ];
    });

    autoTable(doc, {
        startY: yPos,
        head: [['Rang', 'Participant', 'Université', 'Jours', 'Points']],
        body: leaderboardData,
        styles: {
            fontSize: 9,
            cellPadding: 3,
        },
        headStyles: {
            fillColor: [251, 191, 36], // Yellow-500
            textColor: darkColor,
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
            1: { cellWidth: 60 },
            2: { cellWidth: 45 },
            3: { cellWidth: 25, halign: 'center' },
            4: { cellWidth: 30, halign: 'center', fontStyle: 'bold' }
        },
        alternateRowStyles: { fillColor: [254, 249, 195] }, // Yellow-50
        margin: { left: 14, right: 14 }
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // ============================================
    // PARTICIPANTS INACTIFS
    // ============================================
    const inactiveParticipants = profiles.filter(p =>
        !todaySubmissions.some(s => s.user_id === p.id)
    );

    if (inactiveParticipants.length > 0) {
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(16);
        doc.setTextColor(...dangerColor);
        doc.setFont('helvetica', 'bold');
        doc.text(`Participants Inactifs (${inactiveParticipants.length})`, 14, yPos);
        yPos += 5;

        const inactiveData = inactiveParticipants.map(p => [
            p.full_name || p.email,
            p.email,
            p.university || 'N/A',
            (p.total_points || 0).toString()
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Participant', 'Email', 'Université', 'Points']],
            body: inactiveData,
            styles: {
                fontSize: 8,
                cellPadding: 2,
            },
            headStyles: {
                fillColor: dangerColor,
                textColor: 255,
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { cellWidth: 50 },
                1: { cellWidth: 60 },
                2: { cellWidth: 40 },
                3: { cellWidth: 30, halign: 'center' }
            },
            alternateRowStyles: { fillColor: [254, 242, 242] }, // Red-50
            margin: { left: 14, right: 14 }
        });
    }

    // ============================================
    // FOOTER
    // ============================================
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
            `Page ${i}/${pageCount} - Généré le ${new Date().toLocaleString('fr-FR')}`,
            105,
            287,
            { align: 'center' }
        );
        doc.text('Marathon Challenge © 2026', 105, 292, { align: 'center' });
    }

    // Save PDF
    const fileName = `Rapport_Journalier_${date.toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
};

// Keep the original function for backward compatibility
export const exportSubmissionsToPDF = (submissions: Submission[]) => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation

    // Colors
    const primaryColor: [number, number, number] = [59, 130, 246]; // Blue-500

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 297, 30, 'F');

    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('MARATHON CHALLENGE - LISTE DES SOUMISSIONS', 148.5, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Export complet - Généré le: ${new Date().toLocaleString('fr-FR')}`, 148.5, 23, { align: 'center' });

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
        s.status === 'validated' ? 'Valide' : s.status === 'pending' ? 'Attente' : 'Refuse',
        s.score_awarded ? `${s.score_awarded}/${getMaxScoreForDay(s.day_number)}` : '-',
        s.post_link,
        s.content_text || 'Pas de description'
    ]);

    autoTable(doc, {
        startY: 40,
        head: [['Candidat', 'Jour', 'Plateforme', 'Statut', 'Score', 'Lien', 'Description']],
        body: tableRows,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 15 },
            2: { cellWidth: 20 },
            3: { cellWidth: 20 },
            4: { cellWidth: 15 },
            5: { cellWidth: 40 },
            6: { cellWidth: 'auto' }
        },
        alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
        margin: { top: 40, left: 14, right: 14 },
        didDrawPage: () => {
            // Footer
            const pageCount = doc.getNumberOfPages();
            doc.setFontSize(10);
            doc.setTextColor(150);
            const pageSize = doc.internal.pageSize;
            const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
            doc.text(`Page ${pageCount} - Marathon Challenge`, 148.5, pageHeight - 10, { align: 'center' });
        }
    });

    // Save PDF
    doc.save(`Marathon_Challenge_Soumissions_${new Date().toISOString().split('T')[0]}.pdf`);
};
