import express from "express";
import dotenv from "dotenv";

dotenv.config();
const PORT = process.env.PORT || 5035;

const app = express();

app.use("/static", express.static("../client/build/static"));
app.get("/", function (req, res) {
  res.sendFile("index.html", { root: "../client/build/" });
});

app.get("/:dir/:file", function (req, res) {
  var dir = req.params.dir,
    file = req.params.file;

  res.sendFile(dir + "/" + file, { root: "../client/build/" });
});

app.get("/api/v1/status", (req, res) => res.status(200).json("Hello World!"));

app.listen(PORT, () => console.log(`Server is running on port ${PORT}.`));

export default app;
