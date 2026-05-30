const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'SmileOn Lab - Product Service' });
});

app.listen(PORT, () => {
  console.log(`Product Service running on port ${PORT}`);
});
