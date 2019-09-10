/* Copyright 2013 Chris Wilson
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
window.AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext = null;
var audioInput = null,
    realAudioInput = null,
    inputPoint = null,
    audioRecorder = null;
var rafID = null;
var analyserContext = null;
var canvasWidth, canvasHeight;
var recIndex = 0;
var isRecording = false;
var canvas = document.getElementById("preview");
var video = document.getElementById("video");
var context = canvas.getContext("2d");
var streamInterval = null;
canvas.width = 480;
canvas.height = 360;

context.width = canvas.width;
context.height = canvas.height;

function logger(msg){
    $("#logger").text(msg);
}

function loadCam(stream){
    video.srcObject = stream;
}

function loadFail(){
    logger("Couldn't get access to camera");
}

function viewVideo(video, context){
    context.drawImage(video, 0, 0, context.width, context.height);
    socket.emit('video-stream', { destination: destination_id, buffer:canvas.toDataURL('image/jpeg', 0.3) });
}

function startStreaming(){
    if (!streamInterval){
        streamInterval = setInterval(function(){
                viewVideo(video, context);
            }, 30); //fps
    }
}

function stopStreaming(){
    if (streamInterval) {
        clearInterval(streamInterval);
    }
}

function doneEncoding( blob ) {
    Recorder.setupDownload( blob, "myRecording" + ((recIndex<10)?"0":"") + recIndex + ".wav" );
    recIndex++;
}

function toggleRecording() {
    if (isRecording) {
        // stop recording
        audioRecorder.stop();
        if (video_stream) {
            stopStreaming();
        }
        isRecording = false;
    } else {
        // start recording
        if (!audioRecorder)
            return;
        audioRecorder.clear();
        audioRecorder.record();
        if (video_stream) {
            startStreaming();
        }
        isRecording = true;
    }
}

function cancelAnalyserUpdates() {
    window.cancelAnimationFrame( rafID );
    rafID = null;
}

function gotStream(stream) {
    inputPoint = audioContext.createGain();

    // Create an AudioNode from the stream.
    realAudioInput = audioContext.createMediaStreamSource(stream);
    audioInput = realAudioInput;
    audioInput.connect(inputPoint);

    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 2048;
    inputPoint.connect( analyserNode );

    audioRecorder = new Recorder( inputPoint, socket );

    zeroGain = audioContext.createGain();
    zeroGain.gain.value = 0.0;
    inputPoint.connect( zeroGain );
    zeroGain.connect( audioContext.destination );
}

function initVideo() {
    initAudio();
    navigator.mediaDevices.getUserMedia(
    {
        video: true
    }, loadCam, loadFail);
}


function initAudio(){
    audioContext = new AudioContext()
    if (!navigator.getUserMedia)
        navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    if (!navigator.cancelAnimationFrame)
        navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
    if (!navigator.requestAnimationFrame)
        navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;

    navigator.getUserMedia = ( navigator.getUserMedia ||
                               navigator.webkitGetUserMedia ||
                               navigator.mozGetUserMedia ||
                               navigator.msGetUserMedia);

    navigator.mediaDevices.getUserMedia(
    {
        "audio": {
            "mandatory": {
                "googEchoCancellation": "false",
                "googAutoGainControl": "false",
                "googNoiseSuppression": "false",
                "googHighpassFilter": "false"
            },
            "optional": []
        },
    }, gotStream, function(e) {
        alert('Error getting audio');
        console.log(e);
    });
}
