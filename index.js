require("dotenv").config();
const mongoose = require('mongoose');

const connectToDb = async (url) => {
  try {
    mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
    return;
  } catch (error) {
    console.error(error.message);
  }
};

module.exports.main = async () => {
  const { DATABASE_URL } = process.env;
  connectToDb(DATABASE_URL);

  const db = mongoose.connection;

  const listingsAndReviews = await db.collection("listingsAndReviews");

  console.log(listingsAndReviews.collectionName);

  return "hello world"; // some update
};