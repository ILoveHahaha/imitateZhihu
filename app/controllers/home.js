const path = require('path');
class Home {
    index (ctx) {
        ctx.body = '<h1>这是主页</h1>'
    }
    upload (ctx) {
        console.log(ctx.request.files);
        const file = ctx.request.files.file;
        const basename = path.basename(file.path);
        ctx.body = {url: `${ctx.origin}/uploadFiles/${basename}`};
    }
}

module.exports = new Home();