const statisticsStatements = {
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
		ORDER BY `code_length` ASC \
    LIMIT 1 \
	) AS `id`, \
	( \
		SELECT \
			`code_length` \
		FROM `judge_state` `inner_table` \
		WHERE `problem_id` = `outer_table`.`problem_id` AND `user_id` = `outer_table`.`user_id` AND `status` = "Accepted" AND `type` = 0 \
		ORDER BY `code_length` ASC \
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
		ORDER BY `code_length` DESC \
    LIMIT 1 \
	) AS `id`, \
	( \
		SELECT \
			`code_length` \
		FROM `judge_state` `inner_table` \
		WHERE `problem_id` = `outer_table`.`problem_id` AND `user_id` = `outer_table`.`user_id` AND `status` = "Accepted" AND `type` = 0 \
		ORDER BY `code_length` DESC \
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
',
  min:
  ' \
SELECT \
	DISTINCT(`user_id`) AS `user_id`,  \
	( \
		SELECT \
			`id` \
		FROM `judge_state` `inner_table` \
		WHERE `problem_id` = `outer_table`.`problem_id` AND `user_id` = `outer_table`.`user_id` AND `status` = "Accepted" AND `type` = 0 \
		ORDER BY `max_memory` ASC \
    LIMIT 1 \
	) AS `id`, \
	( \
		SELECT \
			`max_memory` \
		FROM `judge_state` `inner_table` \
		WHERE `problem_id` = `outer_table`.`problem_id` AND `user_id` = `outer_table`.`user_id` AND `status` = "Accepted" AND `type` = 0 \
		ORDER BY `max_memory` ASC \
    LIMIT 1 \
	) AS `max_memory` \
FROM `judge_state` `outer_table` \
WHERE  \
	`problem_id` = __PROBLEM_ID__ AND `status` = "Accepted" AND `type` = 0 \
ORDER BY `max_memory` ASC \
',
  max:
  ' \
SELECT \
	DISTINCT(`user_id`) AS `user_id`,  \
	( \
		SELECT \
			`id` \
		FROM `judge_state` `inner_table` \
		WHERE `problem_id` = `outer_table`.`problem_id` AND `user_id` = `outer_table`.`user_id` AND `status` = "Accepted" AND `type` = 0 \
		ORDER BY `max_memory` ASC \
    LIMIT 1 \
	) AS `id`, \
	( \
		SELECT \
			`max_memory` \
		FROM `judge_state` `inner_table` \
		WHERE `problem_id` = `outer_table`.`problem_id` AND `user_id` = `outer_table`.`user_id` AND `status` = "Accepted" AND `type` = 0 \
		ORDER BY `max_memory` ASC \
    LIMIT 1 \
	) AS `max_memory` \
FROM `judge_state` `outer_table` \
WHERE  \
	`problem_id` = __PROBLEM_ID__ AND `status` = "Accepted" AND `type` = 0 \
ORDER BY `max_memory` DESC \
'
};

import * as TypeORM from "typeorm";
import Model from "./common";

declare var syzoj, ErrorMessage: any;

import User from "./user";
import File from "./file";
import JudgeState from "./judge_state";
import Contest from "./contest";
import ProblemTag from "./problem_tag";
import ProblemTagMap from "./problem_tag_map";

import * as fs from "fs-extra";
import * as path from "path";
import * as util from "util";

enum ProblemType {
  Traditional = "traditional",
  SubmitAnswer = "submit-answer",
  Interaction = "interaction"
}

@TypeORM.Entity()
export default class Problem extends Model {
  @TypeORM.PrimaryGeneratedColumn()
  id: number;

  @TypeORM.Column({ nullable: true, type: "varchar", length: 80 })
  title: string;

  @TypeORM.Index()
  @TypeORM.Column({ nullable: true, type: "integer" })
  user_id: number;

  @TypeORM.Column({ nullable: true, type: "integer" })
  publicizer_id: number;

  @TypeORM.Column({ nullable: true, type: "boolean" })
  is_anonymous: boolean;

  @TypeORM.Column({ nullable: true, type: "text" })
  description: string;

  @TypeORM.Column({ nullable: true, type: "text" })
  input_format: string;
  
  @TypeORM.Column({ nullable: true, type: "text" })
  output_format: string;

  @TypeORM.Column({ nullable: true, type: "text" })
  example: string;

  @TypeORM.Column({ nullable: true, type: "text" })
  limit_and_hint: string;

