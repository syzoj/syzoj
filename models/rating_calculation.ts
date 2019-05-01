import * as TypeORM from "typeorm";
import Model from "./common";

declare var syzoj: any;

import Contest from "./contest";
import RatingHistory from "./rating_history";

@TypeORM.Entity()
export default class RatingCalculation extends Model {
  @TypeORM.PrimaryGeneratedColumn()
  id: number;

  @TypeORM.Index({})
  @TypeORM.Column({ nullable: true, type: "integer" })
  contest_id: number;

  contest?: Contest;

  async loadRelationships() {
    this.contest = await Contest.findById(this.contest_id);
  }

  async delete() {
    const histories = await RatingHistory.find({
      where: {
        rating_calculation_id: this.id
      }
    });
    for (const history of histories) {
      await history.loadRelationships();
      const user = history.user;
      await history.destroy();
      const ratingItem = (await RatingHistory.findOne({
        where: {
          user_id: user.id
        },
        order: {
          rating_calculation_id: 'DESC'
        }
      }));
      user.rating = ratingItem ? ratingItem.rating_after : syzoj.config.default.user.rating;
      await user.save();
    }
    await this.destroy();
  }
}
