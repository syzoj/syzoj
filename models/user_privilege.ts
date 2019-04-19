import * as TypeORM from "typeorm";
import Model from "./common";

@TypeORM.Entity()
export default class UserPrivilege extends Model {
  @TypeORM.Index()
  @TypeORM.Column({ type: "integer", primary: true })
  user_id: number;

  @TypeORM.Index()
  @TypeORM.Column({ type: "varchar", length: 80, primary: true })
  privilege: string;
}
