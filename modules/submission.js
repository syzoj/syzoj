let JudgeState = syzoj.model('judge_state');
let FormattedCode = syzoj.model('formatted_code');
let User = syzoj.model('user');
let Contest = syzoj.model('contest');
let Problem = syzoj.model('problem');

const jwt = require('jsonwebtoken');
const { getSubmissionInfo, getRoughResult, processOverallResult } = require('../libs/submissions_process');

const displayConfig = {
  showScore: true,
  showUsage: true,
  showCode: true,
  showResult: true,
  showOthers: true,
  showTestdata: true,
  showDetailResult: true,
  inContest: false,
  showRejudge: false
};

// s is JudgeState
app.get('/submissions', async (req, res) => {
  try {
    const curUser = res.locals.user;
    let user = await User.fromName(req.query.submitter || '');
    let where = {};
    let inContest = false;
    if (user) where.user_id = user.id;
    else if (req.query.submitter) where.user_id = -1;

    if (!req.query.contest) {
      where.type = { $eq: 0 };
    } else {
      const contestId = Number(req.query.contest);
      const contest = await Contest.fromID(contestId);
      contest.ended = contest.isEnded();
      if ((contest.ended && contest.is_public) || // If the contest is ended and is not hidden
        (curUser && await contest.isSupervisior(curUser)) // Or if the user have the permission to check
      ) {
        where.type = { $eq: 1 };
        where.type_info = { $eq: contestId };
        inContest = true;
      } else {
        throw new Error("您暂时无权查看此比赛的详细评测信息。");
      }
    }

    let minScore = parseInt(req.query.min_score);
    let maxScore = parseInt(req.query.max_score);

    if (!isNaN(minScore) || !isNaN(maxScore)) {
      if (isNaN(minScore)) minScore = 0;
      if (isNaN(maxScore)) maxScore = 100;
      if (!(minScore === 0 && maxScore === 100)) {
        where.score = {
          $and: {
            $gte: parseInt(minScore),
            $lte: parseInt(maxScore)
          }
        };
      }
    }

    if (req.query.language) {
      if (req.query.language === 'submit-answer') where.language = '';
      else where.language = req.query.language;
    }
    if (req.query.status) where.status = { $like: req.query.status + '%' };

    if (!inContest && (!curUser || !await curUser.hasPrivilege('manage_problem'))) {
      if (req.query.problem_id) {
        let problem_id = parseInt(req.query.problem_id);
        let problem = await Problem.fromID(problem_id);
        if (!problem)
          throw new ErrorMessage("无此题目。");
        if (await problem.isAllowedUseBy(res.locals.user)) {
          where.problem_id = {
            $and: [
              { $eq: where.problem_id = problem_id }
            ]
          };
        } else {
          throw new ErrorMessage("您没有权限进行此操作。");
        }
      } else {
        where.is_public = {
          $eq: true,
        };
      }
    } else {
      if (req.query.problem_id) where.problem_id = parseInt(req.query.problem_id) || -1;
    }

    let isFiltered = !!(where.problem_id || where.user_id || where.score || where.language || where.status);

    let paginate = syzoj.utils.paginate(await JudgeState.count(where), req.query.page, syzoj.config.page.judge_state);
    let judge_state = await JudgeState.query(paginate, where, [['id', 'desc']], true);

    await judge_state.forEachAsync(async obj => {
      await obj.loadRelationships();
      obj.code_length = obj.code.length;
    })

    res.render('submissions', {
      // judge_state: judge_state,
      items: judge_state.map(x => ({
        info: getSubmissionInfo(x, displayConfig),
        token: (x.pending && x.task_id != null) ? jwt.sign({
          taskId: x.task_id,
          type: 'rough',
          displayConfig: displayConfig
        }, syzoj.config.session_secret) : null,
        result: getRoughResult(x, displayConfig),
        running: false,
      })),
      paginate: paginate,
      pushType: 'rough',
      form: req.query,
      displayConfig: displayConfig,
      isFiltered: isFiltered
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/submission/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const judge = await JudgeState.fromID(id);
    if (!judge) throw new ErrorMessage("提交记录 ID 不正确。");
    const curUser = res.locals.user;
    if (!await judge.isAllowedVisitBy(curUser)) throw new ErrorMessage('您没有权限进行此操作。');

    let contest;
    if (judge.type === 1) {
      contest = await Contest.fromID(judge.type_info);
      contest.ended = contest.isEnded();

      if ((!contest.ended || !contest.is_public) &&
        !(await judge.problem.isAllowedEditBy(res.locals.user) || await contest.isSupervisior(curUser))) {
        throw new Error("比赛没有结束或者没有公开哦");
      }
    }

    await judge.loadRelationships();

    if (judge.problem.type !== 'submit-answer') {
      judge.code_length = judge.code.length;

      let key = syzoj.utils.getFormattedCodeKey(judge.code, judge.language);
      if (key) {
        let formattedCode = await FormattedCode.findOne({
          where: {
            key: key
          }
        });

        if (formattedCode) {
          judge.formattedCode = await syzoj.utils.highlight(formattedCode.code, syzoj.languages[judge.language].highlight);
        }
      }
      judge.code = await syzoj.utils.highlight(judge.code, syzoj.languages[judge.language].highlight);
    }

    displayConfig.showRejudge = await judge.problem.isAllowedEditBy(res.locals.user);
    res.render('submission', {
      info: getSubmissionInfo(judge, displayConfig),
      roughResult: getRoughResult(judge, displayConfig),
      code: (judge.problem.type !== 'submit-answer') ? judge.code.toString("utf8") : '',
      formattedCode: judge.formattedCode ? judge.formattedCode.toString("utf8") : null,
      preferFormattedCode: res.locals.user ? res.locals.user.prefer_formatted_code : false,
      detailResult: processOverallResult(judge.result, displayConfig),
      socketToken: (judge.pending && judge.task_id != null) ? jwt.sign({
        taskId: judge.task_id,
        type: 'detail',
        displayConfig: displayConfig
      }, syzoj.config.session_secret) : null,
      displayConfig: displayConfig,
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.post('/submission/:id/rejudge', async (req, res) => {
  try {
    let id = parseInt(req.params.id);
    let judge = await JudgeState.fromID(id);

    if (judge.pending && !(res.locals.user && await res.locals.user.hasPrivilege('manage_problem'))) throw new ErrorMessage('无法重新评测一个评测中的提交。');

    await judge.loadRelationships();

    let allowedRejudge = await judge.problem.isAllowedEditBy(res.locals.user);
    if (!allowedRejudge) throw new ErrorMessage('您没有权限进行此操作。');

    await judge.rejudge();

    res.redirect(syzoj.utils.makeUrl(['submission', id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});
