<p align="center"><img src="static/syzoj.svg" width="250"></p>

中文 | [English](README.en.md)

一个用于算法竞赛的在线评测系统。

此项目为重写过的、原 Python/Flask 版 SYZOJ 的**官方**后继版本，由原作者 [@Chenyao2333](https://github.com/Chenyao2333) 授权。

目前由 [LibreOJ](https://loj.ac) 维护。

# 部署
见本项目 Wiki 中的 [部署指南](https://github.com/syzoj/syzoj/wiki/%E9%83%A8%E7%BD%B2%E6%8C%87%E5%8D%97)。

加入 QQ 群 [565280992](https://jq.qq.com/?_wv=1027&k=5JQZWwd) 或 Telegram 群 [@lojdev](https://t.me/lojdev) 以取得帮助。

# 升级须知
因为一些数据库结构的更新，从该 commit [d5bcbe8fb79e80f9d603b764ac787295cceffa34](https://github.com/syzoj/syzoj/commit/d5bcbe8fb79e80f9d603b764ac787295cceffa34)（2018 年 4 月 21 日）前更新的用户**必须**在其数据库上执行以下 SQL 语句。

```sql
ALTER TABLE `judge_state` ADD `is_public` TINYINT(1) NOT NULL AFTER `compilation`;
UPDATE `judge_state` JOIN `problem` ON `problem`.`id` = `judge_state`.`problem_id` SET `judge_state`.`is_public` = `problem`.`is_public`;
ALTER TABLE `syzoj`.`judge_state` ADD INDEX `judge_state_is_public` (`id`, `is_public`, `type_info`, `type`);
```

从该 commit [26d66ceef24fbb35481317453bcb89ead6c69076](https://github.com/syzoj/syzoj/commit/26d66ceef24fbb35481317453bcb89ead6c69076)（2018 年 11 月 5 日）前更新的用户**必须**在其数据库上执行以下 SQL 语句。

```sql
ALTER TABLE `contest_player` CHANGE `score_details` `score_details` JSON NOT NULL;
ALTER TABLE `contest_ranklist` CHANGE `ranking_params` `ranking_params` JSON NOT NULL;
ALTER TABLE `contest_ranklist` CHANGE `ranklist` `ranklist` JSON NOT NULL;
ALTER TABLE `custom_test` CHANGE `result` `result` JSON NOT NULL;
ALTER TABLE `judge_state` CHANGE `compilation` `compilation` JSON NOT NULL;
ALTER TABLE `judge_state` CHANGE `result` `result` JSON NOT NULL;
```

从该 commit [84b9e2d7b51e4ed3ab426621b66cf5ae9e1e1c23](https://github.com/syzoj/syzoj/commit/84b9e2d7b51e4ed3ab426621b66cf5ae9e1e1c23)（2018 年 11 月 6 日）前更新的用户**必须**在其数据库上执行以下 SQL 语句。

```sql
ALTER TABLE `problem` ADD `publicize_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `type`;
```
