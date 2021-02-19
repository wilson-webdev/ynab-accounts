const ynabApi = require("./index");

module.exports = async (budgetId, transactions) => {
  try {
    const res = await ynabApi.transactions.createTransactions(budgetId, {
      transactions,
    });

    console.log(
      `Successfully posted ${transactions.length} transaction${
        transactions.length !== 1 ? "s" : ""
      } to YNAB`
    );

    return res.data.transaction_ids;
  } catch (error) {
    console.error(error);
    return [];
  }
};
