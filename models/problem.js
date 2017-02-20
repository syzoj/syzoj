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

let statisticsStatements = {
  fastest:
'\
SELECT \
	DISTINCT(`user_id`) AS `user_id`,  \
	( \
		SELECT \
			`id` \
		FROM `judge_state` `inner_table` \
		WHERE `problem_id` = `outer_table`.`problem_id` AND `user_id` = `outer_table`.`user_id` AND `status` = "Accepted" AND `type` = 0 \
		ORDER BY `total_time` ASC \
    LIMIT 1 \
	) AS `id`, \
	( \
		SELECT \
			`total_time` \
		FROM `judge_state` `inner_table` \
		WHERE `problem_id` = `outer_table`.`problem_id` AND `user_id` = `outer_table`.`user_id` AND `status` = "Accepted" AND `type` = 0 \
		ORDER BY `total_time` ASC \
    LIMIT 1 \
	) AS `total_time` \
FROM `judge_state` `outer_table` \
WHERE  \
	`problem_id` = __PROBLEM_ID__ AND `status` = "Accepted" AND `type` = 0 \
ORDER BY `total_time` ASC \
',
  slowest:
' \
SELECT \
	DISTINCT(`user_id`) AS `user_id`,  \
	( \
		SELECT \
			`id` \
		FROM `judge_state` `inner_table` \
		WHERE `problem_id` = `outer_table`.`problem_id` AND `user_id` = `outer_table`.`user_id` AND `status` = "Accepted" AND `type` = 0 \
		ORDER BY `total_time` DESC \
    LIMIT 1 \
	) AS `id`, \
	( \
		SELECT \
			`total_time` \
		FROM `judge_state` `inner_table` \
		WHERE `problem_id` = `outer_table`.`problem_id` AND `user_id` = `outer_table`.`user_id` AND `status` = "Accepted" AND `type` = 0 \
		ORDER BY `total_time` DESC \
    LIMIT 1 \
	) AS `total_time` \
FROM `judge_state` `outer_table` \
WHERE  \
	`problem_id` = __PROBLEM_ID__ AND `status` = "Accepted" AND `type` = 0 \
ORDER BY `total_time` DESC \
',
  shortest:
' \
SELECT \
	DISTINCT(`user_id`) AS `user_id`,  \
	( \
		SELECT \
			`id` \
		FROM `judge_state` `inner_table` \
		WHERE `problem_id` = `outer_table`.`problem_id` AND `user_id` = `outer_table`.`user_id` AND `status` = "Accepted" AND `type` = 0 \
		ORDER BY LENGTH(`code`) ASC \
    LIMIT 1 \
	) AS `id`, \
	( \
		SELECT \
			LENGTH(`code`) \
		FROM `judge_state` `inner_table` \
		WHERE `problem_id` = `outer_table`.`problem_id` AND `user_id` = `outer_table`.`user_id` AND `status` = "Accepted" AND `type` = 0 \
		ORDER BY LENGTH(`code`) ASC \
    LIMIT 1 \
	) AS `code_length` \
FROM `judge_state` `outer_table` \
WHERE  \
	`problem_id` = __PROBLEM_ID__ AND `status` = "Accepted" AND `type` = 0 \
ORDER BY `code_length` ASC \
',
  longest:
' \
SELECT \
	DISTINCT(`user_id`) AS `user_id`,  \
	( \
		SELECT \
			`id` \
		FROM `judge_state` `inner_table` \
		WHERE `problem_id` = `outer_table`.`problem_id` AND `user_id` = `outer_table`.`user_id` AND `status` = "Accepted" AND `type` = 0 \
		ORDER BY LENGTH(`code`) DESC \
    LIMIT 1 \
	) AS `id`, \
	( \
		SELECT \
			LENGTH(`code`) \
		FROM `judge_state` `inner_table` \
		WHERE `problem_id` = `outer_table`.`problem_id` AND `user_id` = `outer_table`.`user_id` AND `status` = "Accepted" AND `type` = 0 \
		ORDER BY LENGTH(`code`) DESC \
    LIMIT 1 \
	) AS `code_length` \
FROM `judge_state` `outer_table` \
WHERE  \
	`problem_id` = __PROBLEM_ID__ AND `status` = "Accepted" AND `type` = 0 \
ORDER BY `code_length` DESC \
',
  earliest:
' \
SELECT \
	DISTINCT(`user_id`) AS `user_id`,  \
	( \
		SELECT \
			`id` \
		FROM `judge_state` `inner_table` \
		WHERE `problem_id` = `outer_table`.`problem_id` AND `user_id` = `outer_table`.`user_id` AND `status` = "Accepted" AND `type` = 0 \
		ORDER BY `submit_time` ASC \
    LIMIT 1 \
	) AS `id`, \
	( \
		SELECT \
			`submit_time` \
		FROM `judge_state` `inner_table` \
		WHERE `problem_id` = `outer_table`.`problem_id` AND `user_id` = `outer_table`.`user_id` AND `status` = "Accepted" AND `type` = 0 \
		ORDER BY `submit_time` ASC \
    LIMIT 1 \
	) AS `submit_time` \
FROM `judge_state` `outer_table` \
WHERE  \
	`problem_id` = __PROBLEM_ID__ AND `status` = "Accepted" AND `type` = 0 \
ORDER BY `submit_time` ASC \
'
};

let Sequelize = require('sequelize');
let db = syzoj.db;

let User = syzoj.model('user');
let TestData = syzoj.model('testdata');

