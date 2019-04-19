import * as TypeORM from "typeorm";

interface Paginater {
  pageCnt: number;
  perPage: number;
  currPage: number;
}

export default class Model extends TypeORM.BaseEntity {
  static async findById<T extends TypeORM.BaseEntity>(this: TypeORM.ObjectType<T>, id?: number): Promise<T | undefined> {
    return await (this as any).findOne(parseInt(id as any) || 0);
  }

  async destroy() {
    await TypeORM.getManager().remove(this);
  }

  static async countQuery<T extends TypeORM.BaseEntity>(this: TypeORM.ObjectType<T>, query: TypeORM.SelectQueryBuilder<T> | string) {
    let parameters: any[] = null;
    if (typeof query !== 'string') {
      [query, parameters] = query.getQueryAndParameters();
    }

    return parseInt((
      await TypeORM.getManager().query(`SELECT COUNT(*) FROM (${query}) AS \`__tmp_table\``, parameters)
    )[0]['COUNT(*)']);
  }

  static async queryAll(queryBuilder) {
    return await queryBuilder.getMany();
  }

  static async queryPage(paginater: Paginater, where, order) {
    if (!paginater.pageCnt) return [];

    let queryBuilder = where instanceof TypeORM.SelectQueryBuilder
                     ? where
                     : this.createQueryBuilder().where(where);

    if (order) queryBuilder.orderBy(order);

    queryBuilder = queryBuilder.skip((paginater.currPage - 1) * paginater.perPage)
                               .take(paginater.perPage);

    return queryBuilder.getMany();
  }

  static async queryRange(range: any[], where, order) {
    range[0] = parseInt(range[0]);
    range[1] = parseInt(range[1]);

    let queryBuilder = where instanceof TypeORM.SelectQueryBuilder
                     ? where
                     : this.createQueryBuilder().where(where);

    if (order) queryBuilder.orderBy(order);

    queryBuilder = queryBuilder.skip(range[0] - 1)
                               .take(range[1] - range[0] + 1);

    return queryBuilder.getMany();
  }
}
