import React from 'react';
import { Download } from 'lucide-react';
import Button from '../components/ui/Button';
import { exportLeaderboard, exportSubmissions, exportGlobalStats } from '../utils/csvExport';
import { supabase } from '../lib/supabase';

interface ExportButtonProps {
    type: 'leaderboard' | 'submissions' | 'stats';
    label?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({ type, label }) => {
    const [loading, setLoading] = React.useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            switch (type) {
                case 'leaderboard':
                    await exportLeaderboard(supabase);
                    break;
                case 'submissions':
                    await exportSubmissions(supabase);
                    break;
                case 'stats':
                    await exportGlobalStats(supabase);
                    break;
            }
        } catch (error) {
            console.error('Export error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getLabel = () => {
        if (label) return label;
        switch (type) {
            case 'leaderboard':
                return 'Exporter le classement';
            case 'submissions':
                return 'Exporter les soumissions';
            case 'stats':
                return 'Exporter les statistiques';
        }
    };

    return (
        <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            isLoading={loading}
        >
            <Download className="w-4 h-4 mr-2" />
            {getLabel()}
        </Button>
    );
};

export default ExportButton;