let model = db.define('problem', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

  title: { type: Sequelize.STRING(80) },
  user_id: {
    type: Sequelize.INTEGER,
    references: {
      model: 'user',
      key: 'id'
    }
  },

  description: { type: Sequelize.TEXT },
  input_format: { type: Sequelize.TEXT },
  output_format: { type: Sequelize.TEXT },
  example: { type: Sequelize.TEXT },
  limit_and_hint: { type: Sequelize.TEXT },

  time_limit: { type: Sequelize.INTEGER },
  memory_limit: { type: Sequelize.INTEGER },

  testdata_id: {
    type: Sequelize.INTEGER,
    references: {
      model: 'file',
      key: 'id'
    }
  },

  ac_num: { type: Sequelize.INTEGER },
  submit_num: { type: Sequelize.INTEGER },
  is_public: { type: Sequelize.BOOLEAN },

  file_io: { type: Sequelize.BOOLEAN },
  file_io_input_name: { type: Sequelize.TEXT },
  file_io_output_name: { type: Sequelize.TEXT }
}, {
  timestamps: false,
  tableName: 'problem',
  indexes: [
    {
      fields: ['title'],
    },
    {
      fields: ['user_id'],
    }
  ]
});

let Model = require('./common');
class Problem extends Model {
  static async create(val) {
    return Problem.fromRecord(Problem.model.build(Object.assign({
      title: '',
      user_id: '',
      description: '',

      input_format: '',
      output_format: '',
      example: '',
      limit_and_hint: '',

      time_limit: syzoj.config.default.problem.time_limit,
      memory_limit: syzoj.config.default.problem.memory_limit,

      ac_num: 0,
      submit_num: 0,
      is_public: false,

      file_io: false,
      file_io_input_name: '',
      file_io_output_name: ''
    }, val)));
  }

  async loadRelationships() {
    this.user = await User.fromID(this.user_id);
    this.testdata = await TestData.fromID(this.testdata_id);
  }

  async isAllowedEditBy(user) {
    return user && (user.is_admin || this.user_id === user.id);
  }

  async isAllowedUseBy(user) {
    return this.is_public || (user && (user.is_admin || this.user_id === user.id));
  }

  async updateTestdata(path) {
    let fs = Promise.promisifyAll(require('fs'));

    let buf = await fs.readFileAsync(path);
    let key = syzoj.utils.md5(buf);
    await fs.rename(path, TestData.resolvePath(key));

    if (this.testdata_id) {
      let tmp = this.testdata_id;
      this.testdata_id = null;
      await this.save();
      let file = await TestData.fromID(tmp);
      await file.destroy();
    }

    let file = await TestData.create({
      filename: `test_data_${this.id}.zip`,
      md5: key
    });
    await file.save();
    this.testdata_id = file.id;
  }

  async getJudgeState(user, acFirst) {
    if (!user) return null;

    let JudgeState = syzoj.model('judge_state');

    let where = {
      user_id: user.id,
      problem_id: this.id
    };

    if (acFirst) {
      where.status = 'Accepted';

      let state = await JudgeState.findOne({
        where: where,
        order: [['submit_time', 'desc']]
      });

      if (state) return state;
    }

    if (where.status) delete where.status;

    return await JudgeState.findOne({
      where: where,
      order: [['submit_time', 'desc']]
    });
  }

  // type: fastest / slowest / shortest / longest / earliest
  async countStatistics(type) {
    let statement = statisticsStatements[type];
    if (!statement) return null;

    statement = statement.replace('__PROBLEM_ID__', this.id);
    return await db.countQuery(statement);
  }

  // type: fastest / slowest / shortest / longest / earliest
  async getStatistics(type, paginate) {
    let statistics = {
      type: type,
      judge_state: null,
      scoreDistribution: null,
      prefixSum: null,
      suffixSum: null
    };

    let statement = statisticsStatements[type];
    if (!statement) return null;

    statement = statement.replace('__PROBLEM_ID__', this.id);

    let a;
    if (!paginate.pageCnt) a = [];
    else a = (await db.query(statement + `LIMIT ${paginate.perPage} OFFSET ${(paginate.currPage - 1) * paginate.perPage}`))[0];

    let JudgeState = syzoj.model('judge_state');
    statistics.judge_state = await a.mapAsync(async x => JudgeState.fromID(x.id));

    a = (await db.query('SELECT `score`, COUNT(*) AS `count` FROM `judge_state` WHERE `problem_id` = __PROBLEM_ID__ AND `type` = 0 AND `pending` = 0 GROUP BY `score`'.replace('__PROBLEM_ID__', this.id)))[0];

    let scoreCount = [];
    for (let score of a) {
      score.score = Math.min(Math.round(score.score), 100);
      scoreCount[score.score] = score.count;
    }
    if (scoreCount[0] === undefined) scoreCount[0] = 0;
    if (scoreCount[100] === undefined) scoreCount[100] = 0;

    statistics.scoreDistribution = [];
    for (let i = 0; i < scoreCount.length; i++) {
      if (scoreCount[i] !== undefined) statistics.scoreDistribution.push({ score: i, count: scoreCount[i] });
    }

    statistics.prefixSum = JSON.parse(JSON.stringify(statistics.scoreDistribution));
    statistics.suffixSum = JSON.parse(JSON.stringify(statistics.scoreDistribution));

    for (let i = 1; i < statistics.prefixSum.length; i++) {
      statistics.prefixSum[i].count += statistics.prefixSum[i - 1].count;
    }

    for (let i = statistics.prefixSum.length - 1; i >= 1; i--) {
      statistics.suffixSum[i - 1].count += statistics.suffixSum[i].count;
    }

    return statistics;
  }

  getModel() { return model; }
}

Problem.model = model;

module.exports = Problem;
