# ynab-accounts

## 🤔 Purpose

This repo utilises the [YNAB API](https://api.youneedabudget.com/) in order to process the budgets of my partner and I. We have quite a few shared transactions (groceries, bills etc.) that aren't always split 50/50, so we needed a way of easily transferring transactions between our siloed accounts. Before this project, we would have to go through reimbursement transactions in my account and manually transfer them to my partner's... 🙄 This would obviously take up a fair amount of time. So instead, I created this project that looks at my account, finds any transactions that are tagged with the "Personal Reimbursement" category ID and moves them over to my partner's account with the correct metadata e.g. how much she owes, what the category is for her etc. 💪

## 👨‍💻 Tech

- Node.js
- MongoDB to saves which transactions that have already been processed
- Google Cloud Functions in order to run the script every night
