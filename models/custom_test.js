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

let model = db.define('custom_test', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

  input_filepath: { type: Sequelize.TEXT },
  code: { type: Sequelize.TEXT('medium') },
  language: { type: Sequelize.STRING(20) },

  status: { type: Sequelize.STRING(50) },

  time: { type: Sequelize.INTEGER },
  pending: { type: Sequelize.BOOLEAN },
  memory: { type: Sequelize.INTEGER },

  result: { type: Sequelize.TEXT('medium'), json: true },

  user_id: { type: Sequelize.INTEGER },

  problem_id: { type: Sequelize.INTEGER },

  submit_time: { type: Sequelize.INTEGER }
}, {
  timestamps: false,
  tableName: 'custom_test',
  indexes: [
    {
      fields: ['status'],
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
class CustomTest extends Model {
  static async create(val) {
    return CustomTest.fromRecord(CustomTest.model.build(Object.assign({
      input_filepath: '',
      code: '',
      language: '',
      user_id: 0,
      problem_id: 0,
      submit_time: parseInt((new Date()).getTime() / 1000),

      pending: true,

      time: 0,
      memory: 0,
      status: 'Waiting',
    }, val)));
  }

  async loadRelationships() {
    this.user = await User.fromID(this.user_id);
    this.problem = await Problem.fromID(this.problem_id);
  }

  async updateResult(result) {
    this.pending = result.pending;
    this.status = result.status;
    this.time = result.time_used;
    this.memory = result.memory_used;
    this.result = result;
  }

  getModel() { return model; }
}

CustomTest.model = model;

module.exports = CustomTest;
