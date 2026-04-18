// WebRTC ICE Server Configuration
// Supports both free public TURN servers and paid services (Twilio, Xirsys)
// To use paid TURN servers, add secrets: TURN_SERVER_URL, TURN_USERNAME, TURN_CREDENTIAL

export interface TURNConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

// Free public STUN/TURN servers
export const freeIceServers: RTCIceServer[] = [
  // Google STUN servers (always available)
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  
  // OpenRelay TURN servers (free, community-maintained)
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  
  // Metered.ca free tier TURN servers
  {
    urls: 'turn:relay.metered.ca:80',
    username: 'e8d0dbcb29e64c7ba6e8eb4e',
    credential: 'xPfrFjGI9VaDfrz8'
  },
  {
    urls: 'turn:relay.metered.ca:443',
    username: 'e8d0dbcb29e64c7ba6e8eb4e',
    credential: 'xPfrFjGI9VaDfrz8'
  },
  {
    urls: 'turn:relay.metered.ca:443?transport=tcp',
    username: 'e8d0dbcb29e64c7ba6e8eb4e',
    credential: 'xPfrFjGI9VaDfrz8'
  }
];

// Get ICE servers with optional paid TURN server support
// If TURN_SERVER_URL is configured in secrets, it will be used alongside free servers
export const getIceServers = (paidTurnConfig?: TURNConfig): RTCIceServer[] => {
  const servers = [...freeIceServers];
  
  // Add paid TURN server if configured
  if (paidTurnConfig?.urls) {
    // Paid TURN servers should have higher priority (placed first)
    servers.unshift({
      urls: paidTurnConfig.urls,
      username: paidTurnConfig.username,
      credential: paidTurnConfig.credential
    });
    console.log('Using paid TURN server alongside free servers');
  }
  
  return servers;
};

// RTCPeerConnection configuration
export const getRTCConfiguration = (paidTurnConfig?: TURNConfig): RTCConfiguration => {
  return {
    iceServers: getIceServers(paidTurnConfig),
    iceCandidatePoolSize: 10,
    // Use all candidates for best connectivity
    iceTransportPolicy: 'all'
  };
};

// Tips for users about TURN server reliability
export const turnServerInfo = {
  title: 'Connection Quality',
  tips: [
    'Free TURN servers are used by default - works for most users',
    'If you experience connection issues behind corporate firewalls, contact support',
    'For enterprise use, we recommend configuring paid TURN servers (Twilio/Xirsys)'
  ],
  troubleshooting: [
    'Try refreshing the page and reconnecting',
    'Check if your firewall allows WebRTC connections',
    'Ensure your browser has microphone/camera permissions',
    'Try a different network if available (e.g., mobile data)'
  ]
};

export default getIceServers;
