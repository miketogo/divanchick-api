const router = require('express').Router();
const { celebrate, Joi } = require('celebrate');
const {
   getCategories
} = require('../controllers/categories');



router.get('/', getCategories);



module.exports = router;
