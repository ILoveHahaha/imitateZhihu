const mongoose = require('mongoose');

const {Schema, model} = mongoose;

const userSchema = new Schema({
    __v: {type: Number, select: false}, // 屏蔽多余字段返回
    name: {type: String, required: true},
    password: {type: String, required: true, select: false} // 成功之后不返回这个字段出来
});

module.exports = model('User', userSchema);