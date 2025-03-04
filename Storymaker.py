from flask import Blueprint, request, jsonify, send_from_directory
import asyncio
import edge_tts
import os
import uuid
from pydub import AudioSegment
import mysql.connector

storymaker_bp = Blueprint('storymaker', __name__)

AUDIO_FOLDER = "static/audio"
os.makedirs(AUDIO_FOLDER, exist_ok=True)

# Database connection function
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="user_db"
    )

# Function to generate TTS asynchronously
async def generate_tts(text, voice_model, filename):
    output_path = os.path.join(AUDIO_FOLDER, filename)
    tts = edge_tts.Communicate(text, voice_model)
    await tts.save(output_path)
    return output_path

# Function to concatenate multiple audio files
def concatenate_audio(file_paths, output_filename):
    combined = None

    for file in file_paths:
        file_path = os.path.join(AUDIO_FOLDER, file)
        if not os.path.exists(file_path):
            continue  # Skip missing files

        audio = AudioSegment.from_file(file_path, format="mp3")
        combined = audio if combined is None else combined + audio

    if combined:
        output_path = os.path.join(AUDIO_FOLDER, output_filename)
        combined.export(output_path, format="mp3")
        return output_path
    return None

# Save story in database
def save_story(title, combined_audio):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        print(f"Inserting into DB -> Title: {title}, Audio: {combined_audio}")  # Debugging line
        query = "INSERT INTO stories (title, combined_audio) VALUES (%s, %s)"
        cursor.execute(query, (title, combined_audio))
        story_id = cursor.lastrowid  
        conn.commit()
        return story_id
    except Exception as e:
        print(f"Database insert error: {str(e)}") 
        return None
    finally:
        if conn:
            conn.close()  # Ensure the connection closes

@storymaker_bp.route('/add_dialogue', methods=['POST'])
async def add_dialogue():
    data = request.json
    story_title = data.get("title")  # Capture the title
    character = data.get("character")
    dialogue = data.get("dialogue")
    voice = data.get("voice")

    if not story_title or not character or not dialogue or not voice:
        return jsonify({"error": "Missing required fields"}), 400

    # Generate a unique filename to avoid conflicts
    filename = f"{story_title.replace(' ', '_')}_{character}_{voice}_{uuid.uuid4().hex}.mp3"

    try:
        output_path = await generate_tts(dialogue, voice, filename)
        return jsonify({"filename": filename, "file_url": f"/static/audio/{filename}", "title": story_title})
    except Exception as e:
        return jsonify({"error": f"Error generating audio: {str(e)}"}), 500

@storymaker_bp.route('/edit_dialogue', methods=['POST'])
def edit_dialogue():
    data = request.json
    text = data['dialogue']
    voice = data['voice']
    filename = data['filename']
    output_path = os.path.join(AUDIO_FOLDER, filename)

    asyncio.run(generate_tts(text, voice, output_path))
    return jsonify({'audio_url': f"/static/audio/{filename}"})

@storymaker_bp.route('/delete_dialogue', methods=['POST'])
def delete_dialogue():
    data = request.json
    filename = data['filename']
    character = data['character']

    file_path = os.path.join(AUDIO_FOLDER, filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    return jsonify({'message': f"{character}'s dialogue and audio have been deleted."})

@storymaker_bp.route('/combine', methods=['POST'])
def combine_audio():
    data = request.json
    files = data.get("files", [])
    title = data.get("title", "Untitled Story")  # Allow title input

    print(f"Received title: {title}")  # Debugging
    print(f"Files to combine: {files}")  # Debugging

    if not files:
        return jsonify({"error": "No files provided"}), 400

    final_filename = f"final_story_{uuid.uuid4().hex}.mp3"
    print(f"Generated final filename: {final_filename}")  # Debugging

    output_path = concatenate_audio(files, final_filename)
    if not output_path:
        print("Error: Failed to combine audio files")  # Debugging
        return jsonify({"error": "Failed to combine audio files"}), 500

    # Save to DB
    try:
        story_id = save_story(title, final_filename)
        print(f"Story saved with ID: {story_id}")  # Debugging
        return jsonify({"final_audio_url": f"/static/audio/{final_filename}", "title": title})
    except Exception as e:
        print(f"Database Error: {str(e)}")  # Debugging
        return jsonify({"error": "Error creating story. Please try again."}), 500

@storymaker_bp.route('/download/<filename>')
def download_audio(filename):
    return send_from_directory(AUDIO_FOLDER, filename, as_attachment=True)

if __name__ == '__main__':
    storymaker_bp.run(debug=True)
