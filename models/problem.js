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
let TestData = syzoj.model('testdata');

let model = db.define('problem', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

  title: { type: Sequelize.STRING(80) },
  user_id: {
    type: Sequelize.INTEGER,
    references: {
      model: User.model,
      key: 'id'
    }
  },

  description: { type: Sequelize.TEXT },
  input_format: { type: Sequelize.TEXT },
  output_format: { type: Sequelize.TEXT },
  example: { type: Sequelize.TEXT },
  limit_and_hint: { type: Sequelize.TEXT },

  time_limit: { type: Sequelize.INTEGER },
  memory_limit: { type: Sequelize.INTEGER },

  testdata_id: {
    type: Sequelize.INTEGER,
    references: {
      model: TestData.model,
      key: 'id'
    }
  },

  ac_num: { type: Sequelize.INTEGER },
  submit_num: { type: Sequelize.INTEGER },
  is_public: { type: Sequelize.BOOLEAN },

  file_io: { type: Sequelize.BOOLEAN },
  file_io_input_name: { type: Sequelize.TEXT },
  file_io_output_name: { type: Sequelize.TEXT }
}, {
  timestamps: false,
  tableName: 'problem',
  indexes: [
    {
      fields: ['title'],
    },
    {
      fields: ['user_id'],
    }
  ]
});

let Model = require('./common');
class Problem extends Model {
  static async create(val) {
    return Problem.fromRecord(Problem.model.build(Object.assign({
      title: '',
      user_id: '',
      description: '',

      input_format: '',
      output_format: '',
      example: '',
      limit_and_hint: '',

      time_limit: syzoj.config.default.problem.time_limit,
      memory_limit: syzoj.config.default.problem.memory_limit,

      ac_num: 0,
      submit_num: 0,
      is_public: false,

      file_io: false,
      file_io_input_name: 'data.in',
      file_io_output_name: 'data.out'
    }, val)));
  }

  async loadRelationships() {
    this.user = await User.fromID(this.user_id);
    this.testdata = await TestData.fromID(this.testdata_id);
  }

  async isAllowedEditBy(user) {
    return user && (user.is_admin || this.user_id === user.id);
  }

  async isAllowedUseBy(user) {
    return this.is_public || (user && (user.is_admin || this.user_id === user.id));
  }

  async updateTestdata(path) {
    let fs = Promise.promisifyAll(require('fs'));

    let buf = await fs.readFileAsync(path);
    let md5 = require('md5');
    let key = md5(buf);
    await fs.rename(path, TestData.resolvePath(key));

    let file = await TestData.create({
      filename: `test_data_${this.id}.zip`,
      md5: key
    });
    await file.save();
    this.testdata_id = file.id;
  }

  async getSubmitStatus(user) {
    if (!user) return null;

    let JudgeState = syzoj.model('judge_state');

    let status = await JudgeState.model.findAll({
      attributes: ['status'],
      where: {
        user_id: user.id,
        problem_id: this.id
      }
    });

    if (!status || status.length === 0) return null;

    for (let x of status) {
      if (x.get('status') === 'Accepted') return true;
    }

    return false;
  }

  getModel() { return model; }
}

Problem.model = model;

module.exports = Problem;
