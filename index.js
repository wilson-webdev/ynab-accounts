require("dotenv").config();
const ynab = require("ynab");
const connectToDb = require("./db");
const Transaction = require("./models/transaction");
const Category = require("./models/category");
const ids = require("./ids");
const getCategories = require("./api/getCategories");
const postTransactions = require("./api/postTransactions");
const getTransactions = require("./api/getTransactions");
const getTransactionsByCategory = require("./api/getTransactionsByCategory");
const {
  getStartDate,
  createIndex,
  formatCategoryName,
  convertAmount,
  convertDbQueryToIndex,
  formatCategoryNameForComparison,
  formatMemo,
} = require("./utils");

const { DATABASE_URL, NODE_ENV } = process.env;
const transactionClearValue = ynab.SaveTransaction.ClearedEnum.Uncleared;

const processReimbursements = async (
  filteredReimbursements,
  reimbursements,
  transactionTable,
  transactionIdIndex,
  transactionsToInsert
) => {
  filteredReimbursements.forEach((item) => {
    transactionsToInsert.push(new Transaction({ transactionId: item.id }));

    const parentId = item.parent_transaction_id;
    let totalAmount;
    let parentTran = {};

    // If the transaction has a parent id, then use that as the payee name
    if (parentId != null) {
      parentTran = transactionIdIndex[parentId] || {};
      totalAmount = parentTran.amount;
    }

    // Get the transactions that are alongside the current transaction
    const associatedTransactions = (parentTran.subtransactions || [])
      .filter(
        (tran) =>
          tran.category_id !==
          ids.george.categories.personalReimbursementsCategoryId
      )
      .map((tran) => {
        // Remove the emojis so we can compare the text
        tran.category_name = formatCategoryName(tran.category_name);
        return tran;
      });

    reimbursements.push({
      transaction: item,
      parentTransaction: parentTran,
      associatedTransactions,
    });

    transactionTable.push({
      payee: parentTran.payee_name || item.payee_name,
      categories:
        associatedTransactions.length > 0
          ? associatedTransactions
              .map(
                (tran) =>
                  `${tran.category_name} (£${convertAmount(tran.amount)})`
              )
              .join(", ")
          : "Personal",
      amount: `£${convertAmount(item.amount)}`,
      total_amount: `£${convertAmount(totalAmount || item.amount)}`,
      transaction_id: item.id,
    });
  });
};

const findMatchingCategory = (categoryName, categories, categoriesIndex) => {
  const formattedName = formatCategoryNameForComparison(categoryName);

  // Attempt to find the ID using the index first
  if (categoriesIndex[formattedName] != null) {
    return {
      usedIndex: true,
      match: categoriesIndex[formattedName].categoryId,
      formattedName,
    };
  }

  // If a match hasn't been found in the index, attempt to find it in the array of categories using a case-insensitive search with emojis removed
  const match = (
    categories.find(
      (item) => formattedName === formatCategoryNameForComparison(item.name)
    ) || {}
  ).id;

  return { usedIndex: false, match, formattedName };
};

const checkAndPushCategories = (categoriesToPost, usedIndex, formattedName, matchingCategory) => {
  // If we didn't use the index and the matching category is defined
  if (!usedIndex && !!matchingCategory) {
    categoriesToPost.push(
      new Category({
        category: formattedName,
        categoryId: matchingCategory,
      })
    );
  }
};