  @TypeORM.Column({ nullable: true, type: "integer" })
  time_limit: number;

  @TypeORM.Column({ nullable: true, type: "integer" })
  memory_limit: number;

  @TypeORM.Column({ nullable: true, type: "integer" })
  additional_file_id: number;

  @TypeORM.Column({ nullable: true, type: "integer" })
  ac_num: number;

  @TypeORM.Column({ nullable: true, type: "integer" })
  submit_num: number;

  @TypeORM.Index()
  @TypeORM.Column({ nullable: true, type: "boolean" })
  is_public: boolean;

  @TypeORM.Column({ nullable: true, type: "boolean" })
  file_io: boolean;

  @TypeORM.Column({ nullable: true, type: "text" })
  file_io_input_name: string;

  @TypeORM.Column({ nullable: true, type: "text" })
  file_io_output_name: string;

  @TypeORM.Index()
  @TypeORM.Column({ nullable: true, type: "datetime" })
  publicize_time: Date;

  @TypeORM.Column({ nullable: true,
      type: "enum",
      enum: ProblemType,
      default: ProblemType.Traditional
  })
  type: ProblemType;

  user?: User;
  publicizer?: User;
  additional_file?: File;

  async loadRelationships() {
    this.user = await User.findById(this.user_id);
    this.publicizer = await User.findById(this.publicizer_id);
    this.additional_file = await File.findById(this.additional_file_id);
  }

  async isAllowedEditBy(user) {
    if (!user) return false;
    if (await user.hasPrivilege('manage_problem')) return true;
    return this.user_id === user.id;
  }

  async isAllowedUseBy(user) {
    if (this.is_public) return true;
    if (!user) return false;
    if (await user.hasPrivilege('manage_problem')) return true;
    return this.user_id === user.id;
  }

  async isAllowedManageBy(user) {
    if (!user) return false;
    if (await user.hasPrivilege('manage_problem')) return true;
    return user.is_admin;
  }

  getTestdataPath() {
    return syzoj.utils.resolvePath(syzoj.config.upload_dir, 'testdata', this.id.toString());
  }

  getTestdataArchivePath() {
    return syzoj.utils.resolvePath(syzoj.config.upload_dir, 'testdata-archive', this.id.toString() + '.zip');
  }

  async updateTestdata(path, noLimit) {
    await syzoj.utils.lock(['Problem::Testdata', this.id], async () => {
      let p7zip = new (require('node-7z'));

      let unzipSize = 0, unzipCount;
      await p7zip.list(path).progress(files => {
        unzipCount = files.length;
        for (let file of files) unzipSize += file.size;
      });
      if (!noLimit && unzipCount > syzoj.config.limit.testdata_filecount) throw new ErrorMessage('数据包中的文件太多。');
      if (!noLimit && unzipSize > syzoj.config.limit.testdata) throw new ErrorMessage('数据包太大。');

      let dir = this.getTestdataPath();
      await fs.remove(dir);
      await fs.ensureDir(dir);

      let execFileAsync = util.promisify(require('child_process').execFile);
      await execFileAsync(__dirname + '/../bin/unzip', ['-j', '-o', '-d', dir, path]);
      await fs.move(path, this.getTestdataArchivePath(), { overwrite: true });
    });
  }

  async uploadTestdataSingleFile(filename, filepath, size, noLimit) {
    await syzoj.utils.lock(['Promise::Testdata', this.id], async () => {
      let dir = this.getTestdataPath();
      await fs.ensureDir(dir);

      let oldSize = 0, list = await this.listTestdata(), replace = false, oldCount = 0;
      if (list) {
        oldCount = list.files.length;
        for (let file of list.files) {
          if (file.filename !== filename) oldSize += file.size;
          else replace = true;
        }
      }

      if (!noLimit && oldSize + size > syzoj.config.limit.testdata) throw new ErrorMessage('数据包太大。');
      if (!noLimit && oldCount + (!replace as any as number) > syzoj.config.limit.testdata_filecount) throw new ErrorMessage('数据包中的文件太多。');

      await fs.move(filepath, path.join(dir, filename), { overwrite: true });

      let execFileAsync = util.promisify(require('child_process').execFile);
      try { await execFileAsync('dos2unix', [path.join(dir, filename)]); } catch (e) {}

      await fs.remove(this.getTestdataArchivePath());
    });
  }

