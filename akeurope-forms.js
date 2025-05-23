const express = require('express');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const session = require('express-session');
const { engine } = require('express-handlebars');
const exphbs = require('express-handlebars');
const path = require('path');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Forms MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

const portalConnection = mongoose.createConnection(process.env.MONGO_URI_PORTAL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

portalConnection.on('connected', () => {
    console.log('Portal MongoDB connected');
});

global.portalConnection = portalConnection;

const hbsHelpers = require('./modules/helpers');
const { sendErrorToTelegram } = require('./modules/telegramBot');

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

    const forbiddenErrors = ['/overlay/fonts/Karla-regular.woff', '/robots.txt'];

    res.on('finish', () => {
        if (res.statusCode > 399 && !forbiddenErrors.includes(req.originalUrl)) {
            const errorData = {
                message: responseBody,
                status: res.statusCode,
                url: req.originalUrl,
            };
            console.log(errorData);
        }
    });

    next();
});

const uploadRoutes = require('./routes/uploadRoutes');
const entryRoutes = require('./routes/entryRoutes');
const authRoutes = require('./routes/authRoutes');
const orphanRoutes = require('./routes/orphanRoutes');
const familyRoutes = require('./routes/familyRoutes');


app.use(uploadRoutes);
app.use(entryRoutes);
app.use(authRoutes);
app.use(orphanRoutes);
app.use(familyRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
