/* Interactive Starry Canvas Background */
const canvas = document.getElementById('stars-canvas');
const ctx = canvas.getContext('2d');
let stars = [];

function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars();
}

function initStars() {
    stars = [];
    const count = Math.floor((canvas.width * canvas.height) / 4000);
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 1.5 + 0.5,
            alpha: Math.random(),
            speed: Math.random() * 0.02 + 0.005
        });
    }
}

function animateStars() {
    if (!canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";

    stars.forEach(star => {
        star.alpha += star.speed;
        if (star.alpha > 1 || star.alpha < 0) {
            star.speed = -star.speed;
        }
        ctx.globalAlpha = Math.abs(star.alpha);
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    requestAnimationFrame(animateStars);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
animateStars();

/* Countdown Timer Logic */
const targetDate = new Date("2026-11-06T15:00:00+02:00").getTime();

function updateCountdown() {
    const now = new Date().getTime();
    const difference = Math.max(targetDate - now, 0);

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    const elDays = document.getElementById("days");
    if (elDays) {
        elDays.innerText = String(days).padStart(2, '0');
        document.getElementById("hours").innerText = String(hours).padStart(2, '0');
        document.getElementById("minutes").innerText = String(minutes).padStart(2, '0');
        document.getElementById("seconds").innerText = String(seconds).padStart(2, '0');
    }
}

setInterval(updateCountdown, 1000);
updateCountdown();

/* =========================
   OPENING + CINEMATIC AUTO SCROLL
   ========================= */
let invitationOpened = false;
let autoScrollActive = false;
let autoScrollFrame = null;
let autoScrollLastTime = 0;
let autoScrollResumeTimer = null;
let autoScrollStartTimer = null;

const envelopeContainer = document.getElementById('envelopeContainer');
const openingScreen = document.getElementById('openingScreen');
const invitationContent = document.getElementById('invitationContent');

function getMaxScroll() {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
}

function startAutoScroll() {
    if (!invitationOpened || autoScrollActive) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // The content must be unlocked before calculating the scroll height.
    invitationContent?.classList.remove('is-locked');
    invitationContent?.setAttribute('aria-hidden', 'false');

    const maxScroll = getMaxScroll();
    if (maxScroll <= 5) {
        // Images/fonts can increase the page height a little later.
        clearTimeout(autoScrollStartTimer);
        autoScrollStartTimer = setTimeout(startAutoScroll, 800);
        return;
    }

    autoScrollActive = true;
    document.body.classList.add('auto-scrolling');
    autoScrollLastTime = performance.now();

    let indicator = document.getElementById('autoScrollIndicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'autoScrollIndicator';
        indicator.className = 'auto-scroll-indicator';
        indicator.innerHTML = '<span>↓</span> Auto scroll';
        document.body.appendChild(indicator);
    }
    requestAnimationFrame(() => indicator.classList.add('visible'));

    const step = (now) => {
        if (!autoScrollActive) return;

        const dt = Math.min(now - autoScrollLastTime, 50);
        autoScrollLastTime = now;
        const current = window.scrollY || document.documentElement.scrollTop;
        const limit = getMaxScroll();

        if (current >= limit - 2) {
            stopAutoScroll();
            indicator.classList.remove('visible');
            return;
        }

        // ~14 px/sec: slow, elegant, and consistent on desktop + mobile.
        const next = Math.min(current + (dt / 1000) * 24, limit);
        window.scrollTo(0, next);
        autoScrollFrame = requestAnimationFrame(step);
    };

    autoScrollFrame = requestAnimationFrame(step);
}

function stopAutoScroll() {
    autoScrollActive = false;
    if (autoScrollFrame) cancelAnimationFrame(autoScrollFrame);
    autoScrollFrame = null;
    document.body.classList.remove('auto-scrolling');
}

function pauseAutoScrollForUser() {
    if (!invitationOpened) return;
    stopAutoScroll();
    clearTimeout(autoScrollResumeTimer);
    autoScrollResumeTimer = setTimeout(() => {
        if (invitationOpened && getMaxScroll() - window.scrollY > 20) {
            startAutoScroll();
        }
    }, 3000);
}

function finishOpening() {
    if (!openingScreen) return;

    invitationContent?.classList.remove('is-locked');
    invitationContent?.setAttribute('aria-hidden', 'false');
    startAudio();

    openingScreen.classList.add('is-dismissed');
    setTimeout(() => {
        openingScreen.remove();
        // Start after the browser has painted the full invitation.
        requestAnimationFrame(() => requestAnimationFrame(startAutoScroll));
    }, 700);
}

if (envelopeContainer) {
    const openInvitation = () => {
        if (invitationOpened) return;
        invitationOpened = true;
        envelopeContainer.classList.add('is-open');

        // Let the envelope/card animation finish, then reveal the invitation.
        setTimeout(finishOpening, 2000);
    };

    envelopeContainer.addEventListener('click', openInvitation);
    envelopeContainer.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openInvitation();
        }
    });
}

// Any intentional user scrolling pauses auto-scroll, then resumes gently.
['wheel', 'touchstart', 'pointerdown'].forEach(eventName => {
    window.addEventListener(eventName, () => {
        if (invitationOpened) pauseAutoScrollForUser();
    }, { passive: true });
});

window.addEventListener('keydown', (e) => {
    const navigationKeys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '];
    if (navigationKeys.includes(e.key) && invitationOpened) pauseAutoScrollForUser();
});

window.addEventListener('resize', () => {
    // Keep the animation alive if a mobile browser changes viewport height.
    if (invitationOpened && !autoScrollActive && getMaxScroll() > window.scrollY + 20) {
        clearTimeout(autoScrollResumeTimer);
        autoScrollResumeTimer = setTimeout(startAutoScroll, 1200);
    }
});


/* Modal Handlers */
function openModal(id) {
    closeAllModals();
    document.getElementById('modalBackdrop').classList.remove('hidden');
    document.getElementById(id).classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeAllModals() {
    document.getElementById('modalBackdrop').classList.add('hidden');
    const modals = ['rsvpModal', 'locationModal', 'musicModal', 'contactModal', 'dateModal'];
    modals.forEach(m => {
        const el = document.getElementById(m);
        if (el) el.classList.add('hidden');
    });
    document.body.style.overflow = ''; // Restore background scrolling
}

/* Audio Player Toggle */
let isPlaying = false;
function updateAudioControls(playing, status = '') {
    isPlaying = playing;
    const icon = document.getElementById('playBtnIcon');
    const text = document.getElementById('playBtnText');
    const badge = document.getElementById('musicBadge');
    const stat = document.getElementById('musicStatus');
    
    if (icon) icon.className = playing ? "fa-solid fa-pause" : "fa-solid fa-play";
    if (text) text.innerText = playing ? "Pause Music" : "Play Music";
    if (badge) badge.classList.toggle('hidden', !playing);
    if (stat) stat.innerText = status;
}

function startAudio() {
    const audio = document.getElementById('bgAudio');
    if (audio) {
        audio.play().then(() => {
            updateAudioControls(true);
        }).catch(() => {
            updateAudioControls(false, 'Music could not be started. Use Play Music to try again.');
        });
    }
}

function toggleAudio() {
    const audio = document.getElementById('bgAudio');
    if (audio) {
        if (!audio.paused) {
            audio.pause();
            updateAudioControls(false);
        } else {
            startAudio();
        }
    }
}

/* RSVP Form Submission */
async function handleRSVPSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = document.getElementById('rsvpSubmitBtn');
    const btnText = document.getElementById('rsvpBtnText');
    const btnIcon = document.getElementById('rsvpBtnIcon');
    const loader = document.getElementById('rsvpLoader');
    const resultDiv = document.getElementById('rsvpResult');
    
    // UI state during submission
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
    btnText.innerText = 'Sending RSVP...';
    btnIcon.classList.add('hidden');
    loader.style.display = 'block';
    resultDiv.innerHTML = '';
    resultDiv.className = 'mt-3 text-sm text-center';
    
    const guestData = {
        name: document.getElementById('guestName').value.trim(),
        email: document.getElementById('guestEmail').value.trim(),
        attendance: document.getElementById('attendanceStatus').value,
        companions: parseInt(document.getElementById('guestCount').value) || 0,
        message: document.getElementById('guestWish').value.trim()
    };
    
    try {
        const response = await fetch('/api/rsvp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(guestData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Success state
            form.reset();
            form.style.display = 'none'; // hide form
            resultDiv.innerHTML = `
                <div class="text-gold-300 font-serif text-lg mb-2">Thank You ❤️</div>
                <p class="text-slate-300">Your RSVP has been received successfully.</p>
                <p class="text-slate-400 text-xs mt-1">We can't wait to celebrate with you.</p>
            `;
            // Fetch messages again to update the list immediately
            fetchLatestMessages();
        } else {
            throw new Error(data.error || 'Something went wrong');
        }
    } catch (error) {
        // Error state
        resultDiv.classList.add('text-red-400');
        resultDiv.innerText = 'Something went wrong. Please try again in a moment.';
        
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        btnText.innerText = 'Send RSVP';
        btnIcon.classList.remove('hidden');
        loader.style.display = 'none';
    }
}

/* Save to Calendar (.ics format) */
function saveToCalendar() {
    const title = encodeURIComponent("Wedding of Ahmed & Sherouk");
    const location = encodeURIComponent("White Plaza, Ramag Hotel, El-Mushir Tantawy Axis, 5th Settlement, New Cairo");
    const details = encodeURIComponent("Wedding celebration: 3:00–6:00 PM. Katb ElKetab: 3:30 PM. Capacity is limited to 200 guests; RSVP does not reserve a seat.\nGoogle Maps: https://share.google/FNLdm4Xul2ibjzvrU");
    
    // التوقيت بتوقيت UTC (الساعة 13:00 إلى 16:00 UTC تُعادل 3:00 إلى 6:00 مساءً بتوقيت القاهرة GMT+3)
    const startDate = "20261106T130000Z";
    const endDate = "20261106T160000Z";

    // فحص ما إذا كان المستخدم يفتح الموقع من جهاز آيفون / آيباد / ماك
    const isAppleDevice = /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent);

    if (isAppleDevice) {
        // إنشاء بيانات ICS وتمريرها عبر data URI لفتح تطبيق Apple Calendar مباشرة
        const rawTitle = "Wedding of Ahmed & Sherouk";
        const rawLocation = "White Plaza, Ramag Hotel, El-Mushir Tantawy Axis, 5th Settlement, New Cairo";
        const rawDetails = "Wedding celebration: 3:00–6:00 PM. Katb ElKetab: 3:30 PM. Capacity is limited to 200 guests; RSVP does not reserve a seat. Google Maps: https://share.google/FNLdm4Xul2ibjzvrU";
        
        const icsData = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Ahmed and Sherouk//Wedding Invitation//EN",
            "BEGIN:VEVENT",
            `SUMMARY:${rawTitle}`,
            `LOCATION:${rawLocation}`,
            `DESCRIPTION:${rawDetails}`,
            `DTSTART:${startDate}`,
            `DTEND:${endDate}`,
            "END:VEVENT",
            "END:VCALENDAR"
        ].join("\n");

        // فتح التقويم مباشرة على أجهزة أبل
        window.location.href = "data:text/calendar;charset=utf8," + encodeURIComponent(icsData);
    } else {
        // فتح صفحة إضافة الحدث مباشرة في Google Calendar لأجهزة أندرويد والكمبيوتر
        const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
        window.open(googleUrl, '_blank');
    }
}

/* Fetch Latest Guest Messages */


// Helper to escape HTML and prevent XSS
function escapeHtml(unsafe) {
    return (unsafe || "").replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// Fetch messages on load and setup polling
document.addEventListener('DOMContentLoaded', () => {
    fetchLatestMessages();
    // Poll for new messages every 30 seconds
    setInterval(fetchLatestMessages, 30000);
});
