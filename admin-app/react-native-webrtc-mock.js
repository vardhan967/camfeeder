module.exports = {
  RTCPeerConnection: window.RTCPeerConnection || function() {},
  RTCView: function() { return null; },
  RTCIceCandidate: window.RTCIceCandidate || function() {},
  RTCSessionDescription: window.RTCSessionDescription || function() {},
  MediaStream: window.MediaStream || function() {}
};
