let fs = require('fs'),
    path = require('path');

const commandLineArgs = require('command-line-args');
const optionDefinitions = [
    { name: 'config', alias: 'c', type: String, defaultValue: './config.json' },
];

const options = commandLineArgs(optionDefinitions);

global.syzoj = {
  rootDir: __dirname,
  config: require('object-assign-deep')({}, require('./config-example.json'), require(options.config)),
  configDir: options.config,
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
    let winstonLib = require('./libs/winston');
    winstonLib.configureWinston(!syzoj.production);

    app.server = require('http').createServer(app);
    app.server.listen(parseInt(syzoj.config.port), syzoj.config.hostname, () => {
      this.log(`SYZOJ is listening on ${syzoj.config.hostname}:${parseInt(syzoj.config.port)}...`);
    });

    // Set assets dir
    app.use(Express.static(__dirname + '/static', { maxAge: syzoj.production ? '1y' : 0 }));

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

    await this.connectDatabase();
    await this.lib('judger').connect();
    this.loadModules();
  },
  async connectDatabase() {
    let Sequelize = require('sequelize');
    let Op = Sequelize.Op;
    let operatorsAliases = {
      $eq: Op.eq,
      $ne: Op.ne,
      $gte: Op.gte,
      $gt: Op.gt,
      $lte: Op.lte,
      $lt: Op.lt,
      $not: Op.not,
      $in: Op.in,
      $notIn: Op.notIn,
      $is: Op.is,
      $like: Op.like,
      $notLike: Op.notLike,
      $iLike: Op.iLike,
      $notILike: Op.notILike,
      $regexp: Op.regexp,
      $notRegexp: Op.notRegexp,
      $iRegexp: Op.iRegexp,
      $notIRegexp: Op.notIRegexp,
      $between: Op.between,
      $notBetween: Op.notBetween,
      $overlap: Op.overlap,
      $contains: Op.contains,
      $contained: Op.contained,
      $adjacent: Op.adjacent,
      $strictLeft: Op.strictLeft,
      $strictRight: Op.strictRight,
      $noExtendRight: Op.noExtendRight,
      $noExtendLeft: Op.noExtendLeft,
      $and: Op.and,
      $or: Op.or,
      $any: Op.any,
      $all: Op.all,
      $values: Op.values,
      $col: Op.col
    };

    this.db = new Sequelize(this.config.db.database, this.config.db.username, this.config.db.password, {
      host: this.config.db.host,
      dialect: 'mysql',
      logging: syzoj.production ? false : syzoj.log,
      timezone: require('moment')().format('Z'),
      operatorsAliases: operatorsAliases
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
  lib(name) {
    return require(`./libs/${name}`);
  },
  model(name) {
    return require(`./models/${name}`);
  },
  loadHooks() {
    let Session = require('express-session');
    let FileStore = require('session-file-store')(Session);
    let sessionConfig = {
      secret: this.config.session_secret,
      cookie: { httpOnly: false },
      rolling: true,
      saveUninitialized: true,
      resave: true,
      store: new FileStore
    };
    if (syzoj.production) {
      app.set('trust proxy', 1);
      sessionConfig.cookie.secure = false;
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
