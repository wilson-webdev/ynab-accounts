const ynabApi = require("./index");

module.exports = async (budgetId, transactions) => {
  try {
    await ynabApi.transactions.createTransactions(budgetId, { transactions });

    console.log(
      `Successfully posted ${transactions.length} transaction${
        transactions.length !== 1 ? "s" : ""
      } to YNAB`
    );
  } catch (error) {
    console.error(error);
  }
};
