import express from "express";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());
const port = 8000;

app.post("/add", (req, res) => {
  // destructure request body to get data
  const { payer, points, timestamp } = req.body ?? {};
  
  // if missing data, we cannot add the points
  if (payer == undefined || points == undefined || timestamp == undefined) {
    return res.status(400).end();
  }

  // add the transaction to the DB
  
});

app.post("/spend")

app.listen(port, (err) => {
  if (err) {
    console.error(`Error running API on port ${port}: ${err}`);
  } else {
    console.log(`API running on port ${port}`);
  }
});