'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { WebRTCService } from '@/lib/webrtc';
import { Call } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Phone, PhoneOff, Video } from 'lucide-react';
import toast from 'react-hot-toast';

interface IncomingCallModalProps {
  call: Call;
  onClose: () => void;
}

export function IncomingCallModal({ call, onClose }: IncomingCallModalProps) {
  const { user, setActiveCall, setWebrtcService } = useAppStore();
  const [loading, setLoading] = useState(false);

  const handleAcceptCall = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const webrtc = new WebRTCService(user.uid);
      await webrtc.answerCall(call.id);
      
      // Store the WebRTC service so CallModal can use it
      setWebrtcService(webrtc);
      
      setActiveCall({
        ...call,
        status: 'accepted', // Start with accepted, will change to connected when peer connects
      });
      
      onClose();
      toast.success('Call accepted');
    } catch (error) {
      toast.error('Failed to accept call');
      console.error('Accept call error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineCall = async () => {
    if (!user) return;

    try {
      const webrtc = new WebRTCService(user.uid);
      await webrtc.declineCall(call.id);
      
      onClose();
      toast.success('Call declined');
    } catch (error) {
      toast.error('Failed to decline call');
      console.error('Decline call error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white rounded-lg p-6 md:p-8 max-w-sm w-full mx-4">
        {/* Caller Info */}
        <div className="text-center mb-6 md:mb-8">
          <Avatar size="xl" className="mx-auto mb-4" />
          <h2 className="text-xl md:text-2xl font-semibold mb-2">Incoming Call</h2>
          <p className="text-gray-400 mb-1">
            {call.type === 'video' ? 'Video Call' : 'Voice Call'}
          </p>
          <p className="text-base md:text-lg">Caller ID: {call.callerId}</p>
        </div>

        {/* Call Actions */}
        <div className="flex items-center justify-center space-x-6 md:space-x-8">
          {/* Decline */}
          <Button
            variant="danger"
            size="lg"
            onClick={handleDeclineCall}
            disabled={loading}
            className="rounded-full p-3 md:p-4 bg-red-500 hover:bg-red-600"
          >
            <PhoneOff size={24} className="md:w-8 md:h-8" />
          </Button>

          {/* Accept */}
          <Button
            variant="primary"
            size="lg"
            onClick={handleAcceptCall}
            loading={loading}
            disabled={loading}
            className="rounded-full p-3 md:p-4 bg-green-500 hover:bg-green-600"
          >
            {call.type === 'video' ? <Video size={24} className="md:w-8 md:h-8" /> : <Phone size={24} className="md:w-8 md:h-8" />}
          </Button>
        </div>

        {/* Call Info */}
        <div className="text-center mt-4 md:mt-6 text-sm text-gray-400">
          <p className="md:hidden">Tap to answer or decline</p>
          <p className="hidden md:block">Click to answer or decline</p>
        </div>
      </div>
    </div>
  );
}