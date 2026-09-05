const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Verify transporter configuration
transporter.verify((error, success) => {
    if (error) {
        console.warn('⚠️  Email service not configured:', error.message);
        console.warn('   Email verification will be logged to console instead.');
    } else {
        console.log('✅ Email service ready');
    }
});

/**
 * Send verification email
 */
async function sendVerificationEmail(user, token) {
    const verificationUrl = `${process.env.APP_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_FROM || 'Africa Konnect <noreply@africakonnect.com>',
        to: user.email,
        subject: 'Verify Your Email - Africa Konnect',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to Africa Konnect!</h1>
                    </div>
                    <div class="content">
                        <h2>Hi ${user.name},</h2>
                        <p>Thank you for signing up! Please verify your email address to activate your account.</p>
                        <p>Click the button below to verify your email:</p>
                        <a href="${verificationUrl}" class="button">Verify Email Address</a>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
                        <p><strong>This link will expire in 24 hours.</strong></p>
                        <p>If you didn't create an account, you can safely ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2026 Africa Konnect. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Verification email sent to ${user.email}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Failed to send verification email:', error.message);
        // Log to console for development
        console.log('\n📧 VERIFICATION EMAIL (Development Mode):');
        console.log(`   To: ${user.email}`);
        console.log(`   Link: ${verificationUrl}\n`);
        return { success: false, error: error.message };
    }
}

/**
 * Send welcome email
 */
async function sendWelcomeEmail(user) {
    const dashboardUrl = user.role === 'expert'
        ? `${process.env.APP_URL || 'http://localhost:5173'}/expert-dashboard`
        : `${process.env.APP_URL || 'http://localhost:5173'}/project-hub`;

    const mailOptions = {
        from: process.env.EMAIL_FROM || 'Africa Konnect <noreply@africakonnect.com>',
        to: user.email,
        subject: 'Welcome to Africa Konnect!',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Welcome to Africa Konnect!</h1>
                    </div>
                    <div class="content">
                        <h2>Hi ${user.name},</h2>
                        <p>Your email has been verified successfully! You're all set to start your journey.</p>
                        ${user.role === 'expert' ? `
                            <p>As an expert, you can now:</p>
                            <ul>
                                <li>Complete your profile to get matched with clients</li>
                                <li>Showcase your portfolio and skills</li>
                                <li>Set your availability and rates</li>
                                <li>Start receiving project invitations</li>
                            </ul>
                        ` : `
                            <p>As a client, you can now:</p>
                            <ul>
                                <li>Post your projects</li>
                                <li>Browse vetted African experts</li>
                                <li>Get matched with the right talent</li>
                                <li>Collaborate securely with escrow protection</li>
                            </ul>
                        `}
                        <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Welcome email sent to ${user.email}`);
    } catch (error) {
        console.error('❌ Failed to send welcome email:', error.message);
    }
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(user, token) {
    const resetUrl = `${process.env.APP_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_FROM || 'Africa Konnect <noreply@africakonnect.com>',
        to: user.email,
        subject: 'Reset Your Password - Africa Konnect',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <h2>Hi ${user.name},</h2>
                        <p>We received a request to reset your password. Click the button below to create a new password:</p>
                        <a href="${resetUrl}" class="button">Reset Password</a>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
                        <p><strong>This link will expire in 1 hour.</strong></p>
                        <p>If you didn't request a password reset, you can safely ignore this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Password reset email sent to ${user.email}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Failed to send password reset email:', error.message);
        console.log('\n📧 PASSWORD RESET EMAIL (Development Mode):');
        console.log(`   To: ${user.email}`);
        console.log(`   Link: ${resetUrl}\n`);
        return { success: false, error: error.message };
    }
}

/**
 * Send notification email
 */
async function sendNotificationEmail(user, notification) {
    const mailOptions = {
        from: process.env.EMAIL_FROM || 'Africa Konnect <noreply@africakonnect.com>',
        to: user.email,
        subject: notification.title,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="content">
                        <h2>${notification.title}</h2>
                        <p>${notification.message}</p>
                        ${notification.link ? `<a href="${notification.link}" class="button">View Details</a>` : ''}
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Notification email sent to ${user.email}`);
    } catch (error) {
        console.error('❌ Failed to send notification email:', error.message);
    }
}

module.exports = {
    sendVerificationEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendNotificationEmail
};
