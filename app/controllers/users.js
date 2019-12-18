const User = require('../models/users.js');

const db = [{name: 'hahaha'}];

function test (ctx, cb) {
    for (let a in db) {
        if (db[a] && db[a].name === ctx.params.id) {
            if (cb) {
                cb(a);
                return ctx.params
            }
            return db[a]
        }
    }
    return []
}

class Users {
    async find(ctx){
        // ctx.body = db.filter(value => {
        //     return value
        // });
        ctx.body = await User.find();
    }
    async findById(ctx){
        // ctx.throw(ctx.response.status, '没有找到指定用户') // 错误返回自定义文本demo
        // ctx.body = test(ctx)
        const user = await User.findById(ctx.params.id);
        if (!user) {
            ctx.throw(404, '用户不存在');
        }
        ctx.body = user;
    }
    async createById(ctx){
        ctx.verifyParams({
            name: {type: 'string', required: true}
        });
        // db.push(ctx.request.body);
        // ctx.body = ctx.request.body
        ctx.body = await new User(ctx.request.body).save();
    }
    async updateById(ctx){
        ctx.verifyParams({
            name: {type: 'string', required: true}
        });
        // ctx.body = test(ctx, function (param) {
        //     db[param].name = ctx.request.body.name
        // })
        const user = await User.findByIdAndUpdate(ctx.params.id, ctx.request.body);
        if (!user) {
            ctx.throw(404, '用户不存在');
        }
        ctx.body = user;
    }
    async deleteById(ctx){
        // test(ctx, function (param) {
        //     delete db[param]
        // });
        const user = await User.findByIdAndRemove(ctx.params.id);
        if (!user) {
            ctx.throw(404, '用户不存在');
        }
        ctx.status = 204
    }
}

module.exports = new Users();