const express = require("express");
const cors = require("cors");
const { AppError } = require("./utils/errors");
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/products", require("./routes/products"));
app.use('/api/orders', require('./routes/orders'));




app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: err.code,
      message: err.message,
      details: err.details,
    });
  }

  // Broken JSON in the request body
  if (err.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ error: "BAD_JSON", message: "Request body is not valid JSON" });
  }

  console.error(err);
  res
    .status(500)
    .json({ error: "INTERNAL_ERROR", message: "Something went wrong" });
});

module.exports = app;
