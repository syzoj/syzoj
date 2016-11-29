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

let Problem = syzoj.model('problem');
let JudgeState = syzoj.model('judge_state');
let WaitingJudge = syzoj.model('waiting_judge');

app.get('/problem', async (req, res) => {
  try {
    let page = parseInt(req.query.page);
    if (!page || page < 1) page = 1;

    let count = await Problem.count();
    let pageCnt = Math.ceil(count / syzoj.config.page.problem);
    if (page > pageCnt) page = pageCnt;

    let problems = await Problem.query(page, syzoj.config.page.problem);

    await problems.forEachAsync(async problem => {
      problem.allowedEdit = await problem.isAllowedEditBy(res.locals.user);
      problem.status = await problem.getSubmitStatus(res.locals.user);
    });

    res.render('problem_set', {
      problems: problems,
      pageCnt: pageCnt,
      page: page
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/problem/:id', async (req, res) => {
  try {
    let id = parseInt(req.params.id);
    let problem = await Problem.fromID(id);
    if (!problem) throw 'No such problem.';

    if (!await problem.isAllowedUseBy(res.locals.user)) {
      throw 'Permission denied.';
    }

    problem.allowedEdit = await problem.isAllowedEditBy(res.locals.user);

    if (problem.is_public || problem.allowedEdit) {
      await syzoj.utils.markdown(problem, [ 'description', 'input_format', 'output_format', 'example', 'limit_and_hint' ]);
    } else {
      throw 'Permission denied';
    }

    res.render('problem', {
      problem: problem
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/problem/:id/edit', async (req, res) => {
  try {
    let id = parseInt(req.params.id);
    let problem = await Problem.fromID(id);

    if (!problem) {
      problem = await Problem.create();
      problem.id = id;
      problem.allowedEdit = true;
    } else {
      if (!await problem.isAllowedUseBy(res.locals.user)) throw 'Permission denied.';
      problem.allowedEdit = await problem.isAllowedEditBy(res.locals.user);
    }

    res.render('edit_problem', {
      problem: problem
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.post('/problem/:id/edit', async (req, res) => {
  try {
    let id = parseInt(req.params.id);
    let problem = await Problem.fromID(id);
    if (!problem) {
      problem = await Problem.create();
      if (id) problem.id = id;
      problem.user_id = res.locals.user.id;
    } else {
      if (!await problem.isAllowedUseBy(res.locals.user)) throw 'Permission denied.';
      if (!await problem.isAllowedEditBy(res.locals.user)) throw 'Permission denied.';
    }

    problem.title = req.body.title;
    problem.description = req.body.description;
    problem.input_format = req.body.input_format;
    problem.output_format = req.body.output_format;
    problem.example = req.body.example;
    problem.limit_and_hint = req.body.limit_and_hint;

    await problem.save();

    res.redirect(syzoj.utils.makeUrl(['problem', problem.id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/problem/:id/upload', async (req, res) => {
  try {
    let id = parseInt(req.params.id);
    let problem = await Problem.fromID(id);

    if (!problem) throw 'No such problem';
    if (!await problem.isAllowedEditBy(res.locals.user)) throw 'Permission denied';

    await problem.loadRelationships();

    res.render('upload_testdata', {
      problem: problem
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.post('/problem/:id/upload', app.multer.single('testdata'), async (req, res) => {
  try {
    let id = parseInt(req.params.id);
    let problem = await Problem.fromID(id);

    if (!problem) throw 'No such problem';
    if (!await problem.isAllowedEditBy(res.locals.user)) throw 'Permission denied';

    await problem.loadRelationships();

    problem.time_limit = req.body.time_limit;
    problem.memory_limit = req.body.memory_limit;
    problem.file_io = req.body.io_method === 'file-io';
    problem.file_io_input_name = req.body.file_io_input_name;
    problem.file_io_output_name = req.body.file_io_output_name;
    if (req.file) {
      await problem.updateTestdata(req.file.path);
    }

    await problem.save();

    res.redirect(syzoj.utils.makeUrl(['problem', id, 'upload']));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/submit/:id', async (req, res) => {
  try {
    let id = parseInt(req.params.id);
    let problem = await Problem.fromID(id);

    if (!problem) throw 'No such problem.';
    if (!res.locals.user) throw 'Please login.';
    if (!await problem.isAllowedUseBy(res.locals.user)) throw 'Permission denied.';

    res.render('submit', {
      problem: problem
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.post('/submit/:id', async (req, res) => {
  try {
    let id = parseInt(req.params.id);
    let problem = await Problem.fromID(id);

    if (!problem) throw 'No such problem.';
    if (!res.locals.user) throw 'Please login.';
    if (!await problem.isAllowedUseBy(res.locals.user)) throw 'Permission denied.';

    let judge_state = await JudgeState.create({
      code: req.body.code,
      language: req.body.language,
      user_id: res.locals.user.id,
      problem_id: req.params.id,
      type: problem.is_public ? 0 : 2
    });

    await judge_state.save();

    let waiting_judge = await WaitingJudge.create({
      judge_id: judge_state.id
    });

    await waiting_judge.save();

    res.redirect(syzoj.utils.makeUrl(['judge_detail', judge_state.id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/problem/:id/download', async (req, res) => {
  try {
    let id = parseInt(req.params.id);
    let problem = await Problem.fromID(id);

    if (!problem) throw 'No such problem';
    if (!await problem.isAllowedUseBy(res.locals.user)) throw 'Permission denied';

    await problem.loadRelationships();

    res.download(problem.testdata.getPath(), `testdata_${id}.zip`);
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});
