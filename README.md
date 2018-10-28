# SYZOJ 2
An OnlineJudge System for OI.

The UI is powered by [Semantic UI](http://semantic-ui.com/).  
Template designed & coded by [Sengxian](https://www.sengxian.com) and [Menci](https://men.ci).

# Upgrading
Because of an update to the database structure, users who upgrade from a commit BEFORE 4c673956959532d61b8f9ba0be3191a054b4371a **MUST** perform the following SQL on the database:
```sql
ALTER TABLE `judge_state` ADD `is_public` TINYINT(1) NOT NULL AFTER `compilation`;
UPDATE `judge_state` JOIN `problem` ON `problem`.`id` = `judge_state`.`problem_id` SET `judge_state`.`is_public` = `problem`.`is_public`;
ALTER TABLE `syzoj`.`judge_state` ADD INDEX `judge_state_is_public` (`id`, `is_public`, `type_info`, `type`);
```

# Deploying
**Warning** The following content is **outdated**. Please refer to https://syzoj-demo.t123yh.xyz:20170/article/1 for a detailed guide and a demo server.

There's currently *no* stable version of SYZOJ 2, but you can use the unstable version from git.

```
git clone https://github.com/syzoj/syzoj
cd syzoj
```

Install dependencies with `npm install` or `yarn`. Also, follow the instructions [here](https://www.npmjs.com/package/node-7z#installation) to install `7z` executable used by the `node-7z` package.

Copy `config-example.json` to `config.json`, and make necessary changes.

## Database
SYZOJ 2 uses [Sequelize](http://sequelizejs.com), which supports many database systems, including MySQL and Sqlite.

By default it use the Sqlite database `syzoj.db`, you can change it in `config.json`

## Security
You should change the `session_secret` and `judge_token` in `config.json`.

# Administration
In the database, the `is_admin` field in `user` table describes whether a user is admin or not.

To make a user be an admin, the only way is via database.

# Judge
SYZOJ 2 uses a Docker-based sandboxed judger. Please go to [syzoj-judge](https://github.com/syzoj/syzoj-judge).

# Advanced
## System Service
### Run SYZOJ 2
Add SYZOJ 2 to system services.
``` bash
vim [syzoj2 path]/runsyzoj
```
Edit `runsyzoj` as as follows.
``` bash
#!/bin/bash
cd [syzoj2 path]
npm start > log.txt 2>&1
```
**Please change `[syzoj2 path]`.**
### Run SYZOJ-JUDGE
Add SYZOJ-JUDGE to system services.
``` bash
vim [syzoj-judge path]/runjudge
```
Edit `runjudge` as as follows.
``` bash
#!/bin/bash
cd [syzoj-judge path]
npm start > jlog.txt 2>&1
```
**Please change `[syzoj-judge path]`.**
### Add To System Service
``` bash
vim /etc/systemd/system/syzoj.service
```
Edit `/etc/systemd/system/syzoj.service` as as follows.
``` bash
[Unit]
Description=SYZOJ Online Judge
After=network.target

[Service]
Type=simple
PIDFile=/run/syzoj.pid
WorkingDirectory=[syzoj2 path]
ExecStart=[syzoj2 path]/runsyzoj
StandardOutput=null
StandardError=null

[Install]
WantedBy=multi-user.target
```
**Please change `[syzoj2 path]`.**

``` bash
vim /etc/systemd/system/syzoj-judge.service
```
Edit `/etc/systemd/system/syzoj-judge.service` as as follows.
``` bash
[Unit]
Description=SYZOJ Judge Daemon
After=network.target

[Service]
Type=simple
PIDFile=/run/syzoj-judge.pid
WorkingDirectory=[syzoj-judge path]
ExecStart=[syzoj-judge path]/runjudge
StandardOutput=null
StandardError=null

[Install]
WantedBy=multi-user.target
```
**Please change `[syzoj-judge path]`.**
### Usage
#### Start
``` bash
systemctl start syzoj
systemctl start syzoj-judge
```
#### Stop
``` bash
systemctl stop syzoj
systemctl stop syzoj-judge
```
#### Restart
``` bash
systemctl restart syzoj
systemctl restart syzoj-judge
```

## 邮件配置
### register_mail
是否启用注册邮件验证。

### email\_jwt\_secret
用于 Email Token 签名的 secret，脸滚键盘随意填写即可。

### email
#### Sendmail 直接发送（成功率低，不推荐）
```js
  "email": {
    "method": "sendmail",
    "options": {
      "address": "xxxx", // 发件人地址
    }
  },
```

#### 阿里云邮件推送服务（成功率较高）
```js
  "email": {
    "method": "aliyundm",
    "options": {
      "AccessKeyId": "xxxx",
      "AccessKeySecret": "xxxx",
      "AccountName": "xxxx" // 发件邮箱
    }
  },
```

#### SMTP 服务
```js
  "email": {
    "method": "smtp",
    "options": {
        "host": "smtp.163.com",
        "port": 465,
        "username": "xxx@163.com",
        "password": "xxx",
        "allowUnauthorizedTls": false
    }
  },
```
