const jwt = require('koa-jwt'); // token的信息默认放到ctx.state.user中
const Router = require('koa-router'); // koa路由中间件
const router = new Router({prefix: '/questions/:questionId/answers'});
const answer = require('../controllers/answers');
const {secret} = require('../config');
const mongoose = require('mongoose');

const auth = jwt({secret});

// 检查id是否合法
const checkIdVaild = async (ctx, next) => {
    if (mongoose.Types.ObjectId.isValid(ctx.params.id)) {
        await next()
    }
    else {
        ctx.throw(400, '传入的id是非法的')
    }
};

router.get('/', answer.findAnswerList);

router.post('/', auth, answer.createAnswer);

router.get('/:id', checkIdVaild, answer.checkAnswerExist, answer.findAnswerById);

router.patch('/:id', checkIdVaild, auth, answer.checkAnswerExist, answer.checkAnswerer, answer.updateAnswer);

router.delete('/:id', checkIdVaild, auth, answer.checkAnswerExist, answer.checkAnswerer, answer.deleteAnswer);

module.exports = router;