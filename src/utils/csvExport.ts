// Utility functions for CSV export

export const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
        alert('Aucune donnée à exporter');
        return;
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);

    // Create CSV content
    const csvContent = [
        headers.join(','), // Header row
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                // Escape commas and quotes
                if (value === null || value === undefined) return '';
                const stringValue = String(value);
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            }).join(',')
        )
    ].join('\n');

    // Create blob and download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const exportLeaderboard = async (supabase: any) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('full_name, email, total_points, university, phone_number')
            .eq('is_registered', true)
            .eq('role', 'student')
            .order('total_points', { ascending: false });

        if (error) throw error;

        const formattedData = data.map((profile: any, index: number) => ({
            Rang: index + 1,
            Nom: profile.full_name || 'N/A',
            Email: profile.email,
            Points: profile.total_points || 0,
            Université: profile.university || 'N/A',
            Téléphone: profile.phone_number || 'N/A',
        }));

        exportToCSV(formattedData, 'classement_marathon_challenge');
    } catch (error) {
        console.error('Erreur lors de l\'export:', error);
        alert('Erreur lors de l\'export du classement');
    }
};

export const exportSubmissions = async (supabase: any) => {
    try {
        const { data, error } = await supabase
            .from('submissions')
            .select(`
                *,
                profile:profiles!submissions_user_id_fkey(full_name, email, university)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedData = data.map((submission: any) => ({
            Jour: submission.day_number,
            Candidat: submission.profile?.full_name || 'N/A',
            Email: submission.profile?.email || 'N/A',
            Université: submission.profile?.university || 'N/A',
            Plateforme: submission.platform,
            Statut: submission.status,
            Score: submission.score_awarded || 0,
            'Lien du post': submission.post_link,
            'Date de soumission': new Date(submission.created_at).toLocaleDateString('fr-FR'),
            'Commentaire de refus': submission.rejection_comment || '',
        }));

        exportToCSV(formattedData, 'soumissions_marathon_challenge');
    } catch (error) {
        console.error('Erreur lors de l\'export:', error);
        alert('Erreur lors de l\'export des soumissions');
    }
};

export const exportGlobalStats = async (supabase: any) => {
    try {
        // Get all submissions
        const { data: submissions, error: subError } = await supabase
            .from('submissions')
            .select('*');

        if (subError) throw subError;

        // Get all participants (students only, not ambassadors)
        const { data: participants, error: partError } = await supabase
            .from('profiles')
            .select('*')
            .eq('is_registered', true)
            .eq('role', 'student');

        if (partError) throw partError;

        const totalSubmissions = submissions?.length || 0;
        const validatedSubmissions = submissions?.filter((s: any) => s.status === 'validated').length || 0;
        const pendingSubmissions = submissions?.filter((s: any) => s.status === 'pending').length || 0;
        const rejectedSubmissions = submissions?.filter((s: any) => s.status === 'rejected').length || 0;

        const avgScore = submissions
            ?.filter((s: any) => s.status === 'validated' && s.score_awarded)
            .reduce((sum: number, s: any) => sum + s.score_awarded, 0) / (validatedSubmissions || 1);

        const totalPoints = participants?.reduce((sum: number, p: any) => sum + (p.total_points || 0), 0) || 0;

        const statsData = [{
            'Total Participants': participants?.length || 0,
            'Total Soumissions': totalSubmissions,
            'Soumissions Validées': validatedSubmissions,
            'Soumissions En Attente': pendingSubmissions,
            'Soumissions Refusées': rejectedSubmissions,
            'Taux de Validation (%)': ((validatedSubmissions / totalSubmissions) * 100).toFixed(2),
            'Score Moyen': avgScore.toFixed(2),
            'Total Points Distribués': totalPoints,
            'Date d\'export': new Date().toLocaleDateString('fr-FR'),
        }];

        exportToCSV(statsData, 'statistiques_globales');
    } catch (error) {
        console.error('Erreur lors de l\'export:', error);
        alert('Erreur lors de l\'export des statistiques');
    }
};
