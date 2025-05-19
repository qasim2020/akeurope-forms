require('dotenv').config();
const emailConfig = require('../config/emailConfig.js');
const path = require('path');
const fs = require('fs').promises;
const handlebars = require('handlebars');
const nodemailer = require('nodemailer');

const sendEmail = async (email, code) => {
    let transporter = nodemailer.createTransport(emailConfig);
    
    const templatePath = path.join(__dirname, '../views/emails/verificationEmail.handlebars');
    const templateSource = await fs.readFile(templatePath, 'utf8');
    const compiledTemplate = handlebars.compile(templateSource);
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Alkhidmat Europe - Verification Code',
        html: compiledTemplate({
            code
        }),
    };

    await transporter.sendMail(mailOptions);
}

module.exports = {
    sendEmail
}
