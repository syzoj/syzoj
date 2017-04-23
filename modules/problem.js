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
let Contest = syzoj.model('contest');
let ProblemTag = syzoj.model('problem_tag');
let ProblemTagMap = syzoj.model('problem_tag_map');

app.get('/problems', async (req, res) => {
  try {
    let paginate = syzoj.utils.paginate(await Problem.count(), req.query.page, syzoj.config.page.problem);
    let problems = await Problem.query(paginate);

    await problems.forEachAsync(async problem => {
      problem.allowedEdit = await problem.isAllowedEditBy(res.locals.user);
      problem.judge_state = await problem.getJudgeState(res.locals.user, true);
      problem.tags = await problem.getTags();
    });

    res.render('problems', {
      allowedManageTag: res.locals.user && await res.locals.user.hasPrivilege('manage_problem_tag'),
      problems: problems,
      paginate: paginate
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/problems/search', async (req, res) => {
  try {
    let id = parseInt(req.query.keyword) || 0;

    let where = {
      $or: {
        title: { like: `%${req.query.keyword}%` },
        id: id
      }
    };

    let order = [syzoj.db.literal('`id` = ' + id + ' DESC')];

    let paginate = syzoj.utils.paginate(await Problem.count(where), req.query.page, syzoj.config.page.problem);
    let problems = await Problem.query(paginate, where, order);

    await problems.forEachAsync(async problem => {
      problem.allowedEdit = await problem.isAllowedEditBy(res.locals.user);
      problem.judge_state = await problem.getJudgeState(res.locals.user, true);
      problem.tags = await problem.getTags();
    });

    res.render('problems', {
      allowedManageTag: res.locals.user && await res.locals.user.hasPrivilege('manage_problem_tag'),
      problems: problems,
      paginate: paginate
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/problems/tag/:tagIDs', async (req, res) => {
  try {
    let tagIDs = Array.from(new Set(req.params.tagIDs.split(',').map(x => parseInt(x))));
    let tags = await tagIDs.mapAsync(async tagID => ProblemTag.fromID(tagID));

    // Validate the tagIDs
    for (let tag of tags) {
      if (!tag) {
        return res.redirect(syzoj.utils.makeUrl(['problems']));
      }
    }

    let sql = 'SELECT * FROM `problem` WHERE\n';
    for (let tagID of tagIDs) {
      if (tagID !== tagIDs[0]) {
        sql += 'AND\n';
      }

      sql += '`problem`.`id` IN (SELECT `problem_id` FROM `problem_tag_map` WHERE `tag_id` = ' + tagID + ')';
    }

    let paginate = syzoj.utils.paginate(await Problem.count(sql), req.query.page, syzoj.config.page.problem);
    let problems = await Problem.query(sql);

    await problems.forEachAsync(async problem => {
      problem.allowedEdit = await problem.isAllowedEditBy(res.locals.user);
      problem.judge_state = await problem.getJudgeState(res.locals.user, true);
      problem.tags = await problem.getTags();
    });

    res.render('problems', {
      allowedManageTag: res.locals.user && await res.locals.user.hasPrivilege('manage_problem_tag'),
      problems: problems,
      tags: tags,
      paginate: paginate
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
    if (!problem) throw new ErrorMessage('无此题目。');

    if (!await problem.isAllowedUseBy(res.locals.user)) {
      throw new ErrorMessage('您没有权限进行此操作。');
    }

    problem.allowedEdit = await problem.isAllowedEditBy(res.locals.user);
    problem.allowedManage = await problem.isAllowedManageBy(res.locals.user);

    if (problem.is_public || problem.allowedEdit) {
      await syzoj.utils.markdown(problem, [ 'description', 'input_format', 'output_format', 'example', 'limit_and_hint' ]);
    } else {
      throw new ErrorMessage('您没有权限进行此操作。');
    }

    let state = await problem.getJudgeState(res.locals.user, false);

    problem.tags = await problem.getTags();

    res.render('problem', {
      problem: problem,
      state: state
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/problem/:id/export', async (req, res) => {
  try {
    let id = parseInt(req.params.id);
    let problem = await Problem.fromID(id);
    if (!problem || !problem.is_public) throw new ErrorMessage('无此题目。');

    let obj = {
      title: problem.title,
      description: problem.description,
      input_format: problem.input_format,
      output_format: problem.output_format,
      example: problem.example,
      limit_and_hint: problem.limit_and_hint,
      time_limit: problem.time_limit,
      memory_limit: problem.memory_limit,
      file_io: problem.file_io,
      file_io_input_name: problem.file_io_input_name,
      file_io_output_name: problem.file_io_output_name,
      tags: []
    };

    let tags = await problem.getTags();

    obj.tags = tags.map(tag => tag.name);

    res.send({ success: true, obj: obj });
  } catch (e) {
    syzoj.log(e);
    res.send({ success: false, error: e });
  }
});

app.get('/problem/:id/edit', async (req, res) => {
  try {
    let id = parseInt(req.params.id) || 0;
    let problem = await Problem.fromID(id);

    if (!problem) {
      if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });
      problem = await Problem.create();
      problem.id = id;
      problem.allowedEdit = true;
      problem.tags = [];
      problem.new = true;
    } else {
      if (!await problem.isAllowedUseBy(res.locals.user)) throw new ErrorMessage('您没有权限进行此操作。');
      problem.allowedEdit = await problem.isAllowedEditBy(res.locals.user);
      problem.tags = await problem.getTags();
    }

    problem.allowedManage = await problem.isAllowedManageBy(res.locals.user);

    res.render('problem_edit', {
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
    let id = parseInt(req.params.id) || 0;
    let problem = await Problem.fromID(id);
    if (!problem) {
      if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });

      problem = await Problem.create();

      let customID = parseInt(req.body.id);
      if (customID) {
        if (await Problem.fromID(customID)) throw new ErrorMessage('ID 已被使用。');
        problem.id = customID;
      } else if (id) problem.id = id;

      problem.user_id = res.locals.user.id;
    } else {
      if (!await problem.isAllowedUseBy(res.locals.user)) throw new ErrorMessage('您没有权限进行此操作。');
      if (!await problem.isAllowedEditBy(res.locals.user)) throw new ErrorMessage('您没有权限进行此操作。');

      if (await res.locals.user.hasPrivilege('manage_problem')) {
        let customID = parseInt(req.body.id);
        if (customID && customID !== id) {
          if (await Problem.fromID(customID)) throw new ErrorMessage('ID 已被使用。');
          await problem.changeID(customID);
        }
      }
    }

    problem.title = req.body.title;
    problem.description = req.body.description;
    problem.input_format = req.body.input_format;
    problem.output_format = req.body.output_format;
    problem.example = req.body.example;
    problem.limit_and_hint = req.body.limit_and_hint;

    // Save the problem first, to have the `id` allocated
    await problem.save();

    if (!req.body.tags) {
      req.body.tags = [];
    } else if (!Array.isArray(req.body.tags)) {
      req.body.tags = [req.body.tags];
    }

    let newTagIDs = await req.body.tags.map(x => parseInt(x)).filterAsync(async x => ProblemTag.fromID(x));
    await problem.setTags(newTagIDs);

    res.redirect(syzoj.utils.makeUrl(['problem', problem.id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/problem/:id/import', async (req, res) => {
  try {
    let id = parseInt(req.params.id) || 0;
    let problem = await Problem.fromID(id);

    if (!problem) {
      if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });

      problem = await Problem.create();
      problem.id = id;
      problem.new = true;
      problem.user_id = res.locals.user.id;
    } else {
      if (!await problem.isAllowedUseBy(res.locals.user)) throw new ErrorMessage('您没有权限进行此操作。');
      if (!await problem.isAllowedEditBy(res.locals.user)) throw new ErrorMessage('您没有权限进行此操作。');
    }

    res.render('problem_import', {
      problem: problem
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.post('/problem/:id/import', async (req, res) => {
  try {
    let id = parseInt(req.params.id) || 0;
    let problem = await Problem.fromID(id);
    if (!problem) {
      if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });

      problem = await Problem.create();

      let customID = parseInt(req.body.id);
      if (customID) {
        if (await Problem.fromID(customID)) throw new ErrorMessage('ID 已被使用。');
        problem.id = customID;
      } else if (id) problem.id = id;

      problem.user_id = res.locals.user.id;
    } else {
      if (!await problem.isAllowedUseBy(res.locals.user)) throw new ErrorMessage('您没有权限进行此操作。');
      if (!await problem.isAllowedEditBy(res.locals.user)) throw new ErrorMessage('您没有权限进行此操作。');
    }

    let request = require('request-promise');
    let url = require('url');

    let json = await request({
      uri: req.body.url + (req.body.url.endsWith('/') ? 'export' : '/export'),
      timeout: 1500,
      json: true
    });

    if (!json.success) throw new ErrorMessage('题目加载失败。', null, json.error);

    problem.title = json.obj.title;
    problem.description = json.obj.description;
    problem.input_format = json.obj.input_format;
    problem.output_format = json.obj.output_format;
    problem.example = json.obj.example;
    problem.limit_and_hint = json.obj.limit_and_hint;
    problem.time_limit = json.obj.time_limit;
    problem.memory_limit = json.obj.memory_limit;
    problem.file_io = json.obj.file_io;
    problem.file_io_input_name = json.obj.file_io_input_name;
    problem.file_io_output_name = json.obj.file_io_output_name;

    let validateMsg = await problem.validate();
    if (validateMsg) throw new ErrorMessage('无效的题目数据配置。', null, validateMsg);

    await problem.save();

    let tagIDs = (await json.obj.tags.mapAsync(name => ProblemTag.findOne({ where: { name: name } }))).filter(x => x).map(tag => tag.id);
    await problem.setTags(tagIDs);

    let download = require('download');
    let tmp = require('tmp-promise');
    let tmpFile = await tmp.file();
    let fs = require('bluebird').promisifyAll(require('fs'));

    try {
      let data = await download(req.body.url + (req.body.url.endsWith('/') ? 'download' : '/download'));
      await fs.writeFileAsync(tmpFile.path, data);
      await problem.updateTestdata(tmpFile.path);
    } catch (e) {
      syzoj.log(e);
    }

    res.redirect(syzoj.utils.makeUrl(['problem', problem.id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/problem/:id/data', async (req, res) => {
  try {
    let id = parseInt(req.params.id);
    let problem = await Problem.fromID(id);

    if (!problem) throw new ErrorMessage('无此题目。');
    if (!await problem.isAllowedEditBy(res.locals.user)) throw new ErrorMessage('您没有权限进行此操作。');

    await problem.loadRelationships();

    res.render('problem_data', {
      problem: problem
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.post('/problem/:id/data', app.multer.single('testdata'), async (req, res) => {
  try {
    let id = parseInt(req.params.id);
    let problem = await Problem.fromID(id);

    if (!problem) throw new ErrorMessage('无此题目。');
    if (!await problem.isAllowedEditBy(res.locals.user)) throw new ErrorMessage('您没有权限进行此操作。');

    await problem.loadRelationships();

    problem.time_limit = req.body.time_limit;
    problem.memory_limit = req.body.memory_limit;
    problem.file_io = req.body.io_method === 'file-io';
    problem.file_io_input_name = req.body.file_io_input_name;
    problem.file_io_output_name = req.body.file_io_output_name;

    let validateMsg = await problem.validate();
    if (validateMsg) throw new ErrorMessage('无效的题目数据配置。', null, validateMsg);

    if (req.file) {
      await problem.updateTestdata(req.file.path);
    }

    await problem.save();

    res.redirect(syzoj.utils.makeUrl(['problem', id, 'data']));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

// Set problem public
async function setPublic(req, res, is_public) {
  try {
    let id = parseInt(req.params.id);
    let problem = await Problem.fromID(id);
    if (!problem) throw new ErrorMessage('无此题目。');

    let allowedManage = await problem.isAllowedManageBy(res.locals.user);
    if (!allowedManage) throw new ErrorMessage('您没有权限进行此操作。');

    problem.is_public = is_public;
    await problem.save();

    res.redirect(syzoj.utils.makeUrl(['problem', id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
}

app.get('/problem/:id/public', async (req, res) => {
  await setPublic(req, res, true);
});

app.get('/problem/:id/dis_public', async (req, res) => {
  await setPublic(req, res, false);
});

app.post('/problem/:id/submit', async (req, res) => {
  try {
    let id = parseInt(req.params.id);
    let problem = await Problem.fromID(id);

    if (!problem) throw new ErrorMessage('无此题目。');
    if (!syzoj.config.languages[req.body.language]) throw new ErrorMessage('不支持该语言。');
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });

    let judge_state = await JudgeState.create({
      code: req.body.code,
      language: req.body.language,
      user_id: res.locals.user.id,
      problem_id: req.params.id
    });

    let contest_id = parseInt(req.query.contest_id);
    if (contest_id) {
      let contest = await Contest.fromID(contest_id);
      if (!contest) throw new ErrorMessage('无此比赛。');
      let problems_id = await contest.getProblems();
      if (!problems_id.includes(id)) throw new ErrorMessage('无此题目。');

      judge_state.type = 1;
      judge_state.type_info = contest_id;

      await judge_state.save();
    } else {
      if (!await problem.isAllowedUseBy(res.locals.user)) throw new ErrorMessage('您没有权限进行此操作。');
      judge_state.type = problem.is_public ? 0 : 2;
      await judge_state.save();
    }
    await judge_state.updateRelatedInfo(true);

    let waiting_judge = await WaitingJudge.create({
      judge_id: judge_state.id
    });

    await waiting_judge.save();

    if (contest_id) {
      res.redirect(syzoj.utils.makeUrl(['contest', contest_id]));
    } else {
      res.redirect(syzoj.utils.makeUrl(['submission', judge_state.id]));
    }
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

    if (!problem) throw new ErrorMessage('无此题目。');
    if (!await problem.isAllowedUseBy(res.locals.user)) throw new ErrorMessage('您没有权限进行此操作。');

    await problem.loadRelationships();

    if (!problem.testdata) throw new ErrorMessage('无测试数据。');

    res.download(problem.testdata.getPath(), `testdata_${id}.zip`);
  } catch (e) {
    syzoj.log(e);
    res.status(404);
    res.render('error', {
      err: e
    });
  }
});

app.get('/problem/:id/statistics/:type', async (req, res) => {
  try {
    let id = parseInt(req.params.id);
    let problem = await Problem.fromID(id);

    if (!problem) throw new ErrorMessage('无此题目。');
    if (!await problem.isAllowedUseBy(res.locals.user)) throw new ErrorMessage('您没有权限进行此操作。');

    let count = await problem.countStatistics(req.params.type);
    if (count === null) throw new ErrorMessage('无此统计类型。');

    let paginate = syzoj.utils.paginate(count, req.query.page, syzoj.config.page.problem_statistics);
    let statistics = await problem.getStatistics(req.params.type, paginate);

    await statistics.judge_state.forEachAsync(async x => x.loadRelationships());

    res.render('statistics', {
      statistics: statistics,
      paginate: paginate,
      problem: problem
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});
