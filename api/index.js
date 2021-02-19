const ynab = require("ynab");
require("dotenv").config();

module.exports = new ynab.API(process.env.YNAB_TOKEN);
