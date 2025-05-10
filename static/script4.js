let audioFiles = []; // Keeps track of audio files

const voices = [
        { name: "Brain", details: "Male, Conversation, Copilot, Approachable, Casual, Sincere", model: "en-US-BrianMultilingualNeural", avatar: "../static/avatar/male-avatar8.jpg" },
        { name: "Emma", details: "Female, Conversation, Copilot, Cheerful, Clear, Conversational", model: "en-US-EmmaMultilingualNeural", avatar: "../static/avatar/female-avatar7.jpg" },
        { name: "Eric", details: "Male, News, Novel", model: "en-US-EricNeural", avatar: "../static/avatar/male-avatar6.avif" },
        { name: "Ana", details: "Female, Cartoon, Conversation, Cute", model: "en-US-AnaNeural", avatar: "../static/avatar/female-avatar5.avif" },
        { name: "Madhur", details: "Male, General", model: "hi-IN-MadhurNeural", avatar: "../static/avatar/male-avatar2.avif" },
        { name: "Swara", details: "Female, General", model: "hi-IN-SwaraNeural", avatar: "../static/avatar/female-avatar2.avif" },
        { name: "Manohar", details: "Male, General", model: "mr-IN-ManoharNeural", avatar: "../static/avatar/male-avatar3.avif" },
        { name: "Aarohi", details: "Female, General", model: "mr-IN-AarohiNeural", avatar: "../static/avatar/female-avatar3.avif" },
        { name: "Henri", details: "Male, General", model: "fr-FR-HenriNeural", avatar: "../static/avatar/male-avatar1.avif" },
        { name: "Eloise", details: "Female, General", model: "fr-FR-EloiseNeural", avatar: "../static/avatar/female-avatar1.avif" },
        { name: "Valluvar", details: "Male, General", model: "ta-IN-ValluvarNeural", avatar: "../static/avatar/male-avatar4.avif" },
        { name: "Pallavi", details: "Female, General", model: "ta-IN-PallaviNeural", avatar: "../static/avatar/female-avatar4.jpg" },
        { name: "Alvaro", details: "Male, General, Friendly, Positive", model: "es-ES-AlvaroNeural", avatar: "../static/avatar/male-avatar5.avif" },
        { name: "Elvira", details: "Female, General, Friendly, Positive", model: "es-ES-ElviraNeural", avatar: "../static/avatar/female-avatar6.avif" },
        { name: "Yunxia", details: "Male, Cartoon, Novel", model: "zh-CN-YunxiaNeural", avatar: "../static/avatar/male-avatar7.avif" },
        { name: "YunyangNeural", details: "Female, Cartoon, Novel, Lively", model: "zh-CN-XiaoyiNeural", avatar: "../static/avatar/female-avatar8.avif" }
    ];

document.addEventListener("DOMContentLoaded", function () {
    function renderVoices() {
        const voiceList = document.getElementById("voiceList");
        voiceList.innerHTML = ""; // Clear previous content

        voices.forEach(voice => {
            const voiceItem = document.createElement("div");
            voiceItem.classList.add("voice-item");

            voiceItem.innerHTML = `
                <div class="voice-details">
                    <span class="voice-name">${voice.name}</span>
                    <span class="voice-meta">${voice.gender}, ${voice.category}</span>
                    <span class="voice-meta">Model: ${voice.model}</span>
                </div>
                <img src="${voice.avatar}" alt="${voice.name}">
            `;

            voiceItem.addEventListener("click", function () {
                document.getElementById("voice-name").textContent = voice.name; 
                let avatar = document.getElementById("voice-avatar");
                avatar.src = voice.avatar;
                avatar.alt = voice.name;
                avatar.style.display = "block";

                document.getElementById("voice").dataset.model = voice.model; 
                closeVoiceModal();
            });

            voiceList.appendChild(voiceItem);
        });
    }

    document.getElementById("openVoiceModal").addEventListener("click", function () {
        document.getElementById("voiceModal").style.display = "block";
    });

    window.closeVoiceModal = function () {
        document.getElementById("voiceModal").style.display = "none";
    };

    renderVoices();
});

