let JudgeState = syzoj.model('judge_state');
let FormattedCode = syzoj.model('formatted_code');
let User = syzoj.model('user');
let Contest = syzoj.model('contest');
let Problem = syzoj.model('problem');

const jwt = require('jsonwebtoken');
const { getSubmissionInfo, getRoughResult, processOverallResult } = require('../libs/submissions_process');

const displayConfig = {
  showScore: true,
  showUsage: false,
  showCode: false,
  showResult: true,
  showOthers: true,
  showTestdata: true,
  showDetailResult: false,
  inContest: false,
  showRejudge: false
};

app.get('/balloons', async (req, res) => {
  try {
    let query = JudgeState.createQueryBuilder("mt");

    const contestId = Number(req.query.contest);
    query.andWhere('type = 1');
    query.andWhere('type_info = :type_info', { type_info: contestId });
    query.andWhere('isnull(balloon_checked) or balloon_checked!=:checked', {checked:1});

    query.innerJoin(
      qb =>
        qb.from(JudgeState, 't')
          .select('MIN(submit_time)', 'MinDate')
          .addSelect("user_id")
          .addSelect("problem_id")
          .andWhere("type=1")
          .andWhere('type_info=:type_info', {type_info: contestId})
          .andWhere('status="Accepted"')
          .groupBy("user_id, problem_id")
      ,
      "t",
      'mt.submit_time=t.MinDate AND mt.user_id=t.user_id AND mt.problem_id=t.problem_id'
    );

    let judge_state, paginate;

    paginate = syzoj.utils.paginate(
      await JudgeState.countQuery(query),
      req.query.page,
      syzoj.config.page.judge_state
    );
    judge_state = await JudgeState.queryPage(paginate, query, { id: "ASC" }, true);


    await judge_state.forEachAsync(async obj => {
      await obj.loadRelationships();
    });

    //console.log(req.query.status)

    res.render('balloons', {
      items: judge_state.map(x => ({
        info: getSubmissionInfo(x, displayConfig),
        token: (x.pending && x.task_id != null) ? jwt.sign({
          taskId: x.task_id,
          type: 'rough',
          displayConfig: displayConfig
        }, syzoj.config.session_secret) : null,
        result: getRoughResult(x, displayConfig, true),
        running: false,
      })),
      paginate: paginate,
      pushType: 'rough',
      form: req.query,
      displayConfig: displayConfig,
      fast_pagination: syzoj.config.submissions_page_fast_pagination
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});


app.post('/submission/:id/confirm', async (req, res) => {
  try {
    let id = parseInt(req.params.id);
    let judge = await JudgeState.findById(id);

    if (judge.pending ) throw new ErrorMessage('无法确认一个评测中的提交。');

    judge.balloon_checked = true;
    await judge.save();

    JudgeState.query('UPDATE `judge_state` SET `balloon_checked` = true WHERE `id` = ' + id);

    res.redirect("back");

  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});
