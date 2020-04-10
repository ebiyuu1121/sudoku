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

function socketStart(server) {
	const io = require('socket.io').listen(server);

	io.on('connection', socket => {
		// 接続されたクライアントのidをコンソールに表示する
		console.log('id: ' + socket.id + ' is connected');

		// クライアントから送信があった場合のイベントを作成する
		socket.on('user-join', user => {
			users[socket.id] = user;
			console.log(user.name + ' has joined');
			io.emit('user-update', users);
			io.emit('cell-changed', cells);
		})

		socket.on('cell-changed', newCells => {
			cells = newCells;
			socket.broadcast.emit('cell-changed', cells);
		})

		socket.on('user-leave', dic => {
			delete users[socket.id];
			socket.broadcast.emit('user-update', users);
		})
	})
}

start()
