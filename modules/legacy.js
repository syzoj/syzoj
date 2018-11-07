app.get('/problem', async (req, res) => {
  res.redirect('/problems');
});

app.get('/contest', async (req, res) => {
  res.redirect('/contests');
});

app.get('/judge_state', async (req, res) => {
  res.redirect('/submissions');
});

app.get('/judge_detail/:id', async (req, res) => {
  res.redirect('/submission/' + req.params.id);
});
