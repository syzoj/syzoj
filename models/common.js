let Sequelize = require('sequelize');

class Model {
  constructor(record) {
    this.record = record;
    this.loadFields();
  }

  loadFields() {
    let model = this.getModel();
    let obj = JSON.parse(JSON.stringify(this.record.get({ plain: true })));
    for (let key in obj) {
      if (!model.tableAttributes[key]) continue;

      if (model.tableAttributes[key].type instanceof Sequelize.JSON && typeof obj[key] === 'string') {
        try {
          this[key] = JSON.parse(obj[key]);
        } catch (e) {
          this[key] = {};
        }
      } else this[key] = obj[key];
    }
  }

  toPlain() {
    let model = this.getModel();
    let obj = JSON.parse(JSON.stringify(this.record.get({ plain: true })));
    for (let key in obj) {
      obj[key] = this[key];
    }
    return obj;
  }

  async save() {
    let obj = this.toPlain();
    for (let key in obj) this.record.set(key, obj[key]);

    let isNew = this.record.isNewRecord;

    await syzoj.utils.withTimeoutRetry(() => this.record.save());
    if (!isNew) return;

    await this.reload();
  }

  async reload() {
    await this.record.reload();
    this.loadFields();
  }

  async destroy() {
    return this.record.destroy();
  }

  static async fromRecord(record) {
    record = await record;
    if (!record) return null;
    return new this(await record);
  }

  static async fromID(id) {
    return this.fromRecord(this.model.findByPk(id));
  }

  static async findOne(options) {
    return this.fromRecord(this.model.findOne(options));
  }

  static async all() {
    return (await this.model.findAll()).mapAsync(record => (this.fromRecord(record)));
  }

  static async count(where) {
    // count(sql)
    if (typeof where === 'string') {
      let sql = where;
      return syzoj.db.countQuery(sql);
    }

    // count(where)
    return this.model.count({ where: where });
  }

  static async query(paginate, where, order, largeData) {
    let records = [];

    if (typeof paginate === 'string') {
      // query(sql)
      let sql = paginate;
      records = await syzoj.db.query(sql, { model: this.model });
    } else {
      if (paginate && !Array.isArray(paginate) && !paginate.pageCnt) return [];

      let options = {
        where: where,
        order: order
      };
      if (Array.isArray(paginate)) {
        options.offset = paginate[0] - 1;
        options.limit = paginate[1] - paginate[0] + 1;
      } else if (paginate) {
        options.offset = (paginate.currPage - 1) * paginate.perPage;
        options.limit = parseInt(paginate.perPage);
      }

      if (!largeData) records = await this.model.findAll(options);
      else {
        let sql = await getSqlFromFindAll(this.model, options);
        let i = sql.indexOf('FROM');
        sql = 'SELECT id ' + sql.substr(i, sql.length - i);
        sql = `SELECT a.* FROM (${sql}) AS b JOIN ${this.model.name} AS a ON a.id = b.id ORDER BY id DESC`;
        records = await syzoj.db.query(sql, { model: this.model });
      }
    }

    return records.mapAsync(record => (this.fromRecord(record)));
  }
}

function getSqlFromFindAll(Model, options) {
  let id = require('uuid')();

  return new Promise((resolve, reject) => {
    Model.addHook('beforeFindAfterOptions', id, options => {
      Model.removeHook('beforeFindAfterOptions', id);

      resolve(Model.sequelize.dialect.QueryGenerator.selectQuery(Model.getTableName(), options, Model).slice(0, -1));

      return new Promise(() => {});
    });

    return Model.findAll(options).catch(reject);
  });
}

module.exports = Model;
