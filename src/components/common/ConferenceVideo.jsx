import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';

const ConferenceVideo = ({ stream, isLocal, name, isMuted, isVideoOff }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="relative group bg-gray-800 rounded-xl overflow-hidden aspect-video shadow-lg border border-gray-700">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocal} // Local video should be muted to avoid feedback
                className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}`}
            />
            
            {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold uppercase">
                        {name ? name[0] : '?'}
                    </div>
                </div>
            )}

            {/* Overlay Info */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs border border-white/10 group-hover:bg-black/80 transition-all">
                <span className="font-bold truncate max-w-[120px]">{name} {isLocal && '(You)'}</span>
                <div className="flex items-center gap-1.5 border-l border-white/20 pl-1.5">
                    {isMuted ? <MicOff size={12} className="text-red-400" /> : <Mic size={12} className="text-green-400" />}
                    {isVideoOff ? <VideoOff size={12} className="text-red-400" /> : <Video size={12} className="text-green-400" />}
                </div>
            </div>

            {/* Status indicators */}
            {!isLocal && stream && (
                <div className="absolute top-3 right-3 flex items-center gap-2 pointer-events-none">
                   {/* Signal strength or other indicators could go here */}
                </div>
            )}
        </div>
    );
};

export default ConferenceVideo;
