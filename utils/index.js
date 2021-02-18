const ynab = require("ynab");

const createIndex = (arr, key, useValue = true) => {
  return arr.reduce((total, item) => {
    total[key != null ? item[key] : item] = useValue ? item : true;
    return total;
  }, {});
}

const convertAmount = (n) => {
  if (n == null) {
    return null;
  }

  return Math.abs(ynab.utils.convertMilliUnitsToCurrencyAmount(n)).toFixed(
    2
  );
};

const removeEmojis = (str) => {
  return str.replace(
    /([\u2700-\u27BF]|🏃‍♂️|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
    ""
  );
}

const formatCategoryName = (str) => {
  if (typeof str !== "string") {
    return "";
  }

  return removeEmojis(str).trim();
}

const formatCategoryNameForComparison = (str) => {
  return formatCategoryName(str).toLowerCase().replace(/\s/g, "-");
}

const round = (n, dp = 0) => {
  const multiplier = 10 ** dp;
  return Math.round(n * multiplier) / multiplier;
}

const formatMemo = (memo, categoryName, matchingCategory) => {
  return (
    (memo || "") +
    (matchingCategory == null ? ` '${categoryName}' not found` : "")
  );
}

const getStartDate = () => {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    now.getDate()
  );
};

const convertDbQueryToIndex = async (collection, query, indexBy, useValue) => {
  const dbFind = await collection.find(query);
  const arr = await dbFind.toArray();
  return createIndex(arr, indexBy, useValue);
};

module.exports = {
  convertAmount,
  removeEmojis,
  round,
  createIndex,
  formatCategoryNameForComparison,
  formatMemo,
  getStartDate,
  formatCategoryName,
  convertDbQueryToIndex,
  formatCategoryNameForComparison,
};