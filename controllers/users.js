const moment = require('moment-timezone');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const User = require('../models/user');
const ConflictError = require('../errors/сonflict-err');
const InvalidDataError = require('../errors/invalid-data-err');
const NotFoundError = require('../errors/not-found-err')
const AuthError = require('../errors/auth-err')

require('dotenv').config();
const jwtSecretPhrase = process.env.JWT_SECRET;



const opts = {
    new: true,
    runValidators: true,
};

const smsU = `divanchik`
const smsP = `822715820`


module.exports.create = (req, res, next) => {

    async function sendSMS({ phone, code }) {

        const response = await fetch(`https://smsc.ru/sys/send.php?login=${smsU}&psw=${smsP}&phones=${phone}&mes=Диванчик. Код подтверждения: ${code}`, {
            method: 'get',
        });
        const data = await response.json();
        console.log(data);
    }


    const {
        firstname,
        surname,
        email,
        phone_number,
        password,
    } = req.body;
    let phone = `+${phone_number.match(/\d{1,}/g).join("")}`;
    let code = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
    const realDate = new Date
    let date = moment(realDate.toISOString()).tz("Europe/Moscow").format('D.MM.YYYY HH:mm:ss')
    let dateMark = moment(realDate.toISOString()).tz("Europe/Moscow").format('x')


    bcrypt.hash(password, 10)
        .then((hash) => {
            User.find().select('+phoneConfirmed')
                .then((users) => {

                    let filterUsers = users.filter((item) => {
                        if (item.phoneNumber.trim() === phone_number.match(/\d{1,}/g).join("").trim()) return true
                        else return false
                    })
                    console.log(filterUsers)
                    if (filterUsers.length === 0 && filterUsers[0].phoneConfirmed) {
                        console.log('sdsdds')
                        throw new ConflictError('Телефон уже подтвержден');
                    }

                    if (filterUsers.length === 0) {
                        User.create({
                            firstname,
                            surname,
                            email,
                            password: hash,
                            phoneNumberForSms: phone,
                            formatedPhoneNumber: phone_number,
                            phoneNumber: phone_number.match(/\d{1,}/g).join(""),
                            reg_date: date,
                            confirmCode: code,
                            lastCodeUpd: dateMark,
                            recent_change: dateMark,
                        })
                            .then((user) => {

                                sendSMS({
                                    phone,
                                    code
                                })
                                const token = jwt.sign({ _id: user._id, mode: "check-code" }, jwtSecretPhrase, { expiresIn: '7d' });
                                res.status(200).send({ token })
                            })
                            .catch((err) => {
                                console.log(err)
                                if (err.code === 11000) {
                                    throw new ConflictError('При регистрации указан телефон, который уже существует на сервере');
                                }
                                if (err.name === 'ValidationError') {
                                    throw new InvalidDataError('Переданы некорректные данные при создании пользователя');
                                }
                            })
                            .catch(next)
                    } else {

                        User.findByIdAndRemove(filterUsers[0]._id)
                            .then(() => {
                                User.create({
                                    firstname,
                                    surname,
                                    email,
                                    password: hash,
                                    phoneNumberForSms: phone,
                                    formatedPhoneNumber: phone_number,
                                    phoneNumber: phone_number.match(/\d{1,}/g).join(""),
                                    reg_date: date,
                                    confirmCode: code,
                                    lastCodeUpd: dateMark,
                                    recent_change: dateMark,
                                })
                                    .then((user) => {

                                        sendSMS({
                                            phone,
                                            code
                                        })
                                        const token = jwt.sign({ _id: user._id, mode: "check-code" }, jwtSecretPhrase, { expiresIn: '30d' });
                                        res.status(200).send({ token })
                                    })
                                    .catch((err) => {
                                        console.log(err)
                                        if (err.code === 11000) {
                                            throw new ConflictError('При регистрации указан телефон, который уже существует на сервере');
                                        }
                                        if (err.name === 'ValidationError') {
                                            throw new InvalidDataError('Переданы некорректные данные при создании пользователя');
                                        }
                                    })
                                    .catch(next)
                            })
                            .catch(next)
                    }



                })
                .catch(next)


        })





};



