import express from "express";
import db from "./db.js";

const app = express();
app.use(express.json());
const port = 8000;

app.post("/add", async (req, res) => {
  // request body validation
  const transaction = req.body;
  if (!transaction || transaction.payer == undefined || transaction.points == undefined || transaction.timestamp == undefined) {
    return res.status(400).end();
  }

  // try to get the payer's balance
  const transactionCollection = db.collection("Transactions");
  const balanceCollection = db.collection("Balances");
  const payerBalance = await balanceCollection.findOne({ payer: transaction.payer });
  
  const balancePoints = payerBalance ? payerBalance.balance : 0;
  if (transaction.points + balancePoints < 0) {
    return res.status(400).end();
  }

  if (transaction.points < 0) {
    // negative transaction, spend points
    // get positive payer transactions
    const payerTransactions = transactionCollection.find({
      payer: transaction.payer,
      points: { $gt: 0 }
    }).sort({ timestamp: "asc" });

    let toSpend = -transaction.points;
    for await (const other of payerTransactions) {
      if (other.points <= toSpend) {
        // we will spend all of this transaction's points
        await transactionCollection.deleteOne({ _id: other._id });
        toSpend -= other.points;
  
        // update payer balance
        await balanceCollection.updateOne(
          { payer: transaction.payer },
          { $inc: { balance: -other.points }}
        );
  
        // if we spent all the points we needed to, end the loop
        if (toSpend == 0) {
          break;
        }
      } else {
        // we will partially spend points from this transaction and end the loop
        await transactionCollection.updateOne(
          { _id: other._id },
          { $inc: { points: -toSpend }}
        );
        // update payer balance
        await balanceCollection.updateOne(
          { payer: transaction.payer },
          { $inc: { balance: -toSpend }}
        );
        break;
      }
    }
  } else if (transaction.points > 0) {
    // positive transaction, insert new transaction
    const insertedTransaction = await transactionCollection.insertOne(transaction);
    let success = insertedTransaction.acknowledged;

    // add/update payer balance
    if (payerBalance) {
      // existing payer, so just update their balance
      const modifiedBalance = await balanceCollection.updateOne(
        { _id: payerBalance._id },
        { $inc: { balance: transaction.points }}
      );
      success &&= modifiedBalance.acknowledged;
    } else {
      // new payer, insert new balance
      const insertedBalance = await balanceCollection.insertOne({
        payer: transaction.payer,
        balance: transaction.points
      });
      success &&= insertedBalance.acknowledged;
    }
    if (!success) {
      return res.status(400).end();
    }
  }
  res.status(200).end();
});

app.post("/spend", async (req, res) => {
  // request body validation
  if (!req.body || req.body.points == undefined) {
    return res.status(400).end();
  }
  let points = req.body.points;

  // get all balance entries with a positive balance
  const balanceCollection = db.collection("Balances");
  const balances = await balanceCollection.find({
    balance: { $gt: 0 }
  }).toArray();

  // get total balance available to the user and make sure we have enough to spend
  const availableBalance = balances.reduce((total, curr) => total + curr.balance, 0);
  if (availableBalance < points) {
    return res.status(400).send(`Sorry, you don't have enough points to spend. Your current balance is ${availableBalance} Points.`);
  }

  // build list of unique payer names with positive balances
  const payers = [...new Set(balances.map(b => b.payer))];
  
  // get all the transactions made by one of our eligible payers, sorted by timestamp ascending
  const transactionCollection = db.collection("Transactions");
  const transactions = transactionCollection.find({
    payer: { $in: payers },
    points: { $gt: 0 }
  }).sort({ timestamp: "asc" });

  // iterate over the transactions in order of timestamp, tracking what we spend
  // await here instead of with the .find() call above
  // no need to wait for transactions we won't need, just load as we go
  const spent = new Map();
  for await (const transaction of transactions) {
    const prevSpent = spent.get(transaction.payer) ?? 0;
    if (transaction.points <= points) {
      // we will spend all of this transaction's points
      spent.set(transaction.payer, prevSpent + transaction.points);
      await transactionCollection.deleteOne({ _id: transaction._id });
      points -= transaction.points;

      // update payer balance
      await balanceCollection.updateOne(
        { payer: transaction.payer },
        { $inc: { balance: -transaction.points }}
      )

      // if we spent all the points we needed to, end the loop
      if (points == 0) {
        break;
      }
    } else {
      // we will partially spend points from this transaction and end the loop
      spent.set(transaction.payer, prevSpent + points);
      await transactionCollection.updateOne(
        { _id: transaction._id },
        { $inc: { points: -points }}
      );

      // update payer balance
      await balanceCollection.updateOne(
        { payer: transaction.payer },
        { $inc: { balance: -points }}
      );
      break;
    }
  }

  // build the array of what points were spent and send it in the response body
  const payerSpending = Array.from(spent, ([payer, amount]) => ({
    payer: payer,
    points: -amount
  }));
  res.status(200).send(payerSpending);
});

app.get("/balance", async (req, res) => {
  const balanceCollection = db.collection("Balances");
  const balances = await balanceCollection.find().toArray();
  const balanceObj = balances.reduce((obj, balance) => ({
      ...obj,
      [balance.payer]: balance.balance
  }), {});
  res.status(200).send(balanceObj);
})

app.listen(port, (err) => {
  if (err) {
    console.error(`Error running API on port ${port}: ${err}`);
  } else {
    console.log(`API running on port ${port}`);
  }
});