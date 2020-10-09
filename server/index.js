import express from "express";

const app = express();


app.get("/",(req,res) => res.status(200).json("Hello World!"));

app.listen(5035, () => console.log("Server is running on port 5035."));

export default app;
