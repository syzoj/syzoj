let Sequelize = require('sequelize');
let db = syzoj.db;

let model = db.define('formatted_code', {
  key: { type: Sequelize.STRING(50), primaryKey: true },
  code: { type: Sequelize.TEXT('medium') }
}, {
  timestamps: false,
  tableName: 'formatted_code',
  indexes: [
    {
      fields: ['key']
    }
  ]
});

let Model = require('./common');
class FormattedCode extends Model {
  static async create(val) {
    return FormattedCode.fromRecord(FormattedCode.model.build(Object.assign({
      key: "",
      code: ""
    }, val)));
  }

  getModel() { return model; }
}

FormattedCode.model = model;

module.exports = FormattedCode;
