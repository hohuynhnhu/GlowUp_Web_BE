const express = require("express");

require("dotenv").config();
const app = express();
const port = process.env.PORT || 8082;
const hostname = process.env.HOST_NAME;

app.listen(port, hostname, () => {
  console.log(`app listening on port ${port}`);
});
