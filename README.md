<p align="center"><img src="static/self/syzoj.svg" width="250"></p>

中文 | [English](README.en.md)

一个用于算法竞赛的在线评测系统。

本项目继承自 [@louchenyao](https://github.com/louchenyao) 的 [SYZOJ](https://github.com/Zhengzhou-11-Highschool/syzoj)，目前由 [LibreOJ](https://loj.ac) 维护。

# 更新
* 1.增加气球志愿者，但是气球志愿者只能从后台数据库进行权限操作。具体操作为修改气球志愿的nickname属性为watcher，管理员自动拥有气球志愿者的权限，其他气球志愿者没有修改比赛的权限，只能查看气球情况:
样例
```angular2html
UPDATE user SET nickname='watcher' WHERE id=3;
```

# 部署
见本项目 Wiki 中的 [部署指南](https://github.com/syzoj/syzoj/wiki/%E9%83%A8%E7%BD%B2%E6%8C%87%E5%8D%97)。

加入 QQ 群 [565280992](https://jq.qq.com/?_wv=1027&k=5JQZWwd) 或 Telegram 群 [@lojdev](https://t.me/lojdev) 以取得帮助。

# 升级须知
见本项目 Wiki 中的 [更新指南](https://github.com/syzoj/syzoj/wiki/%E6%9B%B4%E6%96%B0%E6%8C%87%E5%8D%97)。
