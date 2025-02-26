const express = require('express');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const session = require('express-session');
const twilio = require('twilio');
const OpenAI = require('openai');
const { engine } = require('express-handlebars');
const exphbs = require('express-handlebars');
const path = require('path');
require('dotenv').config();

const OrphanEnglish = require('./models/OrphanEnglish');
const OrphanArabic = require('./models/OrphanArabic');
const User = require('./models/User');

const { generateFormFields } = require('./modules/generateFormFields');
const hbsHelpers = require('./modules/helpers');
const { sendErrorToTelegram } = require('./modules/telegramBot');

const uploadRoutes = require('./routes/uploadRoutes');
const entryRoutes = require('./routes/entryRoutes');

const app = express();
const PORT = process.env.PORT || 3010;

app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json({ limit: '50mb' }));
app.use(
    session({
        name: 'akeurope-forms-id',
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI,
            collectionName: 'sessions',
        }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 3,
        },
    }),
);

app.use(express.static(path.join(__dirname, 'static')));

app.engine('handlebars', engine({ defaultLayout: 'main' }));
app.engine('handlebars', exphbs.engine({ helpers: hbsHelpers }));
app.set('view engine', 'handlebars');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use('/tabler', express.static(path.join(__dirname, 'node_modules', '@tabler', 'core', 'dist')));
app.use('/static', express.static(path.join(__dirname, 'static')));

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    console.log(req.originalUrl);
    let oldSend = res.send;
    let oldJson = res.json;

    let responseBody;

    res.send = function (data) {
        responseBody = data;
        return oldSend.apply(res, arguments);
    };

    res.json = function (data) {
        responseBody = data;
        return oldJson.apply(res, arguments);
    };

    res.on('finish', () => {
        if (res.statusCode > 399) {
            const errorData = {
                message: responseBody,
                status: res.statusCode,
                url: req.originalUrl,
            };

            sendErrorToTelegram(errorData);
        }
    });
    next();
});

app.use(uploadRoutes);
app.use(entryRoutes);

app.get('/new-orphan', async (req, res) => {
    try {
        if (!req.session.verified) return res.redirect('/');
        const uploadsCount = await OrphanArabic.countDocuments({ 'uploadedBy.actorId': req.session.user._id });
        if (uploadsCount >= req.session.user.maxUploads)
            throw new Error('You have reached your limit. Please contact admins for changes.');
        const entryId = new mongoose.Types.ObjectId();
        const entry = new OrphanArabic({
            _id: entryId,
            uploadedBy: {
                actorType: 'user',
                actorId: req.session.user._id,
                actorUrl: `/user/${req.session.user._id}`,
            },
        });
        await entry.save();
        res.redirect(`/orphan/${entryId}`);
    } catch (error) {
        res.render('error', {
            layout: 'main',
            error: error.message,
        });
    }
});

app.get('/orphan/:entryId', async (req, res) => {
    try {
        if (!req.session.verified) return res.redirect('/');
        const entry = await OrphanArabic.findById(req.params.entryId).lean();
        const formFields = generateFormFields(OrphanArabic.schema, entry, true);
        const uploads = await OrphanArabic.find({ 'uploadedBy.actorId': req.session.user._id }).lean();
        res.render('form', {
            layout: 'main',
            data: {
                uploads,
                formFields,
                rtl: true,
                entryId: entry._id,
                remaining: req.session.user.maxUploads - uploads.length
            },
        });
    } catch (error) {
        res.render('error', {
            layout: 'main',
            error: error.message,
        });
    }
});

app.get('/', async (req, res) => {
    if (!req.session.user) return res.render('verify', { layout: 'main' });

    const latestOrphan = await OrphanArabic.findOne({ 'uploadedBy.actorId': req.session.user._id })
        .sort({ updatedAt: -1 });

    if (!latestOrphan) return res.redirect(`/new-orphan`);

    res.redirect(`/orphan/${latestOrphan._id}`);
});

app.post('/send-code', async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) throw new Error('Phone is required');

        req.session.phone = phone.trim().replace(/\s+/g, '');

        await twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SID)
            .verifications.create({ to: req.session.phone, channel: 'sms' });

        res.status(200).send('Code sent!');
    } catch (error) {
        console.log(error);
        res.status(400).send(error.message);
    }
});

app.post('/verify-code', async (req, res) => {
    try {
        const { code, name } = req.body;
        const phone = req.session.phone;

        if (!phone) throw new Error('Phone is required');

        const verification = await twilioClient.verify.v2
            .services(process.env.TWILIO_VERIFY_SID)
            .verificationChecks.create({ to: phone, code });

        if (verification.status === 'approved') {
            const user = await User.findOneAndUpdate(
                { phoneNumber: phone },
                { name, phoneNumber: phone, verified: true, maxUploads: 10 },
                { upsert: true, new: true, lean: true },
            );
            req.session.verified = true;
            req.session.user = user;
            res.status(200).send('verified');
        } else {
            res.status(300).send('Invalid code, try again');
        }
    } catch (error) {
        console.log(error);
        res.status(error.status).send(error.message);
    }
});

app.get('/logout', (req, res) => {
    if (req.session.user) {
        req.session.destroy((err) => {
            if (err) console.error(err);
            res.redirect('/');
        });
    } else {
        res.redirect('/');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
