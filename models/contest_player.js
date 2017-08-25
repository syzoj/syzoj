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

let model = db.define('contest_player', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  contest_id: { type: Sequelize.INTEGER },
  user_id: { type: Sequelize.INTEGER },

  score: { type: Sequelize.INTEGER },
  score_details: { type: Sequelize.TEXT, json: true },
  time_spent: { type: Sequelize.INTEGER }
}, {
    timestamps: false,
    tableName: 'contest_player',
    indexes: [
      {
        fields: ['contest_id'],
      },
      {
        fields: ['user_id'],
      }
    ]
  });

let Model = require('./common');
class ContestPlayer extends Model {
  static async create(val) {
    return ContestPlayer.fromRecord(ContestPlayer.model.build(Object.assign({
      contest_id: 0,
      user_id: 0,
      score: 0,
      score_details: '{}',
      time_spent: 0
    }, val)));
  }

  static async findInContest(where) {
    return ContestPlayer.findOne({ where: where });
  }

  async loadRelationships() {
    let Contest = syzoj.model('contest');
    this.user = await User.fromID(this.user_id);
    this.contest = await Contest.fromID(this.contest_id);
  }

  async updateScore(judge_state) {
    await this.loadRelationships();
    if (this.contest.type === 'ioi') {
      if (!judge_state.pending) {
        if (!this.score_details[judge_state.problem_id]) {
          this.score_details[judge_state.problem_id] = {
            score: judge_state.score,
            judge_id: judge_state.id,
            submissions: {}
          };
        }

        this.score_details[judge_state.problem_id].submissions[judge_state.id] = {
          judge_id: judge_state.id,
          score: judge_state.score,
          time: judge_state.submit_time
        };

        let arr = Object.values(this.score_details[judge_state.problem_id].submissions);
        arr.sort((a, b) => a.time - b.time);

        let maxScoreSubmission = null;
        for (let x of arr) {
          if (!maxScoreSubmission || x.score >= maxScoreSubmission.score && maxScoreSubmission.score < 100) {
            maxScoreSubmission = x;
          }
        }

        this.score_details[judge_state.problem_id].judge_id = maxScoreSubmission.judge_id;
        this.score_details[judge_state.problem_id].score = maxScoreSubmission.score;
        this.score_details[judge_state.problem_id].time = maxScoreSubmission.time;

        this.score = 0;
        for (let x in this.score_details) {
          if (this.score != null)
            this.score += this.score_details[x].score;
        }
      }
    } else if (this.contest.type === 'noi') {
      if (this.score_details[judge_state.problem_id] && this.score_details[judge_state.problem_id].judge_id > judge_state.id) return;

      this.score_details[judge_state.problem_id] = {
        score: judge_state.score,
        judge_id: judge_state.id
      };

      this.score = 0;
      for (let x in this.score_details) {
        if (this.score != null)
          this.score += this.score_details[x].score;
      }
    } else if (this.contest.type === 'acm') {
      if (!judge_state.pending) {
        if (!this.score_details[judge_state.problem_id]) {
          this.score_details[judge_state.problem_id] = {
            accepted: false,
            unacceptedCount: 0,
            acceptedTime: 0,
            judge_id: 0,
            submissions: {}
          };
        }

        this.score_details[judge_state.problem_id].submissions[judge_state.id] = {
          judge_id: judge_state.id,
          accepted: judge_state.status === 'Accepted',
          compiled: judge_state.score != null,
          time: judge_state.submit_time
        };

        let arr = Object.values(this.score_details[judge_state.problem_id].submissions);
        arr.sort((a, b) => a.time - b.time);

        this.score_details[judge_state.problem_id].unacceptedCount = 0;
        this.score_details[judge_state.problem_id].judge_id = 0;
        this.score_details[judge_state.problem_id].accepted = 0;
        for (let x of arr) {
          if (x.accepted) {
            this.score_details[judge_state.problem_id].accepted = true;
            this.score_details[judge_state.problem_id].acceptedTime = x.time;
            this.score_details[judge_state.problem_id].judge_id = x.judge_id;
            break;
          } else if (x.compiled) {
            this.score_details[judge_state.problem_id].unacceptedCount++;
          }
        }

        if (!this.score_details[judge_state.problem_id].accepted) {
          this.score_details[judge_state.problem_id].judge_id = arr[arr.length - 1].judge_id;
        }

        this.score = 0;
        for (let x in this.score_details) {
          if (this.score_details[x].accepted) this.score++;
        }
      }
    }
  }

  getModel() { return model; }
}

ContestPlayer.model = model;

module.exports = ContestPlayer;
