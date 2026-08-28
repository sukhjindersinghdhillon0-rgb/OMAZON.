require('dotenv').config();
const express = require('express');
const { Resend } = require('resend');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory store for OTPs
const otpStore = {};

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Route 1: Send OTP Email
app.post('/api/send-otp', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = otp;

    try {
        const data = await resend.emails.send({
            from: 'Omazon <onboarding@resend.dev>', // Use onboarding@resend.dev for testing without a domain
            to: [email],
            subject: 'Your Omazon Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2>Welcome to Omazon</h2>
                    <p>Your one-time verification code is:</p>
                    <h1 style="color: #0284c7; letter-spacing: 4px;">${otp}</h1>
                    <p>This code will expire shortly. Do not share it with anyone.</p>
                </div>
            `
        });

        res.json({ success: true, message: `Verification code sent to ${email}` });
    } catch (error) {
        console.error('Resend Error:', error);
        res.status(500).json({ success: false, message: 'Failed to send email via Resend.' });
    }
});

// Route 2: Verify OTP
app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;

    if (otpStore[email] && otpStore[email] === otp) {
        delete otpStore[email]; // Clear OTP after success
        return res.json({ success: true, message: 'Authentication successful.' });
    }

    res.status(400).json({ success: false, message: 'Invalid or expired OTP code.' });
});

app.listen(PORT, () => {
    console.log(`Omazon application server running on http://localhost:${PORT}`);
});