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

app.get('/api/v2/search/problem/:keyword*?', async (req, res) => {
  try {
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

    result = result.map(x => ({ name: `#${x.id}. ${x.title}`, value: x.id }));
    res.send({ success: true, results: result });
  } catch (e) {
    syzoj.log(e);
    res.send({ success: false });
  }
});
