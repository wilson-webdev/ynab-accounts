require("dotenv").config();

const { TEST } = process.env;

module.exports = {
  george: {
    budget: "a1967fd6-da2a-4592-b8d6-fa4822057624",
    categories: {
      reimbursementsGroupCategoryId: "850005a2-74f4-4d6f-8211-e9edd8a7d26e",
      personalReimbursementsCategoryId: "1b9e684e-0bd8-45f4-9568-a57647f74b8b",
    },
  },
  becky: {
    budget: TEST
      ? "2e673740-6675-4f8f-a383-66a3b0c706a3"
      : "0ec8a864-4590-456a-8025-34b55947063a",
    accounts: {
      reimbursement: TEST
        ? "d04db9e4-bc47-4ea8-a373-5ae2a6a5f010"
        : "14e300c2-1325-4d52-a3e2-4198c3a76af3",
    },
  },
};
