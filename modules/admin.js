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

let Problem = syzoj.model('problem');
let JudgeState = syzoj.model('judge_state');
let Article = syzoj.model('article');
let Contest = syzoj.model('contest');
let User = syzoj.model('user');
let UserPrivilege = syzoj.model('user_privilege');

let db = syzoj.db;

app.get('/admin/info', async (req, res) => {
  try {
    if (!res.locals.user || !res.locals.user.is_admin) throw new ErrorMessage('您没有权限进行此操作。');

    let allSubmissionsCount = await JudgeState.count();
    let todaySubmissionsCount = await JudgeState.count({ submit_time: { $gte: syzoj.utils.getCurrentDate(true) } });
    let problemsCount = await Problem.count();
    let articlesCount = await Article.count();
    let contestsCount = await Contest.count();
    let usersCount = await User.count();

    res.render('admin_info', {
      allSubmissionsCount: allSubmissionsCount,
      todaySubmissionsCount: todaySubmissionsCount,
      problemsCount: problemsCount,
      articlesCount: articlesCount,
      contestsCount: contestsCount,
      usersCount: usersCount
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    })
  }
});

let configItems = {
  'title': { name: '站点标题', type: String },
  '邮箱验证': null,
  'register_mail.enabled': { name: '启用', type: Boolean },
  'register_mail.address': { name: '发件人地址', type: String },
  'register_mail.key': { name: '密钥', type: String },
  '默认参数': null,
  'default.problem.time_limit': { name: '时间限制（单位：ms）', type: Number },
  'default.problem.memory_limit': { name: '空间限制（单位：MiB）', type: Number },
  '限制': null,
  'limit.time_limit': { name: '最大时间限制（单位：ms）', type: Number },
  'limit.memory_limit': { name: '最大空间限制（单位：MiB）', type: Number },
  'limit.data_size': { name: '所有数据包大小（单位：byte）', type: Number },
  'limit.testdata': { name: '测试数据大小（单位：byte）', type: Number },
  'limit.submit_code': { name: '代码长度（单位：byte）', type: Number },
  'limit.submit_answer': { name: '提交答案题目答案大小（单位：byte）', type: Number },
  'limit.custom_test_input': { name: '自定义测试输入文件大小（单位：byte）', type: Number },
  'limit.testdata_filecount': { name: '测试数据文件数量（单位：byte）', type: Number },
  '每页显示数量': null,
  'page.problem': { name: '题库', type: Number },
  'page.judge_state': { name: '提交记录', type: Number },
  'page.problem_statistics': { name: '题目统计', type: Number },
  'page.ranklist': { name: '排行榜', type: Number },
  'page.discussion': { name: '讨论', type: Number },
  'page.article_comment': { name: '评论', type: Number },
  'page.contest': { name: '比赛', type: Number },
  '编译器版本': null,
  'languages.cpp.version': { name: 'C++', type: String },
  'languages.cpp11.version': { name: 'C++11', type: String },
  'languages.csharp.version': { name: 'C#', type: String },
  'languages.c.version': { name: 'C', type: String },
  'languages.vala.version': { name: 'Vala', type: String },
  'languages.java.version': { name: 'Java', type: String },
  'languages.pascal.version': { name: 'Pascal', type: String },
  'languages.lua.version': { name: 'Lua', type: String },
  'languages.luajit.version': { name: 'LuaJIT', type: String },
  'languages.python2.version': { name: 'Python 2', type: String },
  'languages.python3.version': { name: 'Python 3', type: String },
  'languages.nodejs.version': { name: 'Node.js', type: String },
  'languages.ruby.version': { name: 'Ruby', type: String },
  'languages.haskell.version': { name: 'Haskell', type: String },
  'languages.ocaml.version': { name: 'OCaml', type: String },
  'languages.vbnet.version': { name: 'Visual Basic', type: String }
};

app.get('/admin/config', async (req, res) => {
  try {
    if (!res.locals.user || !res.locals.user.is_admin) throw new ErrorMessage('您没有权限进行此操作。');

    for (let i in configItems) {
      if (!configItems[i]) continue;
      configItems[i].val = eval(`syzoj.config.${i}`);
    }

    res.render('admin_config', {
      items: configItems
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    })
  }
});

app.post('/admin/config', async (req, res) => {
  try {
    if (!res.locals.user || !res.locals.user.is_admin) throw new ErrorMessage('您没有权限进行此操作。');

    for (let i in configItems) {
      if (!configItems[i]) continue;
      if (req.body[i]) {
        let val;
        if (configItems[i].type === Boolean) {
          val = req.body[i] === 'on';
        } else if (configItems[i].type === Number) {
          val = Number(req.body[i]);
        } else {
          val = req.body[i];
        }

        let f = new Function('val', `syzoj.config.${i} = val`);
        f(val);
      }
    }

    await syzoj.utils.saveConfig();

    res.redirect(syzoj.utils.makeUrl(['admin', 'config']));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    })
  }
});

