/*
 *  This file is part of SYZOJ.
 *
 *  Copyright (c) 2016 Menci <huanghaorui301@gmail.com>
 *
 *  SYZOJ is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  SYZOJ is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public
 *  License along with SYZOJ. If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

let fs = require('fs'),
    path = require('path');

global.syzoj = {
  rootDir: __dirname,
  config: require('./config.json'),
  models: [],
  modules: [],
  db: null,
  log(obj) {
    console.log(obj);
  },
  async run() {
    let Express = require('express');
    global.app = Express();

    syzoj.production = app.get('env') === 'production';

    app.listen(parseInt(syzoj.config.port), syzoj.config.hostname, () => {
      this.log(`SYZOJ is listening on ${syzoj.config.hostname}:${parseInt(syzoj.config.port)}...`);
    });

    // Set assets dir
    app.use(Express.static(__dirname + '/static'));

    // Set template engine ejs
    app.set('view engine', 'ejs');

    // Use body parser
    let bodyParser = require('body-parser');
    app.use(bodyParser.urlencoded({
      extended: true,
      limit: '50mb'
    }));
    app.use(bodyParser.json({ limit: '50mb' }));

    // Use cookie parser
    app.use(require('cookie-parser')());

    let multer = require('multer');
    app.multer = multer({ dest: syzoj.utils.resolvePath(syzoj.config.upload_dir, 'tmp') });

    // This should before load api_v2, to init the `res.locals.user`
    this.loadHooks();
    // Trick to bypass CSRF for APIv2
    app.use((() => {
      let router = new Express.Router();
      app.apiRouter = router;
      require('./modules/api_v2');
      return router;
    })());

    let csurf = require('csurf');
    app.use(csurf({ cookie: true }));

    await this.connectDatabase();
    this.loadModules();
  },
  async connectDatabase() {
    let Sequelize = require('sequelize');
    this.db = new Sequelize(this.config.db.database, this.config.db.username, this.config.db.password, {
      host: this.config.db.host,
      dialect: this.config.db.dialect,
      storage: this.config.db.storage ? this.utils.resolvePath(this.config.db.storage) : null,
      logging: syzoj.production ? false : syzoj.log
    });
    global.Promise = Sequelize.Promise;
    this.db.countQuery = async (sql, options) => (await this.db.query(`SELECT COUNT(*) FROM (${sql}) AS \`__tmp_table\``, options))[0][0]['COUNT(*)'];

    this.loadModels();
  },
  loadModules() {
    fs.readdir('./modules/', (err, files) => {
      if (err) {
        this.log(err);
        return;
      }
      files.filter((file) => file.endsWith('.js'))
           .forEach((file) => this.modules.push(require(`./modules/${file}`)));
    });
  },
  loadModels() {
    fs.readdir('./models/', (err, files) => {
      if (err) {
        this.log(err);
        return;
      }
      files.filter((file) => file.endsWith('.js'))
           .forEach((file) => require(`./models/${file}`));

      this.db.sync();
    });
  },
  model(name) {
    return require(`./models/${name}`);
  },
  loadHooks() {
    let Session = require('express-session');
    let FileStore = require('session-file-store')(Session);
    let sessionConfig = {
      secret: this.config.session_secret,
      cookie: {},
      rolling: true,
      saveUninitialized: true,
      resave: true,
      store: new FileStore
    };
    if (syzoj.production) {
      app.set('trust proxy', 1);
      sessionConfig.cookie.secure = true;
    }
    app.use(Session(sessionConfig));

    app.use((req, res, next) => {
      // req.session.user_id = 1;
      let User = syzoj.model('user');
      if (req.session.user_id) {
        User.fromID(req.session.user_id).then((user) => {
          res.locals.user = user;
          next();
        }).catch((err) => {
          this.log(err);
          res.locals.user = null;
          req.session.user_id = null;
          next();
        })
      } else {
        if (req.cookies.login) {
          let obj;
          try {
            obj = JSON.parse(req.cookies.login);
            User.findOne({
              where: {
                username: obj[0],
                password: obj[1]
              }
            }).then(user => {
              if (!user) throw null;
              res.locals.user = user;
              req.session.user_id = user.id;
              next();
            }).catch(err => {
              console.log(err);
              res.locals.user = null;
              req.session.user_id = null;
              next();
            });
          } catch (e) {
            res.locals.user = null;
            req.session.user_id = null;
            next();
          }
        } else {
          res.locals.user = null;
          req.session.user_id = null;
          next();
        }
      }
    });

    // Active item on navigator bar
    app.use((req, res, next) => {
      res.locals.active = req.path.split('/')[1];
      next();
    });

    app.use((req, res, next) => {
      res.locals.req = req;
      res.locals.res = res;
      next();
    });
  },
  utils: require('./utility')
};

syzoj.run();
