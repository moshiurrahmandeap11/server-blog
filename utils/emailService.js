import nodemailer from "nodemailer";

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    };

    // send password reset link with email
    async sendResetLinkEmail(email,name, resetLink) {
        const mailOptions = {
            from: `"Modern Blog" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Reset Your Password - Modern Blog",
            html: `
            <!DOCTYPE html>
            <html>
            <head>
            <meta charset="uts-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            </style>
            </head>
            <body style="font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
            <!-- Main Container -->
            <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); overflow: hidden;">
            <!-- Hero Section with Gradient -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 48px 40px; text-align: center;">
            <div style="background: rgba(255,255,255,0.1); width: 80px; height: 80px; border-radius: 50%; margin 0 auto 24px; display: flex; align-itmes: center; justify-content: center;">
            <span style="font-size: 40px;">🔐</span>
            </div>
            <h1 style="color: white; margin: 0; font-size 32px; font-weight: 700; letter-spacing: -0.5px;">Modern Blog</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0; font-size 16px;">Password Reset Request</p>
            </div>

            <!-- Content Section -->
            <div style="padding: 48px 40px; background: white;">
            <h2 style="color: #1f2937; margin-top: 0; font-size: 2px; font-weight: 600;">${name || "there"}</h2>
            <p style="color: #4b5563; line-height: 1.8; font-size: 16px; margin: 24px 0;">
            We Received a request to reset the password for your Modern Blog account. No Worries! Click the button below to create a new password:</p>
            <!-- Reset Button -->
            <div style="text-aligh: center; margin: 40px 0;">
            <a href="${resetLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; border-radius: 12pxp; text-decoration: none; font-weight: 600; font-size: 18px; display: inline-block; box-shadow: 0 10px 20px -5px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">Reset Password</a>
            </div>

            <!-- alternative link -->
            <p style="color: #6b7280; font-size: 14px; text-aligh: center; margin: 24px 0;">
            Or Copy this link:<br />
            <span style="color: #667eea; word-break: break-all;">${resetLink}</span>
            </p>

            <!-- warning box -->
            <div style="background: #fef2f2; border-left: 4pxp solid #ef4444; padding: 20px; margin: 32px 0; border-radius: 8px;">
            <p style="color: #991b1b; margin: 0; font-size: 14px; font-weight: 500;">This link will be expire in <strong> 1 hour </strong></p>
            <p style="color: #b91c1c; margin: 8px 0 0; font-size: 14px;">
            If you didn't request this password reset, please ignore this email or <a href="mailto:moshiurrahmandeap@gmail.com" style="color: #dc2626; text-decoration: underline;">Contact support</a> if you're concerned about your account's security.
            </p>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

            <!-- footer -->
            <div style="text-align: center;">
            <p style="color: #9ca3af; font-size: 14px; margin: 8px 0;">
            This is an automated message, please do not reply to this email
            </p>
            <p style="color: #9ca3af; font-size: 13px; margin: 8px 0;">
            &copy; ${new Date().getFullYear()} Modern Blog. All rights reserved.
            </p>
            <div style="margin-top: 24px;">
            <a href="#" style="color: #9ca3af; text-decoration: none; margin: 0 10px; font-size: 13px;">Privacy Policy</a>
            <span style="color: #d1d5db;">•</span>
            <a href="#" style="color: #9ca3af; text-decoration: none; margin: 0 10px; font-size: 13px;">Terms of Serviice</a>
            <span style="color: #d1d5db;">•</span>
            <a href="#" style="color: #9ca3af; text-decoration: none; margin: 0 10px; font-size: 13px;">Contact Support</a>
            </div>
            </div>
            </div>

            <!-- decorative footer -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); height: 8px;"></div>

            </div>
            </body>
            </html>
            `,

            // plain text version
            text: `
            Hello ${name || 'there'}!
            We received a request to reset your Modern Blog account password.
            Click the link below to reset your password: ${resetLink}

            This Link will expire in 1 hour.

            If you didn't request this, please ignore this email.

            This is an automated message, please do not reply.
            © ${new Date().getFullYear()} Modern Blog
            `
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log("Reset link email sent: ", info.messageId);
            return {success: true, messageId: info.messageId};
        } catch (err) {
            console.log("Email sending failed: ", err);
            throw err;
        }
    }


    // send password change confirmation
    async sendPasswordChangeConfirmation(email, name) {
        const mailOptions = {
            from: `"Modern Blog" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Password Changed Successfully - Modern Blog",
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b9981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0;">Success!</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1f2937;">Password Changed Successfully</h2>
            <p style="color: #4b5563;">Hello ${name || 'User'},</p>
            <p style="color: #4b5563;">Your Modern Blog account password has been successfully changed.</p>
            <div style="background: #e6f7e6; padding: 15px; border-radius: 8px; margin:20px 0;">
            <p style="color: #059669; margin: 0;">
            If you didn't make this change, please contact our support team immediately.
            </p>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px; text-aligh: center;">Modern Blog - Your Daily Read</p>
            </div>
            </div>
            `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
        } catch (err) {
            console.log("Confirmation email failed: ", err);
        }
    }
}

export default new EmailService();