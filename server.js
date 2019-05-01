var express = require("express");
var exphbs = require("express-handlebars");
var logger = require("morgan");
var mongoose = require("mongoose");

var cheerio = require("cheerio");
var axios = require("axios");

var app = express();

var db = require("./models");

var PORT = process.env.PORT || 3000;

app.use(logger("dev"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongo-scraper";

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useCreateIndex: true
});

app.engine("handlebars", exphbs({ defaultLayout: "main" }));

app.set("view engine", "handlebars");

app.get("/", function (req, res) {
    db.Article.find({}).then(function (result) {
        res.render("index", result);
    })
        .catch(function (err) {
            res.json(err);
        })
});

app.get("/all", function (req, res) {
    db.scrapedData.find({}, function (error, found) {
        if (error) {
            console.log(error);
        }
        else {
            res.json(found);
        }
    });
});

app.get("/scrape", function (req, res) {
    axios.get("https://www.anandtech.com").then(function (response) {
        var $ = cheerio.load(response.data);

        $("div.cont_box1_txt").each(function (i, element) {
            var result = {};
            result.title = $(this).children("h2").text();
            result.link = "https://www.anandtech.com" + $(element).children("h2").children("a").attr("href");
            result.summary = $(this).children("p").text();
            result.author = $(this).children("span").children("a").text();

            db.Article.create(result)
                .then(function (dbArticle) {
                    console.log(dbArticle);
                })
                .catch(function (err) {
                    console.log(err);
                });
        });
        console.log(results);
        res.send("Scrape Complete");
    });
});

app.get("/articles", function (req, res) {
    db.Article.find({})
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

app.get("/articles:id", function (req, res) {
    db.Article.findOne({ _id: req.params.id })
        .populate("note")
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(errr);
        });
});

app.post("/articles/:id", function (req, res) {
    db.Note.create(req.body)
        .then(function (dbNote) {
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
        })
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

app.listen(PORT, function () {
    console.log("App is running on port" + PORT + "!")
});

