import * as TypeORM from "typeorm";
import Model from "./common";

import User from "./user";
import Contest from "./contest";

@TypeORM.Entity()
export default class ContestPlayer extends Model {
  static cache = true;

  @TypeORM.PrimaryGeneratedColumn()
  id: number;

  @TypeORM.Index()
  @TypeORM.Column({ nullable: true, type: "integer" })
  contest_id: number;

  @TypeORM.Index()
  @TypeORM.Column({ nullable: true, type: "integer" })
  user_id: number;

  @TypeORM.Column({ nullable: true, type: "integer" })
  score: number;

  @TypeORM.Column({ default: JSON.stringify({}), type: "json" })
  score_details: object;

  @TypeORM.Column({ nullable: true, type: "integer" })
  time_spent: number;

  user?: User;
  contest?: Contest;

  static async findInContest(where) {
    return ContestPlayer.findOne({ where: where });
  }

  async loadRelationships() {
    this.user = await User.findById(this.user_id);
    this.contest = await Contest.findById(this.contest_id);
  }

  async updateScore(judge_state) {
    await this.loadRelationships();
    if (this.contest.type === 'ioi') {
      if (!judge_state.pending) {
        if (!this.score_details[judge_state.problem_id]) {
          this.score_details[judge_state.problem_id] = {
            score: judge_state.score,
            judge_id: judge_state.id,
            submissions: {}
          };
        }

        this.score_details[judge_state.problem_id].submissions[judge_state.id] = {
          judge_id: judge_state.id,
          score: judge_state.score,
          time: judge_state.submit_time
        };

        let arr: any = Object.values(this.score_details[judge_state.problem_id].submissions);
        arr.sort((a, b) => a.time - b.time);

        let maxScoreSubmission = null;
        for (let x of arr) {
          if (!maxScoreSubmission || x.score >= maxScoreSubmission.score && maxScoreSubmission.score < 100) {
            maxScoreSubmission = x;
          }
        }

        this.score_details[judge_state.problem_id].judge_id = maxScoreSubmission.judge_id;
        this.score_details[judge_state.problem_id].score = maxScoreSubmission.score;
        this.score_details[judge_state.problem_id].time = maxScoreSubmission.time;

        this.score = 0;
        for (let x in this.score_details) {
          if (this.score != null)
            this.score += this.score_details[x].score;
        }
      }
    } else if (this.contest.type === 'noi') {
      if (this.score_details[judge_state.problem_id] && this.score_details[judge_state.problem_id].judge_id > judge_state.id) return;

      this.score_details[judge_state.problem_id] = {
        score: judge_state.score,
        judge_id: judge_state.id
      };

      this.score = 0;
      for (let x in this.score_details) {
        if (this.score != null)
          this.score += this.score_details[x].score;
      }
    } else if (this.contest.type === 'acm') {
      if (!judge_state.pending) {
        if (!this.score_details[judge_state.problem_id]) {
          this.score_details[judge_state.problem_id] = {
            accepted: false,
            unacceptedCount: 0,
            acceptedTime: 0,
            judge_id: 0,
            submissions: {}
          };
        }

        this.score_details[judge_state.problem_id].submissions[judge_state.id] = {
          judge_id: judge_state.id,
          accepted: judge_state.status === 'Accepted',
          compiled: judge_state.score != null,
          time: judge_state.submit_time
        };

        let arr: any = Object.values(this.score_details[judge_state.problem_id].submissions);
        arr.sort((a, b) => a.time - b.time);

        this.score_details[judge_state.problem_id].unacceptedCount = 0;
        this.score_details[judge_state.problem_id].judge_id = 0;
        this.score_details[judge_state.problem_id].accepted = 0;
        for (let x of arr) {
          if (x.accepted) {
            this.score_details[judge_state.problem_id].accepted = true;
            this.score_details[judge_state.problem_id].acceptedTime = x.time;
            this.score_details[judge_state.problem_id].judge_id = x.judge_id;
            break;
          } else if (x.compiled) {
            this.score_details[judge_state.problem_id].unacceptedCount++;
          }
        }

        if (!this.score_details[judge_state.problem_id].accepted) {
          this.score_details[judge_state.problem_id].judge_id = arr[arr.length - 1].judge_id;
        }

        this.score = 0;
        for (let x in this.score_details) {
          if (this.score_details[x].accepted) this.score++;
        }
      }
    }
  }
}
