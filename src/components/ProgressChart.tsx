import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface ProgressChartProps {
    data: Array<{ day: number; points: number }>;
}

const ProgressChart: React.FC<ProgressChartProps> = ({ data }) => {
    return (
        <div className="neo-card p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-surface-900 flex items-center gap-2 font-display">
                        <TrendingUp className="w-5 h-5 text-primary-500" />
                        Évolution des Points
                    </h3>
                    <p className="text-sm text-surface-500 mt-1">
                        Progression au fil des jours
                    </p>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                        dataKey="day"
                        stroke="#94a3b8"
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        dx={-10}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            backdropFilter: 'blur(8px)',
                        }}
                        labelStyle={{ color: '#0f172a', fontWeight: 600 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="points"
                        stroke="#6366f1"
                        strokeWidth={4}
                        dot={{ fill: '#6366f1', r: 4, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2, fill: '#fff' }}
                        animationDuration={1500}
                    />
                    <defs>
                        <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ProgressChart;
