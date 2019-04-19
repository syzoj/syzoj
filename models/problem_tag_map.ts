import * as TypeORM from "typeorm";
import Model from "./common";

@TypeORM.Entity()
export default class ProblemTagMap extends Model {
  @TypeORM.Index()
  @TypeORM.PrimaryColumn({ type: "integer" })
  problem_id: number;

  @TypeORM.Index()
  @TypeORM.PrimaryColumn({ type: "integer" })
  tag_id: number;
}
