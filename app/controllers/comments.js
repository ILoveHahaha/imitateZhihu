const Comment = require('../models/comments');

class CommentCtrl {
    //TODO: 分页应该要返回总数
    //TODO: 这里的模糊搜索太简单
    async findCommentList(ctx) {
        const per_page = ctx.query.per_page || 10;
        const page = Math.max(Number(ctx.query.page), 1) - 1; // 最少一页
        const perPage = Math.max(Number(per_page), 1); // 每页最少一项
        const q = new RegExp(ctx.query.q);
        const {questionId, answerId} = ctx.params;
        const {rootCommentId} = ctx.query;
        ctx.body = await Comment
            .find({content: q, questionId, answerId, rootCommentId}) // mongoose的语法，or与或类似，既能匹配title又能匹配description
            .limit(perPage)
            .skip(page * perPage)
            .populate('commentator replyTo'); // limit表示只返回x项，skip表示跳过前面x项
    }
    async findCommentById(ctx) {
        const {fields = ''} = ctx.query;
        const selectFields = fields.split(';').filter(value => value).map(value => ' +' + value).join('');
        ctx.body = await Comment.findById(ctx.params.id).select(selectFields).populate('commentator');
    }
    async createComment(ctx) {
        ctx.verifyParams({
            content: {type: 'string', required: true},
            rootCommentId: {type: 'string', required: false},
            replyTo: {type: 'string', required: false}
        });
        const commentator = ctx.state.user._id;
        const {questionId, answerId} = ctx.params;
        ctx.body = await new Comment({...ctx.request.body, commentator, questionId, answerId}).save();
    }
    async updateComment(ctx) {
        ctx.verifyParams({
            content: {type: 'string', required: false},
        });
        const {content} = ctx.request.content
        ctx.body = await ctx.state.comment.updateOne(content);
    }
    async deleteComment(ctx) {
        await Comment.findByIdAndRemove(ctx.params.id);
        ctx.status = 204;
    }
    // 检测评论是否存在
    async checkCommentExist (ctx, next) {
        const comment = await Comment.findById(ctx.params.id).select('+commentator');
        if (!comment) {
            ctx.throw(404, '评论不存在')
        }
        if (ctx.params.questionId && comment.questionId !== ctx.params.questionId) {
            ctx.throw(404, '该评论不在此问题下')
        }
        if (ctx.params.answerId && comment.answerId !== ctx.params.answerId) {
            ctx.throw(404, '该答案下没有此评论')
        }
        ctx.state.comment = comment;
        await next();
    }
    // 检测是否是当前回答人
    async checkCommentator (ctx, next) {
        const {comment} = ctx.state;
        if (comment.commentator.toString() !== ctx.state.user._id) {
            ctx.throw(403, '没有权限')
        }
        await next()
    }
}

module.exports = new CommentCtrl();
