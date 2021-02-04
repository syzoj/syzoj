import * as TypeORM from "typeorm";
import Model from "./common";

import * as fs from "fs-extra";

declare var syzoj, ErrorMessage: any;

@TypeORM.Entity()
export default class File extends Model {
  @TypeORM.PrimaryGeneratedColumn()
  id: number;

  @TypeORM.Index()
  @TypeORM.Column({ nullable: true, type: "varchar", length: 80 })
  type: string;

  @TypeORM.Index({ unique: true })
  @TypeORM.Column({ nullable: true, type: "varchar", length: 80 })
  md5: string;

  unzipSize?: number;

  getPath() {
    return File.resolvePath(this.type, this.md5);
  }

  static resolvePath(type, md5) {
    return syzoj.utils.resolvePath(syzoj.config.upload_dir, type, md5);
  }

  // data: Array of { filename: string, data: buffer or string }
  static async zipFiles(files) {
    let tmp = require('tmp-promise');
    let dir = await tmp.dir(), path = require('path'), fs = require('fs-extra');
    let filenames = await files.mapAsync(async file => {
      let fullPath = path.join(dir.path, file.filename);
      await fs.writeFileAsync(fullPath, file.data);
      return fullPath;
    });

    let p7zip = new (require('node-7z')), zipFile = await tmp.tmpName() + '.zip';
    await p7zip.add(zipFile, filenames);

    await fs.removeAsync(dir.path);

    return zipFile;
  }

  static async upload(path, type, noLimit) {
    let buf = await fs.readFile(path);

    if (!noLimit && buf.length > syzoj.config.limit.data_size) throw new ErrorMessage('数据包太大。');

    let key = syzoj.utils.md5(buf);
    await fs.move(path, File.resolvePath(type, key), { overwrite: true });

    let file = await File.findOne({ where: { md5: key } });
    if (!file) {
      file = await File.create({
        type: type,
        md5: key
      });
      await file.save();
    }

    return file;
  }

  async getUnzipSize() {
    if (this.unzipSize === undefined)  {
      try {
        let p7zip = new (require('node-7z'));
        this.unzipSize = 0;
        await p7zip.list(this.getPath()).progress(files => {
          for (let file of files) this.unzipSize += file.size;
        });
      } catch (e) {
        this.unzipSize = null;
      }
    }

    if (this.unzipSize === null) throw new ErrorMessage('无效的 ZIP 文件。');
    else return this.unzipSize;
  }
}
