const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const { config } = require("./config");

const app = express();

// cors config
/* 

Esta configuración permite solo CORS de dominios específicos

const corsOptions = {
    origin: "http://example.com"
}

app.use(cors(corsOptions));

*/

// Permite todos los dominios
app.use(cors());

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

app.get("/api/auth/verify", function(req, res, next) {
    
    const { access_token } = req.query;

    try {

        const decoded = jwt.verify(access_token, config.authJwtSecret);

        res.json({
            message: "The access token is valid",
            username: decoded.sub
        });
        
    } catch (err) {

        next(err);
        
    }

});

const server = app.listen(5000, function() {
    console.log(`Listening in http://localhost:${server.address().port}`);
});

/*

Creación de un token:

curl \
-X POST \
-H "Content-Type: application/json" \
-d '{ 
    "username": "retaxmaster", 
    "email": "asd@asd.com", 
    "name": "carlos" 
}' \
http://localhost:5000/api/auth/token

Verificación de un token

curl http://localhost:5000/api/auth/verify?access_token=<token>

*/