var supertest = require('supertest'),
	mongo = require('mongodb').MongoClient;

/* eslint-disable no-process-env*/
before(function (done) {
	process.env.MONGO_URI = `mongodb://127.0.0.1:27017/${_.kebabCase(process.env.npm_package_name ||
		require(path.resolve('package')).name)}-test`; // eslint-disable-line global-require

	mongo.connect(process.env.MONGO_URI, { w: 1 }, function (err, database) {
		if (err) { return done(err); }

		global.db = database;

		// eslint-disable-next-line global-require
		global.test = supertest(require(path.resolve('app'))); // to be used in route based tests
		process.on('SIGINT', utils.handle); // utils is exposed as a global in app.js
		process.env.NODE_ENV = 'test';

		return done();
	});
});

after(function (done) {
	db.close(function (err) {
		delete process.env.NODE_ENV;
		delete global.db;
		done(err);
	});
});
