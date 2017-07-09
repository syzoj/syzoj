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

let JudgeState = syzoj.model('judge_state');

let model = db.define('waiting_judge', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  judge_id: { type: Sequelize.INTEGER },

  // Smaller is higher
  priority: { type: Sequelize.INTEGER }
}, {
  timestamps: false,
  tableName: 'waiting_judge',
  indexes: [
    {
      fields: ['judge_id'],
    }
  ]
});

let Model = require('./common');
class WaitingJudge extends Model {
  static async create(val) {
    return WaitingJudge.fromRecord(WaitingJudge.model.build(Object.assign({
      judge_id: 0,
      priority: 0
    }, val)));
  }

  async getJudgeState() {
    return JudgeState.fromID(this.judge_id);
  }

  getModel() { return model; }
}

WaitingJudge.model = model;

module.exports = WaitingJudge;
