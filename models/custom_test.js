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

  result: { type: Sequelize.JSON },

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
      result: {},
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
