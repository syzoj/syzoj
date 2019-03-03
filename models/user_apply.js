let Sequelize = require('sequelize');
let db = syzoj.db;

let model = db.defin('user_apply', {
    user_id: { type: Sequelize.INTEGER, primaryKey: true },
    school: { type: Sequelize.STRING(120) },
    cur_class: { type: Sequelize.STRING(120) },
    training_type: { type: Sequelize.STRING(120) },
    training_class: { type: Sequelize.STRING(120) },
    apply_time: { type: Sequelize.INTEGER}
}, {
    timestamps: false,
    tableName: 'user_apply',
    indexes: [
        {
            fields: ['training_type']
        },
        {
            fields: ['training_class']
        }
    ]
});

let Model = require('./common');
class UserApply extends Model {
    static async create(val) {
        return UserApply.fromRecord(UserApply.model.build(Object.assign({
            user_id: 0,
            school: '',
            cur_class: '',
            training_class: '',
            training_type: '',
            apply_time: parseInt((new Date()).getTime() / 1000)
        }, val)));
    }

    getModel() { return model; }
}

UserApply.model = model;

module.exports = UserApply;