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
let Contest = syzoj.model('contest');

let model = db.define('judge_state', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

  // The data zip's md5 if it's a submit-answer problem
  code: { type: Sequelize.TEXT('medium') },
  language: { type: Sequelize.STRING(20) },

  status: { type: Sequelize.STRING(50) },
  score: { type: Sequelize.INTEGER },
  total_time: { type: Sequelize.INTEGER },
  pending: { type: Sequelize.BOOLEAN },
  max_memory: { type: Sequelize.INTEGER },

  result: { type: Sequelize.TEXT('medium'), json: true },

  user_id: { type: Sequelize.INTEGER },

  problem_id: { type: Sequelize.INTEGER },

  submit_time: { type: Sequelize.INTEGER },
  /*
   * "type" indicate it's contest's submission(type = 1) or normal submission(type = 0)
   * type = 2: this is a test submission
   * if it's contest's submission (type = 1), the type_info is contest_id
   * use this way represent because it's easy to expand
   */
  type: { type: Sequelize.INTEGER },
  type_info: { type: Sequelize.INTEGER }
}, {
  timestamps: false,
  tableName: 'judge_state',
  indexes: [
    {
      fields: ['status'],
    },
    {
      fields: ['score'],
    },
    {
      fields: ['user_id'],
    },
    {
      fields: ['problem_id'],
    }
  ]
});

let Model = require('./common');
class JudgeState extends Model {
  static async create(val) {
    return JudgeState.fromRecord(JudgeState.model.build(Object.assign({
      code: '',
      language: '',
      user_id: 0,
      problem_id: 0,
      submit_time: parseInt((new Date()).getTime() / 1000),

      type: 0,
      type_info: '',

      pending: true,

      score: 0,
      total_time: 0,
      max_memory: 0,
      status: 'Waiting',
      result: '{ "status": "Waiting", "total_time": 0, "max_memory": 0, "score": 0, "case_num": 0, "compiler_output": "", "pending": true }'
    }, val)));
  }

  async loadRelationships() {
    this.user = await User.fromID(this.user_id);
    if (this.problem_id) this.problem = await Problem.fromID(this.problem_id);
  }

  async isAllowedVisitBy(user) {
    await this.loadRelationships();

    if (user && user.id === this.problem.user_id) return true;
    else if (this.type === 0 || this.type == 2) return this.problem.is_public || (user && (await user.hasPrivilege('manage_problem')));
    else if (this.type === 1) {
      let contest = await Contest.fromID(this.type_info);
      if (await contest.isRunning()) {
        return (user && this.user_id === user.id) || (user && user.is_admin);
      } else {
        return true;
      }
    }
  }

  async isAllowedSeeCodeBy(user) {
    await this.loadRelationships();

    if (user && user.id === this.problem.user_id) return true;
    else if (this.type === 0 || this.type === 2) return this.problem.is_public || (user && (await user.hasPrivilege('manage_problem')));
    else if (this.type === 1) {
      let contest = await Contest.fromID(this.type_info);
      if (await contest.isRunning()) {
        return (user && this.user_id === user.id) || (user && user.is_admin);
      } else {
        return true;
      }
    }
  }

  async isAllowedSeeCaseBy(user) {
    await this.loadRelationships();

    if (user && user.id === this.problem.user_id) return true;
    else if (this.type === 0 || this.type === 2) return this.problem.is_public || (user && (await user.hasPrivilege('manage_problem')));
    else if (this.type === 1) {
      let contest = await Contest.fromID(this.type_info);
      if (await contest.isRunning()) {
        return contest.type === 'ioi' || (user && user.is_admin);
      } else {
        return true;
      }
    }
  }

  async isAllowedSeeDataBy(user) {
    await this.loadRelationships();

    if (user && user.id === this.problem.user_id) return true;
    else if (this.type === 0 || this.type === 2) return this.problem.is_public || (user && (await user.hasPrivilege('manage_problem')));
    else if (this.type === 1) {
      let contest = await Contest.fromID(this.type_info);
      if (await contest.isRunning()) {
        return user && user.is_admin;
      } else {
        return true;
      }
    }
  }

  async updateResult(result) {
    this.score = result.score;
    this.pending = result.pending;
    this.status = result.status;
    if (this.language) {
      // language is empty if it's a submit-answer problem
      this.total_time = result.total_time;
      this.max_memory = result.max_memory;
    }
    this.result = result;
  }

  async updateRelatedInfo(newSubmission) {
    if (this.type === 0 || this.type === 2) {
      if (newSubmission) {
        await this.loadRelationships();
        await this.user.refreshSubmitInfo();
        this.problem.submit_num++;
        await this.user.save();
        await this.problem.save();
      } else if (this.status === 'Accepted') {
        await this.loadRelationships();
        await this.user.refreshSubmitInfo();
        this.problem.ac_num++;
        await this.user.save();
        await this.problem.save();
      }
    } else if (this.type === 1) {
      let contest = await Contest.fromID(this.type_info);
      await contest.newSubmission(this);
    } else if (this.type === 2) {
      if (newSubmission || this.status === 'Accepted') {
        await this.loadRelationships();
        await this.user.refreshSubmitInfo();
        await this.user.save();
      }
    }
  }

  async rejudge() {
    await syzoj.utils.lock(['JudgeState::rejudge', this.id], async () => {
      await this.loadRelationships();

      let oldStatus = this.status;

      this.status = 'Waiting';
      this.score = 0;
      if (this.language) {
        // language is empty if it's a submit-answer problem
        this.total_time = 0;
        this.max_memory = 0;
      }
      this.pending = true;
      this.result = { status: "Waiting", total_time: 0, max_memory: 0, score: 0, case_num: 0, compiler_output: "", pending: true };
      await this.save();

      let WaitingJudge = syzoj.model('waiting_judge');
      let waiting_judge = await WaitingJudge.create({
        judge_id: this.id
      });

      await waiting_judge.save();

      if (oldStatus === 'Accepted') {
        await this.user.refreshSubmitInfo();
        await this.user.save();
      }

      if (this.type === 0 || this.type === 2) {
        if (oldStatus === 'Accepted') {
          this.problem.ac_num--;
          await this.problem.save();
        }
      } else if (this.type === 1) {
        let contest = await Contest.fromID(this.type_info);
        await contest.newSubmission(this);
      }
    });
  }

  async getProblemType() {
    await this.loadRelationships();
    return this.problem.type;
  }

  getModel() { return model; }
}

JudgeState.model = model;

module.exports = JudgeState;
