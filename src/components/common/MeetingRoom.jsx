import React from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { Loader2 } from 'lucide-react';

const safeRoomName = (value = '') => `AfricaKonnect-${String(value).replace(/[^a-zA-Z0-9-]/g, '-')}`;

/**
 * A deterministic project room means the client and expert always join the
 * same live meeting from the shared project link. Jitsi supplies WebRTC audio,
 * video, screen sharing and participant controls without client-side secrets.
 */
const MeetingRoom = ({ roomName, userName, onLeave, onReady, onError, meetingId }) => (
    <div className="h-full min-h-[520px] w-full overflow-hidden rounded-xl bg-gray-950">
        <JitsiMeeting
            domain="meet.jit.si"
            roomName={safeRoomName(meetingId || roomName)}
            configOverwrite={{
                prejoinPageEnabled: true,
                disableDeepLinking: true,
                startWithAudioMuted: false,
                startWithVideoMuted: false,
                enableWelcomePage: false,
                toolbarButtons: [
                    'microphone', 'camera', 'desktop', 'chat', 'participants-pane',
                    'raisehand', 'tileview', 'select-background', 'settings',
                    'fullscreen', 'hangup'
                ]
            }}
            interfaceConfigOverwrite={{
                MOBILE_APP_PROMO: false,
                SHOW_JITSI_WATERMARK: false
            }}
            userInfo={{ displayName: userName || 'Africa Konnect participant', email: '' }}
            spinner={() => (
                <div className="flex h-full min-h-[520px] items-center justify-center text-white">
                    <Loader2 className="mr-3 animate-spin" /> Connecting to meeting…
                </div>
            )}
            onReadyToClose={onLeave}
            onApiReady={api => {
                api.addListener('videoConferenceJoined', onReady || (() => {}));
                api.addListener('errorOccurred', onError || (() => {}));
            }}
            getIFrameRef={iframe => {
                iframe.style.height = '100%';
                iframe.style.minHeight = '520px';
                iframe.style.width = '100%';
            }}
        />
    </div>
);

export default MeetingRoom;
