import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Clock, Plus, Trash2, Calendar, Check } from 'lucide-react';
import { toast } from 'sonner';

const DAYS = [
    { id: 0, label: 'Sunday' },
    { id: 1, label: 'Monday' },
    { id: 2, label: 'Tuesday' },
    { id: 3, label: 'Wednesday' },
    { id: 4, label: 'Thursday' },
    { id: 5, label: 'Friday' },
    { id: 6, label: 'Saturday' }
];

const TIMEZONES = [
    'UTC', 'Africa/Accra', 'Africa/Lagos', 'Africa/Nairobi', 'Africa/Cairo',
    'Europe/London', 'America/New_York', 'Asia/Dubai'
];

const AvailabilityManager = () => {
    const [availability, setAvailability] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(1); // Monday default
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

    useEffect(() => {
        fetchAvailability();
    }, []);

    const fetchAvailability = async () => {
        try {
            setLoading(true);
            const data = await api.availability.getMine();
            setAvailability(data);
        } catch (error) {
            console.error('Failed to load availability:', error);
            toast.error('Failed to load availability');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSlot = async () => {
        try {
            if (startTime >= endTime) {
                toast.error('End time must be after start time');
                return;
            }

            const newSlot = await api.availability.set({
                dayOfWeek: selectedDay,
                startTime: startTime,
                endTime: endTime,
                timezone: timezone
            });

            setAvailability([...availability, newSlot].sort((a, b) => {
                if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
                return a.start_time.localeCompare(b.start_time);
            }));

            toast.success('Availability slot added');
        } catch (error) {
            console.error('Failed to add slot:', error);
            toast.error(error.response?.data?.message || 'Failed to add slot');
        }
    };

    const handleDeleteSlot = async (id) => {
        try {
            await api.availability.delete(id);
            setAvailability(availability.filter(slot => slot.id !== id));
            toast.success('Slot removed');
        } catch (error) {
            console.error('Failed to delete slot:', error);
            toast.error('Failed to remove slot');
        }
    };

    const formatTime = (timeString) => {
        return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getSlotsForDay = (dayId) => {
        return availability.filter(slot => slot.day_of_week === dayId);
    };

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="text-primary" size={20} />
                    Interview Availability
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Timezone:</span>
                    <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="text-sm border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                    >
                        {TIMEZONES.map(tz => (
                            <option key={tz} value={tz}>{tz}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-8">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Add New Slot</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Day</label>
                        <select
                            value={selectedDay}
                            onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                            className="w-full text-sm border-gray-300 rounded-lg"
                        >
                            {DAYS.map(day => (
                                <option key={day.id} value={day.id}>{day.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Start Time</label>
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full text-sm border-gray-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">End Time</label>
                        <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full text-sm border-gray-300 rounded-lg"
                        />
                    </div>
                    <Button onClick={handleAddSlot} className="flex items-center justify-center gap-2">
                        <Plus size={16} />
                        Add Slot
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {DAYS.map(day => {
                    const slots = getSlotsForDay(day.id);
                    if (slots.length === 0) return null;

                    return (
                        <div key={day.id} className="border-b last:border-0 pb-4 last:pb-0">
                            <h5 className="font-medium text-gray-900 mb-2">{day.label}</h5>
                            <div className="flex flex-wrap gap-2">
                                {slots.map(slot => (
                                    <div key={slot.id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-full pl-3 pr-2 py-1 shadow-sm">
                                        <Clock size={14} className="text-gray-400" />
                                        <span className="text-sm font-medium text-gray-700">
                                            {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                        </span>
                                        <button
                                            onClick={() => handleDeleteSlot(slot.id)}
                                            className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-50 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {availability.length === 0 && !loading && (
                    <div className="text-center py-8 text-gray-500">
                        <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
                        <p>No availability slots set.</p>
                        <p className="text-sm">Add slots to allow clients to schedule interviews.</p>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default AvailabilityManager;
