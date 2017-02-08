/**
 * @file Handles the creation of a HTTP server on process.env.PORT, and consumes the provided app instance.
 * Can also be used with require,
 */
var path = require('path'),
	http = require('http'),

	_ = require('lodash'),
	debug = require('debug'),
	mongodb = require('mongodb').MongoClient,
	utils = require(path.join(__dirname, '..', 'utils', 'misc')),

	port,
	app,
	server,
	name = require(path.join(__dirname, '..', 'package')).name,
	bugger = debug(`${name}:server`),

	/**
	 * Handles errors passed on from the HTTP server listen routine.
	 *
	 * @param {Error} error - An error instance with details on failed app starts.
	 */
	onError = function (error) {
		if (error.syscall !== 'listen') { throw error; }

		var bind = _.isString(port) ? `Pipe ${port}` : `Port ${port}`;

		// handle specific listen errors with friendly messages
		switch (error.code) {
		case 'EACCES':
			throw new Error(`${bind} requires elevated privileges`);
		case 'EADDRINUSE':
			throw new Error(`${bind} is already in use`);
		default:
			throw error;
		}
	},

	/**
	 * Pipes useful information to the console after the app has started.
	 */
	onListening = function () {
		var address = server.address(),
			bind = _.isString(address) ? `pipe ${address}` : `port ${address.port}`;

		bugger(`Listening on ${bind}`);
	},

	/**
	 * Handles SIGINT gracefully.
	 */
	onSigint = function () {
		db.close();
		process.exit(0); // eslint-disable-line
	};

process.env.NODE_ENV ? utils.checkVars() : require('dotenv').load();

process.on('SIGINT', onSigint);
port = _.toInteger(process.env.PORT);

/**
 * Establishes a reusable database connection to the database at MONGO_URI, and starts an HTTP server.
 *
 * @param {Function} done - The callback invoked at the end of the app start routine.
 */
module.exports = function (done) {
	mongodb.connect(process.env.MONGO_URI, function (err, database) {
		if (err) { throw err; }

		global.db = database;

		app = require(path.join(__dirname, '..', 'app')); // eslint-disable-line global-require
		app.set('port', port);

		server = http.createServer(app);
		server.on('error', onError);
		server.on('listening', onListening);

		server.listen(port);
		done();
	});
};

!module.parent && module.exports(_.noop);