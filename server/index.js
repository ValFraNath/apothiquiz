import express from "express";
import dotenv from "dotenv";

dotenv.config();
const PORT = process.env.PORT || 5035;

const app = express();

app.get("/",(req,res) => res.status(200).json("Hello World!"));

app.listen(PORT, () => console.log(`Server is running on port ${PORT}.`));

export default app;
