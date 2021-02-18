require("dotenv").config();
const connectToDb = require("./db");
const Transaction = require("./models/transaction");
const fs = require("fs");

const main = async () => {
  const db = await connectToDb(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true });

  // const transaction = new Transaction({
  //   transactionId: "abc",
  // });
};

if (process.env.NODE_ENV === "dev") {
  main();
}

module.exports = main;