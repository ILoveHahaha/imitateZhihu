const jsonwebtoken = require('jsonwebtoken');
// const jwt = require('koa-jwt');
const User = require('../models/users.js');
const Topic = require('../models/topics.js');
const Question = require('../models/questions');
const Answer = require('../models/answers');
const {secret} = require('../config.js');

// 公共函数
//TODO: 完成继承调用
class commonFunc {
    /**
     * @param {Array} arr 要寻找的数组
     * @param {String, Number} findVal 要寻找的值
     * @param {String=} findKeyName 要寻找的元素里的属性，一般是数组里是对象的时候想要
     * 进一步去找每个元素里的对象属性是否有这个值才用这个属性
     * @param {String=} returnWay 返回方式，index为返回下标，ele为返回元素，如果是对象、
     * 数组之类则返回引用，可以通过下一个参数来控制返回的是值还是引用，默认值是index
     * @param {Boolean=} returnStatus 返回的是值还是引用，true是返回值，false是返回引用。
     * 数组、对象默认返回引用，变量默认返回值
     * @return {Number, Object, Null} 返回值，如果找不到该下标则返回-1，找不到该值则返回null，
     * 嵌套数组则返回一个包含子数组和目标值的下标
     * @description 寻找数组里某个值是否存在
     * **/
    findSomeEleInArr (arr, findVal, findKeyName = '', returnWay = 'index', returnStatus) {
        if (returnWay !== 'index' && returnWay !== 'ele') throw(`${returnWay} is a illegal input`);
        let nowKey = -1, nowValue = null, nowObj = null;
        for (let a = 0; a < arr.length; a++) {
            if (arr[a] instanceof Array) {
                let temp = arr[a].toString().replace(/,/g, '').indexOf(findVal);
                if (temp > -1) {
                    nowKey = temp;
                    nowObj = {
                        key: temp,
                        value: arr[a]
                    }
                }
            }
            else if (typeof arr[a] === 'object') {
                if (typeof findKeyName !== 'number' && !findKeyName || (arr[a][findKeyName] === null || arr[a][findKeyName] === undefined)) {
                    continue
                }
                if (arr[a][findKeyName].toString() === String(findVal)) {
                    nowKey = a;
                    nowValue = arr[a]
                }
            }
            else if (arr[a] === findVal) {
                nowKey = a;
                nowValue = arr[a]
            }
        }
        if (returnStatus) {
            // 这里应该用递归方式来做深复制
            return JSON.parse(JSON.stringify(nowValue ? nowValue : nowObj))
        }
        else if (returnWay === 'index'){
            return nowKey
        }
        else {
            return nowValue ? nowValue : nowObj
        }
    }
}

class Users extends commonFunc{
    async find(ctx){
        const per_page = ctx.query.per_page || 10;
        const page = Math.max(Number(ctx.query.page), 1) - 1; // 最少一页
        const perPage = Math.max(Number(per_page), 1); // 每页最少一项
        ctx.body = await User
            .find({name: new RegExp(ctx.query.q)})
            .limit(perPage)
            .skip(page * perPage); // limit表示只返回x项，skip表示跳过前面x项
    }

