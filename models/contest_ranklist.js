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

let Sequelize = require('sequelize');
let db = syzoj.db;

let User = syzoj.model('user');
let Problem = syzoj.model('problem');
let ContestPlayer = syzoj.model('contest_player');

let model = db.define('contest_ranklist', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  ranklist: { type: Sequelize.TEXT, json: true }
}, {
  timestamps: false,
  tableName: 'contest_ranklist'
});

let Model = require('./common');
class ContestRanklist extends Model {
  static async create(val) {
    return ContestRanklist.fromRecord(ContestRanklist.model.build(Object.assign({
      ranklist: '{}'
    }, val)));
  }

  async getPlayers() {
    let a = [];
    for (let i = 1; i <= this.ranklist.player_num; i++) {
      a.push(await ContestPlayer.fromID(this.ranklist[i]));
    }
    return a;
  }

  async updatePlayer(player) {
    let players = await this.getPlayers(), newPlayer = true;
    for (let x of players) {
      if (x.user_id === player.user_id) {
        newPlayer = false;
        break;
      }
    }

    if (newPlayer) {
      players.push(player);
    }

    players.sort((a, b) => b.score - a.score);

    this.ranklist = { player_num: players.length };
    for (let i = 0; i < players.length; i++) this.ranklist[i + 1] = players[i].id;
  }

  getModel() { return model; }
}

ContestRanklist.model = model;

module.exports = ContestRanklist;
