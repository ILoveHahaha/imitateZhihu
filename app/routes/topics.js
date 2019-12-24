const jwt = require('koa-jwt'); // token的信息默认放到ctx.state.user中
const Router = require('koa-router'); // koa路由中间件
const router = new Router({prefix: '/topics'});
const topic = require('../controllers/topics');
const {secret} = require('../config');
const mongoose = require('mongoose');

const auth = jwt({secret});

// 用户鉴权
const checkOwner = async (ctx, next) => {
    if (ctx.params.id !== ctx.state.user._id) {
        ctx.throw(403, '没有权限')
    }
    await next()
};

// 检查id是否合法
const checkIdVaild = async (ctx, next) => {
    if (mongoose.Types.ObjectId.isValid(ctx.params.id)) {
        await next()
    }
    else {
        ctx.throw(400, '传入的id是非法的')
    }
};

router.get('/', topic.findTopicList);

router.post('/', auth, topic.createTopic);

router.get('/:id', checkIdVaild, topic.findTopicById);

router.patch('/:id', checkIdVaild, auth, topic.updateTopic);

module.exports = router;