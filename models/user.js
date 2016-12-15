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

let model = db.define('user', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: Sequelize.STRING(80), unique: true },
  email: { type: Sequelize.STRING(120) },
  password: { type: Sequelize.STRING(120) },

  nickname: { type: Sequelize.STRING(80) },
  nameplate: { type: Sequelize.TEXT },
  information: { type: Sequelize.TEXT },

  ac_num: { type: Sequelize.INTEGER },
  submit_num: { type: Sequelize.INTEGER },

  is_admin: { type: Sequelize.BOOLEAN },
  is_show: { type: Sequelize.BOOLEAN },

  sex: { type: Sequelize.INTEGER }
}, {
  timestamps: false,
  tableName: 'user',
  indexes: [
    {
      fields: ['username'],
      unique: true
    },
    {
      fields: ['nickname'],
    },
    {
      fields: ['ac_num'],
    }
  ]
});

let Model = require('./common');
class User extends Model {
  static async create(val) {
    return User.fromRecord(User.model.build(Object.assign({
      username: '',
      password: '',
      email: '',

      nickname: '',
      is_admin: false,
      ac_num: 0,
      submit_num: 0,
    sex: 0,
      is_show: syzoj.config.default.user.show
    }, val)));
  }

  static async fromName(name) {
    return User.fromRecord(User.model.findOne({
      where: {
        username: name
      }
    }));
  }

  async isAllowedEditBy(user) {
    return user && (user.is_admin || this.id === user.id);
  }

  async refreshSubmitInfo() {
    let JudgeState = syzoj.model('judge_state');
    let all = await JudgeState.model.findAll({
      attributes: ['problem_id'],
      where: {
        user_id: this.id,
        status: 'Accepted',
        type: {
          $ne: 1 // Not a contest submissio
        }
      }
    });

    let s = new Set();
    all.forEach(x => s.add(parseInt(x.get('problem_id'))));
    this.ac_num = s.size;

    let cnt = await JudgeState.count({
      user_id: this.id,
      type: {
        $ne: 1 // Not a contest submissio
      }
    });

    this.submit_num = cnt;
  }

  async getACProblems() {
    let JudgeState = syzoj.model('judge_state');

    let all = await JudgeState.model.findAll({
      attributes: ['problem_id'],
      where: {
        user_id: this.id,
        status: 'Accepted',
        type: {
          $ne: 1 // Not a contest submissio
        }
      }
    });

    let s = new Set();
    all.forEach(x => s.add(parseInt(x.get('problem_id'))));
    return Array.from(s).sort((a, b) => a - b);
  }

  async getArticles() {
    let Article = syzoj.model('article');

    let all = await Article.model.findAll({
      attributes: ['id', 'title', 'public_time'],
      where: {
        user_id: this.id
      }
    });

    return all.map(x => ({
      id: x.get('id'),
      title: x.get('title'),
      public_time: x.get('public_time')
    }));
  }

  async getStatistics() {
    let JudgeState = syzoj.model('judge_state');

    let statuses = {
      "Accepted": ["Accepted"],
      "Wrong Answer": ["Wrong Answer", "File Error", "Output Limit Exceeded"],
      "Runtime Error": ["Runtime Error"],
      "Time Limit Exceeded": ["Time Limit Exceeded"],
      "Memory Limit Exceeded": ["Memory Limit Exceeded"],
      "Compile Error": ["Compile Error"]
    };

    let res = {};
    for (let status in statuses) {
      res[status] = 0;
      for (let s of statuses[status]) {
        res[status] += await JudgeState.count({
          user_id: this.id,
          type: 0,
          status: status
        });
      }
    }

    return res;
  }

  async renderInformation() {
    this.information = await syzoj.utils.markdown(this.information);
  }

  getModel() { return model; }
}

User.model = model;

module.exports = User;
