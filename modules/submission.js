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

    let query = JudgeState.createQueryBuilder();
    let isFiltered = false;

    let inContest = false;

    let user = await User.fromName(req.query.submitter || '');
    if (user) {
      query.andWhere('user_id = :user_id', { user_id: user.id });
      isFiltered = true;
    } else if (req.query.submitter) {
      query.andWhere('user_id = :user_id', { user_id: 0 });
      isFiltered = true;
    }

    if (!req.query.contest) {
      query.andWhere('type = 0');
    } else {
      const contestId = Number(req.query.contest);
      const contest = await Contest.findById(contestId);
      contest.ended = contest.isEnded();
      if ((contest.ended && contest.is_public) || // If the contest is ended and is not hidden
        (curUser && await contest.isSupervisior(curUser)) // Or if the user have the permission to check
      ) {
        query.andWhere('type = 1');
        query.andWhere('type_info = :type_info', { type_info: contestId });
        inContest = true;
      } else {
        throw new Error("您暂时无权查看此比赛的详细评测信息。");
      }
    }

    let minScore = parseInt(req.query.min_score);
    if (!isNaN(minScore)) query.andWhere('score >= :minScore', { minScore });
    let maxScore = parseInt(req.query.max_score);
    if (!isNaN(maxScore)) query.andWhere('score <= :maxScore', { maxScore });

    if (!isNaN(minScore) || !isNaN(maxScore)) isFiltered = true;

    if (req.query.language) {
      if (req.query.language === 'submit-answer') {
        query.andWhere(new TypeORM.Brackets(qb => {
          qb.orWhere('language = :language', { language: '' })
            .orWhere('language IS NULL');
        }));
        isFiltered = true;
      } else if (req.query.language === 'non-submit-answer') {
        query.andWhere('language != :language', { language: '' })
             .andWhere('language IS NOT NULL');
        isFiltered = true;
      } else {
        query.andWhere('language = :language', { language: req.query.language });
      }
    }

    if (req.query.status) {
      query.andWhere('status = :status', { status: req.query.status });
      isFiltered = true;
    }

    if (!inContest && (!curUser || !await curUser.hasPrivilege('manage_problem'))) {
      if (req.query.problem_id) {
        let problem_id = parseInt(req.query.problem_id);
        let problem = await Problem.findById(problem_id);
        if (!problem)
          throw new ErrorMessage("无此题目。");
        if (await problem.isAllowedUseBy(res.locals.user)) {
          query.andWhere('problem_id = :problem_id', { problem_id: parseInt(req.query.problem_id) || 0 });
          isFiltered = true;
        } else {
          throw new ErrorMessage("您没有权限进行此操作。");
        }
      } else {
        query.andWhere('is_public = true');
      }
    } else if (req.query.problem_id) {
      query.andWhere('problem_id = :problem_id', { problem_id: parseInt(req.query.problem_id) || 0 });
      isFiltered = true;
    }

    let judge_state, paginate;

    if (syzoj.config.submissions_page_fast_pagination) {
      const queryResult = await JudgeState.queryPageFast(query, syzoj.utils.paginateFast(
        req.query.currPageTop, req.query.currPageBottom, syzoj.config.page.judge_state
      ), -1, parseInt(req.query.page));

      judge_state = queryResult.data;
      paginate = queryResult.meta;
    } else {
      paginate = syzoj.utils.paginate(
        await JudgeState.countQuery(query),
        req.query.page,
        syzoj.config.page.judge_state
      );
      judge_state = await JudgeState.queryPage(paginate, query, { id: "DESC" }, true);
    }

    await judge_state.forEachAsync(async obj => {
      await obj.loadRelationships();
    });

    res.render('submissions', {
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
      isFiltered: isFiltered,
      fast_pagination: syzoj.config.submissions_page_fast_pagination
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
    const judge = await JudgeState.findById(id);
    if (!judge) throw new ErrorMessage("提交记录 ID 不正确。");
    const curUser = res.locals.user;
    if (!await judge.isAllowedVisitBy(curUser)) throw new ErrorMessage('您没有权限进行此操作。');

    let contest;
    if (judge.type === 1) {
      contest = await Contest.findById(judge.type_info);
      contest.ended = contest.isEnded();

      if ((!contest.ended || !contest.is_public) &&
        !(await judge.problem.isAllowedEditBy(res.locals.user) || await contest.isSupervisior(curUser))) {
        throw new Error("比赛未结束或未公开。");
      }
    }

    await judge.loadRelationships();

    if (judge.problem.type !== 'submit-answer') {
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
      roughResult: getRoughResult(judge, displayConfig, false),
      code: (judge.problem.type !== 'submit-answer') ? judge.code.toString("utf8") : '',
      formattedCode: judge.formattedCode ? judge.formattedCode.toString("utf8") : null,
      preferFormattedCode: res.locals.user ? res.locals.user.prefer_formatted_code : true,
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
    let judge = await JudgeState.findById(id);

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
