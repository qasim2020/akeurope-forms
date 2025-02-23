// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const twilio = require('twilio');
const OpenAI = require('openai');
const { engine } = require('express-handlebars');
const path = require('path');
require('dotenv').config();

const OrphanEnglish = require('./models/OrphanEnglish');
const OrphanArabic = require('./models/OrphanArabic');

const { generateFormFields } = require('./modules/generateFormFields');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3010;

// Configure middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

// Configure Handlebars
app.engine('handlebars', engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Twilio setup
// const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// OpenAI setup
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


app.use('/tabler', express.static(path.join(__dirname, 'node_modules', '@tabler', 'core', 'dist')));
app.use('/static', express.static(path.join(__dirname, 'static')));

app.get('/orphan-gaza', (req, res) => {
    // if (!req.session.verified) return res.redirect('/');
    const formFields = generateFormFields(OrphanArabic.schema, true);
    res.render('orphan-form', { 
        layout: 'main',  
        data: {
            formFields,
            rtl: true
        }
    });
});

// Route: Show phone verification page
app.get('/', (req, res) => {
    res.render('verify', { layout: 'main' });
});

// Route: Send verification code
app.post('/send-code', async (req, res) => {
    const { phone } = req.body;
    req.session.phone = phone;
    await twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SID)
        .verifications.create({ to: phone, channel: 'sms' });
    res.render('verify-code', { layout: 'main' });
});

// Route: Verify code
app.post('/verify-code', async (req, res) => {
    const { code } = req.body;
    const phone = req.session.phone;
    
    const verification = await twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SID)
        .verificationChecks.create({ to: phone, code });
    
    if (verification.status === 'approved') {
        req.session.verified = true;
        res.redirect('/form');
    } else {
        res.render('verify-code', { error: 'Invalid code. Try again.', layout: 'main' });
    }
});


// Route: Submit orphan form
app.post('/submit-orphan', async (req, res) => {
    if (!req.session.verified) return res.redirect('/');
    
    const { name, age, gender, description } = req.body;
    const prompt = `Translate this from Arabic to English: {name: '${name}', age: '${age}', gender: '${gender}', description: '${description}'}`;
    
    const response = await openai.completions.create({
        model: 'gpt-4-turbo',
        prompt,
        max_tokens: 100
    });
    
    const translated = JSON.parse(response.choices[0].text);
    
    const orphan = new Orphan({ name, age, gender, description, translated });
    await orphan.save();
    
    res.redirect('/success');
});

// Route: Success page
app.get('/success', (req, res) => {
    res.render('success', { layout: 'main' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});