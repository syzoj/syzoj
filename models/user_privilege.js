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
