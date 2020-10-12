import express from "express";
import dotenv from "dotenv";
import apiRouter from "./routes/api.route.js";

dotenv.config();
const PORT = process.env.PORT || 5035;

const app = express();

app.use("/api/v1/", apiRouter);
app.use("/static", express.static("../client/build/static"));

app.get("/*", function (req, res) {
  res.sendFile("index.html", { root: "../client/build/" });
});



app.listen(PORT, () => console.log(`Server is running on port ${PORT}.`));

export default app;