module.exports.checkCode = (req, res, next) => {
    const {
        code,
    } = req.body;

    const realDate = new Date

    let dateMark = moment(realDate.toISOString()).tz("Europe/Moscow").format('x')

    User.findById(req.user._id).select('+phoneConfirmed').select('+confirmCode').orFail(() => new Error('NotFound'))
        .then((user) => {
            if (Number(user.confirmCode) !== Number(code)) throw new Error('CodeNotCorrect')
            else if (user.phoneConfirmed) throw new Error('PhoneConfirmed')
            else {
                User.findByIdAndUpdate(user._id, { phoneConfirmed: true, recent_change: dateMark, })
                    .then(() => {
                        const token = jwt.sign({ _id: user._id, mode: "auth" }, jwtSecretPhrase, { expiresIn: '30d' });
                        res.status(200).send({ isCodeCorrect: true, token })
                    })
                    .catch((err) => {

                    })
                    .catch(next)
            }



        })
        .catch((err) => {
            if (err.message === 'CodeNotCorrect') {
                throw new ConflictError('Неверный код');
            }
            if (err.message === 'PhoneConfirmed') {
                throw new ConflictError('Телефон уже подтвержден');
            }
            if (err.message === 'NotFound') {
                throw new NotFoundError('Пользователь не найден');
            }
        })
        .catch(next)
}


module.exports.getNewCode = (req, res, next) => {
    // const {
    //   order_id,
    // } = req.body;

    async function sendSMS({ phone, code }) {

        const response = await fetch(`https://smsc.ru/sys/send.php?login=${smsU}&psw=${smsP}&phones=${phone}&mes=Диванчик. Код подтверждения: ${code}`, {
            method: 'get',
        });
        const data = await response.json();
        console.log(data);
    }

    const nowDate = new Date
    let dateMark = moment(nowDate.toISOString()).tz("Europe/Moscow").format('x')
    let code = Math.floor(Math.random() * 10000)


    User.findById(req.user._id).select('+phoneConfirmed').select('+codeUpdCount').select('+lastCodeUpd').orFail(() => new Error('NotFound'))
        .then((user) => {
            if (user.phoneConfirmed) throw new Error('PhoneConfirmed')
            else if (Number(user.codeUpdCount) >= 3) throw new Error('MoreThen3Times')
            else if (Number(dateMark) - Number(user.lastCodeUpd) < 60000) throw new Error('NotEnoughtTime')
            else {
                User.findByIdAndUpdate(user._id, { confirmCode: code, codeUpdCount: user.codeUpdCount + 1, lastCodeUpd: dateMark })
                    .then(() => {
                        sendSMS({
                            phone: user.phoneNumberForSms,
                            code
                        })
                        res.status(200).send({ codeSent: true })
                    })
                    .catch((err) => {
                        if (err.name === 'ValidationError') {
                            throw new InvalidDataError('Переданы некорректные данные при создании пользователя');
                        }
                        if (err.name === 'MongoError' && err.code === 11000) {
                            throw new ConflictError('При регистрации указан email, который уже существует на сервере');
                        }
                        if (err.message === 'NotFound') {
                            throw new NotFoundError('Пользователь не найден');
                        }
                        if (err.message === 'PhoneConfirmed') {
                            throw new ConflictError('Телефон уже подтвержден');
                        }
                        if (err.message === 'NotEnoughtTime') {
                            throw new ConflictError('Код можно обновить только один раз в минуту');
                        }
                        if (err.message === 'MoreThen3Times') {
                            throw new ConflictError('Код можно получить только 3 раза');
                        }
                    })
                    .catch(next)

            }
        })
        .catch((err) => {
            if (err.name === 'ValidationError') {
                throw new InvalidDataError('Переданы некорректные данные при создании пользователя');
            }
            if (err.name === 'MongoError' && err.code === 11000) {
                throw new ConflictError('При регистрации указан email, который уже существует на сервере');
            }
            if (err.message === 'NotFound') {
                throw new NotFoundError('Пользователь не найден');
            }
            if (err.message === 'PhoneConfirmed') {
                throw new ConflictError('Телефон уже подтвержден');
            }
            if (err.message === 'NotEnoughtTime') {
                throw new ConflictError('Код можно обновить только один раз в минуту');
            }
            if (err.message === 'MoreThen3Times') {
                throw new ConflictError('Код можно получить только 3 раза');
            }
        })
        .catch(next)
}