  async deleteTestdataSingleFile(filename) {
    await syzoj.utils.lock(['Promise::Testdata', this.id], async () => {
      await fs.remove(path.join(this.getTestdataPath(), filename));
      await fs.remove(this.getTestdataArchivePath());
    });
  }

  async makeTestdataZip() {
    await syzoj.utils.lock(['Promise::Testdata', this.id], async () => {
      let dir = this.getTestdataPath();
      if (!await syzoj.utils.isDir(dir)) throw new ErrorMessage('无测试数据。');

      let p7zip = new (require('node-7z'));

      let list = await this.listTestdata(), pathlist = list.files.map(file => path.join(dir, file.filename));
      if (!pathlist.length) throw new ErrorMessage('无测试数据。');
      await fs.ensureDir(path.resolve(this.getTestdataArchivePath(), '..'));
      await p7zip.add(this.getTestdataArchivePath(), pathlist);
    });
  }

  async hasSpecialJudge() {
    try {
      let dir = this.getTestdataPath();
      let list = await fs.readdir(dir);
      return list.includes('spj.js') || list.find(x => x.startsWith('spj_')) !== undefined;
    } catch (e) {
      return false;
    }
  }

  async listTestdata() {
    try {
      let dir = this.getTestdataPath();
      let filenameList = await fs.readdir(dir);
      let list = await Promise.all(filenameList.map(async x => {
        let stat = await fs.stat(path.join(dir, x));
        if (!stat.isFile()) return undefined;
        return {
          filename: x,
          size: stat.size
        };
      }));

      list = list.filter(x => x);

      let res = {
        files: list,
        zip: null
      };

      try {
        let stat = await fs.stat(this.getTestdataArchivePath());
        if (stat.isFile()) {
          res.zip = {
            size: stat.size
          };
        }
      } catch (e) {
        if (list) {
          res.zip = {
            size: null
          };
        }
      }

      return res;
    } catch (e) {
      return null;
    }
  }

  async updateFile(path, type, noLimit) {
    let file = await File.upload(path, type, noLimit);

    if (type === 'additional_file') {
      this.additional_file_id = file.id;
    }

    await this.save();
  }

  async validate() {
    if (this.time_limit <= 0) return 'Invalid time limit';
    if (this.time_limit > syzoj.config.limit.time_limit) return 'Time limit too large';
    if (this.memory_limit <= 0) return 'Invalid memory limit';
    if (this.memory_limit > syzoj.config.limit.memory_limit) return 'Memory limit too large';
    if (!['traditional', 'submit-answer', 'interaction'].includes(this.type)) return 'Invalid problem type';

    if (this.type === 'traditional') {
      let filenameRE = /^[\w \-\+\.]*$/;
      if (this.file_io_input_name && !filenameRE.test(this.file_io_input_name)) return 'Invalid input file name';
      if (this.file_io_output_name && !filenameRE.test(this.file_io_output_name)) return 'Invalid output file name';

      if (this.file_io) {
        if (!this.file_io_input_name) return 'No input file name';
        if (!this.file_io_output_name) return 'No output file name';
      }
    }

    return null;
  }

  async getJudgeState(user, acFirst) {
    if (!user) return null;

    let where: any = {
      user_id: user.id,
      problem_id: this.id
    };

    if (acFirst) {
      where.status = 'Accepted';

      let state = await JudgeState.findOne({
        where: where,
        order: {
          submit_time: 'DESC'
        }
      });

      if (state) return state;
    }

    if (where.status) delete where.status;

    return await JudgeState.findOne({
      where: where,
      order: {
        submit_time: 'DESC'
      }
    });
  }

  async resetSubmissionCount() {
    await syzoj.utils.lock(['Problem::resetSubmissionCount', this.id], async () => {
      this.submit_num = await JudgeState.count({ problem_id: this.id, type: TypeORM.Not(1) });
      this.ac_num = await JudgeState.count({ score: 100, problem_id: this.id, type: TypeORM.Not(1) });
      await this.save();
    });
  }

  // type: fastest / slowest / shortest / longest / earliest
  async countStatistics(type) {
    let statement = statisticsStatements[type];
    if (!statement) return null;

    const entityManager = TypeORM.getManager();

    statement = statement.replace('__PROBLEM_ID__', this.id);
    return JudgeState.countQuery(statement);
  }

