import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface DeadlineCountdownProps {
    deadline: string; // ISO timestamp
    dayNumber: number;
}

const DeadlineCountdown: React.FC<DeadlineCountdownProps> = ({ deadline, dayNumber }) => {
    const [timeLeft, setTimeLeft] = useState<{
        hours: number;
        minutes: number;
        seconds: number;
        isExpired: boolean;
        isUrgent: boolean;
    }>({ hours: 0, minutes: 0, seconds: 0, isExpired: false, isUrgent: false });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const deadlineTime = new Date(deadline).getTime();
            const difference = deadlineTime - now;

            if (difference <= 0) {
                return { hours: 0, minutes: 0, seconds: 0, isExpired: true, isUrgent: false };
            }

            const hours = Math.floor(difference / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);
            const isUrgent = hours < 3; // Moins de 3 heures restantes

            return { hours, minutes, seconds, isExpired: false, isUrgent };
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [deadline]);

    if (timeLeft.isExpired) {
        return (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-bold text-sm">Deadline expirée</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`border rounded-lg p-3 transition-all ${timeLeft.isUrgent
                ? 'bg-orange-500/20 border-orange-500/30 animate-pulse'
                : 'bg-blue-500/20 border-blue-500/30'
            }`}>
            <div className="flex items-center gap-2 mb-2">
                <Clock className={`w-4 h-4 ${timeLeft.isUrgent ? 'text-orange-400' : 'text-blue-400'}`} />
                <span className={`font-bold text-xs ${timeLeft.isUrgent ? 'text-orange-400' : 'text-blue-400'}`}>
                    {timeLeft.isUrgent ? '⚠️ Deadline imminente !' : 'Temps restant'}
                </span>
            </div>
            <div className="flex gap-2 text-white font-mono text-sm sm:text-base">
                <div className="flex flex-col items-center bg-black/20 rounded px-2 py-1">
                    <span className="font-bold">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="text-[10px] text-gray-400">h</span>
                </div>
                <span className="self-center">:</span>
                <div className="flex flex-col items-center bg-black/20 rounded px-2 py-1">
                    <span className="font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span className="text-[10px] text-gray-400">m</span>
                </div>
                <span className="self-center">:</span>
                <div className="flex flex-col items-center bg-black/20 rounded px-2 py-1">
                    <span className="font-bold">{String(timeLeft.seconds).padStart(2, '0')}</span>
                    <span className="text-[10px] text-gray-400">s</span>
                </div>
            </div>
        </div>
    );
};

export default DeadlineCountdown;
