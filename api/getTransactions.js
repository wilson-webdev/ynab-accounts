const ynabApi = require("./index");

module.exports = async (budgetId, searchFrom = new Date()) => {
  const transactions = await ynabApi.transactions.getTransactions(budgetId, searchFrom);
  return transactions.data.transactions;
};
