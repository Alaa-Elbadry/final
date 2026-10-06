const express = require('express');
const router = express.Router();
const db = require('../services/db');
const emailService = require('../services/email');

// In-memory fallback if DB is not configured yet
let inMemoryMessages = [];

// Helper for basic sanitization
function sanitize(input) {
    if (typeof input !== 'string') return '';
    return input.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
}

// POST /api/rsvp
router.post('/rsvp', async (req, res) => {
    try {
        const { name, email, attendance, companions, message } = req.body;

        // Basic validation
        if (!name || !email || !attendance) {
            return res.status(400).json({ error: 'Name, email, and attendance are required.' });
        }

        const guestData = {
            name: sanitize(name),
            email: sanitize(email),
            attendance: sanitize(attendance),
            companions: parseInt(companions) || 0,
            message: sanitize(message),
            created_at: new Date().toISOString()
        };

        // Save to Database
        if (db) {
            const { error } = await db.from('rsvps').insert([guestData]);
            if (error) {
                console.error("Database error:", error);
                return res.status(500).json({ error: 'Failed to save RSVP.' });
            }
        } else {
            // Fallback
            inMemoryMessages.unshift(guestData);
            if (inMemoryMessages.length > 4) inMemoryMessages.pop();
        }

        // Send admin notification email
        await emailService.sendRSVPEmail(guestData);

        // Send confirmation/invitation email to the guest if attending
        if (guestData.attendance === 'Attending') {
            await emailService.sendConfirmationEmail(guestData);
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("RSVP endpoint error:", error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/messages
router.get('/messages', async (req, res) => {
    try {
        if (db) {
            const { data, error } = await db
                .from('rsvps')
                .select('name, message, created_at')
                .not('message', 'eq', '')
                .order('created_at', { ascending: false })
                .limit(4);

            if (error) {
                console.error("Database error:", error);
                return res.status(500).json({ error: 'Failed to retrieve messages.' });
            }

            res.status(200).json(data);
        } else {
            // Fallback
            const messagesWithText = inMemoryMessages.filter(m => m.message).slice(0, 4);
            res.status(200).json(messagesWithText);
        }
    } catch (error) {
        console.error("Messages endpoint error:", error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
