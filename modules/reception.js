let User = syzoj.model('user');
let JudgeState = syzoj.model('judge_state');
const RatingCalculation = syzoj.model('rating_calculation');
const Contest = syzoj.model('contest');
let UserApply = syzoj.model('user_apply');
let Problem = syzoj.model('problem');
let Article = syzoj.model('article');
let UserPrivilege = syzoj.model('user_privilege');
const RatingHistory = syzoj.model('rating_history');
let ContestPlayer = syzoj.model('contest_player');
const calcRating = require('../libs/rating');

app.get('/reception/info', async (req, res) => {
    try {
        if (!res.locals.user || !res.locals.user.is_admin) throw new ErrorMessage('您没有权限进行此操作。');
    
        let allSubmissionsCount = await JudgeState.count();
        let todaySubmissionsCount = await JudgeState.count({ submit_time: { $gte: syzoj.utils.getCurrentDate(true) } });
        let problemsCount = await Problem.count();
        let articlesCount = await Article.count();
        let contestsCount = await Contest.count();
        let usersCount = await User.count();
    
        res.render('reception_info', {
          allSubmissionsCount: allSubmissionsCount,
          todaySubmissionsCount: todaySubmissionsCount,
          problemsCount: problemsCount,
          articlesCount: articlesCount,
          contestsCount: contestsCount,
          usersCount: usersCount
        });
      } catch (e) {
        syzoj.log(e);
        res.render('error', {
          err: e
        })
      }
});

app.get('/reception/register', async (req, res) => {
    try {
        if (!res.locals.user || !res.locals.user.is_admin) throw new ErrorMessage('您没有权限进行此操作。');

        let username = res.locals.user.getLastUsername();
        if(username && /^[0-9]+$/.test(username)) {
            username = parseInt(username) + 1;
        }
        res.render('reception_register', {
            username: username
        });
      } catch (e) {
        syzoj.log(e);
        res.render('error', {
          err: e
        })
      }
});