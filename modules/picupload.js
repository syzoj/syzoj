const randomstring = require('randomstring');
const fs = require('fs-extra');
const jwt = require('jsonwebtoken');

app.get('/picupload', async (req, res) => {
    try {
        if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });

        const openPicUpload = syzoj.config.pic_upload;
        if(!openPicUpload) throw new ErrorMessage('管理员尚未开放图床功能，敬请期待。');

        res.render('picupload',{});
    } catch (e) 
    {
        syzoj.log(e);
        res.render('error', {err: e});
    }
});