async function addDialogue() {
    const storyTitle = document.getElementById('storyTitle').value.trim();
    const character = document.getElementById('character').value;
    const dialogue = document.getElementById('dialogue').value;
    const voiceModel = document.getElementById('voice').dataset.model;

    if (!storyTitle) {
        alert("Please enter a story title.");
        return;
    }
    if (!character || !dialogue || !voiceModel) {
        alert("Please fill all fields before adding dialogue.");
        return;
    }

    const selectedVoice = voices.find(v => v.model === voiceModel);
    const avatarSrc = selectedVoice ? selectedVoice.avatar : "";
    const voiceName = selectedVoice ? selectedVoice.name : voiceModel;
    const filename = `${character}_${voiceModel}.mp3`; // Save with model name

    const response = await fetch('/add_dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: storyTitle, character, dialogue, voice: voiceModel, filename})
    });

    const data = await response.json();
    audioFiles.push(data.filename);

    const listItem = document.createElement('li');
    listItem.dataset.filename = data.filename;
    listItem.classList.add("dialogue-item");

    listItem.innerHTML = `
        <div class="dialogue-content">
            <div class="dialogue-text">
                <strong>${character}</strong>
                <p>${dialogue}</p>
            </div>
            <div class="dialogue-meta">
                <span class="icon">
                    <img src="${avatarSrc}" alt="${voiceName}" class="model-img">
                    ${voiceName}
                </span>
            </div>
            <div class="dialogue-actions">
                <button class="edit-btn" onclick="editDialogue('${data.filename}', '${character}', '${dialogue}', '${voiceModel}')"><img src="../static/images/edit.png" alt="Download" width="30px"></button>
                <button class="delete-btn" onclick="deleteDialogue('${data.filename}', '${character}')"><img src="../static/images/delete.png" alt="Download" width="30px"></button>
            </div>
        </div>
    `;
    document.getElementById('dialogueList').appendChild(listItem);

    document.getElementById('character').value = '';
    document.getElementById('dialogue').value = '';
    document.getElementById('voice-name').textContent = 'Select Voice';
    document.getElementById('voice-avatar').style.display = 'none';
    document.getElementById('dialogue-head').textContent='🗣️ Dialogues List'
}

async function editDialogue(filename, character, dialogue, voice) {
    const newDialogue = prompt(`Edit dialogue for ${character}:`, dialogue);
    if (newDialogue) {
        const response = await fetch('/edit_dialogue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dialogue: newDialogue, voice, filename })
        });
        const data = await response.json();

        const listItem = document.querySelector(`#dialogueList li[data-filename="${filename}"]`);
        if (listItem) {
            listItem.querySelector('.dialogue-text p').textContent = newDialogue;
        }

        const index = audioFiles.indexOf(filename);
        if (index !== -1) {
            audioFiles[index] = data.new_filename;
        }
    }
}

async function deleteDialogue(filename, character) {
    if (confirm(`Are you sure you want to delete ${character}'s dialogue and audio?`)) {
        const response = await fetch('/delete_dialogue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename, character })
        });
        const data = await response.json();

        document.querySelector(`#dialogueList li[data-filename="${filename}"]`)?.remove();
        audioFiles = audioFiles.filter(file => file !== filename);
        alert(data.message);
    }
}

async function combineDialogues() {
    const storyTitle = document.getElementById('storyTitle').value.trim();
    audioFiles = Array.from(document.querySelectorAll('#dialogueList li')).map(item => item.dataset.filename);

    if (!storyTitle) {
        alert("Please enter a story title before creating the story.");
        return;
    }
    if (audioFiles.length === 0) {
        alert("No dialogues to combine!");
        return;
    }

    const response = await fetch('/combine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: audioFiles, title: storyTitle, final_filename: "final_story.mp3" })
    });

    const data = await response.json();

    if (data.final_audio_url) {
        const storyAudio = document.getElementById('storyAudio');
        storyAudio.src = data.final_audio_url;
        storyAudio.style.display = 'block';
        storyAudio.play();

        const downloadLink = document.getElementById('downloadLink');
        downloadLink.href = data.final_audio_url;
        downloadLink.download = "final_story.mp3";
        downloadLink.style.display = 'block';

        // Show the audio container
        document.getElementById('audioContainer').style.display = 'flex';
    } else {
        alert("Error creating story. Please try again.");
    }
}

