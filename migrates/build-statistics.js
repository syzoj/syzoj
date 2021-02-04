/*
 * This script will help you build submission_statistics table. SYZOJ changed previous
 * way of querying every time to cache statistics in database and update it for every
 * judged submission. Without running this script after migrating will cause old submissions
 * disappear from statistics.
 * 
 */

const fn = async () => {
  require('..');
  await syzoj.untilStarted;

  const User = syzoj.model('user');
  const Problem = syzoj.model('problem');
  const JudgeState = syzoj.model('judge_state');

  const userIDs = (await User.createQueryBuilder().select('id').getRawMany()).map(record => record.id);
  for (const id of userIDs) {
    const problemIDs = (await JudgeState.createQueryBuilder()
                                        .select('DISTINCT(problem_id)', 'problem_id')
                                        .where('status = :status', { status: 'Accepted' })
                                        .andWhere('user_id = :user_id', { user_id: id })
                                        .andWhere('type = 0')
                                        .getRawMany()).map(record => record.problem_id);
    for (const problemID of problemIDs) {
      const problem = await Problem.findById(problemID);
      await problem.updateStatistics(id);

      console.log(`userID = ${id}, problemID = ${problemID}`);
    }
  }

  process.exit();
};

// NOTE: Uncomment to run.
fn();
