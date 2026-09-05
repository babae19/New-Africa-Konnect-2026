import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Calendar, Clock, Video, X } from 'lucide-react';

const ScheduleInterviewModal = ({ isOpen, onClose, onSchedule, expertName = 'the expert' }) => {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [topic, setTopic] = useState('Project Discussion');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Combine date and time
            const scheduledAt = new Date(`${date}T${time}`);

            await onSchedule({
                scheduledAt: scheduledAt.toISOString(),
                durationMinutes: 30, // Default for now
                notes: topic
            });
            onClose();
        } catch (error) {
            console.error("Failed to schedule:", error);
            // Optionally set error state here
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <Card className="w-full max-w-md p-6 bg-white relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X size={20} />
                </button>

                <h3 className="text-xl font-bold text-gray-900 mb-2">Schedule Interview</h3>
                <p className="text-sm text-gray-500 mb-6">
                    Propose a time to meet with {expertName}. A video link will be generated automatically.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                            <div className="relative">
                                <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                        <Video size={20} className="text-blue-600 mt-1 shrink-0" />
                        <div>
                            <p className="font-semibold text-blue-900 text-sm">Video Conferencing</p>
                            <p className="text-xs text-blue-700 mt-1">
                                A secure Jitsi meeting link will be created and shared with both parties automatically.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Scheduling...' : 'Confirm Schedule'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default ScheduleInterviewModal;
