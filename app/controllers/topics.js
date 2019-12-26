const jsonwebtoken = require('jsonwebtoken');
const Topic = require('../models/topics');
const {secret} = require('../config');

class TopicCtrl {
    //TODO: 分页应该要返回总数
    //TODO: 这里的模糊搜索太简单
    async findTopicList(ctx) {
        const per_page = ctx.query.per_page || 10;
        const page = Math.max(Number(ctx.query.page), 1) - 1; // 最少一页
        const perPage = Math.max(Number(per_page), 1); // 每页最少一项
        ctx.body = await Topic
            .find({name: new RegExp(ctx.query.q)}) // 模糊搜索，搜索关于name的信息
            .limit(perPage)
            .skip(page * perPage); // limit表示只返回x项，skip表示跳过前面x项
    }
    async findTopicById(ctx) {
        const {fields = ''} = ctx.query;
        const selectFields = fields.split(';').filter(value => value).map(value => ' +' + value).join('');
        ctx.body = await Topic.findById(ctx.params.id).select(selectFields);
    }
    async createTopic(ctx) {
        ctx.verifyParams({
            name: {type: 'string', required: true},
            avatar_url: {type: 'string', required: false},
            introduction: {type: 'string', required: false}
        });
        ctx.body = await new Topic(ctx.request.body).save();
    }
    async updateTopic(ctx) {
        ctx.verifyParams({
            name: {type: 'string', required: false},
            avatar_url: {type: 'string', required: false},
            introduction: {type: 'string', required: false}
        });
        ctx.body = await Topic.findByIdAndUpdate(ctx.params.id, ctx.request.body);
    }
}

module.exports = new TopicCtrl();
