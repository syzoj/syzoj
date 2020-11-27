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