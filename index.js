require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const routes = require('./src/routes/action-get');
const sql = require('./src/services/sql-service');

const app = express();
const port = process.env.PORT || 3001;

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(routes);

sql.connectToDatabase();

app.listen(port, () => {
    console.log("server running on port 3001");
});