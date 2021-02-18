const ynabApi = require("./index");

module.exports = async (budgetId) => {
  const output = [];

  try {
    const groupCategories = await ynabApi.categories.getCategories(budgetId);
    groupCategories.data.category_groups.forEach((group) => {
      group.categories.forEach((item) => output.push(item));
    });
  } catch (error) {
    console.error(error);
    return null;
  }

  return output;
}