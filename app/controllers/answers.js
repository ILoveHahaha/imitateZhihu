const Answer = require('../models/answers');

class AnswerCtrl {
    //TODO: 分页应该要返回总数
    //TODO: 这里的模糊搜索太简单
    async findAnswerList(ctx) {
        const per_page = ctx.query.per_page || 10;
        const page = Math.max(Number(ctx.query.page), 1) - 1; // 最少一页
        const perPage = Math.max(Number(per_page), 1); // 每页最少一项
        const q = new RegExp(ctx.query.q);
        ctx.body = await Answer
            .find({content: q, questionId: ctx.params.questionId}) // mongoose的语法，or与或类似，既能匹配title又能匹配description
            .limit(perPage)
            .skip(page * perPage); // limit表示只返回x项，skip表示跳过前面x项
    }
    async findAnswerById(ctx) {
        const {fields = ''} = ctx.query;
        const selectFields = fields.split(';').filter(value => value).map(value => ' +' + value).join('');
        ctx.body = await Answer.findById(ctx.params.id).select(selectFields).populate('answerer');
    }
    async createAnswer(ctx) {
        ctx.verifyParams({
            content: {type: 'string', required: true}
        });
        const answerer = ctx.state.user._id;
        const {questionId} = ctx.params;
        ctx.body = await new Answer({...ctx.request.body, answerer, questionId}).save();
    }
    async updateAnswer(ctx) {
        ctx.verifyParams({
            content: {type: 'string', required: false},
        });
        ctx.body = await ctx.state.answer.updateOne(ctx.request.body);
    }
    async deleteAnswer(ctx) {
        await Answer.findByIdAndRemove(ctx.params.id);
        ctx.status = 204;
    }
    // 检测答案是否存在
    async checkAnswerExist (ctx, next) {
        const answer = await Answer.findById(ctx.params.id).select('+answerer');
        if (!answer) {
            ctx.throw(404, '答案不存在')
        }
        if (answer.questionId !== ctx.params.questionId) {
            ctx.throw(404, '该答案不在此问题下')
        }
        ctx.state.answer = answer;
        await next();
    }
    // 检测是否是当前回答人
    async checkAnswerer (ctx, next) {
        const {answer} = ctx.state;
        if (answer.answerer.toString() !== ctx.state.user._id) {
            ctx.throw(403, '没有权限')
        }
        await next()
    }
}

module.exports = new AnswerCtrl();
