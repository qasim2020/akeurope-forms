const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: false,
        },
        maxUploads: {
            type: Number,
            default: 4,
        },
        ipCountry: {
            type: String,
            required: false,
        },
        phoneNumber: {
            type: String,
            required: true,
            unique: true,
        },
        verified: {
            type: Boolean,
            default: false,
        },
        password: {
            type: String,
            required: false
        },
        projects: {
            type: [String],
            required: true
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'banned'],
            default: 'active'
        },
        resetPasswordToken: {
            type: String,
            unique: true,
            sparse: true
        },
        resetPasswordExpires: {
            type: Date,
            sparse: true
        },
        resetPasswordLink: {
            type: String,
            unique: true,
            sparse: true
        },
    },
    {
        collection: 'formUsers',
        timestamps: true
    },
);


userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (password) {
  if (this.password == undefined) return false;
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
