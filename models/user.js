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
  public_email: { type: Sequelize.BOOLEAN },

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
    if (!user) return false;
    if (await user.hasPrivilege('manage_user')) return true;
    return user && (user.is_admin || this.id === user.id);
  }

  async refreshSubmitInfo() {
    await syzoj.utils.lock(['User::refreshSubmitInfo', this.id], async () => {
      let JudgeState = syzoj.model('judge_state');
      let all = await JudgeState.model.findAll({
        attributes: ['problem_id'],
        where: {
          user_id: this.id,
          status: 'Accepted',
          type: {
            $ne: 1 // Not a contest submission
          }
        }
      });

      let s = new Set();
      all.forEach(x => s.add(parseInt(x.get('problem_id'))));
      this.ac_num = s.size;

      let cnt = await JudgeState.count({
        user_id: this.id,
        type: {
          $ne: 1 // Not a contest submission
        }
      });

      this.submit_num = cnt;
    });
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
          status: s
        });
      }
    }

    return res;
  }

  async renderInformation() {
    this.information = await syzoj.utils.markdown(this.information);
  }

  async getPrivileges() {
    let UserPrivilege = syzoj.model('user_privilege');
    let privileges = await UserPrivilege.query(null, {
      user_id: this.id
    });

    return privileges.map(x => x.privilege);
  }

  async setPrivileges(newPrivileges) {
    let UserPrivilege = syzoj.model('user_privilege');

    let oldPrivileges = await this.getPrivileges();

    let delPrivileges = oldPrivileges.filter(x => !newPrivileges.includes(x));
    let addPrivileges = newPrivileges.filter(x => !oldPrivileges.includes(x));

    for (let privilege of delPrivileges) {
      let obj = await UserPrivilege.findOne({ where: {
        user_id: this.id,
        privilege: privilege
      } });

      await obj.destroy();
    }

    for (let privilege of addPrivileges) {
      let obj = await UserPrivilege.create({
        user_id: this.id,
        privilege: privilege
      });

      await obj.save();
    }
  }

  async hasPrivilege(privilege) {
    if (this.is_admin) return true;

    let UserPrivilege = syzoj.model('user_privilege');
    let x = await UserPrivilege.findOne({ where: { user_id: this.id, privilege: privilege } });
    return !(!x);
  }

  async getLastSubmitLanguage() {
    let JudgeState = syzoj.model('judge_state');

    let a = await JudgeState.query([1, 1], { user_id: this.id }, [['submit_time', 'desc']]);
    if (a[0]) return a[0].language;

    return null;
  }

  getModel() { return model; }
}

User.model = model;

module.exports = User;
