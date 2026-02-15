import bcrypt from "bcrypt";
import { Router } from "express";
import jwt from "jsonwebtoken";
import pool from "../../database/db.js";

const router = Router();
const saltRounds = 10;

// get all users from postgresdb
router.get("/", async(req, res) => {
    try {
        const result = await pool.query("select * from users order by created_at desc");
         console.log("Query result:", result.rows); 

        if(result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "users not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "users fetched successfully",
            data: result.rows,
        })
    } catch (error) {
        console.error("users fetching error :", error);
        res.status(500).json({
            success: false,
            message: "server error",
        })
    }
});


// registration
router.post("/registration", async(req, res) => {
    try {
        const {name, email, password} = req.body;

        if(!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "name , email and password are being required",
            });
        };

        const checkUserExists = await pool.query("select * from users where email = $1", [email.toLowerCase()]);

        if(checkUserExists.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: `user already exists with this id ${email}`
            })
        };

        const role = "user";
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const result = await pool.query("insert into users (name, email , password, role ) values ($1, $2, $3, $4) returning *", [name,email.toLowerCase(), hashedPassword, role || "user"])

        res.status(201).json({
            success: true,
            message: "new user added successfully",
            data: result.rows[0],
        });
    } catch (err) {
        console.error("new user insert error", err);
        res.status(500).json({
            success: false,
            message: "server error",
        })
    }
});

// sign in
router.post("/login", async(req, res) => {
    try {
        const {email, password} = req.body;

        if(!email || !password) {
            return res.status(400).json({
                success: false,
                message: "email and password are being required for system login",
            });
        };
        
        const result = await pool.query("select * from users where email = $1", [email.toLowerCase()]);

        if(result.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid Credentials",
            });
        };

        const user = result.rows[0];

        // compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Wrong password",
            });
        };

        // generate jwt token for login 
        const token = jwt.sign(
            {id: user.id, email: user.email},process.env.JWT_SECRET,
            {expiresIn: process.env.JWT_EXPIRES},
        );

        res.status(200).json({
            success: true,
            message: "user login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (e) {
        console.error("user login error :", e);
        res.status(500).json({
            success: false,
            message: "server error",
        })
    }
})

// forget-password
router.post("/forget-password", async(req, res) => {
    try {
        const {email, otp} = req.body;

        if(!email) {
            return res.status(400).json({
                success: false,
                message: "email required",
            })
        }

        const checkUserExists = await pool.query("select * from users where email = $1", [email])
        if(checkUserExists.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `no data found with this email ${email}`
            })
        }
    } catch (e) {
        console.error("forget password failed :", e);
        res.status(500).json({
            success: false,
            message: "server error"
        })
    }
})


// get solo user from postgresdb by ID
router.get("/:id", async(req, res) => {
    try{
        const {id} = req.params;

        const result = await pool.query("select * from users where id = $1", [id])

        if(result.rows.length === 0 ) {
            return res.status(404).json({
                success: false,
                message: `user not found with the id ${id}`
            });
        };

        res.status(200).json({
            success: true,
            message: "successfully fetched data with id",
            data: result.rows[0],
        });
    } catch (e) {
        console.error("solo user fetching error :", e);
        res.status(500).json({
            success: false,
            message: "server error",
        })
    }
});


// edit user data
router.patch("/:id", async(req, res) => {
    try {
        const {id} = req.params;
        const {name, email, role , bio, phone} = req.body;

        const fields = [];
        const values = [];
        let index = 1;

        if(name !== undefined) {
            fields.push(`name = $${index++}`)
            values.push(name)
        };

        if(email !== undefined) {
            fields.push(`email = $${index++}`)
            values.push(email.toLowerCase())
        };

        const isAdmin = await pool.query("select * from users where id = $1", [id])
        const user = isAdmin.rows[0]
        if(user.role === "admin") {
            if(role !== undefined) {
                fields.push(`role = $${index++}`)
                values.push(role)
            };
        }

        if(bio !== undefined) {
            fields.push(`bio = $${index++}`)
            values.push(bio)
        };

        if(phone !== undefined) {
            fields.push(`phone = $${index++}`)
            values.push(phone)
        };

        if(fields.length === 0) {
            return res.status(400).json({
                success: false,
                message: "not data provided for update",
            });
        };

        values.push(id);

        const query = `
        update users
        set ${fields.join(", ")}, updated_at = current_timestamp
        where id = $${index}
        returning *
        `;

        const result = await pool.query(query, values);

        if(result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "user not found",
            });
        }


        res.status(200).json({
            success: true,
            message: "user data updated successfully",
            data: result.rows[0],
        })


    } catch (e) {
        console.error("updating user data failed :", e);
        res.status(500).json({
            success: false,
            message: "server error",
        })
    }
});


// delete user from postgresdb
router.delete("/:id", async(req, res) => {
    try {
        const {id} = req.params;

        const checkUserExists = await pool.query("select * from users where id = $1", [id])
        if(checkUserExists.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `user not found with the id ${id}`
            });
        };

        const result = await pool.query("delete from users where id = $1 returning *", [id])

        if(result.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "user could not be deleted",
            });
        };

        res.status(200).json({
            success: true,
            message: "user deleted successfully",
            data: result.rows[0],
        })
    } catch (e) {
        console.error("user deleting error", e);
        res.status(500).json({
            success: false,
            message: "server error",
        })
    }
})





export default router;