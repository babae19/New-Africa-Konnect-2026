import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Video, Calendar, Clock, Video as VideoIcon, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useProject } from '../../contexts/ProjectContext';
import { api } from '../../lib/api';
import MeetingRoom from '../../components/common/MeetingRoom';
import { useAuth } from '../../contexts/AuthContext';

const Step3Interview = ({ onNext }) => {
    const { currentProject } = useProject();
    const { user } = useAuth();
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [isScheduling, setIsScheduling] = useState(false);
    const [interviews, setInterviews] = useState([]);
    const [activeMeeting, setActiveMeeting] = useState(null); // { roomName: string, id: string }

    const loadInterviews = useCallback(async () => {
        if (!currentProject?.id) return;
        try {
            const data = await api.interviews.getByProject(currentProject.id);
            setInterviews(data.interviews || []);
        } catch (e) {
            console.error("Failed to load interviews", e);
        } finally {
            // Keep the current list visible if a refresh fails.
        }
    }, [currentProject?.id]);

    useEffect(() => {
        loadInterviews();

    }, [loadInterviews, currentProject?.selected_expert_id]);

    const handleSchedule = async () => {
        if (!scheduledDate || !scheduledTime) {
            toast.error("Please select both date and time");
            return;
        }

        try {
            setIsScheduling(true);
            const scheduledAt = new Date(`${scheduledDate}T${scheduledTime} `);

            // Assuming currentProject.selected_expert_id (the shortlisted one)
            // If no expert selected yet (rare in this flow), warn user
            if (!currentProject.selected_expert_id) {
                toast.warning("No expert has been selected yet. You can skip this step and continue to Contract.");
                return;
            }

            // Create a unique room name
            const roomName = `AK-Interview-${currentProject.id}-${Date.now()}`;

            await api.interviews.schedule({
                projectId: currentProject.id,
                expertId: currentProject.selected_expert_id,
                scheduledAt: scheduledAt.toISOString(),
                durationMinutes: 45,
                notes: "Initial screening",
                meetingLink: roomName // Storing room name as the link for internal logic
            });

            toast.success("Interview Invitation Sent! The expert will be notified.");
            loadInterviews();
        } catch (error) {
            console.error(error);
            toast.error("Failed to schedule: " + error.message);
        } finally {
            setIsScheduling(false);
        }
    };

    const handleJoinMeeting = (interview) => {
        if (interview.meeting_link?.startsWith('https://meet.google.com/')) {
            window.open(interview.meeting_link, '_blank', 'noopener,noreferrer');
            return;
        }
        // If meeting_link is a full URL (legacy), extract room name or just use it. 
        // For new ones, it's just the room name.
        let roomName = interview.meeting_link;
        if (!roomName) {
            roomName = `AK-Interview-${interview.id}`; // Fallback
        }

        // Ensure clean room name if it was a URL
        if (roomName.startsWith('http')) {
            roomName = roomName.split('/').pop();
        }

        setActiveMeeting({
            id: interview.id,
            roomName: roomName
        });
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Schedule Interview</h2>
                <p className="text-gray-600">Coordinate a time to meet your shortlisted expert.</p>
            </div>

            {activeMeeting ? (
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                            Live Interview Session
                        </h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveMeeting(null)}
                            className="text-gray-500 hover:text-red-500"
                        >
                            <X size={16} className="mr-1" /> Leave Meeting
                        </Button>
                    </div>
                    <MeetingRoom
                        roomName={activeMeeting.roomName}
                        userName={user?.name || user?.email || 'User'}
                        userData={user}
                        meetingId={activeMeeting.id}
                        onLeave={() => setActiveMeeting(null)}
                    />
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Scheduler Form */}
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Calendar className="text-primary" />
                                Propose a Time
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                    <input
                                        type="date"
                                        className="w-full p-2 border rounded-lg"
                                        value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                    <input
                                        type="time"
                                        className="w-full p-2 border rounded-lg"
                                        value={scheduledTime}
                                        onChange={(e) => setScheduledTime(e.target.value)}
                                    />
                                </div>

                                <div className="pt-4">
                                    <Button
                                        className="w-full"
                                        onClick={handleSchedule}
                                        disabled={isScheduling || !currentProject?.selected_expert_id}
                                    >
                                        {isScheduling ? "Sending Invite..." : "Send Interview Invitation"}
                                    </Button>
                                    {!currentProject?.selected_expert_id && (
                                        <p className="text-xs text-red-500 mt-2 text-center">
                                            Please shortlist an expert in the previous step first.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Scheduled Interviews List */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <VideoIcon className="text-primary" />
                                Scheduled Sessions
                            </h3>

                            {interviews.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    <p className="text-gray-500">No interviews scheduled yet.</p>
                                </div>
                            ) : (
                                interviews.map((interview) => (
                                    <Card key={interview.id} className="p-4 border-l-4 border-l-primary">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-gray-900">Meeting with {interview.expert_name || 'the Expert'}</h4>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${new Date(interview.scheduled_at) > new Date() ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    {new Date(interview.scheduled_at) > new Date() ? 'Upcoming' : 'Ready'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={14} className="text-primary" />
                                                    {new Date(interview.scheduled_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock size={14} className="text-primary" />
                                                    {new Date(interview.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => handleJoinMeeting(interview)}
                                                className="bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
                                                size="sm"
                                            >
                                                <Video size={16} className="mr-2" />
                                                Start Meeting
                                            </Button>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-end mt-8">
                {!activeMeeting && (
                    <Button
                        variant="ghost"
                        className="mr-2 text-gray-500 hover:text-primary"
                        onClick={() => setActiveMeeting({ roomName: `AK-Demo-${Date.now()}`, id: 'demo' })}
                    >
                        <VideoIcon size={16} className="mr-2" />
                        Quick Test Call
                    </Button>
                )}
                <Button onClick={onNext} className="shadow-xl shadow-primary/20">
                    Continue to Contract
                </Button>
            </div>
        </div>
    );
};

export { Step3Interview };