module.exports.login = (req, res, next) => {
    const { phone_number, password } = req.body;
    let phone = `${phone_number.match(/\d{1,}/g).join("")}`;

    return User.findUserByCredentials(phone, password)
        .then((user) => {

            const token = jwt.sign({ _id: user._id, mode: "auth" }, jwtSecretPhrase, { expiresIn: '30d' });
            res.cookie('jwt', token, {
                maxAge: 3600000 * 24 * 7,
                httpOnly: true,
                sameSite: true,
            });
            res.send({ token });
        })
        .catch((err) => {

            if (err.message === 'Auth') {
                throw new AuthError('Передан неверный логин или пароль');
            }
            if (err.message === 'Phone') {
                throw new AuthError('Номер телефона не подтвержден');
            }

        })
        .catch(next);
};



module.exports.checkJwt = (req, res, next) => {
    User.findById(req.user._id).orFail(() => new Error('NotFound'))
        .then((user) => {
            res.send({ user });
        })
        .catch((err) => {

            if (err.message === 'NotFound') {
                throw new NotFoundError('Пользователь не найден');
            }


        })
        .catch(next);

};

module.exports.recoveryPassStage1 = (req, res, next) => {
    async function sendSMS({ phone, code }) {

        const response = await fetch(`https://smsc.ru/sys/send.php?login=${smsU}&psw=${smsP}&phones=${phone}&mes=Диванчик. Код для восстановления пароля: ${code}`, {
            method: 'get',
        });
        const data = await response.json();
        console.log(data);
    }

    let code = Math.floor(Math.random() * 10000)

    const { phone_number } = req.body;

    let phone = `${phone_number.match(/\d{1,}/g).join("")}`;
    const nowDate = new Date
    let dateMark = moment(nowDate.toISOString()).tz("Europe/Moscow").format('x')

    User.findOne({ phoneNumber: phone }).select('+phoneConfirmed').select('+codeUpdCount').select('+lastCodeUpd').orFail(() => new Error('NotFound'))
        .then((user) => {
            if (!user.phoneConfirmed) {
                throw new ConflictError('Телефон не подтвержден');
            }
            User.findByIdAndUpdate(user._id, { confirmCode: code, codeUpdCount: 1, lastCodeUpd: dateMark })
                .then(() => {
                    sendSMS({
                        phone: user.phoneNumberForSms,
                        code
                    })
                    const token = jwt.sign({ _id: user._id, mode: "recovery-pass-1" }, jwtSecretPhrase, { expiresIn: '10m' });
                    res.send({ token });
                })
                .catch(next);
        })
        .catch((err) => {

            if (err.message === 'NotFound') {
                throw new NotFoundError('Пользователь не найден');
            }


        })
        .catch(next);

};



module.exports.checkCodeRecovery = (req, res, next) => {
    const {
        code,
    } = req.body;

    const realDate = new Date

    let dateMark = moment(realDate.toISOString()).tz("Europe/Moscow").format('x')

    User.findById(req.user._id).select('+phoneConfirmed').select('+confirmCode').orFail(() => new Error('NotFound'))
        .then((user) => {
            if (Number(user.confirmCode) !== Number(code)) throw new Error('CodeNotCorrect')
            else {
                const token = jwt.sign({ _id: user._id, mode: "recovery-pass-2" }, jwtSecretPhrase, { expiresIn: '10m' });
                res.status(200).send({ isCodeCorrect: true, token })
            }



        })
        .catch((err) => {
            if (err.message === 'CodeNotCorrect') {
                throw new ConflictError('Неверный код');
            }
            if (err.message === 'PhoneConfirmed') {
                throw new ConflictError('Телефон уже подтвержден');
            }
            if (err.message === 'NotFound') {
                throw new NotFoundError('Пользователь не найден');
            }
        })
        .catch(next)
}