app.get('/admin/privilege', async (req, res) => {
  try {
    if (!res.locals.user || !res.locals.user.is_admin) throw new ErrorMessage('您没有权限进行此操作。');

    let a = await UserPrivilege.query();
    let users = {};
    for (let p of a) {
      if (!users[p.user_id]) {
        users[p.user_id] = {
          user: await User.fromID(p.user_id),
          privileges: []
        };
      }

      users[p.user_id].privileges.push(p.privilege);
    }

    res.render('admin_privilege', {
      users: Object.values(users)
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    })
  }
});

app.post('/admin/privilege', async (req, res) => {
  try {
    if (!res.locals.user || !res.locals.user.is_admin) throw new ErrorMessage('您没有权限进行此操作。');

    let data = JSON.parse(req.body.data);
    for (let id in data) {
      let user = await User.fromID(id);
      if (!user) throw new ErrorMessage(`不存在 ID 为 ${id} 的用户。`);
      await user.setPrivileges(data[id]);
    }

    res.redirect(syzoj.utils.makeUrl(['admin', 'privilege']));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    })
  }
});

app.get('/admin/rejudge', async (req, res) => {
  try {
    if (!res.locals.user || !res.locals.user.is_admin) throw new ErrorMessage('您没有权限进行此操作。');

    res.render('admin_rejudge', {
      form: {},
      count: null
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    })
  }
});

app.post('/admin/rejudge', async (req, res) => {
  try {
    if (!res.locals.user || !res.locals.user.is_admin) throw new ErrorMessage('您没有权限进行此操作。');

    let user = await User.fromName(req.body.submitter || '');
    let where = {};
    if (user) where.user_id = user.id;
    else if (req.body.submitter) where.user_id = -1;

    let minID = parseInt(req.body.min_id);
    if (isNaN(minID)) minID = 0;
    let maxID = parseInt(req.body.max_id);
    if (isNaN(maxID)) maxID = 2147483647;

    where.id = {
      $and: {
        $gte: parseInt(minID),
        $lte: parseInt(maxID)
      }
    };

    let minScore = parseInt(req.body.min_score);
    if (isNaN(minScore)) minScore = 0;
    let maxScore = parseInt(req.body.max_score);
    if (isNaN(maxScore)) maxScore = 100;

    where.score = {
      $and: {
        $gte: parseInt(minScore),
        $lte: parseInt(maxScore)
      }
    };

    let minTime = syzoj.utils.parseDate(req.body.min_time);
    if (isNaN(minTime)) minTime = 0;
    let maxTime = syzoj.utils.parseDate(req.body.max_time);
    if (isNaN(maxTime)) maxTime = 2147483647;

    where.submit_time = {
      $and: {
        $gte: parseInt(minTime),
        $lte: parseInt(maxTime)
      }
    };

    if (req.body.language) {
      if (req.body.language === 'submit-answer') where.language = '';
      else where.language = req.body.language;
    }
    if (req.body.status) where.status = { $like: req.body.status + '%' };
    if (req.body.problem_id) where.problem_id = parseInt(req.body.problem_id) || -1;

    let count = await JudgeState.count(where);
    if (req.body.type === 'rejudge') {
      let submissions = await JudgeState.query(null, where);
      for (let submission of submissions) {
        await submission.rejudge();
      }
    }

    res.render('admin_rejudge', {
      form: req.body,
      count: count
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    })
  }
});

app.get('/admin/links', async (req, res) => {
  try {
    if (!res.locals.user || !res.locals.user.is_admin) throw new ErrorMessage('您没有权限进行此操作。');

    res.render('admin_links', {
      links: syzoj.config.links || []
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    })
  }
});

app.post('/admin/links', async (req, res) => {
  try {
    if (!res.locals.user || !res.locals.user.is_admin) throw new ErrorMessage('您没有权限进行此操作。');

    syzoj.config.links = JSON.parse(req.body.data);
    await syzoj.utils.saveConfig();

    res.redirect(syzoj.utils.makeUrl(['admin', 'links']));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    })
  }
});

app.get('/admin/raw', async (req, res) => {
  try {
    if (!res.locals.user || !res.locals.user.is_admin) throw new ErrorMessage('您没有权限进行此操作。');

    res.render('admin_raw', {
      data: JSON.stringify(syzoj.config, null, 2)
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    })
  }
});

app.post('/admin/raw', async (req, res) => {
  try {
    if (!res.locals.user || !res.locals.user.is_admin) throw new ErrorMessage('您没有权限进行此操作。');

    syzoj.config = JSON.parse(req.body.data);
    await syzoj.utils.saveConfig();

    res.redirect(syzoj.utils.makeUrl(['admin', 'raw']));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    })
  }
});
