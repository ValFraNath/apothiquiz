import express from "express";
import dotenv from "dotenv";
import path from 'path';

dotenv.config();
const {PORT, BUILT_PATH, IS_PROD} = process.env;

const app = express();

if(IS_PROD === 'true') {
    app.use(express.static(BUILT_PATH));
    app.get("/", function (req, res) {
        return res.sendFile(path.join(BUILT_PATH, 'index.html'));
    })
}

app.get("/api",function(req,res){
    return res.status(200).json("Hello World!");
});


app.listen(PORT, () => console.log(`Server is running on port ${PORT}.`));

export default app;
