let User = syzoj.model('user');
const RatingCalculation = syzoj.model('rating_calculation');
const RatingHistory = syzoj.model('rating_history');
const Contest = syzoj.model('contest');
const ContestPlayer = syzoj.model('contest_player');
let UserApply = syzoj.model('user_apply');

app.get('/reception/info', async (req, res) => {
    try {
        if (!res.locals.user || !res.locals.user.is_admin) throw new ErrorMessage('您没有权限进行此操作。');
    
        let allSubmissionsCount = await JudgeState.count();
        let todaySubmissionsCount = await JudgeState.count({ submit_time: { $gte: syzoj.utils.getCurrentDate(true) } });
        let problemsCount = await Problem.count();
        let articlesCount = await Article.count();
        let contestsCount = await Contest.count();
        let usersCount = await User.count();
    
        res.render('admin_info', {
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