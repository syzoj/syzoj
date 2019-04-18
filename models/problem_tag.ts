import * as TypeORM from "typeorm";
import Model from "./common";

@TypeORM.Entity()
export default class ProblemTag extends Model {
  @TypeORM.PrimaryGeneratedColumn()
  id: number;

  @TypeORM.Index({ unique: true })
  @TypeORM.Column({ nullable: true, type: "varchar", length: 255 })
  name: string;

  @TypeORM.Column({ nullable: true, type: "varchar", length: 255 })
  color: string;
}
