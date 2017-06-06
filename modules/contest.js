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

let Contest = syzoj.model('contest');
let ContestRanklist = syzoj.model('contest_ranklist');
let ContestPlayer = syzoj.model('contest_player');
let Problem = syzoj.model('problem');
let JudgeState = syzoj.model('judge_state');
let User = syzoj.model('user');

app.get('/contests', async (req, res) => {
  try {
    let paginate = syzoj.utils.paginate(await Contest.count(), req.query.page, syzoj.config.page.contest);
    let contests = await Contest.query(paginate);

    await contests.forEachAsync(async x => x.information = await syzoj.utils.markdown(x.information));

    res.render('contests', {
      contests: contests,
      paginate: paginate
    })
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/contest/:id/edit', async (req, res) => {
  try {
    if (!res.locals.user || !res.locals.user.is_admin) throw new ErrorMessage('您没有权限进行此操作。');

    let contest_id = parseInt(req.params.id);
    let contest = await Contest.fromID(contest_id);
    if (!contest) {
      contest = await Contest.create();
      contest.id = 0;
    }

    let problems = [];
    if (contest.problems) problems = await contest.problems.split('|').mapAsync(async id => await Problem.fromID(id));

    res.render('contest_edit', {
      contest: contest,
      problems: problems
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.post('/contest/:id/edit', async (req, res) => {
  try {
    if (!res.locals.user || !res.locals.user.is_admin) throw new ErrorMessage('您没有权限进行此操作。');

    let contest_id = parseInt(req.params.id);
    let contest = await Contest.fromID(contest_id);
    if (!contest) {
      contest = await Contest.create();

      contest.holder_id = res.locals.user.id;

      let ranklist = await ContestRanklist.create();
      await ranklist.save();
      contest.ranklist_id = ranklist.id;
    }

    if (!req.body.title.trim()) throw new ErrorMessage('比赛名不能为空。');
    contest.title = req.body.title;
    if (!Array.isArray(req.body.problems)) req.body.problems = [req.body.problems];
    contest.problems = req.body.problems.join('|');
    if (!['noi', 'ioi', 'acm'].includes(req.body.type)) throw new ErrorMessage('无效的赛制。');
    contest.type = req.body.type;
    contest.information = req.body.information;
    contest.start_time = syzoj.utils.parseDate(req.body.start_time);
    contest.end_time = syzoj.utils.parseDate(req.body.end_time);

    await contest.save();

    res.redirect(syzoj.utils.makeUrl(['contest', contest.id]));
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/contest/:id', async (req, res) => {
  try {
    let contest_id = parseInt(req.params.id);

    let contest = await Contest.fromID(contest_id);
    if (!contest) throw new ErrorMessage('无此比赛。');

    contest.allowedEdit = await contest.isAllowedEditBy(res.locals.user);
    contest.running = await contest.isRunning();
    contest.information = await syzoj.utils.markdown(contest.information);

    let problems_id = await contest.getProblems();
    let problems = await problems_id.mapAsync(async id => await Problem.fromID(id));

    let player = null;

    if (res.locals.user) {
      player = await ContestPlayer.findInContest({
        contest_id: contest.id,
        user_id: res.locals.user.id
      });
    }

    problems = problems.map(x => ({ problem: x, status: null, judge_id: null }));
    if (player) {
      for (let problem of problems) {
        if (contest.type === 'noi') {
          if (player.score_details[problem.problem.id]) {
            if (await contest.isRunning()) {
              problem.status = true;
            } else {
              let judge_state = await JudgeState.fromID(player.score_details[problem.problem.id].judge_id);
              problem.status = judge_state.status;
            }
            problem.judge_id = player.score_details[problem.problem.id].judge_id;
          } else {
            if (contest.isRunning()) {
              problem.status = false;
            }
          }
        } else if (contest.type === 'ioi') {
          if (player.score_details[problem.problem.id]) {
            let judge_state = await JudgeState.fromID(player.score_details[problem.problem.id].judge_id);
            problem.status = judge_state.status;
            problem.judge_id = player.score_details[problem.problem.id].judge_id;
          }
        } else if (contest.type === 'acm') {
          if (player.score_details[problem.problem.id]) {
            problem.status = {
              accepted: player.score_details[problem.problem.id].accepted,
              unacceptedCount: player.score_details[problem.problem.id].unacceptedCount
            };
            problem.judge_id = player.score_details[problem.problem.id].judge_id;
          } else {
            problem.status = null;
          }
        }
      }
    }

    res.render('contest', {
      contest: contest,
      problems: problems
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/contest/:id/ranklist', async (req, res) => {
  try {
    let contest_id = parseInt(req.params.id);
    let contest = await Contest.fromID(contest_id);
    if (!contest) throw new ErrorMessage('无此比赛。');

    if (!await contest.isAllowedSeeResultBy(res.locals.user)) throw new ErrorMessage('您没有权限进行此操作。');

    await contest.loadRelationships();

    let players_id = [];
    for (let i = 1; i <= contest.ranklist.ranklist.player_num; i++) players_id.push(contest.ranklist.ranklist[i]);

    let ranklist = await players_id.mapAsync(async player_id => {
      let player = await ContestPlayer.fromID(player_id);
      for (let i in player.score_details) {
        player.score_details[i].judge_state = await JudgeState.fromID(player.score_details[i].judge_id);
      }

      let user = await User.fromID(player.user_id);

      return {
        user: user,
        player: player
      };
    });

    let problems_id = await contest.getProblems();
    let problems = await problems_id.mapAsync(async id => await Problem.fromID(id));

    res.render('contest_ranklist', {
      contest: contest,
      ranklist: ranklist,
      problems: problems
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/contest/:id/submissions', async (req, res) => {
  try {
    let contest_id = parseInt(req.params.id);
    let contest = await Contest.fromID(contest_id);

    if (!contest) throw new ErrorMessage('无此比赛。');

    contest.ended = await contest.isEnded();

    let problems_id = await contest.getProblems();

    let user = await User.fromName(req.query.submitter || '');
    let where = {};
    if (user) where.user_id = user.id;
    if (req.query.problem_id) where.problem_id = problems_id[parseInt(req.query.problem_id) - 1];
    where.type = 1;
    where.type_info = contest_id;

    if (contest.ended || contest.type !== 'noi' || (res.locals.user && res.locals.user.is_admin)) {
      let minScore = parseInt(req.query.min_score);
      if (isNaN(minScore)) minScore = 0;
      let maxScore = parseInt(req.query.max_score);
      if (isNaN(maxScore)) maxScore = 100;

      where.score = {
        $and: {
          $gte: parseInt(minScore),
          $lte: parseInt(maxScore)
        }
      };

      if (req.query.language) where.language = req.query.language;
      if (req.query.status) where.status = req.query.status;
    }

    let paginate = syzoj.utils.paginate(await JudgeState.count(where), req.query.page, syzoj.config.page.judge_state);
    let judge_state = await JudgeState.query(paginate, where, [['submit_time', 'desc']]);

    await judge_state.forEachAsync(async obj => obj.hidden = !(await obj.isAllowedSeeResultBy(res.locals.user)));
    await judge_state.forEachAsync(async obj => obj.allowedSeeCode = await obj.isAllowedSeeCodeBy(res.locals.user));
    await judge_state.forEachAsync(async obj => {
      await obj.loadRelationships();
      obj.problem_id = problems_id.indexOf(obj.problem_id) + 1;
      obj.problem.title = syzoj.utils.removeTitleTag(obj.problem.title);
    });

    res.render('contest_submissions', {
      contest: contest,
      judge_state: judge_state,
      paginate: paginate,
      form: req.query
    });
  } catch (e) {
    syzoj.log(e);
    res.render('error', {
      err: e
    });
  }
});

app.get('/contest/:id/:pid', async (req, res) => {
  try {
    let contest_id = parseInt(req.params.id);
    let contest = await Contest.fromID(contest_id);

    contest.ended = await contest.isEnded();
    if (!(await contest.isRunning() || contest.ended)) throw new ErrorMessage('比赛尚未开始或已结束。');

    let problems_id = await contest.getProblems();

    let pid = parseInt(req.params.pid);
    if (!pid || pid < 1 || pid > problems_id.length) throw new ErrorMessage('无此题目。');

    let problem_id = problems_id[pid - 1];
    let problem = await Problem.fromID(problem_id);

    await syzoj.utils.markdown(problem, [ 'description', 'input_format', 'output_format', 'example', 'limit_and_hint' ]);

    let state = await problem.getJudgeState(res.locals.user, false);

    res.render('problem', {
      pid: pid,
      contest: contest,
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
