import * as TypeORM from "typeorm";
import Model from "./common";

export enum StatisticsType {
  FASTEST = "fastest",
  SLOWEST = "slowest",
  SHORTEST = "shortest",
  LONGEST = "longest",
  MEMORY_MIN = "min",
  MEMORY_MAX = "max",
  EARLIEST = "earliest"
}

@TypeORM.Entity()
@TypeORM.Index(['problem_id', 'type', 'key'])
export default class SubmissionStatistics extends Model {
  static cache = false;

  @TypeORM.PrimaryColumn({ type: "integer" })
  problem_id: number;

  @TypeORM.PrimaryColumn({ type: "integer" })
  user_id: number;

  @TypeORM.PrimaryColumn({ type: "enum", enum: StatisticsType })
  type: StatisticsType;

  @TypeORM.Column({ type: "integer" })
  key: number;

  @TypeORM.Column({ type: "integer" })
  submission_id: number;
};
