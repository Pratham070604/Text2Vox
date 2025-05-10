from flask import Flask, render_template, request, jsonify, send_from_directory
from flask import Flask, render_template, request, redirect, url_for, flash
import asyncio
import edge_tts
import os
import logging
import bcrypt
from flask import session
import mysql.connector
from document_to_speech import document_to_speech
from werkzeug.utils import secure_filename
from Storymaker import storymaker_bp  # Import Story Maker Blueprint
import re  # For email validation
import uuid  # Import UUID for unique filenames
from flask_mail import Mail, Message
import secrets

app = Flask(__name__)

# Set secret key for session management (Fixes flash error)
app.secret_key = os.urandom(24)

# Register the Story Maker Blueprint
app.register_blueprint(storymaker_bp)

# Email Validation Regex
EMAIL_REGEX = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"

# Dummy storage for emails (use a database in production)
# subscribers = []

# Flask-Mail Configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'  # Use your email provider's SMTP server
app.config['MAIL_PORT'] = 587  # SMTP port (587 for TLS, 465 for SSL)
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'devilboy6907@gmail.com'  # Replace with your email
app.config['MAIL_PASSWORD'] = 'rruf unip kznq vnmz'  # Replace with your app password
app.config['MAIL_DEFAULT_SENDER'] = 'your_email@gmail.com'

mail = Mail(app)

# MySQL Connection
def get_db_connection():
    return mysql.connector.connect(host="localhost", user="root", password="root", database="user_db")

# Database connection
conn = get_db_connection()
cursor = conn.cursor()

# Create users table if not exists
cursor.execute('''CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
)''')
conn.commit()

cursor.execute('''CREATE TABLE IF NOT EXISTS subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL
)''')
conn.commit()

cursor.execute('''CREATE TABLE IF NOT EXISTS audio_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    text TEXT NOT NULL,
    voice_model VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)''')
conn.commit()


# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Path for saving audio files inside static folder
AUDIO_FOLDER = 'static/audio'
os.makedirs(AUDIO_FOLDER, exist_ok=True)

# Path for uploaded files
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50 MB limit
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Voice configurations
VOICES = [
    {'name': 'Brain', 'details': 'Male, Conversation, Copilot, Approachable, Casual, Sincere', 'model': 'en-US-BrianMultilingualNeural','avatar': '/avatar/male-avatar8.jpg'},
    {'name': 'Emma', 'details': 'Female , Conversation, Copilot, Cheerful, Clear, Conversational', 'model': 'en-US-EmmaMultilingualNeural','avatar': '/avatar/female-avatar7.jpg'},
    {'name': 'Eric', 'details': 'Male, News, Novel', 'model': 'en-US-EricNeural','avatar': '/avatar/male-avatar6.avif'},
    {'name': 'Ana', 'details': 'Female, Cartoon, Conversation, Cute', 'model': 'en-US-AnaNeural','avatar': '/avatar/female-avatar5.avif'},
    {'name': 'Madhur', 'details': 'Male, General', 'model': 'hi-IN-MadhurNeural','avatar': '/avatar/male-avatar2.avif'},
    {'name': 'Swara', 'details': 'Female, General', 'model': 'hi-IN-SwaraNeural','avatar': '/avatar/female-avatar2.avif'},
    {'name': 'Manohar', 'details': 'Male, General', 'model': 'mr-IN-ManoharNeural','avatar': '/avatar/male-avatar3.avif'},
    {'name': 'Aarohi', 'details': 'Female, General', 'model': 'mr-IN-AarohiNeural','avatar': '/avatar/female-avatar3.avif'},
    {'name': 'Henri', 'details': 'Male, General', 'model': 'fr-FR-HenriNeural','avatar': '/avatar/male-avatar1.avif'},
    {'name': 'Eloise', 'details': 'Female, General', 'model': 'fr-FR-EloiseNeural','avatar': '/avatar/female-avatar1.avif'},
    {'name': 'Valluvar', 'details': 'Male, General', 'model': 'ta-IN-ValluvarNeural','avatar': '/avatar/male-avatar4.avif'},
    {'name': 'Pallavi', 'details': 'Female, General', 'model': 'ta-IN-PallaviNeural','avatar': '/avatar/female-avatar4.jpg'},
    {'name': 'Alvaro', 'details': ' Male, General, Friendly, Positive','model': 'es-ES-AlvaroNeural','avatar': '/avatar/male-avatar5.avif'},
    {'name': 'Elvira', 'details': 'Female, General, Friendly, Positive', 'model': 'es-ES-ElviraNeural','avatar': '/avatar/female-avatar6.avif'},
    {'name': 'Yunxia', 'details': 'Male, Cartoon, Novel', 'model': 'zh-CN-YunxiaNeural','avatar': '/avatar/male-avatar7.avif'},
    {'name': 'YunyangNeural', 'details': 'Female, Cartoon, Novel,    Lively', 'model': 'zh-CN-XiaoyiNeural','avatar': '/avatar/female-avatar8.avif'}
]

