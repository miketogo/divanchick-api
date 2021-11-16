const mongoose = require('mongoose');
const validator = require('validator');
// Опишем схему:
const sub_categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    link: {
        type: String,
        required: true,
    },
    photo: {
        type: String,
        required: true,
        default: 'Не указано'
    }

});

// создаём модель и экспортируем её
module.exports = mongoose.model('sub_category', sub_categorySchema);
