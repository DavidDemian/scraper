var express = require("express");
var mongoose= require("mongoose");
var exphbs = require("express-handlebars");
var cheerio = require ("cheerio");
var axios = require ("axios");


var PORT = process.env.PORT || 3000;
var app = express();

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));




var router = express.Router();

app.use(express.static(__dirname+"/public"));

app.use(router);

var db = require("./models");

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/db_soccer",function(error){
    if (error){
        console.log(error);
    }
    else{
        console.log("mongoose connection is successful");
    }
});


app.get("/scrape", function(req,res){

    var result = {}
    axios.get("https://m.allfootballapp.com/news").then(function (response){

        var $ = cheerio.load(response.data);


        $("div.list").each(function(i,element){
        
            var link = "https://m.allfootballapp.com" + $(element).find("a").attr("href")
            var title = $(element).find("p.listTitle").text()
            var img = $(element).find("img").attr("src")
        
            result.title = title
            result.link = link
            result.img = img

    
          db.Article.create(result)
        .then(function(dbArticle) {

        //   res.redirect("/")
        console.log("working")

        })
        
        
        })



    })

})


// Route for getting all Articles from the db
app.get("/", function(req, res) {
  // Grab every document in the Articles collection
  db.Article.find({}).populate("comment")
    .then(function(dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.render("index", {article: dbArticle});
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});
// Route for getting all Articles from the db
app.get("/commentForm/:id", function(req, res) {


    db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("comment")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.render("comments", dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
  
  })

  // Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
    // Create a new note and pass the req.body to the entry
    db.Comment.create(req.body)
      .then(function(dbComment) {
        // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
        // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
        // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
        return db.Article.findOneAndUpdate({ _id: req.params.id }, {$push: {comment : dbComment._id}} , { new: true });
      })
      .then(function(dbArticle) {
        // If we were able to successfully update an Article, send it back to the client
        res.render("index")
      })
     
  });

  app.get("/commentsDel/:id", function(req,res){
    db.Comment.remove({_id: req.params.id})
    .then(function(){
        res.redirect("/")
    }
    )
})


app.listen(PORT,function(){
    console.log("app listening on Port" + PORT);
    });