const jwt = require('koa-jwt'); // token的信息默认放到ctx.state.user中
const Router = require('koa-router'); // koa路由中间件
const router = new Router({prefix: '/questions/:questionId/answers/:answerId/comments'});
const comments = require('../controllers/comments');
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

router.get('/', comments.findCommentList);

router.post('/', auth, comments.createComment);

router.get('/:id', checkIdVaild, comments.checkCommentExist, comments.findCommentById);

router.patch('/:id', checkIdVaild, auth, comments.checkCommentExist, comments.checkCommentator, comments.updateComment);

router.delete('/:id', checkIdVaild, auth, comments.checkCommentExist, comments.checkCommentator, comments.deleteComment);

module.exports = router;