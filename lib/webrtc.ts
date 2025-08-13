import Peer from 'simple-peer';
import { ref, set, onValue, push, get } from 'firebase/database';
import { database } from './firebase';
import { Call } from './types';

export class WebRTCService {
  private peer: Peer.Instance | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callId: string | null = null;
  private userId: string;
  private onRemoteStream?: (stream: MediaStream) => void;
  private onCallEnd?: () => void;
  private onCallStatusUpdate?: (call: any) => void;
  private callStatusListener?: () => void;
  private answerListener?: () => void;
  private offerListener?: () => void;

  constructor(userId: string) {
    this.userId = userId;
  }

  async initializeCall(receiverId: string, type: 'audio' | 'video'): Promise<string> {
    try {
      // Get user media with better constraints
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
      });

      console.log('🎤 LOCAL STREAM CREATED:', this.localStream);
      console.log('🎤 Local stream tracks:', this.localStream.getTracks());
      console.log('🎤 Local audio tracks:', this.localStream.getAudioTracks().map(track => ({
        id: track.id,
        kind: track.kind,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState,
        label: track.label
      })));
      console.log('🎤 Local video tracks:', this.localStream.getVideoTracks());

      // Test microphone access
      const audioTracks = this.localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        console.log('✅ MICROPHONE ACCESS GRANTED:', audioTracks.length, 'tracks');
      } else {
        console.error('❌ NO MICROPHONE ACCESS!');
      }

      // Create call record
      const callRef = push(ref(database, 'calls'));
      this.callId = callRef.key!;

      const callData: Omit<Call, 'id'> = {
        callerId: this.userId,
        receiverId,
        type,
        status: 'ringing',
        startTime: Date.now(),
      };

      await set(callRef, callData);

      // Create peer as initiator
      this.peer = new Peer({
        initiator: true,
        trickle: false,
        stream: this.localStream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
          ],
        },
        // Force audio to be enabled
        offerOptions: {
          offerToReceiveAudio: true,
          offerToReceiveVideo: type === 'video'
        }
      });

      console.log('🚀 PEER CREATED AS INITIATOR with stream:', this.localStream);
      // Stream is already added via the constructor, no need to add manually

      this.setupPeerEvents();
      this.listenForCallStatusPrivate();

      // Listen for answer
      const answerRef = ref(database, `calls/${this.callId}/answer`);
      this.answerListener = onValue(answerRef, (snapshot) => {
        if (snapshot.exists() && this.peer && !this.peer.destroyed) {
          try {
            console.log('Caller received answer, signaling...');
            this.peer.signal(snapshot.val());
          } catch (error) {
            console.error('Error signaling answer:', error);
          }
        }
      });

      // Auto-end call after 60 seconds if not answered
      setTimeout(() => {
        if (this.callId && this.peer && !this.peer.connected) {
          console.log('Call timeout, ending call');
          this.endCall();
        }
      }, 60000);

      return this.callId;
    } catch (error) {
      console.error('Error initializing call:', error);
      throw error;
    }
  }

  async answerCall(callId: string): Promise<void> {
    try {
      this.callId = callId;

      // Get call data
      const callRef = ref(database, `calls/${callId}`);
      const callSnapshot = await get(callRef);

      if (!callSnapshot.exists()) {
        throw new Error('Call not found');
      }

      const callData = callSnapshot.val();

      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: callData.type === 'video' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
      });

      console.log('Receiver local stream created:', this.localStream);
      console.log('Receiver local stream tracks:', this.localStream.getTracks());
      console.log('Receiver local audio tracks:', this.localStream.getAudioTracks());
      console.log('Receiver local video tracks:', this.localStream.getVideoTracks());

      // Update call status to accepted
      await set(ref(database, `calls/${callId}/status`), 'accepted');

      // Create peer as receiver
      this.peer = new Peer({
        initiator: false,
        trickle: false,
        stream: this.localStream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
          ],
        },
        // Force audio to be enabled
        answerOptions: {
          offerToReceiveAudio: true,
          offerToReceiveVideo: callData.type === 'video'
        }
      });

      console.log('🚀 PEER CREATED AS RECEIVER with stream:', this.localStream);
      // Stream is already added via the constructor, no need to add manually

      this.setupPeerEvents();
      this.listenForCallStatusPrivate();

      // Listen for offer
      const offerRef = ref(database, `calls/${callId}/offer`);
      this.offerListener = onValue(offerRef, (snapshot) => {
        if (snapshot.exists() && this.peer && !this.peer.destroyed) {
          try {
            console.log('Receiver received offer, signaling...');
            this.peer.signal(snapshot.val());
          } catch (error) {
            console.error('Error signaling offer:', error);
          }
        }
      });

    } catch (error) {
      console.error('Error answering call:', error);
      throw error;
    }
  }

  private setupPeerEvents() {
    if (!this.peer) return;

    this.peer.on('signal', async (data) => {
      if (!this.callId) return;

      try {
        if (data.type === 'offer') {
          console.log('Sending offer to database');
          await set(ref(database, `calls/${this.callId}/offer`), data);
        } else if (data.type === 'answer') {
          console.log('Sending answer to database');
          await set(ref(database, `calls/${this.callId}/answer`), data);
        }
      } catch (error) {
        console.error('Error setting signal data:', error);
      }
    });

    this.peer.on('stream', (stream) => {
      console.log('🎵 RECEIVED REMOTE STREAM:', stream);
      console.log('🎵 Remote stream tracks:', stream.getTracks());
      console.log('🎵 Audio tracks:', stream.getAudioTracks().map(track => ({
        id: track.id,
        kind: track.kind,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState,
        label: track.label
      })));
      console.log('🎵 Video tracks:', stream.getVideoTracks());

      // Test if audio tracks are actually working
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        console.log('✅ AUDIO TRACKS FOUND:', audioTracks.length);
        audioTracks.forEach((track, index) => {
          console.log(`🎵 Audio Track ${index}:`, {
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
            settings: track.getSettings ? track.getSettings() : 'N/A'
          });
        });
      } else {
        console.error('❌ NO AUDIO TRACKS IN REMOTE STREAM!');
      }

      this.remoteStream = stream;
      if (this.onRemoteStream) {
        this.onRemoteStream(stream);
      }
    });

    this.peer.on('connect', async () => {
      console.log('🔗 PEER CONNECTED SUCCESSFULLY');
      console.log('🔗 Local stream in peer:', this.localStream);
      console.log('🔗 Peer connection state:', this.peer?.connected);
      console.log('🔗 Peer destroyed:', this.peer?.destroyed);

      // Verify streams are still active
      if (this.localStream) {
        const audioTracks = this.localStream.getAudioTracks();
        console.log('🔗 Local audio tracks on connect:', audioTracks.map(t => ({
          enabled: t.enabled,
          muted: t.muted,
          readyState: t.readyState
        })));
      }

      if (this.callId) {
        await set(ref(database, `calls/${this.callId}/status`), 'connected');
      }
    });

    this.peer.on('error', (error) => {
      console.error('Peer error:', error);
      this.endCall();
    });

    this.peer.on('close', () => {
      console.log('Peer connection closed');
      this.endCall();
    });
  }

  private listenForCallStatusPrivate() {
    if (!this.callId) return;

    const callRef = ref(database, `calls/${this.callId}`);
    this.callStatusListener = onValue(callRef, (snapshot) => {
      if (snapshot.exists()) {
        const callData = snapshot.val();
        const status = callData.status;
        console.log('Call status changed to:', status);

        // Update the store with the latest call data
        if (this.onCallStatusUpdate) {
          this.onCallStatusUpdate({ ...callData, id: this.callId });
        }

        if (status === 'ended' || status === 'declined') {
          this.endCall();
        }
      }
    });
  }

  async endCall(): Promise<void> {
    try {
      if (this.callId) {
        await set(ref(database, `calls/${this.callId}/status`), 'ended');
        await set(ref(database, `calls/${this.callId}/endTime`), Date.now());
      }

      // Clean up listeners
      if (this.callStatusListener) {
        this.callStatusListener();
        this.callStatusListener = undefined;
      }
      if (this.answerListener) {
        this.answerListener();
        this.answerListener = undefined;
      }
      if (this.offerListener) {
        this.offerListener();
        this.offerListener = undefined;
      }

      if (this.peer) {
        this.peer.destroy();
        this.peer = null;
      }

      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }

      this.remoteStream = null;
      this.callId = null;

      if (this.onCallEnd) {
        this.onCallEnd();
      }
    } catch (error) {
      console.error('Error ending call:', error);
    }
  }

  async declineCall(callId: string): Promise<void> {
    await set(ref(database, `calls/${callId}/status`), 'declined');
  }

  toggleAudio(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  toggleVideo(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  setOnRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStream = callback;
  }

  setOnCallEnd(callback: () => void) {
    this.onCallEnd = callback;
  }

  setOnCallStatusUpdate(callback: (call: any) => void) {
    this.onCallStatusUpdate = callback;
  }

  // Debug method to check stream status
  debugStreamStatus() {
    console.log('=== 🔍 WebRTC Stream Debug ===');
    console.log('Local stream:', this.localStream);
    console.log('Remote stream:', this.remoteStream);
    console.log('Peer connected:', this.peer?.connected);
    console.log('Peer destroyed:', this.peer?.destroyed);

    if (this.localStream) {
      console.log('🎤 Local audio tracks:', this.localStream.getAudioTracks().map(track => ({
        id: track.id,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState,
        label: track.label
      })));
    }

    if (this.remoteStream) {
      console.log('🔊 Remote audio tracks:', this.remoteStream.getAudioTracks().map(track => ({
        id: track.id,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState,
        label: track.label
      })));
    }
    console.log('=== End Debug ===');
  }

  // Test method to verify audio is working
  testAudioPlayback() {
    if (this.remoteStream) {
      const audioTracks = this.remoteStream.getAudioTracks();
      if (audioTracks.length > 0) {
        console.log('🔊 TESTING AUDIO PLAYBACK...');

        // Create a temporary audio element to test
        const audio = new Audio();
        audio.srcObject = this.remoteStream;
        audio.volume = 1.0;
        audio.play().then(() => {
          console.log('✅ AUDIO TEST SUCCESSFUL');
        }).catch(error => {
          console.error('❌ AUDIO TEST FAILED:', error);
        });
      }
    }
  }

  setCallId(callId: string) {
    this.callId = callId;
  }

  listenForCallStatus() {
    if (!this.callId) return;

    const callRef = ref(database, `calls/${this.callId}`);
    this.callStatusListener = onValue(callRef, (snapshot) => {
      if (snapshot.exists()) {
        const callData = snapshot.val();
        const status = callData.status;
        console.log('Call status changed to:', status);

        // Update the store with the latest call data
        if (this.onCallStatusUpdate) {
          this.onCallStatusUpdate({ ...callData, id: this.callId });
        }

        if (status === 'ended' || status === 'declined') {
          this.endCall();
        }
      }
    });
  }

  cleanup() {
    // Clean up listeners without ending the call
    if (this.callStatusListener) {
      this.callStatusListener();
      this.callStatusListener = undefined;
    }
    if (this.answerListener) {
      this.answerListener();
      this.answerListener = undefined;
    }
    if (this.offerListener) {
      this.offerListener();
      this.offerListener = undefined;
    }
  }
}

export const listenForIncomingCalls = (userId: string, callback: (call: Call) => void) => {
  const callsRef = ref(database, 'calls');

  const unsubscribe = onValue(callsRef, (snapshot) => {
    if (snapshot.exists()) {
      const calls = snapshot.val();

      Object.keys(calls).forEach(callId => {
        const call = calls[callId];
        if (call.receiverId === userId && call.status === 'ringing') {
          callback({ ...call, id: callId });
        }
      });
    }
  });

  return unsubscribe;
};

export const checkWebRTCSupport = (): boolean => {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    window.RTCPeerConnection
  );
};

export const requestMediaPermissions = async (type: 'audio' | 'video'): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: type === 'video',
      audio: true,
    });

    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Media permission denied:', error);
    return false;
  }
};