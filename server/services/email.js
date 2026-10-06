const nodemailer = require('nodemailer');

const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;
const rsvpReceiver = process.env.RSVP_RECEIVER_EMAIL || 'sherouk.ahmed1994@gmail.com';

let transporter = null;

if (emailUser && emailPassword) {
    transporter = nodemailer.createTransport({
        service: 'gmail', // You can change this based on the provider
        auth: {
            user: emailUser,
            pass: emailPassword
        }
    });
} else {
    console.warn("Email credentials missing. Email notifications will not be sent.");
}

// Basic HTML escaping helper
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function sendRSVPEmail(guest) {
    if (!transporter) {
        console.log('Would have sent email:', guest);
        return;
    }

    const safeName = escapeHtml(guest.name);
    const safeEmail = escapeHtml(guest.email);
    const safeAttendance = escapeHtml(guest.attendance);
    const safeCompanions = escapeHtml(guest.companions);
    const safeMessage = escapeHtml(guest.message) || '(No message provided)';
    const submittedAt = new Date().toLocaleString();

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fcfbf8; color: #333333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2d7ba; border-radius: 8px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
            .header { background: #080b12; color: #d4af37; text-align: center; padding: 30px 20px; }
            .header h1 { font-family: 'Times New Roman', Times, serif; margin: 0; font-size: 28px; letter-spacing: 2px; }
            .header p { margin: 5px 0 0; font-size: 14px; letter-spacing: 1px; color: #f3e5ab; }
            .header-date { margin-top: 15px; font-size: 13px; color: #a9a9a9; text-transform: uppercase; letter-spacing: 1px; }
            .content { padding: 30px; }
            .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #b8860b; border-bottom: 1px solid #f0efe8; padding-bottom: 8px; margin-bottom: 20px; text-align: center; }
            .info-table { width: 100%; border-collapse: collapse; }
            .info-table td { padding: 12px 0; border-bottom: 1px solid #f9f8f4; }
            .info-label { font-size: 12px; color: #888888; text-transform: uppercase; letter-spacing: 1px; width: 40%; }
            .info-value { font-size: 15px; color: #222222; font-weight: 500; }
            .attendance-status { font-weight: bold; color: ${safeAttendance.toLowerCase().includes('yes') || safeAttendance.toLowerCase().includes('attend') ? '#2e8b57' : '#b22222'}; }
            .message-box { background: #fcfbf8; border-left: 3px solid #d4af37; padding: 15px 20px; margin: 25px 0; font-style: italic; color: #444444; line-height: 1.6; }
            .footer { background: #f9f8f4; padding: 20px; text-align: center; border-top: 1px solid #e2d7ba; }
            .footer p { margin: 0; font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 1px; }
            .submitted-at { text-align: center; font-size: 11px; color: #aaaaaa; margin-top: 15px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>AHMED & SHEROUK</h1>
                <p>WEDDING RSVP</p>
                <div class="header-date">Friday, 6 November 2026</div>
            </div>
            
            <div class="content">
                <div class="section-title">New RSVP Received</div>
                
                <table class="info-table">
                    <tr>
                        <td class="info-label">Name</td>
                        <td class="info-value">${safeName}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Email</td>
                        <td class="info-value"><a href="mailto:${safeEmail}" style="color: #b8860b; text-decoration: none;">${safeEmail}</a></td>
                    </tr>
                    <tr>
                        <td class="info-label">Attendance</td>
                        <td class="info-value attendance-status">${safeAttendance}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Companions</td>
                        <td class="info-value">${safeCompanions}</td>
                    </tr>
                </table>

                <div class="section-title" style="margin-top: 30px;">Guest Message</div>
                <div class="message-box">
                    "${safeMessage}"
                </div>

                <div class="submitted-at">
                    Submitted: ${submittedAt}
                </div>
            </div>

            <div class="footer">
                <p>Ahmed & Sherouk Wedding Invitation</p>
            </div>
        </div>
    </body>
    </html>
    `;

    const mailOptions = {
        from: emailUser,
        to: rsvpReceiver,
        subject: `Wedding RSVP — ${safeName}`,
        html: htmlContent,
        text: `New Wedding RSVP\n\nName: ${safeName}\nEmail: ${safeEmail}\nAttendance: ${safeAttendance}\nNumber of companions: ${safeCompanions}\nCongratulations message: ${safeMessage}\nSubmitted at: ${submittedAt}`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`RSVP email sent for ${guest.name}`);
    } catch (error) {
        console.error("Error sending RSVP email:", error);
        throw error;
    }
}

async function sendConfirmationEmail(guest) {
    if (!transporter) {
        console.log('Would have sent confirmation email to:', guest.email);
        return;
    }

    const safeName = escapeHtml(guest.name);
    const companions = parseInt(guest.companions) || 0;
    const companionsText = companions === 0
        ? 'You are attending alone.'
        : `You will be joined by <strong>${companions}</strong> companion${companions > 1 ? 's' : ''}`;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background-color: #080b12; font-family: 'Georgia', 'Times New Roman', serif; color: #f1f5f9; }
            .wrapper { max-width: 580px; margin: 0 auto; background: #080b12; }

            /* Header */
            .header { text-align: center; padding: 50px 30px 30px; background: linear-gradient(180deg, #0f172a 0%, #080b12 100%); border-bottom: 1px solid rgba(212,175,55,0.3); }
            .header-ornament { color: #d4af37; font-size: 22px; letter-spacing: 8px; margin-bottom: 16px; }
            .header h1 { font-size: 36px; font-weight: 400; letter-spacing: 4px; color: #f3e5ab; margin-bottom: 6px; }
            .header-subtitle { font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: #b8860b; margin-top: 10px; }

            /* Gold divider */
            .divider { height: 1px; background: linear-gradient(to right, transparent, #d4af37, transparent); margin: 0 40px; }

            /* Main content */
            .content { padding: 40px 30px; text-align: center; }
            .greeting { font-size: 14px; color: #94a3b8; letter-spacing: 1px; margin-bottom: 8px; text-transform: uppercase; }
            .guest-name { font-size: 28px; color: #f3e5ab; letter-spacing: 2px; margin-bottom: 30px; }

            /* Invitation box */
            .invite-box { background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(212,175,55,0.35); border-radius: 8px; padding: 30px; margin: 25px 0; text-align: center; }
            .invite-intro { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 20px; }
            .couple-names { font-size: 32px; color: #d4af37; margin: 10px 0; font-style: italic; font-weight: 400; }
            .invite-request { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 2px; margin: 12px 0; }

            /* Event details */
            .details-grid { margin: 25px 0; }
            .detail-item { padding: 14px 0; border-bottom: 1px solid rgba(212,175,55,0.1); }
            .detail-item:last-child { border-bottom: none; }
            .detail-label { font-size: 10px; text-transform: uppercase; letter-spacing: 3px; color: #b8860b; margin-bottom: 5px; }
            .detail-value { font-size: 16px; color: #e2e8f0; letter-spacing: 1px; }
            .detail-sub { font-size: 11px; color: #64748b; margin-top: 4px; letter-spacing: 1px; }

            /* Companions badge */
            .companions-box { background: rgba(212,175,55,0.08); border: 1px solid rgba(212,175,55,0.25); border-radius: 6px; padding: 16px 20px; margin: 20px 0; font-size: 13px; color: #d4af37; line-height: 1.6; }

            /* Map link */
            .map-btn { display: inline-block; margin-top: 20px; padding: 12px 30px; background: rgba(212,175,55,0.15); border: 1px solid rgba(212,175,55,0.5); border-radius: 4px; color: #d4af37; text-decoration: none; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; }

            /* Note */
            .note { font-size: 11px; color: #475569; margin-top: 25px; line-height: 1.8; padding: 0 10px; }

            /* Footer */
            .footer { padding: 25px 30px; text-align: center; border-top: 1px solid rgba(212,175,55,0.15); }
            .footer p { font-size: 10px; color: #334155; letter-spacing: 2px; text-transform: uppercase; line-height: 2; }
            .footer-ornament { color: #b8860b; font-size: 16px; letter-spacing: 6px; margin-bottom: 10px; }
        </style>
    </head>
    <body>
        <div class="wrapper">

            <!-- Header -->
            <div class="header">
                <div class="header-ornament">✦ ✦ ✦</div>
                <h1>Ahmed &amp; Sherouk</h1>
                <div class="header-subtitle">Wedding Invitation — RSVP Confirmed</div>
            </div>
            <div class="divider"></div>

            <!-- Content -->
            <div class="content">

                <div class="greeting">Dear</div>
                <div class="guest-name">${safeName}</div>

                <!-- Invite box -->
                <div class="invite-box">
                    <div class="invite-intro">We are honoured to confirm that</div>
                    <div class="couple-names">Ahmed &amp; Sherouk</div>
                    <div class="invite-request">cordially request the pleasure of your company<br>at their wedding celebration</div>

                    <div class="divider" style="margin: 20px 0;"></div>

                    <!-- Event details -->
                    <div class="details-grid">
                        <div class="detail-item">
                            <div class="detail-label">Date</div>
                            <div class="detail-value">Friday, 6 November 2026</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Time</div>
                            <div class="detail-value">3:00 PM — 6:00 PM</div>
                            <div class="detail-sub">Katb ElKetab: 3:30 PM</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Venue</div>
                            <div class="detail-value">White Plaza, Ramag Hotel</div>
                            <div class="detail-sub">El-Mushir Tantawy Axis, 5th Settlement, New Cairo</div>
                        </div>
                    </div>

                    <!-- Companions note -->
                    <div class="companions-box">
                        🎟 ${companionsText}
                    </div>

                    <!-- Map -->
                    <a href="https://www.google.com/maps/search/?api=1&query=30.0444,31.2357" class="map-btn" target="_blank" rel="noopener noreferrer">
                        📍 Open in Google Maps
                    </a>
                </div>

                <p class="note">
                    Kindly note that capacity is limited to 200 guests.<br>
                    Submitting an RSVP does not guarantee or reserve a seat.<br><br>
                    We look forward to celebrating this special day with you.
                </p>

            </div>

            <!-- Footer -->
            <div class="footer">
                <div class="footer-ornament">✦</div>
                <p>Ahmed &amp; Sherouk • Wedding 2026</p>
                <p>Friday, 6 November 2026 — New Cairo, Egypt</p>
            </div>

        </div>
    </body>
    </html>
    `;

    const mailOptions = {
        from: emailUser,
        to: escapeHtml(guest.email),
        subject: `Your RSVP is Confirmed — Ahmed & Sherouk's Wedding`,
        html: htmlContent,
        text: `Dear ${guest.name},\n\nYour RSVP has been confirmed for the wedding of Ahmed & Sherouk.\n\nDate: Friday, 6 November 2026\nTime: 3:00 PM – 6:00 PM (Katb ElKetab: 3:30 PM)\nVenue: White Plaza, Ramag Hotel, El-Mushir Tantawy Axis, 5th Settlement, New Cairo\nGoogle Maps: https://share.google/FNLdm4Xul2ibjzvrU\n\nCompanions: ${companions}\n\nWe look forward to celebrating with you!\n\nAhmed & Sherouk`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Confirmation email sent to ${guest.email}`);
    } catch (error) {
        // Non-fatal — don't block the RSVP if confirmation email fails
        console.error("Error sending confirmation email:", error);
    }
}

module.exports = {
    sendRSVPEmail,
    sendConfirmationEmail
};
