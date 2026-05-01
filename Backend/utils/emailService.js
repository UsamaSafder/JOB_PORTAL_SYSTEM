const nodemailer = require('nodemailer');

const emailUser = process.env.EMAIL_USER || '';
const emailPassword = process.env.EMAIL_PASSWORD || '';
const emailService = process.env.EMAIL_SERVICE || 'gmail';
const emailConfigured = emailUser && emailPassword && !emailUser.includes('your-email') && !emailPassword.includes('your-app-password');

let transporter = null;
if (emailConfigured) {
  transporter = nodemailer.createTransport({
    service: emailService,
    auth: {
      user: emailUser,
      pass: emailPassword
    }
  });

  transporter.verify((error) => {
    if (error) {
      console.log('Email service connection error:', error.message);
    } else {
      console.log('Email service is ready to send emails');
    }
  });
} else {
  console.log('Email service is not configured. Emails cannot be sent until EMAIL_USER and EMAIL_PASSWORD are configured in Backend/.env.');
}

/**
 * Send welcome email (optional)
 */
const sendWelcomeEmail = async (email, name) => {
  if (!emailConfigured) {
    console.log('Email service not configured, skipping welcome email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@jobportal.com',
      to: email,
      subject: 'Welcome to Job Portal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Job Portal!</h2>
          <p>Hi ${name || 'User'},</p>
          <p>Thank you for registering with us. Your account has been successfully created.</p>
          <p>You can now log in and start exploring job opportunities.</p>
          
          <p style="color: #666;">Happy job hunting!</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #999;">
            This is an automated email. Please do not reply to this email.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to:', email);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWelcomeEmail
};
