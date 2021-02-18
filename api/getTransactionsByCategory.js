const ynabApi = require("./index");

module.exports = async (budgetId, categoryId, searchFrom = new Date()) => {
  const transactions = await ynabApi.transactions.getTransactionsByCategory(budgetId, categoryId, searchFrom);
  return transactions.data.transactions;
};