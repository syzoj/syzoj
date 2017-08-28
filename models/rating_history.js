/*
 *  This file is part of SYZOJ.
 *
 *  Copyright (c) 2017 t123yh <t123yh@outlook.com>
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
