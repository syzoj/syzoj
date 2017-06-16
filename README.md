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
