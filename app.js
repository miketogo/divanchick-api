const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const { errors, celebrate, Joi } = require('celebrate');
const { create, checkCode, getNewCode, login } = require('./controllers/users');
const NotFoundError = require('./errors/not-found-err');
const { requestLogger, errorLogger } = require('./middlewares/logger');
const auth = require('./middlewares/auth');
const checkCodeAuth = require('./middlewares/checkCodeAuth')

require('dotenv').config();
console.log(process.env.NODE_ENV);
const { PORT = 3003 } = process.env; //PORT

const CORS_WHITELIST = [
  'http://localhost:3000',
  'https://localhost:3000',
  'https://www.localhost:3000',
  'http://www.localhost:3000',
];
const app = express();
app.use(helmet());
const corsOption = {
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  allowedHeaders: ['Content-Type', 'origin', 'Authorization'],
  credentials: true,
  origin: [
    'http://localhost:3000',
    'https://localhost:3000',
    'https://www.localhost:3000',
    'http://www.localhost:3000',
    'http://divanchik-frontend.netlify.app',
    'https://divanchik-frontend.netlify.app',
    'https://divanchik-frontend.netlify.app',
    'http://divanchik-frontend.netlify.app',
  ],
};
app.use('*', cors(corsOption));
app.use(cookieParser());
mongoose.connect('mongodb://localhost:27017/divanchick', {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

app.use(express.json());
app.use(requestLogger);



// app.use(cors(corsOption));
app.use('/api/uploads', express.static('uploads'));
app.use('/api/photos', express.static('photos'));
app.use('/api/barcodes', express.static('barcodes'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/users', require('./routes/users'));

// eslint-disable-next-line no-unused-vars
app.use((req, res) => {
  throw new NotFoundError('Запрашиваемый ресурс не найден');
});
app.use(errorLogger);
app.use(errors());

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // если у ошибки нет статуса, выставляем 500

  const { statusCode = 500, message } = err;
  console.log(err)
  res
    .status(statusCode)
    .send({
      message: statusCode === 500
        ? 'На сервере произошла ошибка'
        : message,
    });
});

app.listen(PORT, () => {

});
