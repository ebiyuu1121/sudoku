const express = require('express');
const consola = require('consola');
const {Nuxt, Builder} = require('nuxt');
const app = express();

// Import and Set Nuxt.js options
const config = require('../nuxt.config.js');
config.dev = process.env.NODE_ENV !== 'production';

async function start() {
	// Init Nuxt.js
	const nuxt = new Nuxt(config);

	const {host, port} = nuxt.options.server;

	await nuxt.ready()
	// Build only in dev mode
	if (config.dev) {
		const builder = new Builder(nuxt);
		await builder.build();
	}

	// Give nuxt middleware to express
	app.use(nuxt.render);

	// Listen the server
	let server = app.listen(port, host);
	consola.ready({
		message : `Server listening on http://${host}:${port}`,
		badge : true
	})

	socketStart(server);
	console.log('SocketIO.server starts');
}

let users = {};
let cells = JSON.parse(
    JSON.stringify(
        new Array(9).fill(
            new Array(9).fill({
	            value : "",
	            isProblem : false,
	            inputBy : "",
	            color : ""
            }))));
let rooms = {};

function socketStart(server) {
	const io = require('socket.io').listen(server, {path : "/sudoku/socket.io"});

	io.on('connection', socket => {
		// クライアントから送信があった場合のイベントを作成する
		socket.on('user-join', user => {
			socket.room = user.room;
			console.log(user.name + ' has joined to ' + socket.room);
			socket.join(socket.room);

			if (!rooms[socket.room]) {
				rooms[socket.room] = {
					cells : JSON.parse(
					    JSON.stringify(
					        new Array(9).fill(
					            new Array(9).fill({
						            value : "",
						            isProblem : false,
						            inputBy : "",
						            color : ""
					            })))),
					users : {
						[socket.id] : user
					}
				}
			} else {
				rooms[socket.room].users[socket.id] = user;
			}

			io.to(socket.room).emit('user-update', rooms[socket.room].users);
			io.to(socket.room).emit('cell-changed', rooms[socket.room].cells);
		});

		socket.on('cell-changed', newCells => {
			rooms[socket.room].cells = newCells;
			socket.to(socket.room).broadcast.emit('cell-changed', newCells);
		});

		socket.on('user-leave', dic => {
			console.log(rooms[socket.room].users[socket.id].name + ' has left');
			delete rooms[socket.room].users[socket.id];
			socket.to(socket.room).broadcast.emit('user-update', rooms[socket.room].users);
		});
	});
}

start();
