const randomstring = require('randomstring');
const fs = require('fs-extra');
const jwt = require('jsonwebtoken');
const oss = require('../libs/oss')

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

app.post('/picupload/upload', app.multer.array('pic'), async (req, res) =>{
    try { 
        if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });
        
        if (req.files) {
            var flag = 0;
            for (let file of req.files){
                ++flag;
                if(file.size > 5242880)
                    throw new ErrorMessage('文件过大。');
                if(flag > 10)
                    throw new ErrorMessage('文件过多。');
                await oss.upload(file.path)
            }
        }
        res.redirect(syzoj.utils.makeUrl(['picupload']));
    } catch (e) 
    {
        syzoj.log(e);
        res.render('error', {err: e});
    }
});