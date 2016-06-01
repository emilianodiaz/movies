/**
 * Esta app muestra los ultimos estrenos y nos permite buscar peliculas.
 */

console.log("clase 3, movies application.");

const express = require('express');
const app = express();
const exphbs  = require('express-handlebars');
const mongojs  = require("mongojs");
const compression = require('compression');
const db  = mongojs("class3", ['movies']);

app.use(express.static('public'));
app.engine('.hbs', exphbs({extname: '.hbs', defaultLayout: 'main'}));
app.set('view engine', '.hbs');
app.use(compression());

const Movies = require("./lib/movies");
var movies = new Movies(db);



app.get("/", (req, res)=>{

    if(typeof req.query.key=="undefined") return res.render("home", {});

    movies.search(req.query.key)
        .then((data)=>{
            res.render("home", {movies: data.Search});
        })
        .catch((e)=>{
            console.log(e);
            res.render("error");
        });

});




app.get('/about', (req, res, next)=>{
    res.send("Nuevo website sobre movies");
});


app.listen(3000,  ()=> {
    console.log('Example app listening on port 3000!');
});
