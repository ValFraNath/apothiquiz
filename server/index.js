import express from "express";
import dotenv from "dotenv";
import apiRouter from "./routes/api.route.js";

import reactRouter from "./routes/reactRouter.js";

dotenv.config();
const PORT = process.env.PORT || 5035;

const app = express();
app.use(express.static("../client/build/"));

app.use("/api/v1/", apiRouter);
app.use("/",reactRouter);


app.listen(PORT, () => console.log(`Server is running on port ${PORT}.`));

export default app;
