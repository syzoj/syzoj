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
    if (!res.locals.user || !res.locals.user.is_admin) throw 'Permission denied.';

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
    if (!res.locals.user || !res.locals.user.is_admin) throw 'Permission denied.';

    let contest_id = parseInt(req.params.id);
    let contest = await Contest.fromID(contest_id);
    if (!contest) {
      contest = await Contest.create();

      contest.holder_id = res.locals.user.id;

      let ranklist = await ContestRanklist.create();
      await ranklist.save();
      contest.ranklist_id = ranklist.id;
    }

    contest.title = req.body.title;
    if (!Array.isArray(req.body.problems)) req.body.problems = [req.body.problems];
    contest.problems = req.body.problems.join('|');
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
    if (!contest) throw 'No such contest.';

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
    if (!contest) throw 'No such contest.';

    if (!await contest.isAllowedSeeResultBy(res.locals.user)) throw 'Permission denied';

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

app.get('/contest/:id/:pid', async (req, res) => {
  try {
    let contest_id = parseInt(req.params.id);
    let contest = await Contest.fromID(contest_id);
    if (!await contest.isRunning()) throw 'The contest has ended or not started.'

    let problems_id = await contest.getProblems();

    let pid = parseInt(req.params.pid);
    if (!pid || pid < 1 || pid > problems_id.length) throw 'No such problem.';

    let problem_id = problems_id[pid - 1];
    let problem = await Problem.fromID(problem_id);

    await syzoj.utils.markdown(problem, [ 'description', 'input_format', 'output_format', 'example', 'limit_and_hint' ]);

    let state = await problem.getJudgeState(res.locals.user, false);

    res.render('problem', {
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
