import bcrypt from "bcrypt";
import crypto from "crypto";
import { Router } from "express";
import pool from "../../database/db.js";
import emailService from "../../utils/emailService.js";

const router = Router();
const saltRounds = 10;

router.post("/request", async(req, res) => {
    try {
        const {email} = req.body;

        if(!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        };

        // check if user exists
        const userResult = await pool.query("select id, name, email from users where email = $1", [email.toLowerCase()]);

        // always return success (security best practice)
        if(userResult.rows.length === 0) {
            return res.status(200).json({
                success: true,
                message: "If your email exists in our system, you will receive a reset link"
            });
        }

        const user = userResult.rows[0];

        // generate secure reset token
        const resetToken = crypto.randomBytes(32).toString('hex');


        // set expiry (1 hour from now)
        const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

        // hash the token before storing 
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // store token in database
        await pool.query(
            `
            update users
            set reset_token = $1,
            reset_token_expiry = $2
            where email = $3
            `, [hashedToken, tokenExpiry, email.toLowerCase()]
        );

        // create reset link
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

        // send email with reset link
        try {
            await emailService.sendResetLinkEmail(user.email, user.name, resetLink);

            console.log(`Reset link sent to ${user.email}`); // for debug

            res.status(200).json({
                success: true,
                message: "If your email exists in our system, you will receive a reset link",
                // only in development
                ...(process.env.NODE_ENV === "development" && {
                    dev_reset_link: resetLink,
                    dev_token: resetToken
                })
            });
        } catch (err) {
            console.error("Email sending failed: ", err);
            res.status(200).json({
                success: true,
                message: "If your email exists in our system, you will receive a reset link"
            });
        }
    } catch (err) {
        console.error("Forgot password request error: ", err);
        res.status(500).json({
            success: false,
            message: "server error"
        });
    }
});


// verify reset token
router.get("/verify-token", async(req, res) => {
    try {
        const {token, email} = req.query;

        if(!token || !email) {
            return res.status(400).json({
                success: false,
                message: "Token and email are required"
            });
        };

        // hash the token to compare with stored hash
        const hashedToken = crypto.createHash("sha256").update(token).digest('hex');

        // verify token
        const result = await pool.query(
            `select id from users
            where email = $1
            and reset_token = $2
            and reset_token_expiry > current_timestamp
            `, [email.toLowerCase(), hashedToken]
        );

        res.status(200).json({
            success: true,
            message: "Token is valid"
        });
    } catch (err) {
        console.error("Token verification error", err);
        res.status(500).json({
            success: false,
            message: "server error"
        });
    };
});


// reset password
router.post("/reset",async(req, res) => {
    try {
        const {email, token, newPassword, confirmPassword} = req.body;

        // validation
        if(!email || !token || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if(newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passowrds do not match",
            });
        };

        if(newPassword.length < 6 ) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters",
            });;
            
        };

        // hash the token to compare
        const hashedToken = crypto.createHash("sha256").update(token).digest('hex');


        // verify token 
        const userResult = await pool.query(
            `
            select id, name from users
            where email = $1
            and reset_token = $2
            and reset_token_expiry > current_timestamp
            `,
            [email.toLowerCase(), hashedToken]
        );

        if(userResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset link"
            });
        }

        const user = userResult.rows[0];

        // hash new password
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // update password and clear reset token
        await pool.query(
            `
            update users
            set password = $1,
            reset_token = null,
            reset_token_expiry = null,
            updated_at = current_timestamp
            where email = $2
            `, [hashedPassword, email.toLowerCase()]
        );

        // send confirmation email 
        emailService.sendPasswordChangeConfirmation(user.email, user.name).catch(err => console.log("confirmation email failed: ", err));

        res.status(200).json({
            success: true,
            message: "Password reset successfully"
        });
    } catch (err) {
        console.error("Password reset error: ", err);
        res.status(500).json({
            success: false,
            message: "server error",
        });
    };
});

export default router;