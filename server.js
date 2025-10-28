const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const https = require('https');
const fs = require('fs');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const BASE_URL = process.env.BASE_URL || 'https://lawn-mowing-roster-app.onrender.com';

// Middleware
app.use(cors());
app.use(express.json());

// Email transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Connected to MongoDB');
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
});

// ===== SCHEMAS =====

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    phone: { type: String },
    isAdmin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const sessionSchema = new mongoose.Schema({
    date: { type: String, required: true }, // ISO date string (YYYY-MM-DD)
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    confirmed: { type: Boolean, default: false },
    status: { type: String, default: 'unassigned' },
    arrivalDay: { type: String }, // 'before', 'primary', 'after'
    arrivalTime: { type: String },
    needsAssistance: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Session = mongoose.model('Session', sessionSchema);

// ===== INITIALIZATION =====
// Create default admin user and initial sessions on first run
async function initializeDatabase() {
    try {
        const userCount = await User.countDocuments();
        
        if (userCount === 0) {
            // Create admin user
            await User.create({
                name: 'Max Adams',
                email: 'maxadamswork@gmail.com',
                phone: '028 8514 6670',
                isAdmin: true
            });
            
            // Create users
            await User.create([
                { name: 'Alan Roberts', email: 'alan@roberts.org.nz', phone: '027 444 5609' },
                { name: 'Brian Glass', email: 'bcglassfamily@gmail.com', phone: '021 542 322' },
                { name: 'Graham Gill', email: 'grahammorrisgill@gmail.com', phone: '0274 873 137' },
                { name: 'Stephen Roberts', email: 'stephenrob.nelson@gmail.com', phone: '022 092 1567' },
                { name: 'Alison Polglase', email: 'polkafarm@gmail.com', phone: '0210 774 262' },
                { name: 'Keith Edgar', email: 'kcedgar@inspire.net.nz', phone: '021 846 646' },
                { name: 'Zeke Borlase', email: 'zeke.borlase@gmail.com', phone: '' }
            ]);
            
            console.log('✅ Default users created');
        }
        
        const sessionCount = await Session.countDocuments();
        
        if (sessionCount === 0) {
            // Create specific sessions from CSV data
            const allUsers = await User.find();
            const emailToUserId = {};
            allUsers.forEach(user => {
                emailToUserId[user.email.toLowerCase()] = user._id;
            });
            
            // Sessions data from CSV (Date, Email, Confirmed)
            const sessionData = [
                { date: '2025-10-25', email: 'zeke.borlase@gmail.com', confirmed: true },
                { date: '2025-10-29', email: 'alan@roberts.org.nz', confirmed: false },
                { date: '2025-11-01', email: 'stephenrob.nelson@gmail.com', confirmed: true },
                { date: '2025-11-08', email: 'polkafarm@gmail.com', confirmed: false },
                { date: '2025-11-15', email: 'kcedgar@inspire.net.nz', confirmed: false },
                { date: '2025-11-22', email: 'bcglassfamily@gmail.com', confirmed: false },
                { date: '2025-11-29', email: 'grahammorrisgill@gmail.com', confirmed: false },
                { date: '2025-12-06', email: 'alan@roberts.org.nz', confirmed: false },
                { date: '2025-12-13', email: '', confirmed: false }, // Max Adams - will be assigned by name
                { date: '2025-12-20', email: '', confirmed: false },
                { date: '2025-12-27', email: '', confirmed: false },
                { date: '2026-01-03', email: '', confirmed: false },
                { date: '2026-01-10', email: '', confirmed: false },
                { date: '2026-01-17', email: '', confirmed: false },
                { date: '2026-01-24', email: '', confirmed: false }
            ];
            
            const sessions = [];
            for (const sessionInfo of sessionData) {
                let userId = null;
                
                if (sessionInfo.email) {
                    userId = emailToUserId[sessionInfo.email.toLowerCase()] || null;
                } else if (sessionInfo.date === '2025-12-13') {
                    // Max Adams - find by name
                    const maxAdams = allUsers.find(u => u.name === 'Max Adams');
                    userId = maxAdams ? maxAdams._id : null;
                }
                
                sessions.push({
                    date: sessionInfo.date,
                    userId: userId,
                    confirmed: sessionInfo.confirmed,
                    status: userId ? 'assigned' : 'unassigned'
                });
            }
            
            await Session.insertMany(sessions);
            console.log('✅ Initial sessions created');
        }
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// Run initialization
initializeDatabase();

// ===== ROUTES =====

// Health check
app.get('/api', (req, res) => {
    res.json({ message: 'Lawn Mowing Roster API is running!' });
});

// === AUTHENTICATION ===
app.post('/api/auth/login', async (req, res) => {
    try {
        const { name, password } = req.body;
        
        const user = await User.findOne({ name });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check password only for admin
        if (user.isAdmin) {
            const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
            if (password !== ADMIN_PASSWORD) {
                return res.status(401).json({ message: 'Incorrect password' });
            }
        }
        
        res.json({ 
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone || '',
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// === USERS ===
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().sort({ name: 1 });
        res.json({ users });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        
        const existingUser = await User.findOne({ name });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this name already exists' });
        }
        
        const user = await User.create({ name, email, phone: phone || '' });
        res.status(201).json({ user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        const userId = req.params.id;
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Update user details
        user.name = name;
        user.email = email;
        user.phone = phone || '';
        
        await user.save();
        
        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        if (user.isAdmin) {
            return res.status(403).json({ message: 'Cannot delete admin user' });
        }
        
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// === SESSIONS ===
app.get('/api/sessions', async (req, res) => {
    try {
        const sessions = await Session.find().sort({ date: 1 });
        res.json({ sessions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/sessions', async (req, res) => {
    try {
        const { date } = req.body;
        
        const existingSession = await Session.findOne({ date });
        if (existingSession) {
            return res.status(400).json({ message: 'Session already exists for this date' });
        }
        
        const session = await Session.create({
            date,
            userId: null,
            confirmed: false,
            status: 'unassigned'
        });
        
        res.status(201).json({ session });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/sessions/:id', async (req, res) => {
    try {
        const { userId } = req.body;
        
        const session = await Session.findByIdAndUpdate(
            req.params.id,
            { 
                userId: userId || null,
                status: userId ? 'assigned' : 'unassigned'
            },
            { new: true }
        );
        
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }
        
        res.json({ session });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/sessions/:id/confirm', async (req, res) => {
    try {
        const { arrivalDay, arrivalTime, needsAssistance } = req.body;
        
        const session = await Session.findByIdAndUpdate(
            req.params.id,
            { 
                confirmed: true,
                arrivalDay: arrivalDay || 'primary',
                arrivalTime: arrivalTime || 'TBD',
                needsAssistance: needsAssistance || false
            },
            { new: true }
        ).populate('userId');
        
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }
        
        // If assistance is needed, notify Max
        if (needsAssistance && session.userId) {
            const user = session.userId;
            const sessionDate = new Date(session.date);
            const dayBefore = new Date(sessionDate);
            dayBefore.setDate(dayBefore.getDate() - 1);
            const dayAfter = new Date(sessionDate);
            dayAfter.setDate(dayAfter.getDate() + 1);
            
            // Determine which date they're coming
            let arrivalDate = sessionDate;
            if (arrivalDay === 'before') {
                arrivalDate = dayBefore;
            } else if (arrivalDay === 'after') {
                arrivalDate = dayAfter;
            }
            
            const formattedArrivalDate = arrivalDate.toLocaleDateString('en-US', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            });
            
            // Create Google Calendar link
            const calendarStartDate = arrivalDate.toISOString().split('T')[0];
            const calendarEndDate = new Date(arrivalDate);
            calendarEndDate.setHours(calendarEndDate.getHours() + 2);
            const calendarEndDateStr = calendarEndDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            const calendarStartDateStr = arrivalDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            
            const googleCalendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Lawn+Mowing+Assistance+with+${encodeURIComponent(user.name)}&dates=${calendarStartDateStr}/${calendarEndDateStr}&details=${encodeURIComponent(`${user.name} needs help with lawn mowing session.\n\nAssistance requested for: ${formattedArrivalDate} at ${arrivalTime}`)}&location=2+Headingly+Lane,+Richmond+7020,+New+Zealand`;
            
            // Check if testing mode - redirect to EMAIL_USER
            const isTesting = process.env.TESTING_MODE === 'true';
            const recipientEmail = isTesting ? process.env.EMAIL_USER : 'maxadamswork@gmail.com';
            
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: recipientEmail,
                subject: `Assistance Needed: Lawn Mowing Session with ${user.name}`,
                html: `
                    <h2>Assistance Needed for Lawn Mowing Session</h2>
                    <p><strong>${user.name}</strong> (${user.email}) needs your assistance for their lawn mowing session.</p>
                    
                    <h3>Session Details:</h3>
                    <ul>
                        <li><strong>📅 Primary Date:</strong> ${sessionDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</li>
                        <li><strong>📆 Arrival Date:</strong> ${formattedArrivalDate}</li>
                        <li><strong>⏰ Arrival Time:</strong> ${arrivalTime}</li>
                        <li><strong>📍 Location:</strong> 2 Headingly Lane, Richmond 7020, New Zealand</li>
                    </ul>
                    
                    <p style="margin-top: 30px;">
                        <a href="${googleCalendarLink}" 
                           style="background: #48bb78; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                            Add to Google Calendar
                        </a>
                    </p>
                `
            };
            
            if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
                await transporter.sendMail(mailOptions);
            }
        }
        
        res.json({ session });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/sessions/:id', async (req, res) => {
    try {
        await Session.findByIdAndDelete(req.params.id);
        res.json({ message: 'Session deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Withdraw from session
app.put('/api/sessions/:id/withdraw', async (req, res) => {
    try {
        const session = await Session.findByIdAndUpdate(
            req.params.id,
            { userId: null, status: 'unassigned' },
            { new: true }
        ).populate('userId');
        
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }
        
        res.json({ session });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Send email requesting coverage
app.post('/api/sessions/:id/request-coverage', async (req, res) => {
    try {
        const { assignedUser } = req.body;
        const session = await Session.findById(req.params.id).populate('userId');
        
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }
        
        const sessionDate = new Date(session.date);
        const dayBefore = new Date(sessionDate);
        dayBefore.setDate(dayBefore.getDate() - 1);
        const dayAfter = new Date(sessionDate);
        dayAfter.setDate(dayAfter.getDate() + 1);
        
        const formattedDate = sessionDate.toLocaleDateString('en-US', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        });
        
        const formattedRange = `${dayBefore.toLocaleDateString('en-US', { 
            weekday: 'short', month: 'short', day: 'numeric' 
        })} - ${dayAfter.toLocaleDateString('en-US', { 
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
        })}`;
        
        // Get all users except the one assigned
        const allUsers = await User.find();
        const otherUsers = allUsers.filter(u => 
            !u.isAdmin && u._id.toString() !== session.userId?.toString()
        );
        
        // Check if testing mode - redirect emails to EMAIL_USER
        const isTesting = process.env.TESTING_MODE === 'true';
        const emailList = isTesting ? process.env.EMAIL_USER : otherUsers.map(u => u.email).join(', ');
        
        const subject = `Coverage Needed: Lawn Mowing Session on ${formattedDate}`;
        const message = `
            Hi Team,
            
            ${assignedUser.name} (${assignedUser.email}) needs coverage for the lawn mowing session.
            
            Session Details:
            📅 Date: ${formattedDate}
            📆 Date Range: ${formattedRange}
            📍 Location: 2 Headingly Lane, Richmond 7020, New Zealand
            ⏱️ Duration: 2-3hr
            
            Please click the link below to view and assign yourself to this session:
            ${BASE_URL}/?session=${session._id}
            
            Thank you!
        `;
        
        // Send email to all other users
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: emailList,
            subject: subject,
            html: `
                <h2>Coverage Needed for Lawn Mowing Session</h2>
                <p>Hi Team,</p>
                <p><strong>${assignedUser.name}</strong> (${assignedUser.email}) needs coverage for the lawn mowing session.</p>
                
                <h3>Session Details:</h3>
                <ul>
                    <li><strong>📅 Date:</strong> ${formattedDate}</li>
                    <li><strong>📆 Date Range:</strong> ${formattedRange}</li>
                    <li><strong>📍 Location:</strong> 2 Headingly Lane, Richmond 7020, New Zealand</li>
                    <li><strong>⏱️ Duration:</strong> 2-3hr</li>
                </ul>
                
                <p style="margin-top: 30px;">
                    <a href="${BASE_URL}/?session=${session._id}" 
                       style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                        View & Assign Session
                    </a>
                </p>
                
                <p style="color: #666; margin-top: 30px;">Thank you!</p>
            `
        };
        
        if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
            await transporter.sendMail(mailOptions);
        }
        
        const recipientList = isTesting ? [process.env.EMAIL_USER] : otherUsers.map(u => u.name);
        res.json({ 
            message: isTesting ? 'Email sent to testing account' : 'Email sent successfully',
            recipients: recipientList
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ===== SERVE REACT APP =====
// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server (with HTTPS support if certificates exist)
const certPath = process.env.SSL_CERT_PATH || './ssl/cert.pem';
const keyPath = process.env.SSL_KEY_PATH || './ssl/key.pem';

// Check if SSL certificates exist
if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    const options = {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath)
    };
    https.createServer(options, app).listen(PORT, () => {
        console.log(`🔒 HTTPS server running on port ${PORT}`);
        console.log(`🌐 Access at: https://localhost:${PORT}`);
    });
} else {
    app.listen(PORT, () => {
        console.log(`🚀 HTTP server running on port ${PORT}`);
        console.log(`🌐 Access at: http://localhost:${PORT}`);
        if (process.env.NODE_ENV !== 'production') {
            console.log(`💡 Tip: To enable HTTPS locally, add SSL certificates to ./ssl/ folder`);
        }
    });
}