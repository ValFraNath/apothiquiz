import mysql from "mysql";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "glowing-octo-guacamole",
  password: process.env.DB_PASSWORD || "p@ssword",
  database: process.env.DB_DATABASE || "glowingOctoGuacamole",
});

export default db;
