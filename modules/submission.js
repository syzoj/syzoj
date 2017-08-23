/*
 *  This file is part of SYZOJ.
 *
 *  Copyright (c) 2016 Menci <huanghaorui301@gmail.com>
 *
 *  SYZOJ is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  SYZOJ is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public
 *  License along with SYZOJ. If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

let JudgeState = syzoj.model('judge_state');
let User = syzoj.model('user');
let Contest = syzoj.model('contest');

const jwt = require('jsonwebtoken');
const { getSubmissionInfo, getRoughResult } = require('../libs/submissions_process');

// s is JudgeState
app.get('/submissions', async (req, res) => {
  try {
    const curUser = res.locals.user;
    let user = await User.fromName(req.query.submitter || '');
    let where = {};
    if (user) where.user_id = user.id;
    else if (req.query.submitter) where.user_id = -1;

    if (req.query.contest == null) {
      where.type = { $ne: 1 };
    } else {
      const contestId = Number(req.query.contest);
      const contest = await Contest.fromID(contestId);
      contest.ended = contest.isEnded();
      if (contest.ended || // If the contest is ended
        (curUser && contest.isSupervisior(curUser)) // Or if the user have the permission to check
      ) {
        where.type = { $eq: 1 };
        where.type_info = { $eq: contestId };
      } else {
        throw new Error("您暂时无权查看此比赛的详细评测信息。");
      }
    }

    let minScore = parseInt(req.query.min_score);
    let maxScore = parseInt(req.query.max_score);

    if (!isNaN(minScore) || !isNaN(maxScore)) {
      if (isNaN(minScore)) minScore = 0;
      if (isNaN(maxScore)) maxScore = 100;
      where.score = {
        $and: {
          $gte: parseInt(minScore),
          $lte: parseInt(maxScore)
        }
      };
    }

    if (req.query.language) {
      if (req.query.language === 'submit-answer') where.language = '';
      else where.language = req.query.language;
    }
    if (req.query.status) where.status = { $like: req.query.status + '%' };

    if (!curUser || !await curUser.hasPrivilege('manage_problem')) {
      if (req.query.problem_id) {
        where.problem_id = {
          $and: [
            { $in: syzoj.db.literal('(SELECT `id` FROM `problem` WHERE `is_public` = 1' + (res.locals.user ? (' OR `user_id` = ' + res.locals.user.id) : '') + ')') },
            { $eq: where.problem_id = parseInt(req.query.problem_id) || -1 }
          ]
        };
      } else {
        where.problem_id = {
          $in: syzoj.db.literal('(SELECT `id` FROM `problem` WHERE `is_public` = 1' + (res.locals.user ? (' OR `user_id` = ' + res.locals.user.id) : '') + ')'),
        };
      }
    } else {
      if (req.query.problem_id) where.problem_id = parseInt(req.query.problem_id) || -1;
    }

    let paginate = syzoj.utils.paginate(await JudgeState.count(where), req.query.page, syzoj.config.page.judge_state);
    let judge_state = await JudgeState.query(paginate, where, [['submit_time', 'desc']]);

    await judge_state.forEachAsync(async obj => obj.loadRelationships());

    const displayConfig = {
      pushType: 'rough',
      hideScore: false,
      hideUsage: false,
      hideCode: false,
      hideResult: false,
      hideOthers: false,
      inContest: false,
      showDetailResult: true
    };
    res.render('submissions', {
      // judge_state: judge_state,
      items: judge_state.map(x => ({
        info: getSubmissionInfo(x, displayConfig),
        token: (getRoughResult(x, displayConfig) == null) ? jwt.sign({
          taskId: x.id,
          displayConfig: displayConfig
        }, syzoj.config.judge_token) : null,
        result: getRoughResult(x, displayConfig),
        running: false,
      })),
      paginate: paginate,
      form: req.query,
      displayConfig: displayConfig,
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
    let id = parseInt(req.params.id);
    let judge = await JudgeState.fromID(id);
    if (!judge || !await judge.isAllowedVisitBy(res.locals.user)) throw new ErrorMessage('您没有权限进行此操作。');

    let contest;
    if (judge.type === 1) {
      contest = await Contest.fromID(judge.type_info);
      contest.ended = contest.isEnded();
      let problems_id = await contest.getProblems();
      judge.problem_id = problems_id.indexOf(judge.problem_id) + 1;
      judge.problem.title = syzoj.utils.removeTitleTag(judge.problem.title);

      if (!contest.ended && !await judge.problem.isAllowedEditBy(res.locals.user)) {
        throw new Error("对不起，在比赛结束之前，您不能查看评测结果。");
      }
    }

    await judge.loadRelationships();

    if (judge.problem.type !== 'submit-answer') {
      judge.codeLength = judge.code.length;
      judge.code = await syzoj.utils.highlight(judge.code, syzoj.config.languages[judge.language].highlight);
    }

    judge.allowedRejudge = await judge.problem.isAllowedEditBy(res.locals.user);
    judge.allowedManage = await judge.problem.isAllowedManageBy(res.locals.user);

    res.render('submission', {
      info: getSubmissionInfo(judge),
      roughResult: getRoughResult(judge),
      code: (judge.problem.type !== 'submit-answer') ? judge.code.toString("utf8") : '',
      detailResult: judge.result,
      socketToken: judge.pending ? jwt.sign({
        taskId: judge.id,
        type: 'detail'
      }, syzoj.config.judge_token) : null
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
