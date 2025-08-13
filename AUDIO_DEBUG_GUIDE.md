# 🔊 Audio Debug Guide - Step by Step

## 🚨 **CRITICAL DEBUGGING STEPS:**

### 1. **Open Browser Console** 
- Press F12 → Console tab
- Look for these specific logs when making a call:

### 2. **Expected Console Logs:**

#### **When Starting Call:**
```
🎤 LOCAL STREAM CREATED: MediaStream
🎤 Local audio tracks: [{enabled: true, muted: false, readyState: "live"}]
✅ MICROPHONE ACCESS GRANTED: 1 tracks
🚀 PEER CREATED AS INITIATOR with stream: MediaStream
```

#### **When Answering Call:**
```
🎤 RECEIVER LOCAL STREAM CREATED: MediaStream  
🚀 PEER CREATED AS RECEIVER with stream: MediaStream
```

#### **When Peer Connects:**
```
🔗 PEER CONNECTED SUCCESSFULLY
🎵 RECEIVED REMOTE STREAM: MediaStream
✅ AUDIO TRACKS FOUND: 1
🔊 SETTING REMOTE STREAM IN CALLMODAL
✅ REMOTE AUDIO TRACKS AVAILABLE: 1
✅ REMOTE AUDIO/VIDEO PLAYING SUCCESSFULLY
```

### 3. **What to Check if NO SOUND:**

#### **❌ If you see "NO MICROPHONE ACCESS":**
- Browser blocked microphone permission
- Go to browser settings → Site permissions → Allow microphone
- Try HTTPS instead of HTTP

#### **❌ If you see "NO AUDIO TRACKS IN REMOTE STREAM":**
- The other person's microphone isn't working
- WebRTC peer connection failed
- Check network/firewall issues

#### **❌ If you see "FAILED TO PLAY REMOTE STREAM":**
- Browser autoplay policy blocking audio
- Click anywhere on the page to enable audio
- Check browser audio settings

### 4. **Manual Testing Steps:**

#### **Step 1: Test Microphone Access**
```javascript
// Run this in browser console:
navigator.mediaDevices.getUserMedia({audio: true})
  .then(stream => {
    console.log('✅ Microphone works:', stream.getAudioTracks());
  })
  .catch(err => {
    console.error('❌ Microphone failed:', err);
  });
```

#### **Step 2: Check Audio Permissions**
- Chrome: Click 🔒 icon in address bar → Microphone → Allow
- Firefox: Click 🔒 icon → Permissions → Microphone → Allow
- Safari: Safari menu → Settings → Websites → Microphone → Allow

#### **Step 3: Test on HTTPS**
- WebRTC requires HTTPS for microphone access
- Use `https://localhost:3000` instead of `http://localhost:3000`
- Or test on deployed HTTPS site

### 5. **Common Issues & Fixes:**

#### **Issue: "Permission denied"**
**Fix:** Enable microphone in browser settings

#### **Issue: "No audio tracks"**  
**Fix:** Check if other apps are using microphone

#### **Issue: "Autoplay prevented"**
**Fix:** Click anywhere on the page after call connects

#### **Issue: "Peer connection failed"**
**Fix:** Check firewall/network settings, try different network

### 6. **Debug Commands to Run:**

When call is active, run in console:
```javascript
// Check WebRTC service status
window.webrtcService?.debugStreamStatus();

// Test audio playback
window.webrtcService?.testAudioPlayback();
```

### 7. **Browser Compatibility:**
- ✅ Chrome 60+ (Recommended)
- ✅ Firefox 55+
- ✅ Safari 11+
- ❌ Internet Explorer (Not supported)

### 8. **Network Requirements:**
- HTTPS connection (required for microphone)
- Open ports for WebRTC (UDP 1024-65535)
- STUN servers accessible (Google STUN servers used)

## 🎯 **Quick Fix Checklist:**

1. ✅ **Microphone permission granted?**
2. ✅ **Using HTTPS?**
3. ✅ **Console shows "MICROPHONE ACCESS GRANTED"?**
4. ✅ **Console shows "RECEIVED REMOTE STREAM"?**
5. ✅ **Console shows "REMOTE AUDIO TRACKS AVAILABLE"?**
6. ✅ **Clicked on page after call connects?**
7. ✅ **Other person also has microphone access?**

If ALL are ✅ but still no sound → Check browser audio mixer settings!