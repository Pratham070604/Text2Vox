const waveSurferInstances = {};
const lastGeneratedInputs = {}; // To store last inputs per model

// Function to display non-intrusive messages
function displayStatusMessage(message, type = "info") {
    const statusContainer = document.getElementById('status-message');
    statusContainer.textContent = message;
    statusContainer.className = `status-message ${type}`; // Add class for styling
    statusContainer.style.display = "block";
    setTimeout(() => {
        statusContainer.style.display = "none"; // Hide after 3 seconds
    }, 3000);
}

document.getElementById('voices-container').addEventListener('click', function (event) {
    // Ensure the click event is triggered from the .voice-box
    const voiceBox = event.target.closest('.voice-box');
    
    // If clicked outside the .voice-box or on play/download button, do nothing
    if (!voiceBox || event.target.closest('.play-btn') || event.target.closest('.download-btn')) {
        return; 
    }

    const voiceModel = voiceBox.getAttribute('data-model');
    const text = document.getElementById('text-input').value.trim();

    if (!text) {
        displayStatusMessage("Please enter text before generating speech", "error");
        return;
    }

    // Avoid re-sending the request if the input and model are unchanged
    if (lastGeneratedInputs[voiceModel] && lastGeneratedInputs[voiceModel] === text) {
        displayStatusMessage("Audio is already up-to-date for the current input.", "info");
        return;
    }

    // Update the last input for this model
    lastGeneratedInputs[voiceModel] = text;

    // Send the text and selected voice model to the backend
    fetch('/generate-audio', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text, model: voiceModel }),
    })
        .then(response => response.json())
        .then(data => {
            const playBtn = document.getElementById(`Playbtn-${data.name}`);
            const waveformContainer = document.getElementById(`waveform-${data.name}`);
            const downloadLink = document.getElementById(`Downloadbtn-${data.name}`);

            // Check if WaveSurfer instance exists for this model
            if (waveSurferInstances[data.name]) {
                // Update the audio file without destroying the instance
                const wavesurfer = waveSurferInstances[data.name];
                wavesurfer.load(data.file);

                // Reset the cursor to the beginning after loading the new file
                wavesurfer.on('ready', function () {
                    wavesurfer.seekTo(0); // Reset to the start of the audio
                    wavesurfer.setWaveColor('grey'); // Set grey color initially
                });

                // Update the download link
                downloadLink.href = data.file;
                downloadLink.download = `${data.name}.mp3`;

                displayStatusMessage("Audio updated successfully!", "success");
                return; // Exit early, no need to reinitialize
            }

            // Initialize a new WaveSurfer instance for this audio track
            const wavesurfer = WaveSurfer.create({
                container: waveformContainer,
                waveColor: 'grey',  // Set grey color initially
                progressColor: '#ffc107',
                barWidth: 4,
                responsive: true,
                height: 90,
                barRadius: 4,
                hideScrollbar: true,
                cursorWidth: 0,
            });

            // Save the instance globally
            waveSurferInstances[data.name] = wavesurfer;

            wavesurfer.load(data.file);

            // Reset the cursor to the beginning after loading the new file
            wavesurfer.on('ready', function () {
                wavesurfer.seekTo(0); // Reset to the start of the audio
                wavesurfer.setWaveColor('grey'); // Set grey color initially
            });

            // Update the download link
            downloadLink.href = data.file;
            downloadLink.download = `${data.name}.mp3`;

            // Set initial play button icon
            playBtn.src = "/static/images/play.svg";

            // Handle play/pause button click
            playBtn.onclick = function () {
                if (wavesurfer.isPlaying()) {
                    wavesurfer.pause();
                    playBtn.src = "/static/images/play.svg"; // Switch to "play" icon
                } else {
                    wavesurfer.play();
                    // Check if wavesurfer is valid before calling methods
                    if (wavesurfer && wavesurfer.setWaveColor) {
                        wavesurfer.setWaveColor('#ffc107'); // Set the progress color when playing
                    } else {
                        console.error("WaveSurfer instance is invalid.");
                    }
                    console.log("Audio playing");  // Debugging line
                    playBtn.src = "/static/images/pause.svg";
                }
            };

            // Reset play button when audio finishes
            wavesurfer.on('finish', function () {
                playBtn.src = "/static/images/play.svg"; // Reset to "play" icon
                wavesurfer.setWaveColor('grey'); // Reset to grey color when finished
            });

            displayStatusMessage("Audio generated successfully!", "success");
        })
        .catch(error => {
            console.error('Error:', error);
            displayStatusMessage("Failed to generate audio. Check the console for details.", "error");
        });
});
