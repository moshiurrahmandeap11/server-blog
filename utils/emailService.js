import nodemailer from 'nodemailer';

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER, // your email
                pass: process.env.SMTP_PASS, // your app password
            },
        });
    }

    // Generate 4-digit OTP
    generateOTP() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    // Send OTP Email
    async sendOTPEmail(email, name, otp) {
        const mailOptions = {
            from: `"Modern Blog" <${process.env.SMTP_USER}>`,
            to: email,
            subject: '🔐 Password Reset OTP - Modern Blog',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
                    <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
                        
                        <!-- Header with gradient -->
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 28px;">Modern Blog</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Password Reset Request</p>
                        </div>
                        
                        <!-- Main Content -->
                        <div style="padding: 40px 30px;">
                            <h2 style="color: #333; margin-top: 0;">Hello ${name || 'User'}! 👋</h2>
                            
                            <p style="color: #666; line-height: 1.6; font-size: 16px;">
                                We received a request to reset your password for your Modern Blog account. 
                                Use the following OTP (One-Time Password) to proceed with the password reset:
                            </p>
                            
                            <!-- OTP Box -->
                            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin: 30px 0;">
                                <div style="background: white; padding: 20px; border-radius: 8px; font-size: 48px; letter-spacing: 10px; font-weight: bold; color: #333;">
                                    ${otp}
                                </div>
                            </div>
                            
                            <p style="color: #666; line-height: 1.6; font-size: 16px;">
                                <strong>⏰ This OTP will expire in 5 minutes.</strong>
                            </p>
                            
                            <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 30px 0;">
                                <p style="color: #666; margin: 0; font-size: 14px;">
                                    <strong>⚠️ Security Tip:</strong> If you didn't request this password reset, 
                                    please ignore this email or contact support if you're concerned about your account's security.
                                </p>
                            </div>
                            
                            <p style="color: #999; font-size: 14px; text-align: center; margin-top: 40px;">
                                This is an automated message, please do not reply to this email.<br>
                                &copy; ${new Date().getFullYear()} Modern Blog. All rights reserved.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            // Plain text version for email clients that don't support HTML
            text: `
                Hello ${name || 'User'}!
                
                We received a request to reset your password for your Modern Blog account.
                
                Your OTP (One-Time Password) is: ${otp}
                
                This OTP will expire in 5 minutes.
                
                If you didn't request this password reset, please ignore this email.
                
                This is an automated message, please do not reply to this email.
                © ${new Date().getFullYear()} Modern Blog.
            `,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Email sending failed:', error);
            throw error;
        }
    }

    // Send Password Change Confirmation Email
    async sendPasswordChangeConfirmation(email, name) {
        const mailOptions = {
            from: `"Modern Blog" <${process.env.SMTP_USER}>`,
            to: email,
            subject: '✅ Password Changed Successfully - Modern Blog',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #28a745;">Password Changed Successfully!</h2>
                    <p>Hello ${name || 'User'},</p>
                    <p>Your Modern Blog account password has been successfully changed.</p>
                    <p>If you didn't make this change, please contact our support team immediately.</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">Modern Blog - Your Daily Read</p>
                </div>
            `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Confirmation email failed:', error);
        }
    }
}

export default new EmailService();