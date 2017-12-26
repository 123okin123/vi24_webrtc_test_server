/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';
window.onload = function(){


const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
callButton.disabled = true;
hangupButton.disabled = true;
startButton.onclick = start;
callButton.onclick = call;
hangupButton.onclick = hangup;

let startTime;
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

var localStream;
var peerConnection;
const offerOptions = {
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1
};

localVideo.addEventListener('loadedmetadata', function() {
    trace('Local video videoWidth: ' + this.videoWidth +
        'px,  videoHeight: ' + this.videoHeight + 'px');
});

remoteVideo.addEventListener('loadedmetadata', function() {
    trace('Remote video videoWidth: ' + this.videoWidth +
        'px,  videoHeight: ' + this.videoHeight + 'px');
});

remoteVideo.onresize = function() {
    trace('Remote video size changed to ' +
        remoteVideo.videoWidth + 'x' + remoteVideo.videoHeight);
    // We'll use the first onsize callback as an indication that video has started
    // playing out.
    if (startTime) {
        var elapsedTime = window.performance.now() - startTime;
        trace('Setup time: ' + elapsedTime.toFixed(3) + 'ms');
        startTime = null;
    }
};


const ws = new WebSocket('wss://polar-refuge-15924.herokuapp.com/');
ws.onopen = () => {
    trace('ws connected');
}


ws.onclose = () => {
    trace('ws disconnected');
}

ws.onmessage = (e) => {
    const json = JSON.parse(e.data)
    trace('ws message: ' + json);
    switch (json.type) {
        case 'offer':
            trace('got offer');
            peerConnection.setRemoteDescription(new RTCSessionDescription(json.sdp)).then(() => {
                trace('did set offer as remote sdp');
                peerConnection.createAnswer().then((desc) => {
                        trace('did generate answer"');
                        peerConnection.setLocalDescription(desc).then(
                            (pc) => {
                                trace('did set answer as local sdp');
                                const json = {
                                    type: 'answer',
                                    sdp: desc
                                };
                                ws.send(JSON.stringify(json), () => {trace('did send answer')});
                            },
                            onSetSessionDescriptionError
                        );
                }
                    ,
                    onCreateSessionDescriptionError
                );
            });

            break;
        case 'answer':
            trace('got answer. Not implemented');
            break;
        case 'ice':
            trace('got ice: ' + json);

        default:
            break;
    }




}








function gotStream(stream) {

}

function start() {
    trace('Requesting local stream');
    startButton.disabled = true;

    navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
    })
        .then((stream) => {
            trace('Received local stream');
            localVideo.srcObject = stream;
            localStream = stream;
            callButton.disabled = false;
            var videoTracks = localStream.getVideoTracks();
            var audioTracks = localStream.getAudioTracks();
            if (videoTracks.length > 0) {
                trace('Using video device: ' + videoTracks[0].label);
            }
            if (audioTracks.length > 0) {
                trace('Using audio device: ' + audioTracks[0].label);
            }
            const config = {iceServers: [
                    {urls: ['stun:78.47.169.231:3478']},
                    {urls: ['stun:78.47.169.232:3478']},
                    {
                        urls: ['turn:78.47.169.232:3478'],
                        username: '1514186629:5a30e5c6a68d4',
                        credential: 'aEstvC3X02ZuyXIfSTLGBGvMX8E='
                    }

            ]};

             peerConnection = new RTCPeerConnection(config, {});
            trace('Created local peer connection object pc1');
            peerConnection.onicecandidate = function(e) {
                onIceCandidate(peerConnection, e);
            };

            peerConnection.oniceconnectionstatechange = function(e) {
                onIceStateChange(peerConnection, e);
            };



            localStream.getTracks().forEach( (track) => {
                    peerConnection.addTrack(track, localStream);
                }
            );


        })
        .catch(function(e) {
            alert('getUserMedia() error: ' + e.name);
        });


}

function call() {
    callButton.disabled = true;
    hangupButton.disabled = false;
    trace('Starting call');
    startTime = window.performance.now();

    peerConnection.createOffer(
        offerOptions
    ).then(
        () => {},
        onCreateSessionDescriptionError
    );
}

function onCreateSessionDescriptionError(error) {
    trace('Failed to create session description: ' + error.toString());
}
function onSetSessionDescriptionError(error) {
    trace('Failed to set session description: ' + error.toString());
}

function gotRemoteStream(e) {
    if (remoteVideo.srcObject !== e.streams[0]) {
        remoteVideo.srcObject = e.streams[0];
    }
}


function onIceCandidate(pc, event) {
    const json = {
        "type": "ice",
        "candidate": event.candidate,
    }
    ws.send(JSON.stringify(json));
}

function onAddIceCandidateSuccess(pc) {
}
function onAddIceCandidateError(pc, error) {
}

function onIceStateChange(pc, event) {
    trace.log('ICE state change event: ', event);
}

function hangup() {
    trace('Ending call');
    peerConnection.close();
    peerConnection = null;
    hangupButton.disabled = true;
    callButton.disabled = false;
}


// Logging utility function.
function trace(arg) {
    var now = (window.performance.now() / 1000).toFixed(3);
    console.log(now + ': ', arg);
}
}
