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

class Model {
  constructor(record) {
    this.record = record;
    this.loadFields();
  }

  loadFields() {
    let model = this.getModel();
    let obj = JSON.parse(JSON.stringify(this.record.get({ plain: true })));
    for (let key in obj) {
      if (model.tableAttributes[key].json) {
        try {
          this[key] = eval(`(${obj[key]})`);
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
      if (model.tableAttributes[key].json) obj[key] = JSON.stringify(this[key]);
      else obj[key] = this[key];
    }
    return obj;
  }

  async save() {
    let obj = this.toPlain();
    for (let key in obj) this.record.set(key, obj[key]);

    let isNew = this.record.isNewRecord;
    await this.record.save();
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
    return this.fromRecord(this.model.findById(id))
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

  static async query(paginate, where, order) {
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

      records = await this.model.findAll(options);
    }

    return records.mapAsync(record => (this.fromRecord(record)));
  }
}

module.exports = Model;
