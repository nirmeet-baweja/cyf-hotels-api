const express = require("express");
const app = express();

// require("dotenv").config();

const PORT = process.env.PORT || 5000;

const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_hotel",
  password: "cyf",
  port: 5432,
});

app.get("/hotels", function (req, res) {
  const hotelsQuery = "Select * from hotels";

  pool
    .query(hotelsQuery)
    .then((result) => res.send(result.rows))
    .catch((e) => console.log(e));
});

app.get("/customers", function (req, res) {
  const customersQuery = "Select * from customers";

  pool
    .query(customersQuery)
    .then((result) => res.send(result.rows))
    .catch((e) => console.log(e));
});

app.listen(PORT, function () {
  console.log(`Server is listening on port ${PORT}. Ready to accept requests!`);
});
