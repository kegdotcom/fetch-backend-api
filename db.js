import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

let db;
try {
  const client = new MongoClient(process.env.ATLAS_CONN_STR);
  const connection = await client.connect();
  db = connection.db("Points");
} catch (err) {
  console.error(`Error connecting to MongoDB database: ${err}`);
}

export default db;