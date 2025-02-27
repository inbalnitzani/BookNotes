import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "book_notes",
    password: "Gbck",
    port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let books = [];


async function getBooks(order) {
    // Build the query
    let query;
    if (order == "id") {
        query = `SELECT * FROM books ORDER BY id ASC;`;
    } else {
        query = `SELECT * FROM books ORDER BY stars DESC NULLS LAST;`;
    }

    try {
        const result = await db.query(query);
        books = result.rows;
        console.log(query);
    } catch (error) {
        console.error('Error fetching books:', error);
    }

}

app.get("/", async (req, res) => {
    const order = req.query.order || "id";
    try {
        await getBooks(order);
        console.log(books);
        res.render("index.ejs", {
            booksList: books,
        });
    } catch (err) {
        console.log(err);
    }

});

app.post("/new", (req, res) => {
    res.render("new.ejs");
});
app.post("/addBook", async (req, res) => {
    const title = req.body.title;
    const cover = req.body.cover;
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    const notes = req.body.notes;
    const stars = parseInt(req.body.stars) || 0;
    if (endDate < startDate) {
        console.log("End date is after the start date.");
    } else {
        try {
            await db.query(
                "INSERT INTO books (title, img_url, start_date, end_date, description, stars) VALUES ($1, $2, $3, $4, $5, $6);",
                [title, cover, startDate, endDate, notes, stars]
            );

            res.redirect("/");
        } catch (error) {
            console.error("Error inserting book:", error);
            res.status(500).send("Server Error");
        }
    }
});

app.post("/update", async (req, res) => {
    const id = req.body.id;

    try {
        const title = req.body.title;
        const cover = req.body.cover;
        const startDate = req.body.startDate;
        const endDate = req.body.endDate;
        const notes = req.body.notes;
        const stars = parseInt(req.body.stars) || 0;
        console.log("Stars received:", req.body.stars);

        if (stars > 0) {
            await db.query(
                "UPDATE books SET title = $1, img_url = $2, start_date = $3, end_date = $4, description = $5, stars = $6 WHERE id = $7;",
                [title, cover, startDate, endDate, notes, stars, id]
            );
        } else {
            await db.query(
                "UPDATE books SET title = $1, img_url = $2, start_date = $3, end_date = $4, description = $5 WHERE id = $6;",
                [title, cover, startDate, endDate, notes, id]
            );
        }
        res.redirect("/");
    } catch (error) {
        console.error("Error inserting book:", error);
        res.status(500).send("Server Error");
    }
});

app.post("/edit", async (req, res) => {
    const id = req.body.editBookById;

    res.render("index.ejs", { booksList: books, edit: id });

})

app.post("/delete", async (req, res) => {
    const id = req.body.deleteBookById;

    try {
        await db.query(
            "DELETE FROM books WHERE id = $1", [id]
        );
        res.redirect("/");
    } catch (err) {
        console.log(err);
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