  // type: fastest / slowest / shortest / longest / earliest
  async getStatistics(type, paginate) {
    const entityManager = TypeORM.getManager();

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
    else a = (await entityManager.query(statement + `LIMIT ${paginate.perPage} OFFSET ${(paginate.currPage - 1) * paginate.perPage}`));

    statistics.judge_state = await a.mapAsync(async x => JudgeState.findById(x.id));

    a = (await entityManager.query('SELECT `score`, COUNT(*) AS `count` FROM `judge_state` WHERE `problem_id` = __PROBLEM_ID__ AND `type` = 0 AND `pending` = 0 GROUP BY `score`'.replace('__PROBLEM_ID__', this.id.toString())));

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

  async getTags() {
    let maps = await ProblemTagMap.find({
      where: {
        problem_id: this.id
      }
    });

    let res = await (maps as any).mapAsync(async map => {
      return ProblemTag.findById(map.tag_id);
    });

    res.sort((a, b) => {
      return a.color > b.color ? 1 : -1;
    });

    return res;
  }

  async setTags(newTagIDs) {
    let oldTagIDs = (await this.getTags()).map(x => x.id);

    let delTagIDs = oldTagIDs.filter(x => !newTagIDs.includes(x));
    let addTagIDs = newTagIDs.filter(x => !oldTagIDs.includes(x));

    for (let tagID of delTagIDs) {
      let map = await ProblemTagMap.findOne({
        where: {
          problem_id: this.id,
          tag_id: tagID
        }
      });

      await map.destroy();
    }

    for (let tagID of addTagIDs) {
      let map = await ProblemTagMap.create({
        problem_id: this.id,
        tag_id: tagID
      });

      await map.save();
    }
  }

  async changeID(id) {
    const entityManager = TypeORM.getManager();

    id = parseInt(id);
    await entityManager.query('UPDATE `problem`         SET `id`         = ' + id + ' WHERE `id`         = ' + this.id);
    await entityManager.query('UPDATE `judge_state`     SET `problem_id` = ' + id + ' WHERE `problem_id` = ' + this.id);
    await entityManager.query('UPDATE `problem_tag_map` SET `problem_id` = ' + id + ' WHERE `problem_id` = ' + this.id);
    await entityManager.query('UPDATE `article`         SET `problem_id` = ' + id + ' WHERE `problem_id` = ' + this.id);


    let contests = await Contest.find();
    for (let contest of contests) {
      let problemIDs = await contest.getProblems();

      let flag = false;
      for (let i in problemIDs) {
        if (problemIDs[i] === this.id) {
          problemIDs[i] = id;
          flag = true;
        }
      }

      if (flag) {
        await contest.setProblemsNoCheck(problemIDs);
        await contest.save();
      }
    }

    let oldTestdataDir = this.getTestdataPath(), oldTestdataZip = this.getTestdataArchivePath();

    this.id = id;

    // Move testdata
    let newTestdataDir = this.getTestdataPath(), newTestdataZip = this.getTestdataArchivePath();
    if (await syzoj.utils.isDir(oldTestdataDir)) {
      await fs.move(oldTestdataDir, newTestdataDir);
    }

    if (await syzoj.utils.isFile(oldTestdataZip)) {
      await fs.move(oldTestdataZip, newTestdataZip);
    }

    await this.save();
  }

  async delete() {
    const entityManager = TypeORM.getManager();

    let oldTestdataDir = this.getTestdataPath(), oldTestdataZip = this.getTestdataPath();
    await fs.remove(oldTestdataDir);
    await fs.remove(oldTestdataZip);

    let submissions = await JudgeState.find({
      where: {
        problem_id: this.id
      }
    }), submitCnt = {}, acUsers = new Set();
    for (let sm of submissions) {
      if (sm.status === 'Accepted') acUsers.add(sm.user_id);
      if (!submitCnt[sm.user_id]) {
        submitCnt[sm.user_id] = 1;
      } else {
        submitCnt[sm.user_id]++;
      }
    }

    for (let u in submitCnt) {
      let user = await User.findById(parseInt(u));
      user.submit_num -= submitCnt[u];
      if (acUsers.has(parseInt(u))) user.ac_num--;
      await user.save();
    }

    await entityManager.query('DELETE FROM `problem`         WHERE `id`         = ' + this.id);
    await entityManager.query('DELETE FROM `judge_state`     WHERE `problem_id` = ' + this.id);
    await entityManager.query('DELETE FROM `problem_tag_map` WHERE `problem_id` = ' + this.id);
    await entityManager.query('DELETE FROM `article`         WHERE `problem_id` = ' + this.id);
  }
}
