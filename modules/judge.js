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

app.get('/judge_state', async (req, res) => {
  try {
    let user = await User.fromName(req.query.submitter || '');
    let where = {};
    if (user) where.user_id = user.id;
    if (req.query.problem_id) where.problem_id = parseInt(req.query.problem_id);

    let paginate = syzoj.utils.paginate(await JudgeState.count(where), req.query.page, syzoj.config.page.judge_state);
    let judge_state = await JudgeState.query(paginate, where, [['submit_time', 'desc']]);

    await judge_state.forEachAsync(async obj => obj.hidden = !(await obj.isAllowedSeeResultBy(res.locals.user)));
    await judge_state.forEachAsync(async obj => obj.allowedSeeCode = await obj.isAllowedSeeCodeBy(res.locals.user));

    res.render('judge_state', {
      judge_state: judge_state,
      paginate: paginate,
      form: {
        submitter: req.query.submitter || '',
        problem_id: req.query.problem_id || ''
      }
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/judge_state/:id/ajax', async (req, res) => {
  try {
    let judge_state = await JudgeState.fromID(req.params.id);
    if (!judge_state) throw 'No such judge state';

    judge_state.hidden = !(await judge_state.isAllowedSeeResultBy(res.locals.user));
    judge_state.allowedSeeCode = await judge_state.isAllowedSeeCodeBy(res.locals.user);

    res.render('judge_state_item', {
      judge: judge_state
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/judge_detail/:id', async (req, res) => {
  try {
    let id = parseInt(req.params.id);
    let judge = await JudgeState.fromID(id);

    judge.code = await syzoj.utils.highlight(judge.code, judge.language);
    if (judge.result.compiler_output) judge.result.compiler_output = syzoj.utils.ansiToHTML(judge.result.compiler_output);
    judge.allowedSeeResult = await judge.isAllowedSeeResultBy(res.locals.user);
    judge.allowedSeeCode = await judge.isAllowedSeeCodeBy(res.locals.user);

    res.render('judge_detail', {
      judge: judge
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/judge_detail/:id/ajax', async (req, res) => {
  try {
    let id = parseInt(req.params.id);
    let judge = await JudgeState.fromID(id);

    judge.code = await syzoj.utils.highlight(judge.code, judge.language);
    if (judge.result.compiler_output) judge.result.compiler_output = syzoj.utils.ansiToHTML(judge.result.compiler_output);
    judge.allowedSeeResult = await judge.isAllowedSeeResultBy(res.locals.user);
    judge.allowedSeeCode = await judge.isAllowedSeeCodeBy(res.locals.user);

    res.render('judge_detail_item', {
      judge: judge
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});
