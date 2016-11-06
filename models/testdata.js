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

let model = db.define('file', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  filename: { type: Sequelize.STRING(80), unique: true },
  md5: { type: Sequelize.STRING(80), unique: true }
}, {
  timestamps: false,
  tableName: 'file',
  indexes: [
    {
      fields: ['filename'],
    },
    {
      fields: ['md5'],
    }
  ]
});

let Model = require('./common');
class TestData extends Model {
  static create(val) {
    return TestData.fromRecord(TestData.model.build(Object.assign({
      filename: '',
      md5: ''
    }, val)));
  }

  getPath() {
    return TestData.resolvePath(this.md5);
  }

  static resolvePath(md5) {
    return syzoj.utils.resolvePath(syzoj.config.upload_dir, 'testdata', md5);
  }

  getModel() { return model; }
}

TestData.model = model;

module.exports = TestData;
