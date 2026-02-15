import cors from "cors";
import dotenv from "dotenv";
import express from "express";
dotenv.config();
const port = process.env.PORT;

const app = express();


app.use(cors());
app.use(express.json());


app.get("/", async(req, res) => {
    res.send("modern blog server running rapidly");
});

app.listen(port, () => {
    console.log(`modern blog server running on port http://localhost:${port}`);
})