let Sequelize = require('sequelize');
const User = syzoj.model('user');
let db = syzoj.db;

let model = db.define('rating_history', {
    rating_calculation_id: { type: Sequelize.INTEGER, primaryKey: true },
    user_id: { type: Sequelize.INTEGER, primaryKey: true },
    rating_after: { type: Sequelize.INTEGER },
    rank: { type: Sequelize.INTEGER },
}, {
        timestamps: false,
        tableName: 'rating_history',
        indexes: [
            {
                fields: ['rating_calculation_id']
            },
            {
                fields: ['user_id']
            },
        ]
    });

let Model = require('./common');
class RatingHistory extends Model {
    static async create(rating_calculation_id, user_id, rating, rank) {
        return RatingHistory.fromRecord(RatingHistory.model.build({
            rating_calculation_id: rating_calculation_id,
            user_id: user_id,
            rating_after: rating,
            rank: rank
        }));
    }

    async loadRelationships() {
        this.user = await User.fromID(this.user_id);
    }

    getModel() { return model; }
}

RatingHistory.model = model;

module.exports = RatingHistory;
