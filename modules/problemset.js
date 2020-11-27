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
        if (res.locals.user && (res.locals.user.is_admin || await res.locals.user.hasPrivilege('manage_problemset'))) where = {}
        else where = { is_public: true };

        let paginate = syzoj.utils.paginate(await Problemset.countForPagination(where), req.query.page, syzoj.config.page.problemset);
        let problemsets = await Problemset.queryPage(paginate, where, {
            id: 'ASC'
        });

        await problemsets.forEachAsync(async x => x.subtitle = await syzoj.utils.markdown(x.subtitle));

        res.render('problemsets',{
            allowedManageProblemsets: res.locals.user && (res.locals.user.is_admin || await res.locals.user.hasPrivilege('manage_problemset')),
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
        if (!res.locals.user || (!res.locals.user.is_admin && !await res.locals.user.hasPrivilege('manage_problemset'))) throw new ErrorMessage('您没有权限进行此操作。');
        
        let problemset_id = parseInt(req.params.id);
        let problemset = await Problemset.findById(problemset_id);
        if (!problemset){
            problemset = await Problemset.create();
            problemset.id = 0;
        } 

        let problems = [];
        if (problemset.problems) problems = await problemset.problems.split('|').mapAsync(async id => await Problem.findById(id));
        
        res.render('problemset_edit', {
            allowedManageProblemsets: res.locals.user && (res.locals.user.is_admin || await res.locals.user.hasPrivilege('manage_problemset')),
            problemset: problemset,
            problems: problems
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
        if (!res.locals.user || (!res.locals.user.is_admin && !await res.locals.user.hasPrivilege('manage_problemset'))) throw new ErrorMessage('您没有权限进行此操作。');

        let problemset_id = parseInt(req.params.id) || 0;
        let problemset = await Problemset.findById(problemset_id);

        if(!problemset) {
            problemset = await problemset.create();
        }

        let customID = parseInt(req.body.id)
        if(customID)
        {
            if(await Problemset.findById(customID))
                throw new ErrorMessage('ID 已被使用。');
            problemset.id = customID;
        }
        else if(problemset_id)
            problemset.id = problemset_id;

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

app.post('/problemset/:id/delete', async (req, res) =>{
    try{
        let id = parseInt(req.params.id);
        let problemset = await Problemset.findById(id);
        if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });
        if (!problemset) throw new ErrorMessage('无此题单。');

        if (!res.locals.user || (!res.locals.user.is_admin && !await res.locals.user.hasPrivilege('manage_problemset'))) throw new ErrorMessage('您没有权限进行此操作。');

        await problemset.delete();

        res.redirect(syzoj.utils.makeUrl(['problemsets']));        
    } catch (e){
        syzoj.log(e);
        res.render('error', {
            err: e
        });       
    }
});

app.get('/problemset/:id', async (req, res) => {
    try{
        if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });
        const curUser = res.locals.user;
        let problemset_id = parseInt(req.params.id);

        let problemset = await Problemset.findById(problemset_id);
        if(!problemset) throw new ErrorMessage('无此题单。');
        const isSupervisitor = await problemset.isSupervisitor(curUser)

        if(!problemset.is_public && (!res.locals.user || !isSupervisitor))
            throw new ErrorMessage('题单尚未公开');
        
        problemset.subtitle = await syzoj.utils.markdown(problemset.subtitle);
        problemset.information = await syzoj.utils.markdown(problemset.information);

        let problems_id = await problemset.getProblems();
        let problems = await problems_id.mapAsync(async id => await Problem.findById(id));

        await problems.forEachAsync(async problem => {
            problem.allowedEdit = await problem.isAllowedEditBy(res.locals.user);
            problem.judge_state = await problem.getJudgeState(res.locals.user, true);
          });
        
        res.render('problemset',{
            problemset: problemset,
            problems: problems,
            isSupervisitor: isSupervisitor
        })  
    } catch (e){
        syzoj.log(e);
        res.render('error', {
            err: e
        });       
    }
});