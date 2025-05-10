from flask import Flask, render_template, request, flash
from flask_mail import Mail, Message

app = Flask(__name__)

# Email configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = 'your-email@gmail.com'
app.config['MAIL_PASSWORD'] = 'your-app-password'  # Use App Password, NOT Gmail password
app.config['MAIL_DEFAULT_SENDER'] = 'your-email@gmail.com'
app.config['SECRET_KEY'] = 'your-secret-key'

mail = Mail(app)

@app.route('/send-email', methods=['POST'])
def send_email():
    email = request.form['email']  # Get email from form

    msg = Message('Password Reset Request', recipients=[email])
    msg.body = 'Click here to reset your password: <reset_link>'

    try:
        mail.send(msg)
        flash('Email sent successfully!', 'success')
    except Exception as e:
        flash(f'Error sending email: {str(e)}', 'danger')

    return render_template('forgot_password.html')
