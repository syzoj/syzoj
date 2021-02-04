import * as TypeORM from "typeorm";
import * as LRUCache from "lru-cache";
import * as DeepCopy from "deepcopy";

declare var syzoj: any;

interface Paginater {
  pageCnt: number;
  perPage: number;
  currPage: number;
}

enum PaginationType {
  PREV = -1,
  NEXT = 1
}

enum PaginationIDOrder {
  ASC = 1,
  DESC = -1
}

const caches: Map<string, LRUCache<number, Model>> = new Map();

function ensureCache(modelName) {
  if (!caches.has(modelName)) {
    caches.set(modelName, new LRUCache({
      max: syzoj.config.db.cache_size
    }));
  }

  return caches.get(modelName);
}

function cacheGet(modelName, id) {
  return ensureCache(modelName).get(parseInt(id));
}

function cacheSet(modelName, id, data) {
  if (data == null) {
    ensureCache(modelName).del(id);
  } else {
    ensureCache(modelName).set(parseInt(id), data);
  }
}

export default class Model extends TypeORM.BaseEntity {
  static cache = false;

  static async findById<T extends TypeORM.BaseEntity>(this: TypeORM.ObjectType<T>, id?: number): Promise<T | undefined> {
    const doQuery = async () => await (this as any).findOne(parseInt(id as any) || 0);

    if ((this as typeof Model).cache) {
      const resultObject = cacheGet(this.name, id);
      if (resultObject) {
        return (this as typeof Model).create(resultObject) as any as T;
      }

      const result = await doQuery();
      if (result) {
        cacheSet(this.name, id, result.toPlain());
      }
      return result;
    } else {
      return await doQuery();
    }
  }

  toPlain() {
    const object = {};
    TypeORM.getConnection().getMetadata(this.constructor).ownColumns.map(column => column.propertyName).forEach(key => {
      object[key] = DeepCopy(this[key]);
    });
    return object;
  }

  async destroy() {
    const id = (this as any).id;
    await TypeORM.getManager().remove(this);
    await (this.constructor as typeof Model).deleteFromCache(id);
  }

  static async deleteFromCache(id) {
    if (this.cache) {
      cacheSet(this.name, id, null);
    }
  }

  async saveHook(): Promise<void> {}

  async save(): Promise<this> {
    await this.saveHook();
    await super.save();
    if ((this.constructor as typeof Model).cache) {
      cacheSet(this.constructor.name, (this as any).id, this);
    }
    return this;
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

  static async countForPagination(where) {
    const queryBuilder = where instanceof TypeORM.SelectQueryBuilder
                       ? where
                       : this.createQueryBuilder().where(where);
    return await queryBuilder.getCount();
  }

  static async queryAll(queryBuilder) {
    return await queryBuilder.getMany();
  }

  static async queryPage(paginater: Paginater, where, order, largeData = false) {
    if (!paginater.pageCnt) return [];

    const queryBuilder = where instanceof TypeORM.SelectQueryBuilder
                       ? where
                       : this.createQueryBuilder().where(where);

    if (order) queryBuilder.orderBy(order);

    queryBuilder.skip((paginater.currPage - 1) * paginater.perPage)
                .take(paginater.perPage);

    if (largeData) {
      const rawResult = await queryBuilder.select('id').getRawMany();
      return await Promise.all(rawResult.map(async result => this.findById(result.id)));
    }

    return queryBuilder.getMany();
  }

  static async queryPageFast<T extends TypeORM.BaseEntity>(this: TypeORM.ObjectType<T>,
                                                           queryBuilder: TypeORM.SelectQueryBuilder<T>,
                                                           { currPageTop, currPageBottom, perPage },
                                                           idOrder: PaginationIDOrder,
                                                           pageType: PaginationType) {
    const queryBuilderBak = queryBuilder.clone();

    const result = {
      meta: {
        hasPrevPage: false,
        hasNextPage: false,
        top: 0,
        bottom: 0
      },
      data: []
    };

    queryBuilder.take(perPage);
    if (pageType === PaginationType.PREV) {
      if (currPageTop != null) {
        queryBuilder.andWhere(`id ${idOrder === PaginationIDOrder.DESC ? '>' : '<'} :currPageTop`, { currPageTop });
        queryBuilder.orderBy('id', idOrder === PaginationIDOrder.DESC ? 'ASC' : 'DESC');
      }
    } else if (pageType === PaginationType.NEXT) {
      if (currPageBottom != null) {
        queryBuilder.andWhere(`id ${idOrder === PaginationIDOrder.DESC ? '<' : '>'} :currPageBottom`, { currPageBottom });
        queryBuilder.orderBy('id', idOrder === PaginationIDOrder.DESC ? 'DESC' : 'ASC');
      }
    } else queryBuilder.orderBy('id', idOrder === PaginationIDOrder.DESC ? 'DESC' : 'ASC');

    result.data = await queryBuilder.getMany();
    result.data.sort((a, b) => (a.id - b.id) * idOrder);

    if (result.data.length === 0) return result;

    const queryBuilderHasPrev = queryBuilderBak.clone(),
          queryBuilderHasNext = queryBuilderBak;

    result.meta.top = result.data[0].id;
    result.meta.bottom = result.data[result.data.length - 1].id;

    // Run two queries in parallel.
    await Promise.all(([
      async () => result.meta.hasPrevPage = !!(await queryBuilderHasPrev.andWhere(`id ${idOrder === PaginationIDOrder.DESC ? '>' : '<'} :id`, {
                                                                          id: result.meta.top
                                                                        }).take(1).getOne()),
      async () => result.meta.hasNextPage = !!(await queryBuilderHasNext.andWhere(`id ${idOrder === PaginationIDOrder.DESC ? '<' : '>'} :id`, {
                                                                          id: result.meta.bottom
                                                                        }).take(1).getOne())
    ]).map(f => f()));

    return result;
  }

  static async queryRange(range: any[], where, order) {
    range[0] = parseInt(range[0]);
    range[1] = parseInt(range[1]);

    const queryBuilder = where instanceof TypeORM.SelectQueryBuilder
                       ? where
                       : this.createQueryBuilder().where(where);

    if (order) queryBuilder.orderBy(order);

    queryBuilder.skip(range[0] - 1)
                .take(range[1] - range[0] + 1);

    return queryBuilder.getMany();
  }
}
