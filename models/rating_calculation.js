let Sequelize = require('sequelize');
let db = syzoj.db;
const User = syzoj.model('user');
const Contest = syzoj.model('contest');

let model = db.define('rating_calculation', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    contest_id: { type: Sequelize.INTEGER }
}, {
        timestamps: false,
        tableName: 'rating_calculation',
        indexes: [
            {
                fields: ['contest_id']
            },
        ]
    });

let Model = require('./common');
class RatingCalculation extends Model {
    static async create(contest_id) {
        return RatingCalculation.fromRecord(RatingCalculation.model.create({ contest_id: contest_id }));
    }

    async loadRelationships() {
        this.contest = await Contest.fromID(this.contest_id);
    }

    getModel() { return model; }

    async delete() {
        const RatingHistory = syzoj.model('rating_history');
        const histories = await RatingHistory.query(null, {
            rating_calculation_id: this.id
        });
        for (const history of histories) {
            await history.loadRelationships();
            const user = history.user;
            await history.destroy();
            const ratingItem = (await RatingHistory.findOne({
                where: { user_id: user.id },
                order: 'rating_calculation_id DESC'
            }));
            user.rating = ratingItem ? ratingItem.rating_after : syzoj.config.default.user.rating;
            await user.save();
        }
        await this.destroy();
    }
}

RatingCalculation.model = model;

module.exports = RatingCalculation;
