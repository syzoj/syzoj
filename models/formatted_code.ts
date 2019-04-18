import * as TypeORM from "typeorm";
import Model from "./common";

@TypeORM.Entity()
export default class FormattedCode extends Model {
  @TypeORM.Column({ type: "varchar", length: 50, primary: true })
  key: string;

  @TypeORM.Column({ nullable: true, type: "mediumtext" })
  code: string;
}
