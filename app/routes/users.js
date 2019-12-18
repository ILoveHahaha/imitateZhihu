const Router = require('koa-router'); // koa路由中间件
const router = new Router({prefix: '/users'});
const users = require('../controllers/users');

router.get('/', users.find);

router.post('/', users.createById);

router.get('/:id', users.findById);

router.put('/:id', users.updateById);

router.delete('/:id', users.deleteById);

// app.use(router.allowedMethods());
module.exports = router;