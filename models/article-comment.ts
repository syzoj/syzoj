import * as TypeORM from "typeorm";
import Model from "./common";

import User from "./user";
import Article from "./article";

@TypeORM.Entity()
export default class ArticleComment extends Model {
  @TypeORM.PrimaryGeneratedColumn()
  id: number;

  @TypeORM.Column({ nullable: true, type: "text" })
  content: string;

  @TypeORM.Index()
  @TypeORM.Column({ nullable: true, type: "integer" })
  article_id: number;

  @TypeORM.Index()
  @TypeORM.Column({ nullable: true, type: "integer" })
  user_id: number;

  @TypeORM.Column({ nullable: true, type: "integer" })
  public_time: number;

  user?: User;
  article?: Article;

  async loadRelationships() {
    this.user = await User.findById(this.user_id);
    this.article = await Article.findById(this.article_id);
  }

  async isAllowedEditBy(user) {
    await this.loadRelationships();
    return user && (user.is_admin || this.user_id === user.id || user.id === this.article.user_id);
  }
};
