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

// APIs for judge client
app.apiRouter.post('/api/v2/judge/peek', async (req, res) => {
  try {
    if (req.query.session_id !== syzoj.config.judge_token) return res.status(404).send({ err: 'Permission denied' });

    let WaitingJudge = syzoj.model('waiting_judge');
    let JudgeState = syzoj.model('judge_state');

    let judge_state, custom_test;
    await syzoj.utils.lock('/api/v2/judge/peek', async () => {
      let waiting_judge = await WaitingJudge.findOne({ order: [['priority', 'ASC'], ['id', 'ASC']] });
      if (!waiting_judge) {
        return;
      }

      if (waiting_judge.type === 'submission') {
        judge_state = await waiting_judge.getJudgeState();
        await judge_state.loadRelationships();
      } else {
        custom_test = await waiting_judge.getCustomTest();
        await custom_test.loadRelationships();
      }
      await waiting_judge.destroy();
    });

    if (judge_state) {
      if (judge_state.problem.type === 'submit-answer') {
        res.send({
          have_task: 1,
          judge_id: judge_state.id,
          answer_file: judge_state.code,
          testdata: judge_state.problem.id,
          problem_type: judge_state.problem.type,
          type: 'submission'
        });
      } else {
        res.send({
          have_task: 1,
          judge_id: judge_state.id,
          code: judge_state.code,
          language: judge_state.language,
          testdata: judge_state.problem.id,
          time_limit: judge_state.problem.time_limit,
          memory_limit: judge_state.problem.memory_limit,
          file_io: judge_state.problem.file_io,
          file_io_input_name: judge_state.problem.file_io_input_name,
          file_io_output_name: judge_state.problem.file_io_output_name,
          problem_type: judge_state.problem.type,
          type: 'submission'
        });
      }
    } else if (custom_test) {
      res.send({
        have_task: 1,
        judge_id: custom_test.id,
        code: custom_test.code,
        language: custom_test.language,
        input_file: (await require('fs-extra').readFileAsync(custom_test.input_filepath)).toString(),
        time_limit: custom_test.problem.time_limit,
        memory_limit: custom_test.problem.memory_limit,
        file_io: custom_test.problem.file_io,
        file_io_input_name: custom_test.problem.file_io_input_name,
        file_io_output_name: custom_test.problem.file_io_output_name,
        problem_type: custom_test.problem.type,
        type: 'custom_test'
      });
    } else {
      res.send({ have_task: 0 });
    }
  } catch (e) {
    res.status(500).send(e);
  }
});

app.apiRouter.post('/api/v2/judge/update/:id', async (req, res) => {
  try {
    if (req.query.session_id !== syzoj.config.judge_token) return res.status(404).send({ err: 'Permission denied' });

    if (req.body.type === 'custom-test') {
      let CustomTest = syzoj.model('custom_test');
      let custom_test = CustomTest.fromID(req.params.id);
      await custom_test.updateResult(JSON.parse(req.body.result));
      await custom_test.save();
    } else if (req.body.type === 'submission') {
      let JudgeState = syzoj.model('judge_state');
      let judge_state = await JudgeState.fromID(req.params.id);
      await judge_state.updateResult(JSON.parse(req.body.result));
      await judge_state.save();
      await judge_state.updateRelatedInfo();
    }

    res.send({ return: 0 });
  } catch (e) {
    syzoj.log(e);
    res.status(500).send(e);
  }
});
