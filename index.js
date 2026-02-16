import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import pool, { connectDB } from "./database/db.js";
dotenv.config();
const port = process.env.PORT;

// import routes
import blogs from "./routes/blogsRoute/blogs.js";
import forgetPassword from "./routes/userRoutes/forget-password.js";
import users from "./routes/userRoutes/users.js";

const app = express();


app.use(cors());
app.use(express.json());


connectDB();

// api endpoints
app.use("/api/users", users);
app.use("/api/forgot-password", forgetPassword);
app.use("/api/blogs", blogs);



app.get("/test-db", async(req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({
            success: true,
            message: "Database connected",
            time: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Database connection failed",
            error: error.message
        });
    }
});


app.get("/", async(req, res) => {
    res.send("modern blog server running rapidly");
});

app.listen(port, () => {
    console.log(`modern blog server running on port http://localhost:${port}`);
})