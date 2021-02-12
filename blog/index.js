/*

En este flujo de autenticación usamos el flujo Authorization Code para ejemplificar dicho flujo usando Spotify, básicamente la aplicación solicita permiso al usuario, este lo concede y la aplicación regresa un código de autenticación, con ese código debemos ir y pedirle a Spotify un token usando el grant type "authorization_code" (porque este es el flujo de Authorization Code, dah) y una vez que nos lo da, guardamos ese token en una cookie que solo se puede leer desde el servidor (por eso este tipo de autenticación solo se debe implementar si tu aplicación se renderiza desde un servidor y no se debe usar en SPA)

*/

const express = require("express");
const path = require("path");
const request = require("request");
const querystring = require("querystring");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const generateRandomString = require("./utils/generateRandomString");
const encodeBasic = require("./utils/encodeBasic");
const scopesArray = require("./utils/scopesArray");

const playlistMocks = require("./utils/mocks/playlist");

const { config } = require("./config");

const app = express();

// static files
app.use("/static", express.static(path.join(__dirname, "public")));

// middlewares
app.use(cors());
app.use(cookieParser());

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

function getUserInfo(accessToken) {

  if (!accessToken)
    return Promise.resolve(null);

  const options = {
    url: "https://api.spotify.com/v1/me",
    headers: { Authorization: `Bearer ${accessToken}` },
    json: true
  };

  return new Promise((resolve, reject) => {

    request.get(options, function(error, response, body) {

      if (error || response.statusCode !== 200)
        reject(error);

      resolve(body);

    });

  });

}

function getUserPlaylists(accessToken, userId) {

  if (!accessToken || !userId)
    return Promise.resolve(null);

  const options = {
    url: `https://api.spotify.com/v1/users/${userId}/playlists`,
    headers: { Authorization: `Bearer ${accessToken}` },
    json: true
  };

  return new Promise((resolve, reject) => {

    request.get(options, function(error, response, body) {

      if (error || response.statusCode !== 200)
        reject(error);

      resolve(body);

    });

  });

}


// routes
app.get("/", async function(req, res, next) {
  res.render("posts", { posts: [{
    title: "Guillermo's playlist",
    description: "Creatine supplementation is the reference compound for increasing muscular creatine levels; there is variability in this increase, however, with some nonresponders.",
    author: "Guillermo Rodas"
  }] });
});

app.get("/playlists", async function(req, res, next) {

  const { access_token: accessToken } = req.cookies;

  if (!accessToken)
    return res.redirect("/");

  try {

    const userInfo = await getUserInfo(accessToken);
    const userPlaylists = await getUserPlaylists(accessToken, userInfo.id);

    res.render("playlists", { userInfo, playlists: userPlaylists });

  } catch (error) {

    next(error);

  }

});

app.get("/login", function(req, res) {
  
  // El estado es para evitar un ataquie de cross scripting, así cuando spotify nos responda verificamos que el estado ese ahí
  const state = generateRandomString(16);

  const queryString = querystring.stringify({
    response_type: "code",
    client_id: config.spotifyClientId,
    scope: scopesArray.join(" "),
    redirect_uri: config.spotifyRedirectUri,
    state: state
  });

  // Metemos el estado en una cookie que solo debe ser visible por el servidor (httpOnly: true)
  res.cookie("auth_state", state, {
    httpOnly: true
  });
  
  res.redirect(`https://accounts.spotify.com/authorize?${queryString}`);

});


app.get("/logout", function(req, res) {
  res.clearCookie("access_token");
  res.redirect("/");
});

app.get("/callback", function(req, res, next) {

  const { code, state } = req.query;
  const { auth_state } = req.cookies;

  // Si el estado cambió es porque hubo alguna especie de ataque de cross scripting
  if (state === null || state !== auth_state) 
    next(new Error("The state doesn't match"));

  res.clearCookie("auth_state");

  // Aquí mandamos el request para solicitar el token
  const authOptions = {

    url: "https://accounts.spotify.com/api/token",

    form: {
      code: code,
      redirect_uri: config.spotifyRedirectUri,
      grant_type: "authorization_code"
    },

    headers: {
      Authorization: `Basic ${encodeBasic(
        config.spotifyClientId,
        config.spotifyClientSecret
      )}`
    },

    json: true
    
  }

  request.post(authOptions, function(error, response, body) {
    
    if (error || response.statusCode != 200)
      next(new Error("The token is invalid"));

    // Si todo salió chido, entonces guardamos el token en una cookie que solo se puede leer del lado del servidor
    res.cookie("access_token", body.access_token, {
      httpOnly: true
    });

    res.redirect("/playlists");

  });
  
});

// server
const server = app.listen(3000, function() {
  console.log(`Listening http://localhost:${server.address().port}`);
});