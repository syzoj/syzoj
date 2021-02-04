// Code by Dicint

const util = require('util');
const _ = require('lodash');

function getEloWinProbability(ra, rb) {
    return 1.0 / (1 + Math.pow(10, (rb - ra) / 400.0));
}

// 传入具体某个人的情况
function getContestantSeed(contestantIndex, allContestants) {
    let seed = 1;
    let rating = allContestants[contestantIndex].currentRating;
    for (let i = 0; i < allContestants.length; i++) {
        if (contestantIndex != i) {
            seed += getEloWinProbability(allContestants[i].currentRating, rating);
        }
    }
    return seed;
}

function getRatingSeed(rating, allContestants) {
    return 1 + _.sum(allContestants.map(c => getEloWinProbability(c.currentRating, rating)));
}

function getAverageRank(contestant, allContestants) {
    const realRank = allContestants[contestant].rank;
    const expectedRank = getContestantSeed(contestant, allContestants);
    const average = Math.sqrt(realRank * expectedRank);

    return average;
}

function getRatingToRank(contestantIndex, allContestants) {
    let averageRank = getAverageRank(contestantIndex, allContestants);

    let left = 1;// contestant.getPrevRating() - 2 * minDelta;
    let right = 8000;// contestant.getPrevRating() + 2 * maxDelta;

    while (right - left > 1) {
        const mid = (left + right) / 2;
        const seed = getRatingSeed(mid, allContestants);
        if (seed < averageRank) {
            right = mid;
        } else {
            left = mid;
        }
    }
    return left;
}

function calculateDeltas(allContestants) {
    let deltas = [];
    const numberOfContestants = allContestants.length;
    for (let i = 0; i < allContestants.length; i++) {
        const expR = getRatingToRank(i, allContestants);
        deltas[i] = ((expR - allContestants[i].currentRating) / 2);
    }

    // Total sum should not be more than zero.
    const deltaSum = _.sum(deltas);
    const inc = -deltaSum / numberOfContestants - 1;
    deltas = deltas.map(d => d + inc);

    // Sum of top-4*sqrt should be adjusted to zero.
    const zeroSumCount = Math.min(Math.trunc(4 * Math.round(Math.sqrt(numberOfContestants))), numberOfContestants);
    const deltaSum2 = _.sum(deltas.slice(0, zeroSumCount));
    const inc2 = Math.min(Math.max(-deltaSum2 / zeroSumCount, -10), 0);
    deltas = deltas.map(d => d + inc2);

    return deltas;
}

module.exports = function(allContestants) {
    const deltas = calculateDeltas(allContestants);
    return allContestants.map((contestant, i) => ({ user: contestant.user, rank: contestant.rank, currentRating: contestant.currentRating + deltas[i] }));
}