// Vielä täysin kesken

const servers = {
  iceServers: [
    {
      // Free Stun servers from google
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],

  iceCandidatePoolSize: 10,
}

// Global State
let RTC = new RTCPeerConnection(servers);

let remoteStream = null; 

// Get tracks from remote stream, add to video stream
RTC.ontrack = event => {
    event.streams[0].getTracks().forEach(track => {
        remoteStream.addTrack(track)
    });
}