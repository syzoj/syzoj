const OSS = require("ali-oss");
const fs = require("fs");
const random = require("string-random");
const crypto = require("crypto");
const md5 = crypto.createHash('MD5');
const path = require('path');

const client = OSS({
    accessKeyId: syzoj.config.pic_upload_config.accessKeyId,
    accessKeySecret: syzoj.config.pic_upload_config.accessKeySecret,
    bucket: syzoj.config.pic_upload_config.bucket,
    region: syzoj.config.pic_upload_config.region,
});

async function uploadImage(filepath){
    try {
        var name = random(20) + toString(Date.now());
        var uploadpath = syzoj.config.pic_upload_config.path + md5.update(name).digest('hex') + path.extname(filepath)
        console.log(uploadpath);
        let stream = fs.createReadStream(filepath);
        let result = await client.put(uploadpath,stream);
        await client.putACL(uploadpath,'public-read');
        return result.url;
    } catch (e) {
        console.log(e);
    }
}

module.exports.upload = uploadImage;
