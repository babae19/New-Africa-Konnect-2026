import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    Loader2, Mic, MicOff, Video, VideoOff, ScreenShare, 
    PhoneOff, Settings, Users, Share2, Maximize2 
} from 'lucide-react';
import ConnectyCube, { createConnectyCubeSession } from '../../lib/connectycube';
import ConferenceVideo from './ConferenceVideo';
import { toast } from 'sonner';

const MeetingRoom = ({ roomName, userName, userData, onLeave, meetingId: initialMeetingId }) => {
    const [loading, setLoading] = useState(true);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState({});
    const [participants, setParticipants] = useState({});
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    
    const sessionRef = useRef(null);
    const currentMeetingId = useRef(initialMeetingId || roomName);

    const cleanup = useCallback(() => {
        if (sessionRef.current) {
            sessionRef.current.leave();
            sessionRef.current = null;
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        setLocalStream(null);
        setRemoteStreams({});
        setParticipants({});
    }, [localStream]);

    useEffect(() => {
        let isMounted = true;

        const initMeeting = async () => {
            try {
                // 1. Ensure we have a ConnectyCube session for the user
                const ccUser = await createConnectyCubeSession(userData);
                
                // 2. Create conference session
                const session = ConnectyCube.videochatconference.createNewSession();
                sessionRef.current = session;

                // 3. Setup event listeners
                session.onParticipantJoinedListener = (participantId, participantName) => {
                    console.log('Participant joined:', participantId, participantName);
                    setParticipants(prev => ({ ...prev, [participantId]: { name: participantName, id: participantId } }));
                    toast.info(`${participantName} joined the meeting`);
                };

                session.onParticipantLeftListener = (participantId) => {
                    console.log('Participant left:', participantId);
                    const name = participants[participantId]?.name || 'Someone';
                    setParticipants(prev => {
                        const newParticipants = { ...prev };
                        delete newParticipants[participantId];
                        return newParticipants;
                    });
                    setRemoteStreams(prev => {
                        const newStreams = { ...prev };
                        delete newStreams[participantId];
                        return newStreams;
                    });
                    toast.info(`${name} left the meeting`);
                };

                session.onRemoteStreamListener = (participantId, stream) => {
                    console.log('Remote stream received from:', participantId);
                    setRemoteStreams(prev => ({ ...prev, [participantId]: stream }));
                };

                session.onSlowLinkListener = (uplink, nacks) => {
                    console.warn('Slow link detected:', uplink, nacks);
                };

                session.onSessionConnectionStateChangedListener = (participantId, state) => {
                    console.log('Connection state for', participantId, 'is', state);
                };

                // 4. Get local media
                const mediaParams = { audio: true, video: true };
                const stream = await session.getUserMedia(mediaParams);
                if (!isMounted) return;
                
                setLocalStream(stream);

                // 5. Join the room
                // Note: ConnectyCube.videochatconference.join(roomId, userId, userName)
                // We use the meetingId if provided, otherwise the roomName string
                await session.join(currentMeetingId.current, ccUser.id, userName);
                
                if (isMounted) setLoading(false);
                toast.success('Joined meeting room securely');

            } catch (error) {
                console.error('Failed to join meeting:', error);
                toast.error(`Meeting error: ${error.message || 'Unknown error'}`);
                if (isMounted) setLoading(false);
            }
        };

        initMeeting();

        return () => {
            isMounted = false;
            cleanup();
        };
    }, [userData, userName, cleanup]);

    const toggleMic = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
                // Also toggle in session if needed
                if (isMuted) sessionRef.current.unmuteAudio();
                else sessionRef.current.muteAudio();
            }
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
                if (isVideoOff) sessionRef.current.unmuteVideo();
                else sessionRef.current.muteVideo();
            }
        }
    };

    const toggleScreenShare = async () => {
        try {
            if (!isScreenSharing) {
                const stream = await sessionRef.current.getDisplayMedia({ video: true, audio: true });
                setLocalStream(stream);
                setIsScreenSharing(true);
                toast.info('Screen sharing started');
                
                // Handle when user stops sharing via browser UI
                stream.getVideoTracks()[0].onended = () => {
                    stopScreenSharing();
                };
            } else {
                stopScreenSharing();
            }
        } catch (error) {
            console.error('Screen share error:', error);
            toast.error('Failed to share screen');
        }
    };

    const stopScreenSharing = async () => {
        try {
            const stream = await sessionRef.current.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            setIsScreenSharing(false);
            toast.info('Switched back to camera');
        } catch (error) {
            console.error('Error switching back to camera:', error);
        }
    };

    const handleLeave = () => {
        cleanup();
        if (onLeave) onLeave();
    };

    if (loading) {
        return (
            <div className="h-full w-full bg-gray-900 rounded-xl flex flex-col items-center justify-center text-white p-8">
                <div className="relative mb-6">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Users size={20} className="text-primary" />
                    </div>
                </div>
                <h3 className="text-lg font-bold mb-2">Connecting to Secure Server...</h3>
                <p className="text-gray-400 text-sm max-w-xs text-center">
                    Setting up your encrypted video channel. Please allow camera and microphone access.
                </p>
            </div>
        );
    }

    const allParticipantsCount = Object.keys(remoteStreams).length + 1;

    return (
        <div className="h-full w-full bg-gray-950 rounded-xl flex flex-col overflow-hidden border border-white/5 shadow-2xl relative">
            {/* Main Video Grid */}
            <div className={`flex-1 p-4 overflow-y-auto scrollbar-hide grid gap-4 place-items-stretch content-start ${
                allParticipantsCount === 1 ? 'grid-cols-1 max-w-3xl mx-auto' :
                allParticipantsCount === 2 ? 'grid-cols-1 md:grid-cols-2' :
                allParticipantsCount <= 4 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'
            }`}>
                {/* Local Video */}
                <ConferenceVideo 
                    stream={localStream} 
                    isLocal={true} 
                    name={userName} 
                    isMuted={isMuted}
                    isVideoOff={isVideoOff}
                />

                {/* Remote Videos */}
                {Object.entries(remoteStreams).map(([id, stream]) => (
                    <ConferenceVideo 
                        key={id} 
                        stream={stream} 
                        isLocal={false} 
                        name={participants[id]?.name || 'Participant'} 
                        isMuted={false} // Assume false, state sync can be added
                        isVideoOff={false}
                    />
                ))}

                {allParticipantsCount === 0 && (
                    <div className="col-span-full h-full flex flex-center">
                        <p className="text-gray-500">Waiting for others to join...</p>
                    </div>
                )}
            </div>

            {/* Floating Top Info */}
            <div className="absolute top-6 left-6 right-6 flex items-start justify-between pointer-events-none">
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3 pointer-events-auto">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-white text-xs font-bold uppercase tracking-wider">{roomName}</span>
                    <div className="w-[1px] h-4 bg-white/20 mx-1" />
                    <div className="flex -space-x-2">
                        {[...Array(Math.min(3, allParticipantsCount))].map((_, i) => (
                            <div key={i} className="w-5 h-5 rounded-full border border-gray-900 bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                                {i === 0 ? 'Y' : 'P'}
                            </div>
                        ))}
                    </div>
                    <span className="text-white/60 text-[10px] font-medium">{allParticipantsCount} active</span>
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="bg-black/80 backdrop-blur-2xl border-t border-white/5 px-6 py-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2 hidden md:flex">
                   <button className="p-2.5 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        <Settings size={20} />
                   </button>
                   <button className="p-2.5 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        <Users size={20} />
                   </button>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={toggleMic}
                        className={`p-4 rounded-2xl transition-all shadow-lg ${
                            isMuted ? 'bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30' : 'bg-white/10 text-white border border-white/10 hover:bg-white/20'
                        }`}
                    >
                        {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                    </button>
                    <button 
                        onClick={toggleVideo}
                        className={`p-4 rounded-2xl transition-all shadow-lg ${
                            isVideoOff ? 'bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30' : 'bg-white/10 text-white border border-white/10 hover:bg-white/20'
                        }`}
                    >
                        {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
                    </button>
                    
                    <button 
                        onClick={toggleScreenShare}
                        className={`p-4 rounded-2xl transition-all shadow-lg ${
                            isScreenSharing ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-white/10 text-white border border-white/10 hover:bg-white/20'
                        }`}
                    >
                        <ScreenShare size={22} />
                    </button>

                    <button 
                        onClick={handleLeave}
                        className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl transition-all shadow-lg shadow-red-600/20 active:scale-95"
                    >
                        <PhoneOff size={22} />
                    </button>
                </div>

                <div className="flex items-center gap-2 hidden md:flex">
                    <button 
                        className="p-2.5 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            toast.success('Meeting link copied!');
                        }}
                    >
                        <Share2 size={20} />
                    </button>
                    <button className="p-2.5 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        <Maximize2 size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MeetingRoom;
