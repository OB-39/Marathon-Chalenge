import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Target } from 'lucide-react';

interface PerformanceChartProps {
    validated: number;
    pending: number;
    rejected: number;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ validated, pending, rejected }) => {
    const data = [
        { name: 'Validés', value: validated, color: '#10b981' }, // Success
        { name: 'En attente', value: pending, color: '#f59e0b' }, // Warning
        { name: 'Refusés', value: rejected, color: '#f43f5e' }, // Danger
    ].filter(item => item.value > 0);

    const total = validated + pending + rejected;
    const successRate = total > 0 ? ((validated / total) * 100).toFixed(0) : 0;

    return (
        <div className="neo-card p-6 h-full flex flex-col justify-center">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-surface-900 flex items-center gap-2 font-display">
                        <Target className="w-5 h-5 text-success-500" />
                        Taux de Réussite
                    </h3>
                    <p className="text-sm text-surface-500 mt-1">
                        Performance globale
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-bold text-success-600 font-display">{successRate}%</p>
                    <p className="text-xs text-surface-500">de validation</p>
                </div>
            </div>

            {data.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={85}
                            paddingAngle={5}
                            dataKey="value"
                            strokeWidth={0}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                padding: '8px 12px',
                            }}
                            itemStyle={{ fontWeight: 500 }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(value, _entry: any) => (
                                <span className="text-sm font-medium text-surface-600 ml-2">
                                    {value}
                                </span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-surface-400 min-h-[150px]">
                    <div className="w-16 h-16 rounded-full bg-surface-50 border-2 border-surface-100 flex items-center justify-center mb-2">
                        <Target className="w-6 h-6 text-surface-300" />
                    </div>
                    <p className="text-sm">Aucune donnée</p>
                </div>
            )}
        </div>
    );
};

export default PerformanceChart;
