import dotenv from "dotenv";
import pkg from "pg";
dotenv.config();

const {Pool} = pkg;

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
});

// connect with postgres db
export const connectDB = async () => {
    try {
        const client = await pool.connect();
        console.log("postgres connected successfully");
    } catch (error) {
        console.log("postgres connection failed :", error);
        process.exit(1);
    }
}


export default pool;