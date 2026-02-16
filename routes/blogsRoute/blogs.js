import { Router } from "express";
import pool from "../../database/db.js";

const router = Router();

// get all blogs with query parameter support
router.get("/", async(req, res) => {
    try {
        const { authorEmail } = req.query;
        let query = "SELECT * FROM blogs";
        let params = [];

        // যদি authorEmail query parameter থাকে
        if (authorEmail) {
            query += " WHERE blogbyemail = $1";
            params.push(authorEmail.toLowerCase());
        }

        query += " ORDER BY created_at DESC";
        
        const result = await pool.query(query, params);
        
        res.status(200).json({
            success: true,
            message: "blogs fetched successfully",
            data: result.rows,
        });
    } catch (e) {
        console.error("blog fetching failed :", e);
        res.status(500).json({
            success: false,
            message: "server error",
        });
    }
});

// get blog by email (প্যারামিটার ভিত্তিক)
router.get("/email/:email", async(req, res) => {
    try {
        const {email} = req.params;
        if(!email) {
            return res.status(400).json({
                success: false,
                message: "email required"
            });
        }

        const result = await pool.query(
            "SELECT * FROM blogs WHERE blogbyemail = $1 ORDER BY created_at DESC", 
            [email.toLowerCase()]
        );

        res.status(200).json({
            success: true,
            message: "fetching successfully with email",
            data: result.rows,
        });
    } catch (err) {
        console.error("failed to fetch email blogs", err);
        res.status(500).json({
            success: false,
            message: "server error",
        });
    }
});

// get blog by ID
router.get("/:id", async(req, res) => {
    try {
        const {id} = req.params;
        
        const result = await pool.query(
            "SELECT * FROM blogs WHERE id = $1", 
            [id]
        );

        if(result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `no blog found with the id ${id}`,
            });
        }

        res.status(200).json({
            success: true,
            message: "successfully fetching blog by ID",
            data: result.rows[0],
        });
    } catch (err) {
        console.error("fetch by id failed", err);
        res.status(500).json({
            success: false,
            message: "server error",
        });
    }
});

// add new blog
router.post("/", async(req, res) => {
    try {
        const {title, description, tags, authorId, authorEmail, authorName} = req.body;
        
        if(!title || !description) {
            return res.status(400).json({
                success: false,
                message: "title and description required",
            });
        }

        // tags array কে string এ convert করুন
        const tagsString = Array.isArray(tags) ? tags.join(',') : tags;

        const result = await pool.query(
            `INSERT INTO blogs (blogTitle, blogDescription, blogTags, blogbyemail) 
             VALUES($1, $2, $3, $4) 
             RETURNING id, blogTitle as title, blogDescription as description, blogTags as tags, blogbyemail as "authorEmail", created_at, updated_at`,
            [title, description, tagsString || '', authorEmail?.toLowerCase() || '']
        );

        res.status(201).json({
            success: true,
            message: "blog added successfully",
            data: result.rows[0],
        });
    } catch (err) {
        console.error("blogs added failed: ", err);
        res.status(500).json({
            success: false,
            message: "server error",
        });
    }
});

// update blog by ID
router.patch("/:id", async(req, res) => {
    try {
        const {id} = req.params;
        const {title, description, tags} = req.body;
        
        const fields = [];
        const values = [];
        let index = 1;

        if(title) {
            fields.push(`blogTitle = $${index++}`);
            values.push(title);
        }

        if(description) {
            fields.push(`blogDescription = $${index++}`);
            values.push(description);
        }

        if(tags) {
            const tagsString = Array.isArray(tags) ? tags.join(',') : tags;
            fields.push(`blogTags = $${index++}`);
            values.push(tagsString);
        }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);

        values.push(id);

        const query = `
            UPDATE blogs
            SET ${fields.join(", ")}
            WHERE id = $${index}
            RETURNING id, blogTitle as title, blogDescription as description, blogTags as tags, blogbyemail as "authorEmail", created_at, updated_at
        `;

        const result = await pool.query(query, values);

        if(result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `no blog found with id ${id}`
            });
        }

        res.status(200).json({
            success: true,
            message:"blogs update successfully",
            data: result.rows[0],
        });
    } catch (err) {
        console.error("blogs update error", err);
        res.status(500).json({
            success: false,
            message: "server error",
        });
    }
});

// delete blogs from db
router.delete("/:id", async(req, res) => {
    try {
        const {id} = req.params;

        const checkBlog = await pool.query("SELECT * FROM blogs WHERE id = $1", [id]);
        if(checkBlog.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `blogs not exists with id ${id}`
            });
        } 

        const result = await pool.query(
            "DELETE FROM blogs WHERE id = $1 RETURNING *", 
            [id]
        );

        res.status(200).json({
            success: true,
            message: "blogs deleted successfully",
            data: result.rows[0],
        }); 
    } catch (err) {
        console.error("blogs deletion error", err);
        res.status(500).json({
            success: false,
            message: "server error",
        });
    }
});

export default router;