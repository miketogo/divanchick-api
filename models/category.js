const mongoose = require('mongoose');
const validator = require('validator');
// Опишем схему:
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    link: {
        type: String,
        required: true,
    },
    sub_catigories: [
        {
            sub_category_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'sub_category',
                required: true,
            },
        }
    ]

});

// создаём модель и экспортируем её
module.exports = mongoose.model('category', categorySchema);
