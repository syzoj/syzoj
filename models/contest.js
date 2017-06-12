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

let Sequelize = require('sequelize');
let db = syzoj.db;

let User = syzoj.model('user');
let Problem = syzoj.model('problem');
let ContestRanklist = syzoj.model('contest_ranklist');
let ContestPlayer = syzoj.model('contest_player');

let model = db.define('contest', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: Sequelize.STRING(80) },
  start_time: { type: Sequelize.INTEGER },
  end_time: { type: Sequelize.INTEGER },

  holder_id: {
    type: Sequelize.INTEGER,
    references: {
      model: 'user',
      key: 'id'
    }
  },
  // type: noi, ioi, acm
  type: { type: Sequelize.STRING(10) },

  information: { type: Sequelize.TEXT },
  problems: { type: Sequelize.TEXT },

  ranklist_id: {
    type: Sequelize.INTEGER,
    references: {
      model: 'contest_ranklist',
      key: 'id'
    }
  }
}, {
  timestamps: false,
  tableName: 'contest',
  indexes: [
    {
      fields: ['holder_id'],
    },
    {
      fields: ['ranklist_id'],
    }
  ]
});

let Model = require('./common');
class Contest extends Model {
  static async create(val) {
    return Contest.fromRecord(Contest.model.build(Object.assign({
      title: '',
      problems: '',
      information: '',
      type: 'noi',
      start_time: 0,
      end_time: 0,
      holder: 0,
      ranklist_id: 0
    }, val)));
  }

  async loadRelationships() {
    this.holder = await User.fromID(this.holder_id);
    this.ranklist = await ContestRanklist.fromID(this.ranklist_id);
  }

  async isAllowedEditBy(user) {
    return user && (user.is_admin || this.holder_id === user.id);
  }

  async isAllowedSeeResultBy(user) {
    if (this.type === 'acm' || this.type === 'ioi') return true;
    return (user && (user.is_admin || this.holder_id === user.id)) || !(await this.isRunning());
  }

  async getProblems() {
    if (!this.problems) return [];
    return this.problems.split('|').map(x => parseInt(x));
  }

  async setProblemsNoCheck(problemIDs) {
    this.problems = problemIDs.join('|');
  }

  async setProblems(s) {
    let a = [];
    await s.split('|').forEachAsync(async x => {
      let problem = await Problem.fromID(x);
      if (!problem) return;
      a.push(x);
    });
    this.problems = a.join('|');
  }

  async newSubmission(judge_state) {
    let problems = await this.getProblems();
    if (!problems.includes(judge_state.problem_id)) throw new ErrorMessage('当前比赛中无此题目。');

    let player = await ContestPlayer.findInContest({
      contest_id: this.id,
      user_id: judge_state.user_id
    });

    if (!player) {
      player = await ContestPlayer.create({
        contest_id: this.id,
        user_id: judge_state.user_id
      });
    }

    await player.updateScore(judge_state);
    await player.save();

    await this.loadRelationships();
    await this.ranklist.updatePlayer(this, player);
    await this.ranklist.save();
  }

  async isRunning(now) {
    if (!now) now = syzoj.utils.getCurrentDate();
    return now >= this.start_time && now < this.end_time;
  }

  async isEnded(now) {
    if (!now) now = syzoj.utils.getCurrentDate();
    return now >= this.end_time;
  }

  getModel() { return model; }
}

Contest.model = model;

module.exports = Contest;
