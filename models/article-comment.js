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
let Article = syzoj.model('article');

let model = db.define('comment', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

  content: { type: Sequelize.TEXT },

  article_id: { type: Sequelize.INTEGER },

  user_id: { type: Sequelize.INTEGER },

  public_time: { type: Sequelize.INTEGER }
}, {
  timestamps: false,
  tableName: 'comment',
  indexes: [
    {
      fields: ['article_id']
    },
    {
      fields: ['user_id']
    }
  ]
});

let Model = require('./common');
class ArticleComment extends Model {
  static async create(val) {
    return ArticleComment.fromRecord(ArticleComment.model.build(Object.assign({
      content: '',
      article_id: 0,
      user_id: 0,
      public_time: 0,
    }, val)));
  }

  async loadRelationships() {
    this.user = await User.fromID(this.user_id);
    this.article = await Article.fromID(this.article_id);
  }

  async isAllowedEditBy(user) {
    await this.loadRelationships();
    return user && (user.is_admin || this.user_id === user.id || user.id === this.article.user_id);
  }

  getModel() { return model; }
};

ArticleComment.model = model;

module.exports = ArticleComment;