    async findById(ctx){
        // ctx.throw(ctx.response.status, '没有找到指定用户') // 错误返回自定义文本demo
        // 通过传入的fields字段来获取要展示额外的数据
        const {fields = ''} = ctx.query;
        const selectFields = fields.split(';').filter(value => value).map(value => {return ' +' + value}).join('');
        const populateStr = fields.split(';').filter(value => value).map(value => {
            if (value === 'employments') {
                return 'employments.company employments.job'
            }
            if (value === 'educations') {
                return 'educations.school educations.major'
            }
            return value
        }).join(' ');
        const user = await User.findById(ctx.params.id)
            .select(selectFields)
            .populate(populateStr);
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

    async listFollowing(ctx) {
        const user = await User.findById(ctx.params.id).select('+following').populate('following');
        if (!user) {
            ctx.throw(404, '用户不存在')
        }
        ctx.body = user.following;
    }

    async follow(ctx) {
        const me = await User.findById(ctx.state.user._id).select('+following');
        if (!me.following.map(id => id.toString()).includes(ctx.params.id)) {
            me.following.push(ctx.params.id);
            me.save();
        }
        ctx.status = 204
    }

    async unfollow(ctx) {
        const me = await User.findById(ctx.state.user._id).select('+following');
        for (let a = 0; a < me.following.length; a++) {
            if (me.following[a].toString() === ctx.params.id) {
                if (a !== me.following.length - 1) {
                    me.following[a] = me.following[0]
                }
                let [firstIndex, ...restArr] = me.following;
                me.following = restArr;
                me.save();
                break
            }
        }
        ctx.status = 204
    }

    async listFollower(ctx) {
        ctx.body = await User.find({following: ctx.params.id})
    }

    async followTopic(ctx) {
        const me = await User.findById(ctx.state.user._id).select('+followingTopics');
        if (!me.followingTopics.map(id => id.toString()).includes(ctx.params.id)) {
            me.followingTopics.push(ctx.params.id);
            me.save();
        }
        ctx.status = 204
    }

    async unfollowTopic(ctx) {
        const me = await User.findById(ctx.state.user._id).select('+followingTopics');
        for (let a = 0; a < me.followingTopics.length; a++) {
            if (me.followingTopics[a].toString() === ctx.params.id) {
                if (a !== me.followingTopics.length - 1) {
                    me.followingTopics[a] = me.followingTopics[0]
                }
                let [firstIndex, ...restArr] = me.followingTopics;
                me.followingTopics = restArr;
                me.save();
                break
            }
        }
        ctx.status = 204
    }

    async listFollowerTopics(ctx) {
        const user = await User.findById(ctx.params.id).select('+followingTopics').populate('followingTopics');
        if (!user) {
            ctx.throw(404, '用户不存在')
        }
        ctx.body = user.followingTopics;
    }

    // 检测用户是否存在
    async checkUserExist(ctx, next) {
        const user = await User.findById(ctx.params.id);
        if (!user) {
            ctx.throw(404, '用户不存在')
        }
        await next();
    }

    // 检测话题是否存在
    async checkTopicExist (ctx, next) {
        const topic = await Topic.findById(ctx.params.id);
        if (!topic) {
            ctx.throw(404, '话题不存在')
        }
        await next();
    }

    async listQuestions(ctx) {
        ctx.body = await Question.find({questioner: ctx.params.id})
    }

    async listLikingAnswers(ctx) {
        const user = await User.findById(ctx.params.id).select('+likingAnswers').populate('likingAnswers');
        if (!user) {ctx.throw(404, '用户不存在')}
        ctx.body = user.likingAnswers;
    }

    // 点赞和踩是互斥事件
    async likeAnswer(ctx, next) {
        const me = await User.findById(ctx.state.user._id).select('+likingAnswers');
        if (!me.likingAnswers.map(value => value.toString()).includes(ctx.params.id)) {
            me.likingAnswers.push(ctx.params.id);
            me.save();
            await Answer.findByIdAndUpdate(ctx.params.id, {$inc: {voteCount: 1}}) // $inc表示的是增加
        }
        ctx.status = 204;
        await next();
    }

    async unlikeAnswer(ctx) {
        const me = await User.findById(ctx.state.user._id).select('+likingAnswers');
        for (let a = 0; a < me.likingAnswers.length; a++) {
            if (me.likingAnswers[a].toString() === ctx.params.id) {
                if (a !== me.likingAnswers.length - 1) {
                    me.likingAnswers[a] = me.likingAnswers[0]
                }
                let [firstIndex, ...restArr] = me.likingAnswers;
                me.likingAnswers = restArr;
                me.save();
                await Answer.findByIdAndUpdate(ctx.params.id, {$inc: {voteCount: -1}});
                break
            }
        }
        ctx.status = 204
    }

    async listDisLikingAnswers(ctx) {
        const user = await User.findById(ctx.params.id).select('+dislikingAnswers').populate('dislikingAnswers');
        if (!user) {ctx.throw(404, '用户不存在')}
        ctx.body = user.dislikingAnswers;
    }

    async dislikeAnswer(ctx, next) {
        const me = await User.findById(ctx.state.user._id).select('+dislikingAnswers');
        if (!me.dislikingAnswers.map(value => value.toString()).includes(ctx.params.id)) {
            me.dislikingAnswers.push(ctx.params.id);
            me.save();
        }
        ctx.status = 204;
        await next();
    }

    async undislikeAnswer(ctx) {
        const me = await User.findById(ctx.state.user._id).select('+dislikingAnswers');
        for (let a = 0; a < me.dislikingAnswers.length; a++) {
            if (me.dislikingAnswers[a].toString() === ctx.params.id) {
                if (a !== me.dislikingAnswers.length - 1) {
                    me.dislikingAnswers[a] = me.dislikingAnswers[0]
                }
                let [firstIndex, ...restArr] = me.dislikingAnswers;
                me.dislikingAnswers = restArr;
                me.save();
                break
            }
        }
        ctx.status = 204
    }

    async listCollectingAnswer(ctx) {
        const user = await User.findById(ctx.params.id).select('+collectingAnswers').populate('collectingAnswers');
        if (!user) {ctx.throw(404, '用户不存在')}
        ctx.body = user.collectingAnswers;
    }

    async collectAnswer(ctx) {
        const me = await User.findById(ctx.state.user._id).select('+collectingAnswers');
        if (!me.collectingAnswers.map(value => value.toString()).includes(ctx.params.id)) {
            me.collectingAnswers.push(ctx.params.id);
            me.save();
        }
        ctx.status = 204;
    }

    async unCollectAnswer(ctx) {
        const me = await User.findById(ctx.state.user._id).select('+collectingAnswers');
        for (let a = 0; a < me.collectingAnswers.length; a++) {
            if (me.collectingAnswers[a].toString() === ctx.params.id) {
                if (a !== me.collectingAnswers.length - 1) {
                    me.collectingAnswers[a] = me.collectingAnswers[0]
                }
                let [firstIndex, ...restArr] = me.collectingAnswers;
                me.collectingAnswers = restArr;
                me.save();
                break
            }
        }
        ctx.status = 204
    }
}

module.exports = new Users();