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
