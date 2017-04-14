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

let model = db.define('problem_tag', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: Sequelize.STRING },
  color: { type: Sequelize.STRING },
}, {
  timestamps: false,
  tableName: 'problem_tag',
  indexes: [
    {
      unique: true,
      fields: ['name'],
    }
  ]
});

let Model = require('./common');
class ProblemTag extends Model {
  static async create(val) {
    return ProblemTag.fromRecord(ProblemTag.model.build(Object.assign({
      name: '',
      color: ''
    }, val)));
  }

  getModel() { return model; }
}

ProblemTag.model = model;

module.exports = ProblemTag;
