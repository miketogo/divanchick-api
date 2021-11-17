const moment = require('moment-timezone');
var JsBarcode = require('jsbarcode');
const path = require('path');
var pdf = require("pdf-creator-node");
var fs = require("fs");

const { DOMImplementation, XMLSerializer } = require('xmldom');
const xmlSerializer = new XMLSerializer();
const doc = new DOMImplementation().createDocument('http://www.w3.org/1999/xhtml', 'html', null);
const svgNode = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');

// Read HTML Template


const Product = require('../models/product');
const Category = require('../models/category');
const Sub_category = require('../models/sub_category');

const ConflictError = require('../errors/сonflict-err');
const InvalidDataError = require('../errors/invalid-data-err');
const NotFoundError = require('../errors/not-found-err')
const AuthError = require('../errors/auth-err')




module.exports.getCategories = (req, res, next) => {
  const {

  } = req.body;


  Category.find()
    .populate(['sub_catigories.sub_category_id'])
    .then((categories) => {
      res.status(200).send({ categories })
    })
    .catch((err) => {
      console.log(err)
      if (err.code === 11000) {
        throw new ConflictError('Указанный артикул, уже существует на сервере, он должны быть уникальным');
      }
      if (err.name === 'ValidationError') {
        throw new InvalidDataError('Переданы некорректные данные при создании товара');
      }
    })
    .catch(next)

};


