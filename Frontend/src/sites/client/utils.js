// Vielä täysin kesken

const servers = {
  iceServers: [
    {
      // Ilmaisia stun servereitä Googlelta
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],

  iceCandidatePoolSize: 10,
}

// Global State
let pc = new RTCPeerConnection(servers);
let localStream = null;