# Function to generate TTS asynchronously
async def generate_tts(text, voice_model):
    unique_filename = f"{voice_model}_{uuid.uuid4().hex}.mp3"
    output_file = os.path.join(AUDIO_FOLDER, unique_filename)
    tts = edge_tts.Communicate(text, voice_model)
    await tts.save(output_file)
    return output_file

# Synchronous wrapper for async TTS
def process_text(text, voice_model):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(generate_tts(text, voice_model))
    finally:
        loop.close()

@app.route('/')
def index():
    # if 'user' not in session:
    #     return redirect(url_for('login'))
    return render_template('index.html',user=session.get("username"), voices=VOICES)

@app.route('/Text_to_Speech')
def Text_to_Speech():

    if 'username' not in session:
        return redirect(url_for('login'))
    return render_template('Text_to_Speech.html', voices=VOICES)

@app.route('/Document_to_Speech')
def Document_to_Speech():
    if 'username' not in session:
        return redirect(url_for('login'))
    return render_template('Document_to_Speech.html', voices=VOICES)

@app.route('/Storymaker')
def Storymaker():
    if 'username' not in session:
        return redirect(url_for('login'))
    return render_template('Storymaker.html', voices=VOICES)

@app.route('/about')
def about():
    # if 'user' not in session:
    #     return redirect(url_for('login'))
    return render_template('about.html')


@app.route('/contact', methods=['GET', 'POST'])
def contact():
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        message = request.form['message']

        # Validate email format
        if not re.match(EMAIL_REGEX, email):
            flash('Invalid email format!', 'danger')
            return redirect(url_for('contact'))

        try:
            cursor.execute("INSERT INTO contacts (name, email, message) VALUES (%s, %s, %s)", (name, email, message))
            conn.commit()
            flash('Your message has been sent successfully!', 'success')
        except mysql.connector.Error as err:
            conn.rollback()
            flash(f'Database error: {err}', 'danger')

        return redirect(url_for('contact'))

    return render_template('contact.html')

@app.route("/subscribe", methods=["POST"])
def subscribe():
    data = request.get_json()
    email = data.get("email")

    if not email:
        return jsonify({"error": "Email is required"}), 400

    if not re.match(EMAIL_REGEX, email):
        return jsonify({"error": "Invalid email format"}), 400

    con = get_db_connection()
    cursor = con.cursor()

    # ✅ Check if the email already exists before inserting
    cursor.execute("SELECT email FROM subscribers WHERE email = %s", (email,))
    existing_email = cursor.fetchone()

    if existing_email:
        return jsonify({"error": "Email already subscribed"}), 400

    try:
        cursor.execute("INSERT INTO subscribers (email) VALUES (%s)", (email,))
        con.commit()
        return jsonify({"message": "Subscribed successfully!"}), 200

    except mysql.connector.Error as e:
        con.rollback()
        return jsonify({"error": "Database error"}), 500

    finally:
        cursor.close()
        con.close()

