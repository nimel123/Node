const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const indexRouter = require('./Routes/routes'); 

const app = express();

app.use(cors());
app.use(express.json());

app.use('/', indexRouter);

app.listen(port, () => {
  console.log('Server is running on port 5000');
});
