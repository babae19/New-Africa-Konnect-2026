import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { X, Calendar, Clock, Check, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const AutoScheduleModal = ({ isOpen, onClose, expertId, expertName, projectId, onScheduled }) => {
    const [availability, setAvailability] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [note, setNote] = useState('');

    useEffect(() => {
        if (isOpen && expertId) {
            fetchAvailability();
        }
    }, [isOpen, expertId]);

    const fetchAvailability = async () => {
        try {
            setLoading(true);
            const data = await api.availability.getByExpert(expertId);
            setAvailability(data);
        } catch (error) {
            console.error('Failed to load availability:', error);
            // Don't show error to client immediately, just show no slots
        } finally {
            setLoading(false);
        }
    };

    const getDaysSlots = (date) => {
        const dayOfWeek = date.getDay();
        return availability.filter(slot => slot.day_of_week === dayOfWeek);
    };

    // Generate specific time slots from availability windows
    // In a real app, we would check against existing bookings here
    const generateTimeSlots = (window) => {
        const slots = [];
        const [startHour, startMinute] = window.start_time.split(':').map(Number);
        const [endHour, endMinute] = window.end_time.split(':').map(Number);

        let current = new Date(selectedDate);
        current.setHours(startHour, startMinute, 0, 0);

        const end = new Date(selectedDate);
        end.setHours(endHour, endMinute, 0, 0);

        // 30 minute slots
        while (current < end) {
            const slotEnd = new Date(current.getTime() + 30 * 60000);
            if (slotEnd <= end) {
                // Determine if this slot is in the past
                if (current > new Date()) {
                    slots.push({
                        start: new Date(current),
                        end: slotEnd,
                        label: `${current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    });
                }
            }
            current = slotEnd;
        }

        return slots;
    };

    const handleSchedule = async () => {
        if (!selectedSlot) return;

        try {
            setSubmitting(true);

            // This endpoint would be part of the interview controller
            // For now, we'll simulate the API call or use the existing invite endpoint with extra data
            await api.projects.invite(projectId, expertId, {
                scheduledAt: selectedSlot.start.toISOString(),
                note
            });

            toast.success('Interview scheduled successfully');
            onScheduled();
            onClose();
        } catch (error) {
            console.error('Failed to schedule:', error);
            toast.error('Failed to schedule interview');
        } finally {
            setSubmitting(false);
        }
    };

    // Date navigation
    const nextDay = () => {
        const next = new Date(selectedDate);
        next.setDate(selectedDate.getDate() + 1);
        setSelectedDate(next);
        setSelectedSlot(null);
    };

    const prevDay = () => {
        const prev = new Date(selectedDate);
        prev.setDate(selectedDate.getDate() - 1);
        // Don't allow going before today
        if (prev >= new Date().setHours(0, 0, 0, 0)) {
            setSelectedDate(prev);
            setSelectedSlot(null);
        }
    };

    if (!isOpen) return null;

    const daySlots = getDaysSlots(selectedDate);
    const availableTimeSlots = daySlots.flatMap(generateTimeSlots);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="font-bold text-gray-900">Schedule Interview</h3>
                        <p className="text-xs text-gray-500">with {expertName}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1">
                    {/* Date Selector */}
                    <div className="flex items-center justify-between mb-6 bg-white border rounded-lg p-2">
                        <button
                            onClick={prevDay}
                            disabled={selectedDate <= new Date().setHours(0, 0, 0, 0)}
                            className="p-2 hover:bg-gray-100 rounded disabled:opacity-30"
                        >
                            <ArrowRight size={16} className="rotate-180" />
                        </button>
                        <div className="text-center">
                            <div className="font-medium text-gray-900">
                                {selectedDate.toLocaleDateString(undefined, { weekday: 'long' })}
                            </div>
                            <div className="text-sm text-gray-500">
                                {selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                            </div>
                        </div>
                        <button
                            onClick={nextDay}
                            className="p-2 hover:bg-gray-100 rounded"
                        >
                            <ArrowRight size={16} />
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin text-primary" size={32} />
                        </div>
                    ) : availableTimeSlots.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Clock size={48} className="mx-auto text-gray-300 mb-3" />
                            <p>No available slots for this day.</p>
                            <p className="text-xs mt-1">Try checking another date.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-2 mb-6">
                            {availableTimeSlots.map((slot, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`px-2 py-2 text-sm rounded border transition-colors ${selectedSlot === slot
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-primary hover:text-primary'
                                        }`}
                                >
                                    {slot.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {selectedSlot && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Message (Optional)
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Add a note or meeting agenda..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm h-20 resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50 flex gap-3">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSchedule}
                        disabled={!selectedSlot || submitting}
                        className="flex-1 flex items-center justify-center gap-2"
                    >
                        {submitting ? <Loader2 className="animate-spin" size={16} /> : <Calendar size={16} />}
                        Schedule
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default AutoScheduleModal;
