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

let model = db.define('article', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

  title: { type: Sequelize.STRING(80) },
  content: { type: Sequelize.TEXT('medium') },

  user_id: { type: Sequelize.INTEGER },
  problem_id: { type: Sequelize.INTEGER },

  public_time: { type: Sequelize.INTEGER },
  update_time: { type: Sequelize.INTEGER },
  sort_time: { type: Sequelize.INTEGER },

  comments_num: { type: Sequelize.INTEGER },
  allow_comment: { type: Sequelize.BOOLEAN },

  is_notice: { type: Sequelize.BOOLEAN }
}, {
  timestamps: false,
  tableName: 'article',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['sort_time']
    }
  ]
});

let Model = require('./common');
class Article extends Model {
  static async create(val) {
    return Article.fromRecord(Article.model.build(Object.assign({
      title: '',
      content: '',

      user_id: 0,
      problem_id: 0,

      public_time: 0,
      update_time: 0,
      sort_time: 0,

      comments_num: 0,
      allow_comment: true,

      is_notice: false
    }, val)));
  }

  async loadRelationships() {
    this.user = await User.fromID(this.user_id);
  }

  async isAllowedEditBy(user) {
    return user && (user.is_admin || this.user_id === user.id);
  }

  async isAllowedCommentBy(user) {
    return user && (this.allow_comment || user.is_admin || this.user_id === user.id);
  }

  getModel() { return model; }
};

Article.model = model;

module.exports = Article;
