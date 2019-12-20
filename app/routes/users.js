const jsonwebtoken = require('jsonwebtoken'); // jsonwebtoken来使用JWT
const jwt = require('koa-jwt'); // token的信息默认放到ctx.state.user中
const Router = require('koa-router'); // koa路由中间件
const router = new Router({prefix: '/users'});
const users = require('../controllers/users');
const {secret} = require('../config');

// 用户认证(注释的是用jsonwebtoken)
// const auth = async (ctx, next) => {
//     const {authorization = ''} = ctx.request.header;
//     const token = authorization.replace('Bearer ', '');
//     try {
//         // ctx.state.user是约定俗成的方法，state通常用来存储用户信息
//         ctx.state.user = jsonwebtoken.verify(token, secret);
//     } catch (err) {
//         ctx.throw(401, err.message)
//     }
//     await next()
// };
const auth = jwt({secret});

// 用户鉴权
const checkOwner = async (ctx, next) => {
    if (ctx.params.id !== ctx.state.user._id) {
        ctx.throw(403, '没有权限')
    }
    await next()
};

router.get('/', users.find);

router.post('/', users.createById);

router.get('/:id', users.findById);

router.patch('/:id', auth, checkOwner, users.updateById);

router.delete('/:id', auth, checkOwner, users.deleteById);

router.post('/login', users.login);

// app.use(router.allowedMethods());
module.exports = router;