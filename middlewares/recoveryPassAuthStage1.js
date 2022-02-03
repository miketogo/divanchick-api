const jwt = require('jsonwebtoken');
const AuthError = require('../errors/auth-err');
const User = require('../models/user');

require('dotenv').config();
const jwtSecretPhrase = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
  const { authorization } = req.headers;


  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new AuthError('Необходима авторизация');
  } else {
    const token = authorization.replace('Bearer ', '');
    let payload;

    try {
      // попытаемся верифицировать токен
      payload = jwt.verify(token, jwtSecretPhrase);
      if (!payload.mode || payload.mode !== 'recovery-pass-1') {
        throw new AuthError('Токен не в режиме восстановления');
      }

    } catch (err) {
      // отправим ошибку, если не получилось
      throw new AuthError('Необходима авторизация');
    }
    payload = {
      _id: payload._id
    }
    req.user = payload; // записываем пейлоуд в объект запроса

    next();
  }



  // извлечём токен

};
