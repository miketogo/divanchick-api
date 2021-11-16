const mongoose = require('mongoose');
const validator = require('validator');
// Опишем схему:
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    link: {
        type: String,
        required: true,
    },
    manufacturer: {
        type: String,
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
        required: true,
    },
    sub_category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'sub_category',
        required: true,
    },
    key_words: {
        type: Array,
        required: true,
    },
    photos: {
        type: Array,
        default: [],
        required: true,
    },
    description: {
        type: String,
        default: 'Не указано',
        required: true,
    },
    specifications: {
        colour: {
            type: String,
            default: 'Не указано',
        },
        material: {
            type: String,
            default: 'Не указано',
        },

        width: {
            type: String,
            default: 'Не указано',
        },
        height: {
            type: String,
            default: 'Не указано',
        },
        length: {
            type: String,
            default: 'Не указано',
        },
        weight: {
            type: String,
            default: 'Не указано',
        },

    },
    article: {
        type: String,
        required: true,
    },
    isModuleParent: {
        type: Boolean,
        required: true,
        default: false,
    },
    isModuleChild: {
        type: Boolean,
        required: true,
        default: false,
    },
    isVariationParent: {
        type: Boolean,
        required: true,
        default: false,
    },
    isVariationChild: {
        type: Boolean,
        required: true,
        default: false,
    },
    moduleItems: [
        {
            product_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'product',
                required: true,
            },
        }
    ],
    price: {
        type: String,
        default: 'Не указано',
        required: true,
    },
    variations: [
        {
            product_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'product',
                required: true,
            },
        }
    ]

});

// создаём модель и экспортируем её
module.exports = mongoose.model('product', productSchema);
