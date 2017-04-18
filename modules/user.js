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

// Ranklist
app.get('/ranklist', async (req, res) => {
  try {
    let paginate = syzoj.utils.paginate(await User.count({ is_show: true }), req.query.page, syzoj.config.page.ranklist);
    let ranklist = await User.query(paginate, { is_show: true }, [['ac_num', 'desc']]);
    await ranklist.forEachAsync(async x => x.renderInformation());

    res.render('ranklist', {
      ranklist: ranklist,
      paginate: paginate
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/find_user', async (req, res) => {
  try {
    let user = await User.fromName(req.query.nickname);
    if (!user) throw `Can't find user ${req.query.nickname}`;
    res.redirect(syzoj.utils.makeUrl(['user', user.id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

// Login
app.get('/login', async (req, res) => {
  if (res.locals.user) {
    res.render('error', {
      err: 'Please logout first'
    });
  } else {
    res.render('login');
  }
});

// Sign up
app.get('/sign_up', async (req, res) => {
  if (res.locals.user) {
    res.render('error', {
      err: 'Please logout first'
    });
  } else {
    res.render('sign_up');
  }
});

// Logout
app.get('/logout', async (req, res) => {
  req.session.user_id = null;
  res.redirect(req.query.url || '/');
});

// User page
app.get('/user/:id', async (req, res) => {
  try {
    let id = parseInt(req.params.id);
    let user = await User.fromID(id);
    user.ac_problems = await user.getACProblems();
    user.articles = await user.getArticles();
    user.allowedEdit = await user.isAllowedEditBy(res.locals.user);

    let statistics = await user.getStatistics();
    await user.renderInformation();

    res.render('user', {
      show_user: user,
      statistics: statistics
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/user/:id/edit', async (req, res) => {
  try {
    let id = parseInt(req.params.id);
    let user = await User.fromID(id);
    if (!user) throw 'No such user.';

    let allowedEdit = await user.isAllowedEditBy(res.locals.user);
    if (!allowedEdit) {
      throw 'Permission denied';
    }

    res.render('user_edit', {
      edited_user: user,
      error_info: null
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.post('/user/:id/edit', async (req, res) => {
  let user;
  try {
    let id = parseInt(req.params.id);
    user = await User.fromID(id);

    let allowedEdit = await user.isAllowedEditBy(res.locals.user);
    if (!allowedEdit) throw 'Permission denied.';

    if (req.body.old_password && req.body.new_password) {
      if (user.password !== req.body.old_password && !res.locals.user.is_admin) throw 'Old password wrong.';
      user.password = req.body.new_password;
    }

    if (res.locals.user.is_admin) {
      if (!syzoj.utils.isValidUsername(req.body.username)) throw 'Invalid username.';
      user.username = req.body.username;
    }

    user.email = req.body.email;
    user.information = req.body.information;
    user.sex = req.body.sex;

    await user.save();

    if (user.id === res.locals.user.id) res.locals.user = user;

    res.render('user_edit', {
      edited_user: user,
      error_info: 'Success'
    });
  } catch (e) {
    res.render('user_edit', {
      edited_user: user,
      error_info: e
    });
  }
});
