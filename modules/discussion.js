let Problem = syzoj.model('problem');
let Article = syzoj.model('article');
let ArticleComment = syzoj.model('article-comment');
let User = syzoj.model('user');

app.get('/discussion/:type?', async (req, res) => {
  try {
    if (!['global', 'problems'].includes(req.params.type)) {
      res.redirect(syzoj.utils.makeUrl(['discussion', 'global']));
    }
    const in_problems = req.params.type === 'problems';

    let where;
    if (in_problems) {
      where = { problem_id: TypeORM.Not(TypeORM.IsNull()) };
    } else {
      where = { problem_id: null };
    }
    let paginate = syzoj.utils.paginate(await Article.countForPagination(where), req.query.page, syzoj.config.page.discussion);
    let articles = await Article.queryPage(paginate, where, {
      sort_time: 'DESC'
    });

    for (let article of articles) {
      await article.loadRelationships();
      if (in_problems) {
        article.problem = await Problem.findById(article.problem_id);
      }
    }

    res.render('discussion', {
      articles: articles,
      paginate: paginate,
      problem: null,
      in_problems: in_problems
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/discussion/problem/:pid', async (req, res) => {
  try {
    let pid = parseInt(req.params.pid);
    let problem = await Problem.findById(pid);
    if (!problem) throw new ErrorMessage('无此题目。');
    if (!await problem.isAllowedUseBy(res.locals.user)) {
      throw new ErrorMessage('您没有权限进行此操作。');
    }

    let where = { problem_id: pid };
    let paginate = syzoj.utils.paginate(await Article.countForPagination(where), req.query.page, syzoj.config.page.discussion);
    let articles = await Article.queryPage(paginate, where, {
      sort_time: 'DESC'
    });

    for (let article of articles) await article.loadRelationships();

    res.render('discussion', {
      articles: articles,
      paginate: paginate,
      problem: problem,
      in_problems: false
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/article/:id', async (req, res) => {
  try {
    let id = parseInt(req.params.id);
    let article = await Article.findById(id);
    if (!article) throw new ErrorMessage('无此帖子。');

    await article.loadRelationships();
    article.allowedEdit = await article.isAllowedEditBy(res.locals.user);
    article.allowedComment = await article.isAllowedCommentBy(res.locals.user);
    article.content = await syzoj.utils.markdown(article.content);

    let where = { article_id: id };
    let commentsCount = await ArticleComment.countForPagination(where);
    let paginate = syzoj.utils.paginate(commentsCount, req.query.page, syzoj.config.page.article_comment);

    let comments = await ArticleComment.queryPage(paginate, where, {
      public_time: 'DESC'
    });

    for (let comment of comments) {
      comment.content = await syzoj.utils.markdown(comment.content);
      comment.allowedEdit = await comment.isAllowedEditBy(res.locals.user);
      await comment.loadRelationships();
    }

    let problem = null;
    if (article.problem_id) {
      problem = await Problem.findById(article.problem_id);
      if (!await problem.isAllowedUseBy(res.locals.user)) {
        throw new ErrorMessage('您没有权限进行此操作。');
      }
    }

    res.render('article', {
      article: article,
      comments: comments,
      paginate: paginate,
      problem: problem,
      commentsCount: commentsCount
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/article/:id/edit', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });

    let id = parseInt(req.params.id);
    let article = await Article.findById(id);

    if (!article) {
      article = await Article.create();
      article.id = 0;
      article.allowedEdit = true;
    } else {
      article.allowedEdit = await article.isAllowedEditBy(res.locals.user);
    }

    res.render('article_edit', {
      article: article
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.post('/article/:id/edit', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });

    let id = parseInt(req.params.id);
    let article = await Article.findById(id);

    let time = syzoj.utils.getCurrentDate();
    if (!article) {
      article = await Article.create();
      article.user_id = res.locals.user.id;
      article.public_time = article.sort_time = time;

      if (req.query.problem_id) {
        let problem = await Problem.findById(req.query.problem_id);
        if (!problem) throw new ErrorMessage('无此题目。');
        article.problem_id = problem.id;
      } else {
        article.problem_id = null;
      }
    } else {
      if (!await article.isAllowedEditBy(res.locals.user)) throw new ErrorMessage('您没有权限进行此操作。');
    }

    if (!req.body.title.trim()) throw new ErrorMessage('标题不能为空。');
    article.title = req.body.title;
    article.content = req.body.content;
    article.update_time = time;
    article.is_notice = (res.locals.user && res.locals.user.is_admin ? req.body.is_notice === 'on' : article.is_notice);

    await article.save();

    res.redirect(syzoj.utils.makeUrl(['article', article.id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.post('/article/:id/delete', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });

    let id = parseInt(req.params.id);
    let article = await Article.findById(id);

    if (!article) {
      throw new ErrorMessage('无此帖子。');
    } else {
      if (!await article.isAllowedEditBy(res.locals.user)) throw new ErrorMessage('您没有权限进行此操作。');
    }

    await Promise.all((await ArticleComment.find({
      article_id: article.id
    })).map(comment => comment.destroy()))

    await article.destroy();

    res.redirect(syzoj.utils.makeUrl(['discussion', 'global']));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.post('/article/:id/comment', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });

    let id = parseInt(req.params.id);
    let article = await Article.findById(id);

    if (!article) {
      throw new ErrorMessage('无此帖子。');
    } else {
      if (!await article.isAllowedCommentBy(res.locals.user)) throw new ErrorMessage('您没有权限进行此操作。');
    }

    let comment = await ArticleComment.create({
      content: req.body.comment,
      article_id: id,
      user_id: res.locals.user.id,
      public_time: syzoj.utils.getCurrentDate()
    });

    await comment.save();

    await article.resetReplyCountAndTime();

    res.redirect(syzoj.utils.makeUrl(['article', article.id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.post('/article/:article_id/comment/:id/delete', async (req, res) => {
  try {
    if (!res.locals.user) throw new ErrorMessage('请登录后继续。', { '登录': syzoj.utils.makeUrl(['login'], { 'url': req.originalUrl }) });

    let id = parseInt(req.params.id);
    let comment = await ArticleComment.findById(id);

    if (!comment) {
      throw new ErrorMessage('无此评论。');
    } else {
      if (!await comment.isAllowedEditBy(res.locals.user)) throw new ErrorMessage('您没有权限进行此操作。');
    }

    const article = await Article.findById(comment.article_id);

    await comment.destroy();

    await article.resetReplyCountAndTime();

    res.redirect(syzoj.utils.makeUrl(['article', comment.article_id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});
