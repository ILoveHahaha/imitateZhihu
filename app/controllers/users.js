const jsonwebtoken = require('jsonwebtoken');
// const jwt = require('koa-jwt');
const User = require('../models/users.js');
const {secret} = require('../config.js');

class Users {
    async find(ctx){
        ctx.body = await User.find();
    }
    async findById(ctx){
        // ctx.throw(ctx.response.status, '没有找到指定用户') // 错误返回自定义文本demo
        // 通过传入的fields字段来获取要展示额外的数据
        const {fields} = ctx.query;
        const selectFields = fields.split(';')
            .filter(value => value)
            .map(value => {return ' +' + value})
            .join('');
        const user = await User.findById(ctx.params.id).select(selectFields);
        if (!user) {
            ctx.throw(404, '用户不存在');
        }
        ctx.body = user;
    }
    async createById(ctx){
        ctx.verifyParams({
            name: {type: 'string', required: true},
            password: {type: 'string', required: true}
        });
        const {name} = ctx.request.body;
        const repeatedUser = await User.findOne({name});
        if (repeatedUser) {
            ctx.throw(409, '用户已经存在') // 409状态表示冲突
        }
        ctx.body = await new User(ctx.request.body).save();
    }
    async updateById(ctx){
        ctx.verifyParams({
            name: {type: 'string', required: false},
            password: {type: 'string', required: false},
            avatar_url: {type: 'string', required: false},
            gender: {type: 'string', required: false},
            headline: {type: 'string', required: false},
            locations: {type: 'array', itemType: 'string', required: false},
            business: {type: 'string', required: false},
            employments: {type: 'array', itemType: 'object', required: false},
            educations: {type: 'array', itemType: 'object', required: false}
        });
        const user = await User.findByIdAndUpdate(ctx.params.id, ctx.request.body);
        // const user = await User.findByIdAndUpdate(ctx.params.id, ctx.request.body, (err) => {
        //     if (err) ctx.throw(404, err.message);
        // });
        if (!user) {
            ctx.throw(404, '用户不存在');
        }
        ctx.body = user;
    }
    async deleteById(ctx){
        const user = await User.findByIdAndRemove(ctx.params.id);
        if (!user) {
            ctx.throw(404, '用户不存在');
        }
        ctx.status = 204
    }
    async login(ctx){
        ctx.verifyParams({
            name: {type: 'string', required: true},
            password: {type: 'string', required: true}
        });
        const user = await User.findOne(ctx.request.body);
        if (!user) {
            ctx.throw(401, '用户名或密码不正确')
        }
        const {_id, name} = user;
        // 设置需要返回的内容，签名密码和token过期时间
        const token = jsonwebtoken.sign({_id, name}, secret, {expiresIn: '1d'});
        ctx.body = {token}
    }
}

module.exports = new Users();