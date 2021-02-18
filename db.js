const mongoose = require("mongoose");

module.exports = async (url, options) => {
  try {
    mongoose.connect(url, options);

    const db = mongoose.connection;

    db.on("error", (error) => console.error(error));
    db.once("open", () => console.log("Connected to DB"));

    return db;
  } catch (error) {
    console.error(error);
  }
};