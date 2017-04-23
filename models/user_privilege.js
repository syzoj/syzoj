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

let model = db.define('user_privilege', {
  user_id: { type: Sequelize.INTEGER, primaryKey: true },
  privilege: {
    type: Sequelize.STRING,
    primaryKey: true
  }
}, {
  timestamps: false,
  tableName: 'user_privilege',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['privilege']
    }
  ]
});

let Model = require('./common');
class UserPrivilege extends Model {
  static async create(val) {
    return UserPrivilege.fromRecord(UserPrivilege.model.build(Object.assign({
      user_id: 0,
      privilege: ''
    }, val)));
  }

  getModel() { return model; }
}

UserPrivilege.model = model;

module.exports = UserPrivilege;
