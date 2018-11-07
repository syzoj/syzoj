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
