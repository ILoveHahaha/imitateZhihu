const jwt = require('koa-jwt'); // token的信息默认放到ctx.state.user中
const Router = require('koa-router'); // koa路由中间件
const router = new Router({prefix: '/questions'});
const question = require('../controllers/questions');
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

router.get('/', question.findQuestionList);

router.post('/', auth, question.createQuestion);

router.get('/:id', checkIdVaild, question.checkQuestionExist, question.findQuestionById);

router.patch('/:id', checkIdVaild, auth, question.checkQuestionExist, question.checkQuestioner, question.updateQuestion);

router.delete('/:id', checkIdVaild, auth, question.checkQuestionExist, question.checkQuestioner, question.deleteQuestion);

module.exports = router;