const Router = require('koa-router');
const router = new Router();
const home = require('../controllers/home');

router.get('/', home.index);
router.post('/upload', home.upload);

module.exports = router;