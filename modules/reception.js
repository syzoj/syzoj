let User = syzoj.model('user');
let UserApply = syzoj.model('user_apply');

app.get('/reception', async (req, res) => {
    try{
        const order = req.query.order || syzoj.config.sorting.ranklist.order;
        if (!['ac_num', 'rating', 'id', 'username'].includes(sort) || !['asc', 'desc'].includes(order)) {
        throw new ErrorMessage('错误的排序参数。');
        }
        let paginate = syzoj.utils.paginate(await User.count({ is_show: true }), req.query.page, syzoj.config.page.ranklist);
        let ranklist = await User.query(paginate, { is_show: true }, [[sort, order]]);
        await ranklist.forEachAsync(async x => x.renderInformation());

        res.render('reception_user_list', {
        ranklist: ranklist,
        paginate: paginate,
        curSort: sort,
        curOrder: order === 'asc'
        });
    } catch (e) {
        syzoj.log(e);
        res.render('error', {
            err: e
        });
    }
});