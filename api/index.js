const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const { config } = require("./config");

const app = express();

// body parser
app.use(bodyParser.json());

app.post("/api/auth/token", function(req, res) {
    
    const { email, username, name } = req.body;

    const token = jwt.sign({
        sub: username,
        email,
        name, 
    }, config.authJwtSecret);

    res.json({
        access_token: token
    });

});


const server = app.listen(5000, function() {
    console.log(`Listening in http://localhost:${server.address().port}`);
});

// Puede ser ejecutado desde la terminal con: 
// curl -X POST -d "{ 'username': 'retaxmaster', 'email': 'asd@asd.com', 'name': 'carlos'  }" http://localhost:5000/api/auth/token