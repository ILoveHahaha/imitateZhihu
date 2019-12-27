const jsonwebtoken = require('jsonwebtoken'); // jsonwebtoken来使用JWT
const jwt = require('koa-jwt'); // token的信息默认放到ctx.state.user中
const Router = require('koa-router'); // koa路由中间件
const router = new Router({prefix: '/users'});
const users = require('../controllers/users');
const {checkAnswerExist} = require('../controllers/answers');
const {secret} = require('../config');
const mongoose = require('mongoose');

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

// 检查id是否合法
const checkIdVaild = async (ctx, next) => {
    if (mongoose.Types.ObjectId.isValid(ctx.params.id)) {
        await next()
    }
    else {
        ctx.throw(400, '传入的id是非法的')
    }
};

router.get('/', users.find);

router.post('/', users.createById);

router.get('/:id', checkIdVaild, users.findById);

router.patch('/:id', checkIdVaild, auth, checkOwner, users.updateById);

router.delete('/:id', checkIdVaild, auth, checkOwner, users.deleteById);

router.post('/login', users.login);

router.get('/:id/following', checkIdVaild, users.listFollowing);

router.put('/following/:id', checkIdVaild, auth, users.checkUserExist, users.follow);

router.delete('/following/:id', checkIdVaild, auth, users.checkUserExist, users.unfollow);

router.get('/:id/followers', checkIdVaild, users.listFollower);

router.put('/followingTopics/:id', checkIdVaild, auth, users.checkTopicExist, users.followTopic);

router.delete('/followingTopics/:id', checkIdVaild, auth, users.checkTopicExist, users.unfollowTopic);

router.get('/:id/followingTopics', checkIdVaild, users.listFollowerTopics);

router.get('/:id/questions', users.listQuestions);

router.get('/:id/likingAnswers', checkIdVaild, users.listLikingAnswers);

router.put('/likingAnswers/:id', checkIdVaild, auth, checkAnswerExist, users.likeAnswer, users.undislikeAnswer);

router.delete('/likingAnswers/:id', checkIdVaild, auth, checkAnswerExist, users.unlikeAnswer);

router.get('/:id/dislikingAnswers', checkIdVaild, users.listDisLikingAnswers);

router.put('/dislikingAnswers/:id', checkIdVaild, auth, checkAnswerExist, users.dislikeAnswer, users.unlikeAnswer);

router.delete('/dislikingAnswers/:id', checkIdVaild, auth, checkAnswerExist, users.undislikeAnswer);

// app.use(router.allowedMethods());
module.exports = router;