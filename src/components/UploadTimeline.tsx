import { useState, useEffect } from 'react';
import {
    Calendar, Clock, Upload, CheckCircle2, Lock,
    ChevronDown, ChevronUp, CircleDot, Timer, Zap
} from 'lucide-react';
import { getUploadSchedule } from '../services/api';

interface ScheduleEntry {
    date: string;
    deadlineHour: number;
    deadlineMinute: number;
    label: string;
    status: 'past' | 'active' | 'upcoming';
    opensAt: string;
    deadlineFormatted: string;
    dateFormatted: string;
    dayName: string;
}

interface ScheduleData {
    schedule: ScheduleEntry[];
    isOpen: boolean;
    message: string;
    phase: 'initial' | 'scheduled' | 'closed';
    currentWindow: ScheduleEntry | null;
    nextWindow: ScheduleEntry | null;
}

interface UploadTimelineProps {
    /** If true, show in a compact read-only mode for the Rules page */
    compact?: boolean;
}

const UploadTimeline = ({ compact = false }: UploadTimelineProps) => {
    const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
    const [expanded, setExpanded] = useState(compact); // expanded by default on Rules page
    const [error, setError] = useState('');

    useEffect(() => {
        loadSchedule();
    }, []);

    const loadSchedule = async () => {
        try {
            const data = await getUploadSchedule();
            setScheduleData(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load upload schedule');
        }
    };

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-600 text-sm">
                ⚠️ {error}
            </div>
        );
    }

    if (!scheduleData) {
        return (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
                <div className="animate-pulse flex flex-col items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="h-4 w-48 bg-gray-200 rounded" />
                </div>
            </div>
        );
    }

    const { schedule, isOpen, message, phase, currentWindow, nextWindow } = scheduleData;

    // Show limited items unless expanded
    const firstUpcomingIdx = schedule.findIndex(s => s.status === 'upcoming' || s.status === 'active');
    const visibleStart = Math.max(0, firstUpcomingIdx - 2);
    const visibleSchedule = expanded ? schedule : schedule.slice(visibleStart, visibleStart + 7);

    const getMonthGroup = (dateStr: string) => {
        const [, m] = dateStr.split('-').map(Number);
        return ['', 'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'][m];
    };

    return (
        <div className="space-y-4">
            {/* Status Banner */}
            {!compact && (
                <div className={`rounded-2xl p-5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isOpen
                        ? phase === 'initial'
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                            : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                        : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${isOpen
                                ? phase === 'initial' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
                                : 'bg-amber-500 text-white'
                            }`}>
                            {isOpen ? (phase === 'initial' ? <Zap size={22} /> : <Upload size={22} />) : <Lock size={22} />}
                        </div>
                        <div>
                            <h3 className={`font-bold text-base ${isOpen
                                    ? phase === 'initial' ? 'text-blue-800' : 'text-green-800'
                                    : 'text-amber-800'
                                }`}>
                                {isOpen
                                    ? phase === 'initial' ? '🔵 Initial Submission Period — Uploads Open!' : '🟢 Upload Window Open!'
                                    : '🔒 Uploads Closed'
                                }
                            </h3>
                            <p className={`text-sm mt-0.5 ${isOpen
                                    ? phase === 'initial' ? 'text-blue-600' : 'text-green-600'
                                    : 'text-amber-600'
                                }`}>
                                {message}
                            </p>
                        </div>
                    </div>

                    {isOpen && phase === 'scheduled' && currentWindow && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/70 rounded-xl border border-green-200">
                            <Timer size={14} className="text-green-600" />
                            <span className="text-sm font-bold text-green-700">
                                Deadline: {currentWindow.deadlineFormatted} IST
                            </span>
                        </div>
                    )}

                    {isOpen && phase === 'initial' && nextWindow && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/70 rounded-xl border border-blue-200">
                            <Calendar size={14} className="text-blue-600" />
                            <span className="text-sm font-bold text-blue-700">
                                Schedule starts: {nextWindow.dateFormatted}
                            </span>
                        </div>
                    )}

                    {!isOpen && nextWindow && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/70 rounded-xl border border-amber-200">
                            <Calendar size={14} className="text-amber-600" />
                            <span className="text-sm font-bold text-amber-700">
                                Next: {nextWindow.dateFormatted}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Timeline */}
            <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${compact ? '' : ''}`}>
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="text-blue-600" size={18} />
                        Model Upload Schedule
                    </h3>
                    <span className="text-xs text-gray-400 font-medium">
                        {schedule.filter(s => s.status !== 'past').length} windows remaining
                    </span>
                </div>

                <div className="p-5">
                    {/* Info note */}
                    <div className="mb-4 px-3 py-2.5 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700">
                        <strong>📋 Schedule:</strong> Each upload window opens at <strong>12:00 AM IST</strong> and closes at the listed deadline time. You can upload or update your model during any open window.
                    </div>

                    <div className="relative">
                        {/* Vertical line */}
                        <div className="absolute left-[19px] top-3 bottom-3 w-[2px] bg-gradient-to-b from-blue-200 via-blue-100 to-gray-100" />

                        {visibleSchedule.map((entry, idx) => {
                            const prevEntry = idx > 0 ? visibleSchedule[idx - 1] : null;
                            const showMonthLabel = !prevEntry || getMonthGroup(entry.date) !== getMonthGroup(prevEntry.date);

                            return (
                                <div key={entry.date}>
                                    {/* Month Separator */}
                                    {showMonthLabel && (
                                        <div className="flex items-center gap-3 mb-3 mt-1">
                                            <div className="w-10 flex justify-center">
                                                <div className="w-2 h-2 rounded-full bg-gray-300" />
                                            </div>
                                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                                {getMonthGroup(entry.date)} 2026
                                            </span>
                                        </div>
                                    )}

                                    {/* Timeline Node */}
                                    <div className={`flex items-center gap-4 py-2.5 px-1 rounded-xl transition-all ${entry.status === 'active' ? 'bg-green-50/80 -mx-2 px-3' : ''
                                        }`}>
                                        {/* Node Dot */}
                                        <div className="w-10 flex justify-center relative z-10">
                                            {entry.status === 'active' ? (
                                                <div className="relative">
                                                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-md shadow-green-200">
                                                        <Upload size={14} className="text-white" />
                                                    </div>
                                                    <div className="absolute inset-0 w-8 h-8 rounded-full bg-green-400 animate-ping opacity-30" />
                                                </div>
                                            ) : entry.status === 'upcoming' ? (
                                                <div className="w-7 h-7 rounded-full bg-blue-100 border-2 border-blue-400 flex items-center justify-center">
                                                    <CircleDot size={12} className="text-blue-500" />
                                                </div>
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                                                    <CheckCircle2 size={12} className="text-gray-400" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 flex items-center justify-between">
                                            <div>
                                                <div className={`font-bold text-sm ${entry.status === 'active' ? 'text-green-800' :
                                                        entry.status === 'upcoming' ? 'text-gray-900' :
                                                            'text-gray-400'
                                                    }`}>
                                                    {entry.dateFormatted}
                                                </div>
                                                <div className={`text-xs mt-0.5 ${entry.status === 'active' ? 'text-green-600' :
                                                        entry.status === 'upcoming' ? 'text-gray-500' :
                                                            'text-gray-300'
                                                    }`}>
                                                    {entry.dayName}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${entry.status === 'active'
                                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                                        : entry.status === 'upcoming'
                                                            ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                                            : 'bg-gray-50 text-gray-400 border border-gray-100'
                                                    }`}>
                                                    <Clock size={10} />
                                                    12 AM — {entry.deadlineFormatted} IST
                                                </div>

                                                {entry.status === 'active' && (
                                                    <span className="px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wide animate-pulse">
                                                        Live
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Expand/Collapse */}
                    {!compact && schedule.length > 7 && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-xl transition border border-blue-100"
                        >
                            {expanded ? (
                                <><ChevronUp size={16} /> Show Less</>
                            ) : (
                                <><ChevronDown size={16} /> Show All {schedule.length} Dates</>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UploadTimeline;
