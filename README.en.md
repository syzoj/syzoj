<p align="center"><img src="static/syzoj.svg" width="250"></p>

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
