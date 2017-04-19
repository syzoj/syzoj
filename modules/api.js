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

let User = syzoj.model('user');
let Problem = syzoj.model('problem');
let WaitingJudge = syzoj.model('waiting_judge');
let JudgeState = syzoj.model('judge_state');
let TestData = syzoj.model('testdata');

function setLoginCookie(username, password, res) {
  res.cookie('login', JSON.stringify([username, password]));
}

// Login
app.post('/api/login', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    let user = await User.fromName(req.body.username);

    if (!user) res.send({ error_code: 1001 });
    else if (user.password !== req.body.password) res.send({ error_code: 1002 });
    else {
      req.session.user_id = user.id;
      setLoginCookie(user.username, user.password, res);
      res.send({ error_code: 1 });
    }
  } catch (e) {
    syzoj.log(e);
    res.send({ error_code: e });
  }
});

// Sign up
app.post('/api/sign_up', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    let user = await User.fromName(req.body.username);
    if (user) throw 2008;

    // Because the salt is "syzoj2_xxx" and the "syzoj2_xxx" 's md5 is"59cb..."
    // the empty password 's md5 will equal "59cb.."
    let syzoj2_xxx_md5 = '59cb65ba6f9ad18de0dcd12d5ae11bd2';
    if (req.body.password === syzoj2_xxx_md5) throw 2007;
    if (!(req.body.email = req.body.email.trim())) throw 2006;
    if (!syzoj.utils.isValidUsername(req.body.username)) throw 2002;

    user = await User.create({
      username: req.body.username,
      password: req.body.password,
      email: req.body.email
    });
    await user.save();

    req.session.user_id = user.id;
    setLoginCookie(user.username, user.password, res);

    res.send(JSON.stringify({ error_code: 1 }));
  } catch (e) {
    syzoj.log(e);
    res.send(JSON.stringify({ error_code: e }));
  }
});

// Markdown
app.post('/api/markdown', async (req, res) => {
  try {
    let s = await syzoj.utils.markdown(req.body.s.toString());
    res.send(s);
  } catch (e) {
    syzoj.log(e);
    res.send(e);
  }
});

// APIs for judge client
app.get('/api/waiting_judge', async (req, res) => {
  try {
    if (req.query.session_id !== syzoj.config.judge_token) return res.status(404).send({ err: 'Permission denied' });

    let waiting_judge = await WaitingJudge.findOne();
    if (!waiting_judge) return res.send({ have_task: 0 });

    let judge_state = await waiting_judge.getJudgeState();
    await judge_state.loadRelationships();
    await judge_state.problem.loadRelationships();
    await waiting_judge.destroy();

    res.send({
      have_task: 1,
      judge_id: judge_state.id,
      code: judge_state.code,
      language: judge_state.language,
      testdata: judge_state.problem.testdata ? judge_state.problem.testdata.md5 : '',
      time_limit: judge_state.problem.time_limit,
      memory_limit: judge_state.problem.memory_limit,
      file_io: judge_state.problem.file_io,
      file_io_input_name: judge_state.problem.file_io_input_name,
      file_io_output_name: judge_state.problem.file_io_output_name
    });
  } catch (e) {
    syzoj.log(e);
    res.status(500).send(e);
  }
});

app.post('/api/update_judge/:id', async (req, res) => {
  try {
    if (req.query.session_id !== syzoj.config.judge_token) return res.status(404).send({ err: 'Permission denied' });

    let judge_state = await JudgeState.fromID(req.params.id);
    await judge_state.updateResult(JSON.parse(req.body.result));
    await judge_state.save();
    await judge_state.updateRelatedInfo();

    res.send({ return: 0 });
  } catch (e) {
    syzoj.log(e);
    res.status(500).send(e);
  }
});

app.get('/static/uploads/:md5', async (req, res) => {
  try {
    res.sendFile(TestData.resolvePath(req.params.md5));
  } catch (e) {
    res.status(500).send(e);
  }
})
