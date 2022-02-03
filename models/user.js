const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const AuthError = require('../errors/auth-err');
// Опишем схему:
const userSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
    },
    formatedPhoneNumber: {
        type: String,
        required: true,
    },
    phoneNumberForSms:{
        type: String,
        required: true,
    },
    user_rights: {
        type: String,
        minlength: 2,
        maxlength: 30,
        default: 'default',
        select: false,
        required: true,
    },
    firstname: {
        type: String,
        required: true,
    },
    surname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator(v) {
                return validator.isEmail(v);
            },
        },
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    reg_date: {
        type: String,
        required: true,
        select: false,
    },
    order_history: [{
        order_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'order'
        },
        date: {
            type: String,
        },
    }
    ],
    recent_change: {
        type: String,
        select: false,
    },
    confirmCode: {
        type: Number,
        required: true,
        select: false,
    },
    lastCodeUpd: {
        type: String,
        required: true,
        select: false,
    },
    codeUpdCount: {
        type: Number,
        required: true,
        default: 1,
        select: false,
    },
    phoneConfirmed: {
        type: Boolean,
        required: true,
        default: false,
        select: false,
    },
});



userSchema.statics.findUserByCredentials = function (phone, password) {
    return this.findOne({ phoneNumber: phone }).select('+password').select('+phoneConfirmed')
        .then((user) => {
            if (!user) {
                return Promise.reject(new Error('Auth'));
            }
            if (!user.phoneConfirmed) {
                return Promise.reject(new Error('Phone'));
            }

            return bcrypt.compare(password, user.password)
                .then((matched) => {
                    if (!matched) {
                        return Promise.reject(new Error('Auth'));
                    }

                    return user; // теперь user доступен
                });
        });
};

// создаём модель и экспортируем её
module.exports = mongoose.model('user', userSchema);
