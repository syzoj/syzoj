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

app.get('/api/v2/search/users/:keyword*?', async (req, res) => {
  try {
    let User = syzoj.model('user');

    let keyword = req.params.keyword || '';
    let conditions = [];
    const uid = parseInt(keyword);
    if (uid != null && !isNaN(uid)) {
      conditions.push({ id: uid });
    }
    if (keyword != null && String(keyword).length >= 2) {
      conditions.push({ username: { like: `%${req.params.keyword}%` } });
    }
    if (conditions.length === 0) {
      res.send({ success: true, results: [] });
    } else {
      let users = await User.query(null, {
        $or: conditions
      }, [['username', 'asc']]);

      let result = [];

      result = users.map(x => ({ name: `${x.username}`, value: x.id, url: syzoj.utils.makeUrl(['user', x.id]) }));
      res.send({ success: true, results: result });
    }
  } catch (e) {
    syzoj.log(e);
    res.send({ success: false });
  }
});

app.get('/api/v2/search/problems/:keyword*?', async (req, res) => {
  try {
    let Problem = syzoj.model('problem');

    let keyword = req.params.keyword || '';
    let problems = await Problem.query(null, {
      title: { like: `%${req.params.keyword}%` }
    }, [['id', 'asc']]);

    let result = [];

    let id = parseInt(keyword);
    if (id) {
      let problemById = await Problem.fromID(parseInt(keyword));
      if (problemById && await problemById.isAllowedUseBy(res.locals.user)) {
        result.push(problemById);
      }
    }
    await problems.forEachAsync(async problem => {
      if (await problem.isAllowedUseBy(res.locals.user) && result.length < syzoj.config.page.edit_contest_problem_list && problem.id !== id) {
        result.push(problem);
      }
    });

    result = result.map(x => ({ name: `#${x.id}. ${x.title}`, value: x.id, url: syzoj.utils.makeUrl(['problem', x.id]) }));
    res.send({ success: true, results: result });
  } catch (e) {
    syzoj.log(e);
    res.send({ success: false });
  }
});

app.get('/api/v2/search/tags/:keyword*?', async (req, res) => {
  try {
    let Problem = syzoj.model('problem');
    let ProblemTag = syzoj.model('problem_tag');

    let keyword = req.params.keyword || '';
    let tags = await ProblemTag.query(null, {
      name: { like: `%${req.params.keyword}%` }
    }, [['name', 'asc']]);

    let result = tags.slice(0, syzoj.config.page.edit_problem_tag_list);

    result = result.map(x => ({ name: x.name, value: x.id }));
    res.send({ success: true, results: result });
  } catch (e) {
    syzoj.log(e);
    res.send({ success: false });
  }
});

app.apiRouter.post('/api/v2/markdown', async (req, res) => {
  try {
    let s = await syzoj.utils.markdown(req.body.s.toString(), null, req.body.noReplaceUI === 'true');
    res.send(s);
  } catch (e) {
    syzoj.log(e);
    res.send(e);
  }
});

app.apiRouter.post('/api/v2/judge/compiled', async (req, res) => {
  try {
    if (req.get('Token') !== syzoj.config.judge_token) return res.status(403).send({ err: 'Incorrect token' });
    let data = req.body;

    let JudgeState = syzoj.model('judge_state');
    let judge_state = await JudgeState.findOne({ where: { task_id: req.body.taskId } });
    if (!judge_state) {
      res.send({ return: 1 }); // The task might have been rejudging.
      return;
    }
    judge_state.compilation = req.body.result;
    await judge_state.save();

    res.send({ return: 0 });
  } catch (e) {
    syzoj.log(e);
    res.status(500).send(e);
  }
});

app.apiRouter.post('/api/v2/judge/finished', async (req, res) => {
  try {
    if (req.get('Token') !== syzoj.config.judge_token) return res.status(403).send({ err: 'Incorrect token' });
    let data = req.body;

    let JudgeState = syzoj.model('judge_state');
    let judge_state = await JudgeState.findOne({ where: { task_id: req.body.taskId } });
    if (!judge_state) {
      res.send({ return: 1 }); // The task might have been rejudging.
      return;
    }
    // await judge_state.updateResult(JSON.parse(req.body));
    judge_state.score = data.score;
    judge_state.pending = false;
    judge_state.status = data.statusString;
    judge_state.total_time = data.time;
    judge_state.max_memory = data.memory;
    judge_state.result = data.result;
    await judge_state.save();
    await judge_state.updateRelatedInfo();

    res.send({ return: 0 });
  } catch (e) {
    syzoj.log(e);
    res.status(500).send(e);
  }
});
