const express = require("express");
const app = express();

app.use(express.json());

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

/*****************************************************************************/
// Get Requests
/*****************************************************************************/

app.get("/", function (req, res) {
  res.send("CYF Hotels API.");
});

app.get("/hotels", function (req, res) {
  const hotelNameQuery = req.query.name;
  let hotelsQuery = "SELECT * FROM hotels ORDER BY name";

  if (hotelNameQuery) {
    hotelsQuery = `SELECT * FROM hotels WHERE name ILIKE '%${hotelNameQuery}%' ORDER BY name`;
  }

  pool
    .query(hotelsQuery)
    .then((result) => res.send(result.rows))
    .catch((e) => console.error(e));
});

app.get("/hotels/:hotelId", function (req, res) {
  const hotelId = req.params.hotelId;

  pool
    .query("SELECT * FROM hotels WHERE id=$1", [hotelId])
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});

app.get("/customers", function (req, res) {
  const customersQuery = "Select * from customers ORDER BY name";

  pool
    .query(customersQuery)
    .then((result) => res.send(result.rows))
    .catch((e) => console.log(e));
});

app.get("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});

app.get("/customers/:customerId/bookings", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query(
      `SELECT TO_CHAR(b.checkin_date :: DATE, 'Mon dd, yyyy') AS "Checkin Date", b.nights AS "Nights", h.name AS "Hotel Name", h.postcode AS "Hotel Postcode" FROM bookings AS b INNER JOIN hotels AS h ON b.hotel_id = h.id WHERE customer_id=$1;`,
      [customerId]
    )
    .then((result) => res.send(result.rows))
    .catch((e) => console.error(e));
});

/*****************************************************************************/
// Post Requests
/*****************************************************************************/

app.post("/hotels", function (req, res) {
  const newHotelName = req.body.name;
  const newHotelRooms = req.body.rooms;
  const newHotelPostcode = req.body.postcode;

  if (!Number.isInteger(newHotelRooms) || newHotelRooms <= 0) {
    return res
      .status(400)
      .send("The number of rooms should be a positive integer.");
  }

  pool
    .query("SELECT * FROM hotels WHERE name=$1", [newHotelName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("An hotel with the same name already exists.");
      } else {
        const hotelsPostQuery =
          "INSERT INTO hotels (name, rooms, postcode) VALUES ($1, $2, $3);";
        pool
          .query(hotelsPostQuery, [
            newHotelName,
            newHotelRooms,
            newHotelPostcode,
          ])
          .then(() => res.send("Hotel Created!"))
          .catch((e) => console.error(e));
      }
    });
});

app.post("/customers", function (req, res) {
  const newCustomerName = req.body.name;
  const newCustomerEmail = req.body.email;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerPostcode = req.body.postcode;
  const newCustomerCountry = req.body.country;

  const emailValidator =
    /^[a-zA-Z0-9._-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  pool
    .query("SELECT * FROM customers WHERE name=$1", [newCustomerName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("A customer with the same name already exists.");
      } else if (!emailValidator.test(newCustomerEmail)) {
        return res
          .status(400)
          .send("Enter a valid email address for the customer.");
      } else {
        const customerPostQuery =
          "INSERT INTO customers (name, email, address, city, postcode, country) VALUES ($1, $2, $3, $4, $5, $6);";

        pool
          .query(customerPostQuery, [
            newCustomerName,
            newCustomerEmail,
            newCustomerAddress,
            newCustomerCity,
            newCustomerPostcode,
            newCustomerCountry,
          ])
          .then(() => res.send("Customer Created!"))
          .catch((e) => console.error(e));
      }
    });
});

/*****************************************************************************/
// Put Requests
/*****************************************************************************/

app.put("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  const newCustomerEmail = req.body.email;

  const emailValidator =
    /^[a-zA-Z0-9._-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailValidator.test(newCustomerEmail)) {
    return res.status(400).send("Update unsuccessful. Invalid email address.");
  } else {
    pool
      .query("UPDATE customers SET email=$1 WHERE id=$2", [
        newCustomerEmail,
        customerId,
      ])
      .then(() => res.send(`Customer ${customerId} updated successfully!`))
      .catch((e) => console.error(e));
  }
});

/*****************************************************************************/
// Delete Requests
/*****************************************************************************/

// Delete a customer and all its corresponding bookings from the DB
app.delete("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query("DELETE FROM bookings WHERE customer_id=$1", [customerId])
    .then(() => {
      pool
        .query("DELETE FROM customers WHERE id=$1", [customerId])
        .then(() => res.send(`Customer ${customerId} deleted!`))
        .catch((e) => console.error(e));
    })
    .catch((e) => console.error(e));
});

// Delete a hotel and all its bookings from the DB
app.delete("/hotels/:hotelId", function (req, res) {
  const hotelId = req.params.hotelId;

  pool
    .query("DELETE FROM bookings WHERE hotel_id=$1", [hotelId])
    .then(() => {
      pool
        .query("DELETE FROM hotels WHERE id=$1", [hotelId])
        .then(() => res.send(`Hotel ${hotelId} deleted!`))
        .catch((e) => console.error(e));
    })
    .catch((e) => console.error(e));
});

/*****************************************************************************/
// Listen
/*****************************************************************************/

app.listen(PORT, function () {
  console.log(`Server is listening on port ${PORT}. Ready to accept requests!`);
});
