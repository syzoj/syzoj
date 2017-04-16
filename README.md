# SYZOJ 2
An OnlineJudge System for OI.

The UI is powered by [Semantic UI](http://semantic-ui.com/).  
Template designed & coded by [Sengxian](https://www.sengxian.com) and [Menci](https://men.ci).

# Deploying
There's currently *no* stable version of SYZOJ 2, but you can use the unstable version from git.

```
git clone https://github.com/syzoj/syzoj
cd syzoj
```

Install dependencies with `npm install` or `yarn`.

Copy the `config-example.json` file to `config.json`, and change the configures.

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