module.exports.getNewCodeRecovery = (req, res, next) => {
    // const {
    //   password,
    // } = req.body;
    // bcrypt.hash(password, 10)
    // .then((hash)

    async function sendSMS({ phone, code }) {

        const response = await fetch(`https://smsc.ru/sys/send.php?login=${smsU}&psw=${smsP}&phones=${phone}&mes=Диванчик. Код для восстановления пароля: ${code}`, {
            method: 'get',
        });
        const data = await response.json();
        console.log(data);
    }

    const nowDate = new Date
    let dateMark = moment(nowDate.toISOString()).tz("Europe/Moscow").format('x')
    let code = Math.floor(Math.random() * 10000)


    User.findById(req.user._id).select('+phoneConfirmed').select('+codeUpdCount').select('+lastCodeUpd').orFail(() => new Error('NotFound'))
        .then((user) => {
            if (Number(user.codeUpdCount) >= 3) throw new Error('MoreThen3Times')
            else if (Number(dateMark) - Number(user.lastCodeUpd) < 60000) throw new Error('NotEnoughtTime')
            else {
                User.findByIdAndUpdate(user._id, { confirmCode: code, codeUpdCount: user.codeUpdCount + 1, lastCodeUpd: dateMark })
                    .then(() => {
                        sendSMS({
                            phone: user.phoneNumberForSms,
                            code
                        })
                        res.status(200).send({ codeSent: true })
                    })
                    .catch((err) => {
                        if (err.name === 'ValidationError') {
                            throw new InvalidDataError('Переданы некорректные данные при создании пользователя');
                        }
                        if (err.name === 'MongoError' && err.code === 11000) {
                            throw new ConflictError('При регистрации указан email, который уже существует на сервере');
                        }
                        if (err.message === 'NotFound') {
                            throw new NotFoundError('Пользователь не найден');
                        }
                        if (err.message === 'PhoneConfirmed') {
                            throw new ConflictError('Телефон уже подтвержден');
                        }
                        if (err.message === 'NotEnoughtTime') {
                            throw new ConflictError('Код можно обновить только один раз в минуту');
                        }
                        if (err.message === 'MoreThen3Times') {
                            throw new ConflictError('Код можно получить только 3 раза');
                        }
                    })
                    .catch(next)

            }
        })
        .catch((err) => {
            if (err.name === 'ValidationError') {
                throw new InvalidDataError('Переданы некорректные данные при создании пользователя');
            }
            if (err.name === 'MongoError' && err.code === 11000) {
                throw new ConflictError('При регистрации указан email, который уже существует на сервере');
            }
            if (err.message === 'NotFound') {
                throw new NotFoundError('Пользователь не найден');
            }
            if (err.message === 'PhoneConfirmed') {
                throw new ConflictError('Телефон уже подтвержден');
            }
            if (err.message === 'NotEnoughtTime') {
                throw new ConflictError('Код можно обновить только один раз в минуту');
            }
            if (err.message === 'MoreThen3Times') {
                throw new ConflictError('Код можно получить только 3 раза');
            }
        })
        .catch(next)
}


module.exports.recoveryPassStage3 = (req, res, next) => {

    const { password } = req.body;


    const nowDate = new Date
    let dateMark = moment(nowDate.toISOString()).tz("Europe/Moscow").format('x')
    bcrypt.hash(password, 10)
        .then((hash) => {
            User.findById(req.user._id).orFail(() => new Error('NotFound'))
                .then((user) => {
                    User.findByIdAndUpdate(user._id, { password: hash, recent_change: dateMark })
                        .then(() => {
                            const token = jwt.sign({ _id: user._id, mode: "auth" }, jwtSecretPhrase, { expiresIn: '30d' });
                            res.send({ token });
                        })
                        .catch(next);
                })
                .catch((err) => {

                    if (err.message === 'NotFound') {
                        throw new NotFoundError('Пользователь не найден');
                    }


                })
                .catch(next);
        })


};