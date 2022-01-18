const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const AuthError = require('../errors/auth-err');
// Опишем схему:
const userSchema = new mongoose.Schema({
    phone_number: {
        type: String,
        required: true,
        unique: true,
    },
    user_rights: {
        type: String,
        minlength: 2,
        maxlength: 30,
        default: 'default',
        select: false,
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
    },
    confirmCode: {
        type: Number,
        required: true,
    },
    lastCodeUpd: {
        type: String,
        required: true,
    },
    codeUpdCount: {
        type: Number,
        required: true,
        default: 1,
    },
    phoneConfirmed: {
        type: Boolean,
        required: true,
        default: false,
    },
});



userSchema.statics.findUserByCredentials = function (phone, password) {
    return this.findOne({ phone_number: phone }).select('+password')
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
