import mysql from "mysql";
import dotenv from "dotenv";
import fs from 'fs';
import path from 'path'
const __dirname = path.resolve();

dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "glowing-octo-guacamole",
  password: process.env.DB_PASSWORD || "p@ssword",
  database: process.env.DB_DATABASE || "glowingOctoGuacamole",
  multipleStatements: true
});

export default db;

export function create_database_scheme(db) {
  let sql = "SELECT sy_version FROM system";
  db.query(sql, function (err, res) {
    if(err) {
      if(err.code === "ER_NO_SUCH_TABLE"){
        const dataSql = fs.readFileSync(path.resolve(__dirname,'db','db_creation.sql')).toString('utf8');

        db.query(dataSql,function(err,res){
          if(err) throw err;
          console.log(res);
        })
      }else{
        throw err
      }
    };
  })
}

