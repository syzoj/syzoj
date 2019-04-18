import * as TypeORM from "typeorm";
import Model from "./common";

@TypeORM.Entity()
export default class ProblemTagMap extends Model {
  @TypeORM.Index()
  @TypeORM.Column({ type: "integer", primary: true })
  problem_id: number;

  @TypeORM.Index()
  @TypeORM.Column({ type: "integer", primary: true })
  tag_id: number;
}