const main = async () => {
  if (typeof connectToDb !== "function") {
    return false;
  }

  const db = await connectToDb(DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const categoriesCollection = await db.collection("categories");
  const transactionsCollection = await db.collection("transactions");

  console.log("Fetching data from YNAB from one month ago...");

  console.time("get-categories");
  const beckyCategories = await getCategories(ids.becky.budget);
  console.timeLog("get-categories", beckyCategories.length);

  // Something has gone wrong, usually too many requests
  if (beckyCategories == null) {
    return false;
  }

  const startDate = getStartDate();

  console.time("get-all-transactions");
  const allTransactions = await getTransactions(ids.george.budget, startDate);
  console.timeLog("get-all-transactions", allTransactions.length);

  const transactionIdIndex = createIndex(allTransactions, "id", true);

  console.time("get-reimbursement-transactions");
  // Get all transactions under the personal reimbursement category
  const transactions = await getTransactionsByCategory(
    ids.george.budget,
    ids.george.categories.personalReimbursementsCategoryId,
    startDate
  );
  console.timeLog("get-reimbursement-transactions", transactions.length);

  const processedTransactionsIndex = await convertDbQueryToIndex(
    transactionsCollection,
    {},
    "transactionId",
    false
  );

  // Filter the transactions for 'Becky' at the start of the memo field and that it hasn't been imported before
  const filteredReimbursements = transactions.filter(
    (item) =>
      processedTransactionsIndex[item.id] == null && /^becky/gi.test(item.memo)
  );

  console.log(
    `Found ${filteredReimbursements.length} transaction${
      filteredReimbursements.length !== 1 ? "s" : ""
    } to transfer.`
  );

  // No need to carry on, no transactions to import
  if (filteredReimbursements.length === 0) {
    return false;
  }

  const categoryIndex = await convertDbQueryToIndex(
    categoriesCollection,
    {},
    "category"
  );

  // Transactions to be imported once mapped
  const reimbursements = [];

  // Display table (using console.table) of applicable transactions
  const transactionTable = [];

  const transactionsToInsert = [];

  processReimbursements(
    filteredReimbursements,
    reimbursements,
    transactionTable,
    transactionIdIndex,
    transactionsToInsert
  );

  const categoriesToPost = [];

  const transactionsToPost = reimbursements.map(
    ({ transaction, parentTransaction, associatedTransactions }) => {
      // If there is only one transaction alongside the reimbursement, use this as the template for the single transaction to import
      if (associatedTransactions.length === 1) {
        const [{ category_name: categoryName }] = associatedTransactions;
        const {
          match: matchingCategory,
          usedIndex,
          formattedName,
        } = findMatchingCategory(categoryName, beckyCategories, categoryIndex);

        checkAndPushCategories(categoriesToPost, usedIndex, formattedName, matchingCategory);

        return {
          account_id: ids.becky.accounts.reimbursement,
          date: transaction.date,
          amount: transaction.amount,
          payee_name: parentTransaction.payee_name,
          category_id: matchingCategory,
          memo: formatMemo("", categoryName, matchingCategory),
          // flag_color: ynab.SaveTransaction.FlagColorEnum.Orange,
          cleared: transactionClearValue,
          approved: true,
        };
      }

      // If there are no associated transactions, then it's a full reimbursement in which case we don't know what the corresponding category should be
      if (associatedTransactions.length === 0) {
        return {
          account_id: ids.becky.accounts.reimbursement,
          date: transaction.date,
          amount: transaction.amount,
          payee_name: transaction.payee_name,
          // memo: MEMO,
          // flag_color: ynab.SaveTransaction.FlagColorEnum.Orange,
          cleared: transactionClearValue,
          approved: true,
        };
      }

      return {
        account_id: ids.becky.accounts.reimbursement,
        date: transaction.date,
        amount: 0,
        payee_name: transaction.payee_name || parentTransaction.payee_name,
        memo: `You owe £${convertAmount(transaction.amount)}`,
        // flag_color: ynab.SaveTransaction.FlagColorEnum.Orange,
        cleared: transactionClearValue,
        approved: true,
        subtransactions: associatedTransactions.map((tran) => {
          const {
            match: matchingCategory,
            usedIndex,
            formattedName,
          } = findMatchingCategory(
            tran.category_name,
            beckyCategories,
            categoryIndex
          );

          checkAndPushCategories(categoriesToPost, usedIndex, formattedName, matchingCategory);

          return {
            amount: 0,
            category_id: matchingCategory,
            memo: `${
              tran.memo ? `${tran.memo}. ` : ""
            }George paid £${convertAmount(tran.amount)}`,
          };
        }),
      };
    }
  );

  if (categoriesToPost.length > 0) {
    console.log("Adding categories to the DB");
    await categoriesCollection.insertMany(categoriesToPost);
  }

  console.time("post-transactions");
  const transactionsPosted = await postTransactions(
    ids.becky.budget,
    transactionsToPost
  );

  // If at least one posts, then we know all them have
  if (transactionsPosted.length > 0) {
    await transactionsCollection.insertMany(transactionsToInsert);
  }

  console.timeLog("post-transactions", transactionsToPost.length);

  return true;
};

if (NODE_ENV === "dev") {
  main();
}

module.exports.main = main;
