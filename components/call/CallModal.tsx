'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { WebRTCService } from '@/lib/webrtc';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import {
    PhoneOff,
    Mic,
    MicOff,
    Video,
    VideoOff,
    Minimize2,
    Maximize2
} from 'lucide-react';

export function CallModal() {
    const { user, activeCall, setActiveCall, webrtcService: storedWebrtcService } = useAppStore();
    const [webrtc, setWebrtc] = useState<WebRTCService | null>(null);
    const [callDuration, setCallDuration] = useState(0);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (!activeCall || !user) return;

        // For existing calls, we need to listen for status updates
        const webrtcService = new WebRTCService(user.uid);
        setWebrtc(webrtcService);

        // Set up the call status listener
        webrtcService.setCallId(activeCall.id);
        webrtcService.listenForCallStatus();

        webrtcService.setOnRemoteStream((stream) => {
            console.log('🔊 SETTING REMOTE STREAM IN CALLMODAL:', stream);
            console.log('🔊 Remote stream audio tracks:', stream.getAudioTracks());
            console.log('🔊 Remote stream video tracks:', stream.getVideoTracks());
            
            if (remoteVideoRef.current) {
                console.log('🔊 Setting srcObject on video element');
                remoteVideoRef.current.srcObject = stream;
                
                // CRITICAL: Ensure audio is enabled
                remoteVideoRef.current.muted = false;
                remoteVideoRef.current.volume = 1.0;
                remoteVideoRef.current.autoplay = true;
                remoteVideoRef.current.playsInline = true;
                
                // Force play the video element
                const playPromise = remoteVideoRef.current.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            console.log('✅ REMOTE AUDIO/VIDEO PLAYING SUCCESSFULLY');
                        })
                        .catch(error => {
                            console.error('❌ FAILED TO PLAY REMOTE STREAM:', error);
                            // Try to enable audio on user interaction
                            const enableAudio = () => {
                                if (remoteVideoRef.current) {
                                    remoteVideoRef.current.play();
                                    document.removeEventListener('click', enableAudio);
                                }
                            };
                            document.addEventListener('click', enableAudio);
                        });
                }
                
                // Test audio tracks
                const audioTracks = stream.getAudioTracks();
                if (audioTracks.length > 0) {
                    console.log('✅ REMOTE AUDIO TRACKS AVAILABLE:', audioTracks.length);
                    audioTracks.forEach((track, i) => {
                        console.log(`🔊 Remote Audio Track ${i}:`, {
                            enabled: track.enabled,
                            muted: track.muted,
                            readyState: track.readyState
                        });
                    });
                } else {
                    console.error('❌ NO REMOTE AUDIO TRACKS!');
                }
            } else {
                console.error('❌ NO REMOTE VIDEO REF!');
            }
        });

        webrtcService.setOnCallEnd(() => {
            setActiveCall(null);
        });

        webrtcService.setOnCallStatusUpdate((updatedCall) => {
            console.log('Call status updated in CallModal:', updatedCall);
            setActiveCall(updatedCall);
        });

        const setupLocalStream = async () => {
            const localStream = webrtcService.getLocalStream();
            if (localStream && localVideoRef.current) {
                localVideoRef.current.srcObject = localStream;
            }
        };

        setupLocalStream();

        return () => {
            webrtcService.cleanup();
        };
    }, [activeCall, user, setActiveCall]);

    useEffect(() => {
        if (!activeCall || (activeCall.status !== 'accepted' && activeCall.status !== 'connected')) return;

        const interval = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [activeCall]);

    const handleEndCall = () => {
        if (webrtc) {
            webrtc.endCall();
        }
        setActiveCall(null);
    };

    const handleToggleAudio = () => {
        if (webrtc) {
            const enabled = webrtc.toggleAudio();
            setIsAudioMuted(!enabled);
        }
    };

    const handleToggleVideo = () => {
        if (webrtc) {
            const enabled = webrtc.toggleVideo();
            setIsVideoMuted(!enabled);
        }
    };

    const formatCallDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!activeCall) return null;

    const isVideoCall = activeCall.type === 'video';
    const isOutgoing = activeCall.callerId === user?.uid;

    return (
        <div className={`fixed inset-0 z-50 ${isMinimized ? 'md:bottom-4 md:right-4 md:top-auto md:left-auto md:w-80 md:h-60' : ''
            }`}>
            <div className={`${isMinimized ? 'w-full h-full md:w-full md:h-full' : 'w-full h-full'
                } bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden ${isMinimized ? 'md:rounded-lg md:shadow-2xl' : ''
                }`}>

                {/* Header */}
                <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Avatar size="sm" className="ring-2 ring-white/20" />
                            <div>
                                <h3 className="font-semibold text-lg">
                                    {(activeCall.status === 'accepted' || activeCall.status === 'connected') ? 'Connected' : 'Calling...'}
                                </h3>
                                <p className="text-sm text-white/80">
                                    {(activeCall.status === 'accepted' || activeCall.status === 'connected')
                                        ? formatCallDuration(callDuration)
                                        : activeCall.status === 'ringing' ? 'Ringing...' : 'Connecting...'
                                    }
                                </p>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="text-white hover:bg-white/10 rounded-full p-2"
                        >
                            {isMinimized ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
                        </Button>
                    </div>
                </div>

                {/* Video Area */}
                {isVideoCall && !isMinimized && (
                    <div className="relative flex-1 bg-black h-full">
                        {/* Remote Video */}
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />

                        {/* Local Video */}
                        <div className="absolute top-20 right-4 w-28 h-20 md:w-36 md:h-28 bg-gray-900 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Connection Status */}
                        {activeCall.status === 'ringing' && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="animate-pulse mb-4">
                                        <Avatar size="xl" className="mx-auto ring-4 ring-white/30" />
                                    </div>
                                    <h2 className="text-2xl font-semibold mb-2">Calling...</h2>
                                    <p className="text-white/80">Waiting for answer</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Audio Call or Minimized View */}
                {(!isVideoCall || isMinimized) && (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 relative h-full">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute inset-0 bg-gradient-to-br from-whatsapp-500/20 to-blue-500/20"></div>
                            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
                            <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
                        </div>

                        <div className="relative z-10 text-center">
                            <div className={`mb-6 ${activeCall.status === 'ringing' ? 'animate-pulse' : ''}`}>
                                <Avatar size="xl" className="mx-auto ring-4 ring-white/20 shadow-2xl" />
                            </div>

                            <h2 className="text-3xl font-bold mb-2">
                                {(activeCall.status === 'accepted' || activeCall.status === 'connected') ? 'Connected' : 'Calling...'}
                            </h2>

                            <p className="text-white/80 text-lg mb-2">
                                {activeCall.type === 'video' ? 'Video Call' : 'Voice Call'}
                            </p>

                            <p className="text-white/60">
                                {(activeCall.status === 'accepted' || activeCall.status === 'connected')
                                    ? formatCallDuration(callDuration)
                                    : activeCall.status === 'ringing' ? 'Ringing...' : 'Connecting...'
                                }
                            </p>
                        </div>
                    </div>
                )}

                {/* Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <div className="flex items-center justify-center space-x-6">
                        {/* Audio Toggle */}
                        <Button
                            variant="ghost"
                            size="lg"
                            onClick={handleToggleAudio}
                            className={`rounded-full p-4 backdrop-blur-sm border-2 transition-all ${isAudioMuted
                                ? 'bg-red-500/80 border-red-400 hover:bg-red-500'
                                : 'bg-white/10 border-white/20 hover:bg-white/20'
                                }`}
                        >
                            {isAudioMuted ? <MicOff size={24} /> : <Mic size={24} />}
                        </Button>

                        {/* Video Toggle (only for video calls) */}
                        {isVideoCall && (
                            <Button
                                variant="ghost"
                                size="lg"
                                onClick={handleToggleVideo}
                                className={`rounded-full p-4 backdrop-blur-sm border-2 transition-all ${isVideoMuted
                                    ? 'bg-red-500/80 border-red-400 hover:bg-red-500'
                                    : 'bg-white/10 border-white/20 hover:bg-white/20'
                                    }`}
                            >
                                {isVideoMuted ? <VideoOff size={24} /> : <Video size={24} />}
                            </Button>
                        )}

                        {/* End Call */}
                        <Button
                            variant="ghost"
                            size="lg"
                            onClick={handleEndCall}
                            className="rounded-full p-4 bg-red-500/80 border-2 border-red-400 hover:bg-red-500 backdrop-blur-sm transition-all"
                        >
                            <PhoneOff size={24} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}