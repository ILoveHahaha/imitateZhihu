const mongoose = require('mongoose');

const {Schema, model} = mongoose;

const questionSchema = new Schema({
    __v: {type: Number, select: false},
    content: {type: String, required: true},
    answerer: {type: Schema.Types.ObjectId, ref: 'User', required: true, select: false},
    questionId: {type: String, required: true}
});

module.exports = model('Answer', questionSchema);