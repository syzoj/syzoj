let Problemset = syzoj.model('problemset');
let Problem = syzoj.model('problem');
let JudgeState = syzoj.model('judge_state');
let User = syzoj.model('user');

const jwt = require('jsonwebtoken');
const { getSubmissionInfo, getRoughResult, processOverallResult } = require('../libs/submissions_process');

app.get('/problemsets', async (req, res) => {
    try{
        if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });
        let where;
        if (res.locals.user && res.locals.user.is_admin) where = {}
        else where = { is_public: true };

        let paginate = syzoj.utils.paginate(await Contest.countForPagination(where), req.query.page, syzoj.config.page.problemset);
        let problemsets = await Problemset.queryPage(paginate, where, {
            id: 'ASC'
        });

        await problemsets.forEachAsync(async x => x.subtitle = await syzoj.utils.markdown(x.subtitle));

        req.render('problemsets',{
            problemsets: problemsets,
            paginate: paginate
        })
    } catch(e){
        syzoj.log(e);
        res.render('error', {
            err: e
        });
    }
});

app.get('/problemset/:id/edit', async (req, res) => {
    try{
        if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });
        if (!res.locals.user || !res.locals.user.is_admin) throw new ErrorMessage('您没有权限进行此操作。');
        
        let problemset_id = parseInt(req.params.id);
        let problemset = await Problemset.findById(problemset_id);
        if (!problemset){
            problemset = await Problemset.create();
            problemset.id = 0;
        } 

        let problems = [];
        if (problemset.problems) problems = await problemset.problems.split('|').mapAsync(async id => await Problem.findById(id));
        
        res.render('problemset_edit', {
            problemset: problemset,
            problems: problems,
        });
    } catch (e){
        syzoj.log(e);
        res.render('error', {
            err: e
        });       
    }
});

app.post('/problemset/:id/edit', async (req, res) => {
    try{
        if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });
        if (!res.locals.user || !res.locals.user.is_admin) throw new ErrorMessage('您没有权限进行此操作。');

        let problemset_id = parseInt(req.params.id);
        let problemset = await Problemset.findById(problemset_id);

        if(!problemset) {
            problemset = await problemset.create();
        }

        if (!req.body.title.trim()) throw new ErrorMessage('题单名不能为空。');  
        problemset.title = req.body.title;
        problemset.subtitle = req.body.subtitle;
        if (!Array.isArray(req.body.problems))  req.body.problems = [req.body.problems]
        problemset.problems = req.body.problems.join('|');
        problemset.information = req.body.information;
        problemset.is_public = req.body.is_public === 'on';

        await problemset.save();

        res.redirect(syzoj.utils.makeUrl(['problemset', problemset.id]))
    } catch (e){
        syzoj.log(e);
        res.render('error', {
            err: e
        });       
    }
});