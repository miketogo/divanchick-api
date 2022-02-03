const router = require('express').Router();
const { celebrate, Joi } = require('celebrate');
const {
    checkJwt, recoveryPassStage1, checkCode, getNewCode, create, login, getNewCodeRecovery, checkCodeRecovery, recoveryPassStage3
} = require('../controllers/users');

const auth = require('../middlewares/auth')
const checkCodeAuth = require('../middlewares/checkCodeAuth')
const recoveryPassAuthStage1 = require('../middlewares/recoveryPassAuthStage1')
const recoveryPassAuthStage2 = require('../middlewares/recoveryPassAuthStage2')

router.post('/signup', celebrate({
    body: Joi.object().keys({
        email: Joi.string().min(3).required(),
        password: Joi.string().min(8).required(),
        firstname: Joi.string().min(1).required(),
        surname: Joi.string().min(1).required(),
        phone_number: Joi.string().min(11).required(),
    }),
}), create);

router.post('/signin', celebrate({
    body: Joi.object().keys({
        phone_number: Joi.string().min(11).required(),
        password: Joi.string().min(8).required(),
    })
}), login);

router.post('/signup-code', celebrate({
    body: Joi.object().keys({
        code: Joi.string().min(4).max(4).required(),
    }),
}), checkCodeAuth, checkCode);

router.get('/signup-new-code', checkCodeAuth, getNewCode);

router.get('/check-jwt', auth, checkJwt);

router.post('/recovery-pass-stage-1', celebrate({
    body: Joi.object().keys({
        phone_number: Joi.string().min(11).required(),
    })
}), recoveryPassStage1)

router.post('/recovery-code', celebrate({
    body: Joi.object().keys({
        code: Joi.string().min(4).max(4).required(),
    }),
}), recoveryPassAuthStage1, checkCodeRecovery);

router.get('/recovery-new-code', recoveryPassAuthStage1, getNewCodeRecovery);

router.post('/recovery-set-password', celebrate({
    body: Joi.object().keys({
        password: Joi.string().min(8).required(),
    }),
}), recoveryPassAuthStage2, recoveryPassStage3);



module.exports = router;
