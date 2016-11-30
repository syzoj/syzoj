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
    let page = parseInt(req.query.page);
    if (!page || page < 1) page = 1;

    let user = await User.fromName(req.query.submitter || '');
    let where = {};
    if (user) where.user_id = user.id;
    if (req.query.problem_id) where.problem_id = parseInt(req.query.problem_id);

    let count = await JudgeState.count(where);

    let pageCnt = Math.ceil(count / syzoj.config.page.judge_state);
    if (page > pageCnt) page = pageCnt;

    let judge_state = await JudgeState.query(page, syzoj.config.page.judge_state, where, [['submit_time', 'desc']]);

    await judge_state.forEachAsync(async obj => obj.hidden = !(await obj.isAllowedSeeResultBy(res.locals.user)));
    await judge_state.forEachAsync(async obj => obj.allowedSeeCode = await obj.isAllowedSeeCodeBy(res.locals.user));

    res.render('judge_state', {
      judge_state: judge_state,
      pageCnt: pageCnt,
      page: page,
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

app.get('/judge_detail/:id', async (req, res) => {
  try {
    let id = parseInt(req.params.id);
    let judge = await JudgeState.fromID(id);

    if (!await judge.isAllowedSeeCodeBy(res.locals.user)) throw 'Permission denied';

    judge.code = await syzoj.utils.highlight(judge.code, judge.language);
    if (judge.result.compiler_output) judge.result.compiler_output = syzoj.utils.ansiToHTML(judge.result.compiler_output);

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
