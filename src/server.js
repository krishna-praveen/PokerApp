// src/server.js
const Server = require("boardgame.io/server").Server;
const poker = require("./game").pokerGame.game;
const server = Server({ games: [poker] });
server.run(8000);

// Do this as well to run server side by side along with npm start
// in seperate terminal
// $ npm i esm
// $ node -r esm src/server.js