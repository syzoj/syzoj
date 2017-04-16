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

let model = db.define('problem_tag_map', {
  problem_id: { type: Sequelize.INTEGER, primaryKey: true },
  tag_id: {
    type: Sequelize.INTEGER,
    primaryKey: true
  }
}, {
  timestamps: false,
  tableName: 'problem_tag_map',
  indexes: [
    {
      fields: ['problem_id']
    },
    {
      fields: ['tag_id']
    }
  ]
});

let Model = require('./common');
class ProblemTagMap extends Model {
  static async create(val) {
    return ProblemTagMap.fromRecord(ProblemTagMap.model.build(Object.assign({
      problem_id: 0,
      tag_id: 0
    }, val)));
  }

  getModel() { return model; }
}

ProblemTagMap.model = model;

module.exports = ProblemTagMap;
