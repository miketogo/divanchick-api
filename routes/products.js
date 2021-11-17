const router = require('express').Router();
const { celebrate, Joi } = require('celebrate');
const {
  create, createVariationChild, createModuleChild, createModuleAndVariationChild, getProducts, createBarcode, getProductsForSale
} = require('../controllers/products');

router.post('/create', celebrate({
  body: Joi.object().keys({
    name: Joi.string().required(),
    manufacturer: Joi.string().required(),
    category: Joi.string().required(),
    sub_category: Joi.string().required(),
    description: Joi.string(),
    specifications: Joi.object(),
    article: Joi.string().required(),
    photos: Joi.array(),
  }),
}), create);

router.post('/add-variation', celebrate({
  body: Joi.object().keys({
    name: Joi.string().required(),
    manufacturer: Joi.string().required(),
    category: Joi.string().required(),
    sub_category: Joi.string().required(),
    description: Joi.string(),
    specifications: Joi.object(),
    article: Joi.string().required(),
    photos: Joi.array(),
    variation_parent_article: Joi.string().required(),
  }),
}), createVariationChild);

router.post('/add-module-item', celebrate({
  body: Joi.object().keys({
    name: Joi.string().required(),
    manufacturer: Joi.string().required(),
    category: Joi.string().required(),
    sub_category: Joi.string().required(),
    description: Joi.string(),
    specifications: Joi.object(),
    article: Joi.string().required(),
    photos: Joi.array(),
    module_parent_article: Joi.string().required(),
  }),
}), createModuleChild);

router.post('/add-module-and-variation-item', celebrate({
  body: Joi.object().keys({
    name: Joi.string().required(),
    manufacturer: Joi.string().required(),
    category: Joi.string().required(),
    sub_category: Joi.string().required(),
    description: Joi.string(),
    specifications: Joi.object(),
    article: Joi.string().required(),
    photos: Joi.array(),
    variation_parent_article: Joi.string().required(),
    module_parent_article: Joi.string().required(),
  }),
}), createModuleAndVariationChild);

router.get('/all', getProducts);
router.get('/forsale', getProductsForSale);

router.post('/get-barcode', celebrate({
  body: Joi.object().keys({
    product_id: Joi.string().required(),
  }),
}), createBarcode);


module.exports = router;
