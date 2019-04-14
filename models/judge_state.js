let Sequelize = require('sequelize');
const randomstring = require('randomstring');
let db = syzoj.db;

let User = syzoj.model('user');
let Problem = syzoj.model('problem');
let Contest = syzoj.model('contest');

let Judger = syzoj.lib('judger');

let model = db.define('judge_state', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

  // The data zip's md5 if it's a submit-answer problem
  code: { type: Sequelize.TEXT('medium') },
  language: { type: Sequelize.STRING(20) },

  status: { type: Sequelize.STRING(50) },
  task_id: { type: Sequelize.STRING(50) },
  score: { type: Sequelize.INTEGER },
  total_time: { type: Sequelize.INTEGER },
  code_length: { type: Sequelize.INTEGER },
  pending: { type: Sequelize.BOOLEAN },
  max_memory: { type: Sequelize.INTEGER },

  // For NOI contest
  compilation: { type: Sequelize.JSON },

  result: { type: Sequelize.JSON },

  user_id: { type: Sequelize.INTEGER },

  problem_id: { type: Sequelize.INTEGER },

  submit_time: { type: Sequelize.INTEGER },
  /*
   * "type" indicate it's contest's submission(type = 1) or normal submission(type = 0)
   * if it's contest's submission (type = 1), the type_info is contest_id
   * use this way represent because it's easy to expand // Menci：这锅我不背，是 Chenyao 留下来的坑。
   */
  type: { type: Sequelize.INTEGER },
  type_info: { type: Sequelize.INTEGER },
  is_public: { type: Sequelize.BOOLEAN }
}, {
    timestamps: false,
    tableName: 'judge_state',
    indexes: [
      {
        fields: ['status'],
      },
      {
        fields: ['score'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['problem_id'],
      },
      {
        fields: ['task_id'],
      },
      {
        fields: ['id', 'is_public', 'type_info', 'type']
      }
    ]
  });

let Model = require('./common');
class JudgeState extends Model {
  static async create(val) {
    return JudgeState.fromRecord(JudgeState.model.build(Object.assign({
      code: '',
      code_length: 0,
      language: null,
      user_id: 0,
      problem_id: 0,
      submit_time: parseInt((new Date()).getTime() / 1000),

      type: 0,
      type_info: 0,

      pending: false,

      score: null,
      total_time: null,
      max_memory: null,
      status: 'Unknown',
      compilation: {},
      result: {},
      task_id: randomstring.generate(10),
      is_public: false
    }, val)));
  }

  async loadRelationships() {
    if (!this.user) {
      this.user = await User.fromID(this.user_id);
    }
    if (!this.problem) {
      if (this.problem_id) this.problem = await Problem.fromID(this.problem_id);
    }
  }

  async isAllowedVisitBy(user) {
    await this.loadRelationships();

    if (user && user.id === this.problem.user_id) return true;
    else if (this.type === 0) return this.problem.is_public || (user && (await user.hasPrivilege('manage_problem')));
    else if (this.type === 1) {
      let contest = await Contest.fromID(this.type_info);
      if (contest.isRunning()) {
        return user && await contest.isSupervisior(user);
      } else {
        return true;
      }
    }
  }

  async updateRelatedInfo(newSubmission) {
    if (this.type === 0) {
      await this.loadRelationships();

      // No need to await them.
      this.user.refreshSubmitInfo();
      this.problem.resetSubmissionCount();
    } else if (this.type === 1) {
      let contest = await Contest.fromID(this.type_info);
      await contest.newSubmission(this);
    }
  }

  async rejudge() {
    await syzoj.utils.lock(['JudgeState::rejudge', this.id], async () => {
      await this.loadRelationships();

      let oldStatus = this.status;

      this.status = 'Unknown';
      this.pending = false;
      this.score = null;
      if (this.language) {
        // language is empty if it's a submit-answer problem
        this.total_time = null;
        this.max_memory = null;
      }
      this.result = {};
      this.task_id = randomstring.generate(10);
      await this.save();

      /*
      let WaitingJudge = syzoj.model('waiting_judge');
      let waiting_judge = await WaitingJudge.create({
        judge_id: this.id,
        priority: 2,
        type: 'submission'
      });

      await waiting_judge.save();
      */

      await this.problem.resetSubmissionCount();
      if (oldStatus === 'Accepted') {
        await this.user.refreshSubmitInfo();
        await this.user.save();
      }

      if (this.type === 1) {
        let contest = await Contest.fromID(this.type_info);
        await contest.newSubmission(this);
      }

      try {
        await Judger.judge(this, this.problem, 1);
        this.pending = true;
        this.status = 'Waiting';
        await this.save();
      } catch (err) {
        console.log("Error while connecting to judge frontend: " + err.toString());
        throw new ErrorMessage("无法开始评测。");
      }
    });
  }

  async getProblemType() {
    await this.loadRelationships();
    return this.problem.type;
  }

  getModel() { return model; }
}

JudgeState.model = model;

module.exports = JudgeState;
