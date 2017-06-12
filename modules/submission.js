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

app.get('/submissions', async (req, res) => {
  try {
    let user = await User.fromName(req.query.submitter || '');
    let where = {};
    if (user) where.user_id = user.id;
    else if (req.query.submitter) where.user_id = -1;
    if (req.query.problem_id) where.problem_id = parseInt(req.query.problem_id) || -1;

    let minScore = parseInt(req.query.min_score);
    if (isNaN(minScore)) minScore = 0;
    let maxScore = parseInt(req.query.max_score);
    if (isNaN(maxScore)) maxScore = 100;

    where.score = {
      $and: {
        $gte: parseInt(minScore),
        $lte: parseInt(maxScore)
      }
    };

    if (req.query.language) where.language = req.query.language;
    if (req.query.status) where.status = req.query.status;

    where.type = { $ne: 1 };

    if (!res.locals.user || !await res.locals.user.hasPrivilege('manage_problem')) {
      where.problem_id = {
        $in: syzoj.db.literal('(SELECT `id` FROM `problem` WHERE `is_public` = 1' + (res.locals.user ? (' OR `user_id` = ' + res.locals.user.id) : '') + ')')
      };
    }

    let paginate = syzoj.utils.paginate(await JudgeState.count(where), req.query.page, syzoj.config.page.judge_state);
    let judge_state = await JudgeState.query(paginate, where, [['submit_time', 'desc']]);

    await judge_state.forEachAsync(async obj => obj.loadRelationships());
    await judge_state.forEachAsync(async obj => obj.hidden = !(await obj.isAllowedSeeResultBy(res.locals.user)));
    await judge_state.forEachAsync(async obj => obj.allowedSeeCode = await obj.isAllowedSeeCodeBy(res.locals.user));
    await judge_state.forEachAsync(async obj => obj.allowedSeeData = await obj.isAllowedSeeDataBy(res.locals.user));

    res.render('submissions', {
      judge_state: judge_state,
      paginate: paginate,
      form: req.query
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/submissions/:id/ajax', async (req, res) => {
  try {
    let judge_state = await JudgeState.fromID(req.params.id);
    if (!judge_state) throw new ErrorMessage('无此提交记录。');

    await judge_state.loadRelationships();

    judge_state.hidden = !(await judge_state.isAllowedSeeResultBy(res.locals.user));
    judge_state.allowedSeeCode = await judge_state.isAllowedSeeCodeBy(res.locals.user);
    judge_state.allowedSeeData = await judge_state.isAllowedSeeDataBy(res.locals.user);

    let contest;
    if (judge_state.type === 1) {
      contest = await Contest.fromID(judge_state.type_info);
      let problems_id = await contest.getProblems();
      judge_state.problem_id = problems_id.indexOf(judge_state.problem_id) + 1;
      judge_state.problem.title = syzoj.utils.removeTitleTag(judge_state.problem.title);
    }

    res.render('submissions_item', {
      contest: contest,
      judge: judge_state
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

    let contest;
    if (judge.type === 1) contest = await Contest.fromID(judge.type_info);

    await judge.loadRelationships();

    judge.codeLength = judge.code.length;
    judge.code = await syzoj.utils.highlight(judge.code, syzoj.config.languages[judge.language].highlight);
    judge.allowedSeeResult = await judge.isAllowedSeeResultBy(res.locals.user);
    judge.allowedSeeCode = await judge.isAllowedSeeCodeBy(res.locals.user);
    judge.allowedSeeCase = await judge.isAllowedSeeCaseBy(res.locals.user);
    judge.allowedSeeData = await judge.isAllowedSeeDataBy(res.locals.user);
    judge.allowedRejudge = await judge.problem.isAllowedEditBy(res.locals.user);

    if (contest) {
      let problems_id = await contest.getProblems();
      judge.problem_id = problems_id.indexOf(judge.problem_id) + 1;
      judge.problem.title = syzoj.utils.removeTitleTag(judge.problem.title);
    }

    res.render('submission', {
      contest: contest,
      judge: judge
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/submission/:id/ajax', async (req, res) => {
  try {
    let id = parseInt(req.params.id);
    let judge = await JudgeState.fromID(id);

    let contest;
    if (judge.type === 1) contest = await Contest.fromID(judge.type_info);

    await judge.loadRelationships();

    judge.codeLength = judge.code.length;
    judge.code = await syzoj.utils.highlight(judge.code, syzoj.config.languages[judge.language].highlight);
    judge.allowedSeeResult = await judge.isAllowedSeeResultBy(res.locals.user);
    judge.allowedSeeCode = await judge.isAllowedSeeCodeBy(res.locals.user);
    judge.allowedSeeCase = await judge.isAllowedSeeCaseBy(res.locals.user);
    judge.allowedSeeData = await judge.isAllowedSeeDataBy(res.locals.user);
    judge.allowedRejudge = await judge.problem.isAllowedEditBy(res.locals.user);

    if (contest) {
      let problems_id = await contest.getProblems();
      judge.problem_id = problems_id.indexOf(judge.problem_id) + 1;
      judge.problem.title = syzoj.utils.removeTitleTag(judge.problem.title);
    }

    res.render('submission_content', {
      contest: contest,
      judge: judge
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/submission/:id/rejudge', async (req, res) => {
  try {
    let id = parseInt(req.params.id);
    let judge = await JudgeState.fromID(id);

    if (judge.pending && !req.query.force) throw new ErrorMessage('无法重新评测一个评测中的提交。');

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
