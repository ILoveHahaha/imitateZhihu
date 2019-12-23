const mongoose = require('mongoose');

const {Schema, model} = mongoose;

const userSchema = new Schema({
    __v: {type: Number, select: false}, // 屏蔽多余字段返回
    name: {type: String, required: true},
    password: {type: String, required: true, select: false}, // 成功之后不返回这个字段出来
    avatar_url: {type: String}, // 头像地址
    gender: {type: String, enum: ['male', 'female'], default: 'male', required: true}, // 可枚举，默认值
    headline: {type: String},
    locations: {type: [{type: String}], select: false}, // 表示存入的是字符串数组
    business: {type: String, select: false},
    employments: {
        type: [{
            company: {type: String},
            job: {type: String}
        }],
        select: false
    }, // 表示存入的是对象
    educations: {
        type: [{
            school: {type: String},
            major: {type: String},
            diploma: {type: Number, enum: [1, 2, 3, 4, 5]},
            entrance_year: {type: Number},
            graduation_year: {type: Number}
        }],
        select: false
    }
});

module.exports = model('User', userSchema);