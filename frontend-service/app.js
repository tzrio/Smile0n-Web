const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('SmileOn Lab - Frontend Service');
});

app.listen(PORT, () => {
  console.log(`Frontend Service running on port ${PORT}`);
});
