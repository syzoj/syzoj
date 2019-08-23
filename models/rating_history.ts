import * as TypeORM from "typeorm";
import Model from "./common";

declare var syzoj: any;

import User from "./user";

@TypeORM.Entity()
export default class RatingHistory extends Model {
  @TypeORM.PrimaryColumn({ type: "integer" })
  rating_calculation_id: number;

  @TypeORM.PrimaryColumn({ type: "integer" })
  user_id: number;

  @TypeORM.Column({ nullable: true, type: "integer" })
  rating_after: number;

  @TypeORM.Column({ nullable: true, type: "integer" })
  rank: number;

  user: User;

  async loadRelationships() {
    this.user = await User.findById(this.user_id);
  }
}