# Text to Speech
@app.route('/generate-audio', methods=['POST'])
def generate_audio():
    try:
        text = request.json.get('text', '').strip()
        model = request.json.get('model', '').strip()

        if not text:
            return jsonify({"error": "Text cannot be empty"}), 400
        if len(text) > 1000:
            return jsonify({"error": "Text is too long. Please limit to 1000 characters"}), 400
        if not model:
            return jsonify({"error": "Voice model is required"}), 400

        voice = next((v for v in VOICES if v['model'] == model), None)
        if not voice:
            return jsonify({"error": "Invalid voice model"}), 404

        file_path = process_text(text, model)
        filename = os.path.basename(file_path)  # Extract just the filename

        # Save audio file info in database
        cursor.execute("INSERT INTO audio_files (text, model, file_path) VALUES (%s, %s, %s)", (text, model, filename))
        conn.commit()

        return jsonify({"name": voice['name'], "file": f"/static/audio/{filename}"})

    except Exception as e:
        logging.exception("Error generating audio")
        return jsonify({"error": str(e)}), 500
    
@app.route('/saved-audios')
def saved_audios():
    cursor.execute("SELECT id, text, voice_model, file_path, created_at FROM audio_files ORDER BY created_at DESC")
    audios = cursor.fetchall()
    return render_template('saved_audios.html', audios=audios)

# Document to Speech
@app.route('/convert', methods=['POST'])
async def convert():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    selected_voice = request.form.get('model')
    if not selected_voice:
        return jsonify({'error': 'No voice model selected'}), 400

    if file:
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        try:
            file.save(file_path)
        except Exception as e:
            return jsonify({'error': f'Error saving file: {str(e)}'}), 500

        try:
            output_file_path = await document_to_speech(file_path, selected_voice)
            if output_file_path:
                return jsonify({'message': 'File successfully converted to speech', 'audio_url': f'/static/audio/{os.path.basename(output_file_path)}'})
            else:
                return jsonify({'error': 'Conversion failed'}), 500
        except Exception as e:
            return jsonify({'error': f'Error during conversion: {str(e)}'}), 500
        
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        cursor.execute('SELECT * FROM users WHERE username = %s', (username,))
        user = cursor.fetchone()

        if user and bcrypt.checkpw(password.encode('utf-8'), user[3].encode('utf-8')):  # Assuming password is at index 2
            session["username"] = user[1]  # Assuming username is at index 1
            flash('Login Successful!', 'success')
            return redirect(url_for('index'))
        else:
            flash('Invalid Credentials!', 'danger')

    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        cursor.execute("SELECT * FROM users WHERE username = %s OR email = %s", (username, email))
        existing_user = cursor.fetchone()

        if existing_user:
            flash('Username or Email already exists!', 'danger')  # Flash message for duplicate entry
        else:
            cursor.execute('INSERT INTO users (username, email, password) VALUES (%s, %s, %s)', 
                           (username, email, hashed_password))
            conn.commit()
            flash('Account created successfully!', 'success')
            return redirect(url_for('login'))

    return render_template('signup.html')

@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form['email']
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if user:
            reset_token = secrets.token_urlsafe(32)  # Generate a secure token
            cursor.execute("UPDATE users SET reset_token = %s WHERE email = %s", (reset_token, email))
            conn.commit()

            reset_url = url_for('reset_password', token=reset_token, _external=True)
            msg = Message('Password Reset Request', recipients=[email])
            msg.body = f'Click the link to reset your password: {reset_url}'
            mail.send(msg)

            flash('Password reset link sent to your email!', 'success')
        else:
            flash('Email not found!', 'danger')

    return render_template('forgot_password.html')

@app.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    if request.method == 'POST':
        new_password = request.form['password']
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        cursor.execute("SELECT id FROM users WHERE reset_token = %s", (token,))
        user = cursor.fetchone()

        if user:
            cursor.execute("UPDATE users SET password = %s, reset_token = NULL WHERE reset_token = %s", (hashed_password, token))
            conn.commit()
            flash('Password reset successful! You can now log in.', 'success')
            return redirect(url_for('login'))
        else:
            flash('Invalid or expired reset link!', 'danger')

    return render_template('reset_password.html', token=token)

@app.route('/logout')
def logout():
    session.pop("username", None)  # Remove username from session
    flash('Logged out successfully!', 'success')
    return redirect(url_for('login'))

# Route to serve static audio file after conversion
@app.route('/static/audio/<filename>')
def serve_audio(filename):
    return send_from_directory(AUDIO_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True)