<p align="center"><img src="static/self/syzoj.svg" width="250"></p>

[中文](README.md) | English

An online judge system for algorithm competition.

This project is the **official** successor and rewritten version of the original Python/Flask version of SYZOJ, which is authorized by the original author [@Chenyao2333](https://github.com/Chenyao2333).

Currently maintained by [LibreOJ](https://loj.ac).

# Deploying
Currently, the tutorial for deploying is only available in Chinese. It's [部署指南](https://github.com/syzoj/syzoj/wiki/%E9%83%A8%E7%BD%B2%E6%8C%87%E5%8D%97) in this project's wiki.

Join QQ group [565280992](https://jq.qq.com/?_wv=1027&k=5JQZWwd) or Telegram group [@lojdev](https://t.me/lojdev) for help.

# Upgrading
Because of updates to the database structure, users who upgrade from a commit BEFORE [d5bcbe8fb79e80f9d603b764ac787295cceffa34](https://github.com/syzoj/syzoj/commit/d5bcbe8fb79e80f9d603b764ac787295cceffa34) (Feb 21, 2018) **MUST** perform the following SQL on the database.

```sql
ALTER TABLE `judge_state` ADD `is_public` TINYINT(1) NOT NULL AFTER `compilation`;
UPDATE `judge_state` JOIN `problem` ON `problem`.`id` = `judge_state`.`problem_id` SET `judge_state`.`is_public` = `problem`.`is_public`;
ALTER TABLE `syzoj`.`judge_state` ADD INDEX `judge_state_is_public` (`id`, `is_public`, `type_info`, `type`);
```

Who upgrade from a commit BEFORE [26d66ceef24fbb35481317453bcb89ead6c69076](https://github.com/syzoj/syzoj/commit/26d66ceef24fbb35481317453bcb89ead6c69076) (Nov 5, 2018) **MUST** perform the following SQL on the database.

```sql
ALTER TABLE `contest_player` CHANGE `score_details` `score_details` JSON NOT NULL;
ALTER TABLE `contest_ranklist` CHANGE `ranking_params` `ranking_params` JSON NOT NULL;
ALTER TABLE `contest_ranklist` CHANGE `ranklist` `ranklist` JSON NOT NULL;
ALTER TABLE `custom_test` CHANGE `result` `result` JSON NOT NULL;
ALTER TABLE `judge_state` CHANGE `compilation` `compilation` JSON NOT NULL;
ALTER TABLE `judge_state` CHANGE `result` `result` JSON NOT NULL;
```

Who upgraded from a commit BEFORE [84b9e2d7b51e4ed3ab426621b66cf5ae9e1e1c23](https://github.com/syzoj/syzoj/commit/84b9e2d7b51e4ed3ab426621b66cf5ae9e1e1c23) (Nov 6, 2018) **MUST** perform the following SQL on the database.

```sql
ALTER TABLE `problem` ADD `publicize_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `type`;
```

Who upgraded from a commit BEFORE [d8be150fc6b8c43af61c5e4aca4fc0fe0445aef3](https://github.com/syzoj/syzoj/commit/d8be150fc6b8c43af61c5e4aca4fc0fe0445aef3) (Dec 7, 2018) **MUST** perform the following SQL on the database.

```sql
ALTER TABLE `user` ADD `prefer_formatted_code` TINYINT(1) NOT NULL DEFAULT 1 AFTER `public_email`;
```

To make code formatting work, `clang-format` needs to be installed. [migrates/format-old-codes.js](migrates/format-old-codes.js) may help formating old submissions' codes.

Who upgraded from a commit BEFORE [c192e8001ac81cab132ae033b39f09a094587633](https://github.com/syzoj/syzoj/commit/c192e8001ac81cab132ae033b39f09a094587633) (Mar 23, 2019) **MUST** install `redis-server` and [pygments](http://pygments.org/) on the web server. Markdown contents may be broken by switching to new renderer, [migrates/html-table-merge-cell-to-md.js](migrates/html-table-merge-cell-to-md.js) may help the migration。

Who upgraded from a commit BEFORE [7b03706821c604f59fe8263286203d57d634c421](https://github.com/syzoj/syzoj/commit/7b03706821c604f59fe8263286203d57d634c421) (Mar 27, 2019) **MUST** add `RemainAfterExit=yes` to the systemd config file `syzoj-web.service`'s `[Service]` section to make sure that restart service can work properly.

Who upgraded from a commit BEFORE [d1d019383e5cb0c96ed2191f900970654e4055c0](https://github.com/syzoj/syzoj/commit/d1d019383e5cb0c96ed2191f900970654e4055c0) (Mar 30, 2019) **MUST** upgrade web server's Redis to at least version 5, and fill web config's `judge_token` with random key. Judge server must be upgraded together, and `daemon-config.json`'s  `ServerUrl` and `ServerToken` (= `judge_token`) must be filled. If judge and web run on different server, it's recommend to move RabbitMQ to judge server.
