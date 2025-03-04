// Global object to store WaveSurfer instances and track if audio is generated
const waveSurferInstances = {};
const generatedAudio = {}; // Track audio generation status per voice model

document.addEventListener('DOMContentLoaded', function () {
    console.log("DOM Loaded. Attaching event listeners...");

    // Attach click event to each voice selector container
    document.querySelectorAll('.voice-selector').forEach(box => {
        let voiceModel = box.getAttribute('data-voice');
        console.log("Attaching event to:", voiceModel);

        box.addEventListener('click', function (event) {
            if (event.target.closest('.play-btn') || event.target.closest('.download-btn')) {
                return;
            }
            console.log("Voice selected:", voiceModel);
            if (!generatedAudio[voiceModel]) {
                uploadFile(voiceModel); // Only upload if audio is not generated
            } else {
                const audioURL = `/static/audio/speech_${voiceModel}.mp3?t=${new Date().getTime()}`;
                initializeWaveSurfer(voiceModel, audioURL);
            }
        });
    });

    // Drag and Drop functionality
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-upload');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    dropArea.addEventListener('dragover', () => dropArea.classList.add('highlight'));
    dropArea.addEventListener('dragleave', () => dropArea.classList.remove('highlight'));
    dropArea.addEventListener('drop', handleDrop);

    dropArea.addEventListener('click', () => fileInput.click()); // Trigger file dialog on click

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        fileInput.files = files;
        displayFileDetails(files[0]);
        alert('File dropped. Now select a voice model to proceed.');
    }

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            displayFileDetails(e.target.files[0]);
            // alert('File selected. Now select a voice model to proceed.');
        }
    });
});

function displayFileDetails(file) {
    const fileList = document.getElementById('file-list');

    // Determine the appropriate size format
    let fileSize = file.size;
    let sizeText = '';

    if (fileSize < 1024) {
        sizeText = `${fileSize} B`;
    } else if (fileSize < 1024 * 1024) {
        sizeText = `${(fileSize / 1024).toFixed(2)} KB`;
    } else {
        sizeText = `${(fileSize / (1024 * 1024)).toFixed(2)} MB`;
    }

    // Display file details with a remove (❌) button
    fileList.innerHTML = `
        <div class="file-box">
            <div class="file-img">
                <img src="../static/images/file-svg.svg">
            </div>
            <div class="file-content">
                <p><strong>${file.name}</strong></p>
                <p>${sizeText}</p>
            </div>
            <img src="../static/images/cross.svg" class="remove-file" onclick="removeFile()">
        </div>
    `;
}

function removeFile() {
    const fileInput = document.getElementById('file-upload');
    const fileList = document.getElementById('file-list');

    fileInput.value = "";    // Clear the selected file
    fileList.innerHTML = ""; // Clear the file display box
    // alert("File removed successfully!");
}


function uploadFile(voiceModel) {
    let fileInput = document.getElementById('file-upload');
    let file = fileInput.files[0];

    if (!file) {
        alert('Please select or drop a file first.');
        console.error("No file selected.");
        return;
    }

    let formData = new FormData();
    formData.append('file', file);
    formData.append('model', voiceModel);

    console.log("Uploading file for voice:", voiceModel);

    fetch('/convert', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error: ' + data.error);
            console.error("Server error:", data.error);
            return;
        }

        console.log("File uploaded successfully. Checking for generated audio...");
        generatedAudio[voiceModel] = true;
        checkAudioFile(voiceModel);
    })
    .catch(error => {
        console.error('Error uploading file:', error);
        alert('There was an error uploading the file.');
    });
}

function checkAudioFile(voiceModel) {
    const audioURL = `/static/audio/speech_${voiceModel}.mp3?t=${new Date().getTime()}`;

    fetch(audioURL, { cache: "no-store" })
        .then(response => {
            if (response.status === 200) {
                console.log("Audio file found!");
                initializeWaveSurfer(voiceModel, audioURL);
            } else {
                console.log("Audio file not ready, retrying...");
                setTimeout(() => checkAudioFile(voiceModel), 2000);
            }
        })
        .catch(error => {
            console.error('Error checking audio file:', error);
        });
}

function initializeWaveSurfer(voiceModel, audioURL) {
    if (waveSurferInstances[voiceModel]) {
        console.log(`WaveSurfer already initialized for ${voiceModel}.`);
        waveSurferInstances[voiceModel].load(audioURL);
        return;
    }

    const waveformContainer = document.getElementById(`waveform-${voiceModel}`);
    const playBtn = document.getElementById(`Playbtn-${voiceModel}`);
    const downloadLink = document.getElementById(`Downloadbtn-${voiceModel}`);

    const waveSurfer = WaveSurfer.create({
        container: waveformContainer,
        waveColor: 'grey',
        progressColor: '#ffc107',
        barWidth: 4,
        responsive: true,
        height: 90,
        barRadius: 4,
        hideScrollbar: true,
        cursorWidth: 0,
    });

    waveSurferInstances[voiceModel] = waveSurfer;
    waveSurfer.load(audioURL);

    waveSurfer.on('ready', function () {
        console.log("WaveSurfer is ready for", voiceModel);
        waveSurfer.seekTo(0);
        waveSurfer.setWaveColor('grey');
    });

    downloadLink.href = audioURL;
    downloadLink.download = `${voiceModel}.mp3`;

    playBtn.src = "/static/images/play.svg";

    playBtn.onclick = function () {
        if (waveSurfer.isPlaying()) {
            waveSurfer.pause();
            playBtn.src = "/static/images/play.svg";
        } else {
            waveSurfer.play();
            if (waveSurfer && waveSurfer.setWaveColor) {
                waveSurfer.setWaveColor('#ffc107'); // Set the progress color when playing
            } else {
                console.error("WaveSurfer instance is invalid.");
            }
            console.log("Audio playing");  // Debugging line
            playBtn.src = "/static/images/pause.svg";
        }
    };

    waveSurfer.on('finish', function () {
        playBtn.src = "/static/images/play.svg";
        waveSurfer.setWaveColor('grey');
    });
}
