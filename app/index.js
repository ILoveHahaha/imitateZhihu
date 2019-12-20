const Koa = require('koa');
// const bodyParser = require('koa-bodyparser'); // 请求体响应，只支持JSON和form，不支持客户端发送的文件等
const koaBody = require('koa-body'); // 比上面的koa-bodyparser更强大，支持各种各样的请求
const koaJsonError = require('koa-json-error'); // 错误状态码捕获处理中间件
const parameter = require('koa-parameter'); // 校验参数中间件
const mongoose = require('mongoose'); // 连接云数据库mongoDB插件
const koaStatic = require('koa-static'); // 静态文件生成链接
const path = require('path');
const app = new Koa();
const {connectionStr} = require('./config');
const routing = require('./routes');

mongoose.connect(connectionStr, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}, () => {
    console.log('success')
});
mongoose.connection.on('error', console.error);

// 原生错误捕获，因为比较难捕获到404，所以需要引入koa-json-error
// app.use(async (ctx, next) => {
//     try {
//         await next()
//     } catch (err) {
//         ctx.status = err.status || err.statusCode || 500;
//         ctx.body = {
//             status: ctx.status,
//             desc: err.message
//         }
//     }
// });

app.use(koaStatic(path.join(__dirname, 'public')));
app.use(koaJsonError({
    postFormat: (e, {stack, ...rest}) => {
        return process.env.NODE_ENV === 'production' ? rest: {stack, ...rest}
    }
}));
app.use(koaBody({
    multipart: true,
    formidable: {
        uploadDir: path.join(__dirname, '/public/uploadFiles'), // 设置上传目录
        keepExtensions: true // 保留扩展名
    }
}));
app.use(parameter(app));
routing(app);

app.listen(3000, () => {
    console.log('program is running in 3000')
});
