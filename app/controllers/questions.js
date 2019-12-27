const Question = require('../models/questions');

class QuestionCtrl {
    //TODO: 分页应该要返回总数
    //TODO: 这里的模糊搜索太简单
    async findQuestionList(ctx) {
        const per_page = ctx.query.per_page || 10;
        const page = Math.max(Number(ctx.query.page), 1) - 1; // 最少一页
        const perPage = Math.max(Number(per_page), 1); // 每页最少一项
        const q = new RegExp(ctx.query.q);
        ctx.body = await Question
            .find({$or: [{title: q}, {description: q}]}) // mongoose的语法，or与或类似，既能匹配title又能匹配description
            .limit(perPage)
            .skip(page * perPage); // limit表示只返回x项，skip表示跳过前面x项
    }
    async findQuestionById(ctx) {
        const {fields = ''} = ctx.query;
        const selectFields = fields.split(';').filter(value => value).map(value => ' +' + value).join('');
        ctx.body = await Question.findById(ctx.params.id).select(selectFields).populate('questioner topics');
    }
    async createQuestion(ctx) {
        ctx.verifyParams({
            title: {type: 'string', required: true},
            description: {type: 'string', required: false}
        });
        ctx.body = await new Question({...ctx.request.body, questioner: ctx.state.user._id}).save();
    }
    async updateQuestion(ctx) {
        ctx.verifyParams({
            title: {type: 'string', required: false},
            description: {type: 'string', required: false},
        });
        ctx.body = await ctx.state.question.updateOne(ctx.request.body);
    }
    async deleteQuestion(ctx) {
        await Question.findByIdAndRemove(ctx.params.id);
        ctx.status = 204;
    }
    // 检测问题是否存在
    async checkQuestionExist (ctx, next) {
        const question = await Question.findById(ctx.params.id).select('+questioner');
        if (!question) {
            ctx.throw(404, '问题不存在')
        }
        ctx.state.question = question;
        await next();
    }
    // 检测是否是当前提问人
    async checkQuestioner (ctx, next) {
        const {question} = ctx.state;
        if (question.questioner.toString() !== ctx.state.user._id) {
            ctx.throw(403, '没有权限')
        }
        await next()
    }
}

module.exports = new QuestionCtrl();
