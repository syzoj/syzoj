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

let model = db.define('judge_state', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: Sequelize.TEXT },
  language: { type: Sequelize.STRING(20) },

  status: { type: Sequelize.STRING(50) },
  score: { type: Sequelize.INTEGER },
  result: { type: Sequelize.TEXT, json: true },

  user_id: {
    type: Sequelize.INTEGER,
    references: {
      model: User.model,
      key: 'id'
    }
  },

  problem_id: {
    type: Sequelize.INTEGER,
    references: {
      model: Problem.model,
      key: 'id'
    }
  },

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

      score: 0,
      status: 'Waiting',
      result: '{ "status": "Waiting", "total_time": 0, "total_memory": 0, "score": 0, "case_num": 0, "compiler_output": "" }'
    }, val)));
  }

  async loadRelationships() {
    this.user = await User.fromID(this.user_id);
    if (this.problem_id) this.problem = await Problem.fromID(this.problem_id);
  }

  async isAllowedSeeResultBy(user) {
    await this.loadRelationships();

    if (user && (user.is_admin || user.id === this.problem.user_id)) return true;
    else if (this.type === 0) return true;
    else if (this.type === 1) {
      // TODO: contest
      return false;
    } else if (this.type === 2) return false;
  }

  async isAllowedSeeCodeBy(user) {
    return this.isAllowedSeeResultBy(user);
  }

  async updateResult(result) {
    this.score = result.score;
    this.status = result.status;
    this.result = result;
  }

  async updateRelatedInfo() {
    if (this.type === 0) {
      await this.loadRelationships()
      await this.user.refreshSubmitInfo();
      this.problem.submit_num++;
      if (this.status === 'Accepted') this.problem.ac_num++;
      await this.user.save();
      await this.problem.save();
    }
  }

  getModel() { return model; }
}

JudgeState.model = model;

module.exports = JudgeState;
