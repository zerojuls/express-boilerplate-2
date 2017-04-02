describe('User', function () {
	afterEach(purge);

	var users = [
			{ email: 'someone@example.com', authStrategy: 'local' },
			{ email: 'somebody@example.com', authStrategy: 'admin' }
		],
		seedCb = function (done) {
			User.insert(users, done);
		},
		seedPromise = function (done) {
			User
				.insert(users)
				.then(function () { done(); }, done)
				.catch(done);
		},
		validateEmptyUpdate = function (err, meta) {
			!meta && (meta = err) && (err = null);

			assert.strictEqual(err, null, 'Error might be malformed');
			assert.strictEqual(meta.upsertedId, null);
			assert.strictEqual(meta.matchedCount, 0, 'User.update does not handle invalid matches');
			assert.strictEqual(meta.modifiedCount, 0, 'User.update does not handle invalid updates');
			assert.strictEqual(meta.upsertedCount, 0, 'User.update does not handle invalid upserts');
			assert.deepStrictEqual(meta.result, { n: 0, nModified: 0, ok: 1 }, 'User.update error');
		},
		validateEmptyDelete = function (err, meta) {
			!meta && (meta = err) && (err = null);

			assert.strictEqual(err, null, 'User.deleteOne should not return an error for no data');
			assert.deepStrictEqual(meta.result, { n: 0, ok: 1 }, 'User.deleteOne should not remove');
			assert.strictEqual(meta.deletedCount, 0, 'User.deleteOne should not remove records');
		};

	describe('.insert', function () {
		describe('error handling', function () {
			describe('callbacks', function () {
				it('should result in an error for missing data', function (done) {
					User.insert(function (err) {
						assert.equal(err.message, utils.err.badInsertData, 'User.insert does not handle missing data');
						done();
					});
				});

				it('should result in an error for empty data', function (done) {
					User.insert(null, function (err) {
						assert.equal(err.message, utils.err.badInsertData, 'User.insert does not handle empty data');
						done();
					});
				});

				it('should result in an error for malformed data', function (done) {
					User.insert('someone@example.com', function (err) {
						assert.equal(err.message, utils.err.badInsertData, 'User.insert doesn\'t handle bad data');
						done();
					});
				});
			});

			describe('promises', function () {
				it('should result in an error for missing data', function (done) {
					User
						.insert()
						.then(done, function (err) {
							assert.equal(err.message, utils.err.badInsertData, 'User.insert mishandles missing data');
							done();
						})
						.catch(done);
				});

				it('should result in an error for empty data', function (done) {
					User
						.insert(null)
						.then(done, function (err) {
							assert.equal(err.message, utils.err.badInsertData, 'User.insert doesn\'t handle bad data');
							done();
						})
						.catch(done);
				});

				it('should result in an error for malformed data', function (done) {
					User
						.insert('someone@example.com')
						.then(done, function (err) {
							assert.equal(err.message, utils.err.badInsertData, 'User.insert mishandled malformed data');
							done();
						})
						.catch(done);
				});
			});
		});

		describe('duplicate data', function () {
			describe('callbacks', function () {
				beforeEach(function (done) {
					User.insert({ email: 'someone@user.com', authStrategy: 'admin' }, done);
				});

				it('should result in an error', function (done) {
					User.insert({ email: 'someone@user.com', authStrategy: 'local' }, function (err, user) {
						assert(err.message, 'User.insert does not handle duplicate data correctly');
						assert(!user, 'User.insert leaks data on duplicate insertion');
						done();
					});
				});
			});

			describe('promises', function () {
				beforeEach(function (done) {
					User
						.insert({ email: 'someone@user.com', authStrategy: 'admin' })
						.then(function (user) {
							assert(_.isObject(user) && !_.isEmpty(user), 'User.insert may not be working correctly');
							done();
						}, done)
						.catch(done);
				});

				it('should result in an error', function (done) {
					User
						.insert({ email: 'someone@user.com', authStrategy: 'local' })
						.then(done, function (err) {
							assert(err.message, 'User.insert does not handle duplicate data correctly');
							done();
						})
						.catch(done);
				});
			});
		});

		describe('normal functioning', function () {
			describe('callbacks', function () {
				it('should insert a user correctly', function (done) {
					User.insert({ email: 'someone@example.com' }, function (err, user) {
						if (err) { return done(err); }

						assert(_.isObject(user) && !_.isEmpty(user), 'User record was not created correctly');
						done();
					});
				});

				it('should insert multiple users correctly', function (done) {
					User.insert([{ email: 'someone@example.com' }, { email: 'someone.else@example.com' }],
						function (err, meta) {
							if (err) { return done(err); }

							assert.deepStrictEqual(meta.result, { ok: 1, n: 2 }, 'Bulk records weren\'t inserted');
							assert.deepStrictEqual(meta.insertedIds, ['someone@example.com',
								'someone.else@example.com'], 'Users not created properly');

							done();
						});
				});
			});

			describe('promises', function () {
				it('should insert a user correctly', function (done) {
					User
						.insert({ email: 'someone@example.com' })
						.then(function (user) {
							assert(_.isObject(user) && !_.isEmpty(user), 'User record was not created correctly');
							done();
						}, done)
						.catch(done);
				});

				it('should insert multiple users correctly', function (done) {
					User
						.insert([{ email: 'someone@example.com' }, { email: 'someone.else@example.com' }])
						.then(function (meta) {
							assert.deepStrictEqual(meta.result, { ok: 1, n: 2 }, 'Bulk records weren\'t inserted');
							assert.deepStrictEqual(meta.insertedIds, ['someone@example.com',
								'someone.else@example.com'], 'Users not created properly');

							done();
						})
						.catch(done);
				});
			});
		});
	});

	describe('.findOne', function () {
		describe('no data', function () {
			describe('callbacks', function () {
				it('should handle missing queries correctly', function (done) {
					User.findOne(function (err, result) {
						assert.strictEqual(err, null, 'User.findOne should not return an error for no data');
						assert.strictEqual(result, null, 'User.findOne should not return a result for no data');

						done();
					});
				});

				it('should handle singular query entities correctly', function (done) {
					User.findOne('someone@example.com', function (err, result) {
						assert.strictEqual(err, null, 'User.findOne should not return an error for no data');
						assert.strictEqual(result, null, 'User.findOne should not return a result for no data');

						done();
					});
				});

				it('should handle non-existent queries correctly', function (done) {
					User.findOne({}, function (err, result) {
						assert.strictEqual(err, null, 'User.findOne should not return an error for no data');
						assert.strictEqual(result, null, 'User.findOne should not return a result for no data');

						done();
					});
				});

				it('should handle slicing correctly', function (done) {
					User.findOne({}, {}, function (err, result) {
						assert.strictEqual(err, null, 'User.findOne should not return an error for no data');
						assert.strictEqual(result, null, 'User.findOne should not return a result for no data');

						done();
					});
				});
			});

			describe('promises', function () {
				it('should handle missing queries correctly', function (done) {
					User
						.findOne()
						.then(function (result) {
							assert.strictEqual(result, null, 'User.findOne should not return a result for no data');
							done();
						}, done)
						.catch(done);
				});

				it('should handle singular queries correctly', function (done) {
					User
						.findOne('someone@example.com')
						.then(function (result) {
							assert.strictEqual(result, null, 'User.findOne should not return a result for no data');
							done();
						}, done)
						.catch(done);
				});

				it('should handle non-existent queries correctly', function (done) {
					User
						.findOne({})
						.then(function (result) {
							assert.strictEqual(result, null, 'User.findOne should not return a result for no data');
							done();
						}, done)
						.catch(done);
				});

				it('should handle slicing correctly', function (done) {
					User
						.findOne({}, {})
						.then(function (result) {
							assert.strictEqual(result, null, 'User.findOne should not return a result for no data');
							done();
						}, done)
						.catch(done);
				});
			});
		});

		describe('valid data', function () {
			var email = 'someone@example.com';

			describe('callbacks', function () {
				var data = { email: email };

				beforeEach(function (done) {
					User.insert(data, done);
				});

				it('should handle missing queries correctly', function (done) {
					User.findOne(function (err, result) {
						assert.strictEqual(err, null, 'User.findOne should not return an error for valid data');
						assert.deepStrictEqual(result._id, email, 'User.findOne doesn\'t return a valid result');

						done();
					});
				});

				it('should handle singular query entites correctly', function (done) {
					User.findOne(email, function (err, result) {
						assert.strictEqual(err, null, 'User.findOne should not return an error for no data');
						assert.strictEqual(result._id, email, 'User.findOne should not return a result for valid data');

						done();
					});
				});

				it('should handle non-existent queries correctly', function (done) {
					User.findOne({ _id: 'somebody@example.com' }, function (err, result) {
						assert.strictEqual(err, null, 'User.findOne should not return an error for no data');
						assert.strictEqual(result, null, 'User.findOne should not return a result for no matches');

						done();
					});
				});

				it('should handle slicing correctly', function (done) {
					User.findOne({ _id: email }, { _id: 1 }, function (err, result) {
						assert.strictEqual(err, null, 'User.findOne should not return an error for valid data');
						assert.deepStrictEqual(result, { _id: email },
							'User.findOne should only slice down to the specified fields');

						done();
					});
				});
			});

			describe('promises', function () {
				beforeEach(function (done) {
					User
						.insert({ email: email })
						.then(function () { done(); }, done)
						.catch(done);
				});

				it('should handle missing queries correctly', function (done) {
					User
						.findOne()
						.then(function (result) {
							assert.strictEqual(result._id, email, 'User.findOne doesn\'t return a result correctly');
							done();
						}, done)
						.catch(done);
				});

				it('should handle singular query entities correctly', function (done) {
					User
						.findOne(email)
						.then(function (result) {
							assert.strictEqual(result._id, email, 'User.findOne doesn\'t return a result correctly');
							done();
						}, done)
						.catch(done);
				});

				it('should handle non-existent queries correctly', function (done) {
					User
						.findOne({})
						.then(function (result) {
							assert.strictEqual(result._id, email, 'User.findOne doesn\'t return a result correctly');
							done();
						}, done)
						.catch(done);
				});

				it('should handle slicing correctly', function (done) {
					User
						.findOne(email, { _id: 1 })
						.then(function (result) {
							assert.deepStrictEqual(result, { _id: email },
								'User.findOne doesn\'t return a result correctly');
							done();
						}, done)
						.catch(done);
				});
			});
		});
	});

	describe('.find', function () {
		describe('no data', function () {
			describe('callbacks', function () {
				var validateEmpty = function (err, result) {
					assert.strictEqual(err, null, 'Error should be null for User.find');
					assert.deepStrictEqual(result, [], 'User.find does not return an empty set for no matches');
				};

				it('should handle default queries correctly', function (done) {
					User.find(function (err, result) { // eslint-disable-line lodash/prefer-lodash-method
						validateEmpty(err, result);
						done();
					});
				});

				it('should handle primary key based queries correctly', function (done) {
					// eslint-disable-next-line lodash/prefer-lodash-method
					User.find('someone@example.com', function (err, result) {
						validateEmpty(err, result);
						done();
					});
				});

				it('should handle object based queries correctly', function (done) {
					// eslint-disable-next-line lodash/prefer-lodash-method
					User.find({ _id: 'someone@example.com' }, function (err, result) {
						validateEmpty(err, result);
						done();
					});
				});

				it('should handle slicing correctly', function (done) {
					// eslint-disable-next-line lodash/prefer-lodash-method
					User.find({ _id: 'someone@example.com' }, { _id: 1 }, function (err, result) {
						validateEmpty(err, result);
						done();
					});
				});
			});

			describe('promises', function () {
				it('should handle default queries correctly', function (done) {
					User // eslint-disable-line lodash/prefer-lodash-method
						.find()
						.then(function (result) {
							assert.deepStrictEqual(result, [], 'User.find doesn\'t return an empty set for no matches');

							done();
						}, done)
						.catch(done);
				});

				it('should handle primary key based queries correctly', function (done) {
					User // eslint-disable-line lodash/prefer-lodash-method
						.find('someone@example.com')
						.then(function (result) {
							assert.deepStrictEqual(result, [], 'User.find doesn\'t return an empty set for no matches');

							done();
						}, done)
						.catch(done);
				});

				it('should handle object based queries correctly', function (done) {
					User // eslint-disable-line lodash/prefer-lodash-method
						.find({ _id: 'someone@example.com' })
						.then(function (result) {
							assert.deepStrictEqual(result, [], 'User.find doesn\'t return an empty set for no matches');

							done();
						}, done)
						.catch(done);
				});

				it('should handle slicing correctly', function (done) {
					User // eslint-disable-line lodash/prefer-lodash-method
						.find({ _id: 'someone@example.com' }, { _id: 1 })
						.then(function (result) {
							assert.deepStrictEqual(result, [], 'User.find doesn\'t return an empty set for no matches');

							done();
						}, done)
						.catch(done);
				});
			});
		});

		describe('valid data', function () {
			var validate = function (err, result) {
				!result && (result = err) && (err = null);

				assert.strictEqual(err, null, 'Error should be null for User.find');
				assert.deepStrictEqual(result.length, 1, 'User records may be mutated!');
				assert.strictEqual(result[0]._id, 'someone@example.com', 'User records may be polluted');
			};

			describe('callbacks', function () {
				beforeEach(function (done) {
					User.insert({ email: 'someone@example.com' }, done);
				});

				it('should handle default queries correctly', function (done) {
					User.find(function (err, result) { // eslint-disable-line lodash/prefer-lodash-method
						validate(err, result);
						done();
					});
				});

				it('should handle primary key based queries correctly', function (done) {
					// eslint-disable-next-line lodash/prefer-lodash-method
					User.find('someone@example.com', function (err, result) {
						validate(err, result);
						done();
					});
				});

				it('should handle object based queries correctly', function (done) {
					// eslint-disable-next-line lodash/prefer-lodash-method
					User.find({ _id: 'someone@example.com' }, function (err, result) {
						validate(err, result);
						done();
					});
				});

				it('should handle slicing correctly', function (done) {
					// eslint-disable-next-line lodash/prefer-lodash-method
					User.find({ _id: 'someone@example.com' }, { _id: 1 }, function (err, result) {
						validate(err, result);
						done();
					});
				});
			});

			describe('promises', function () {
				beforeEach(function (done) {
					User
						.insert({ email: 'someone@example.com' })
						.then(function () { done(); }, done)
						.catch(done);
				});

				it('should handle default queries correctly', function (done) {
					User // eslint-disable-line lodash/prefer-lodash-method
						.find()
						.then(function (result) {
							validate(result);

							done();
						}, done)
						.catch(done);
				});

				it('should handle primary key based queries correctly', function (done) {
					User // eslint-disable-line lodash/prefer-lodash-method
						.find('someone@example.com')
						.then(function (result) {
							validate(result);

							done();
						}, done)
						.catch(done);
				});

				it('should handle object based queries correctly', function (done) {
					User // eslint-disable-line lodash/prefer-lodash-method
						.find({ _id: 'someone@example.com' })
						.then(function (result) {
							validate(result);

							done();
						}, done)
						.catch(done);
				});

				it('should handle slicing correctly', function (done) {
					User // eslint-disable-line lodash/prefer-lodash-method
						.find({ _id: 'someone@example.com' }, { _id: 1 })
						.then(function (result) {
							assert.deepStrictEqual(result, [{ _id: 'someone@example.com' }],
								'User.find does not handle slicing correctly');

							done();
						}, done)
						.catch(done);
				});
			});
		});
	});

	describe('.updateOne', function () {
		describe('no data', function () {
			describe('callbacks', function () {
				it('should handle invalid updateOnes correctly', function (done) {
					User.updateOne('someone@example.com', function (err, result) {
						validateEmptyUpdate(err, result);
						done();
					});
				});

				it('should handle non-existent targets correctly', function (done) {
					User.updateOne('someone@example.com', { foo: 'bar' }, function (err, result) {
						validateEmptyUpdate(err, result);
						done();
					});
				});

				it('should handle generic queries correctly', function (done) {
					User.updateOne({ foo: 'bar' }, function (err, result) {
						validateEmptyUpdate(err, result);
						done();
					});
				});
			});

			describe('promises', function () {
				it('should handle invalid updateOnes correctly', function (done) {
					User
						.updateOne('someone@example.com')
						.then(function (meta) {
							validateEmptyUpdate(meta);
							done();
						}, done)
						.catch(done);
				});

				it('should handle non-existent targets correctly', function (done) {
					User
						.updateOne('someone@example.com', { foo: 'bar' })
						.then(function (meta) {
							validateEmptyUpdate(meta);
							done();
						}, done)
						.catch(done);
				});

				it('should handle generic queries correctly', function (done) {
					User
						.updateOne({ foo: 'bar' })
						.then(function (meta) {
							validateEmptyUpdate(meta);
							done();
						}, done)
						.catch(done);
				});
			});
		});

		describe('valid update targets', function () {
			var validate = function (err, meta) {
				!meta && (meta = err) && (err = null);

				assert.strictEqual(err, null, 'User.updateOne does not update arbitrary records correctly');
				assert.strictEqual(meta.matchedCount, 1, 'User.updateOne did not match records to update');
				assert.strictEqual(meta.upsertedCount, 0, 'User.updateOne upsertedCount mismatch');
				assert.strictEqual(meta.upsertedId, null, 'User.updateOne upsertedId mismatch');
				assert.strictEqual(meta.modifiedCount, 1, 'User.updateOne modifiedCount mismatch');
			};

			describe('callbacks', function () {
				beforeEach(seedCb);

				it('should correctly update an arbitrary document', function (done) {
					User.updateOne({ authStrategy: 'random' }, function (err, meta) {
						validate(err, meta);
						done();
					});
				});

				it('should correctly update a document found with a singular query', function (done) {
					User.updateOne('somebody@example.com', { authStrategy: 'local' }, function (err, meta) {
						validate(err, meta);
						done();
					});
				});

				it('should correctly update an specific document', function (done) {
					User.updateOne({ authStrategy: 'local' }, { authStrategy: 'admin' }, function (err, meta) {
						validate(err, meta);
						done();
					});
				});
			});

			describe('promises', function () {
				beforeEach(seedPromise);

				it('should correctly update an arbitrary document', function (done) {
					User
						.updateOne({ authStrategy: 'random' })
						.then(function (meta) {
							validate(meta);
							done();
						}, done)
						.catch(done);
				});

				it('should correctly update a document found with a singular query', function (done) {
					User
						.updateOne('somebody@example.com', { authStrategy: 'local' })
						.then(function (meta) {
							validate(meta);
							done();
						}, done)
						.catch(done);
				});

				it('should correctly update an specific document', function (done) {
					User
						.updateOne({ authStrategy: 'local' }, { authStrategy: 'admin' })
						.then(function (meta) {
							validate(meta);
							done();
						}, done)
						.catch(done);
				});
			});
		});
	});

	describe('.update', function () {
		describe('no data', function () {
			describe('callbacks', function () {
				it('should handle invalid updates correctly', function (done) {
					User.update('someone@example.com', function (err, meta) {
						validateEmptyUpdate(err, meta);
						done();
					});
				});

				it('should handle non-existent targets correctly', function (done) {
					User.update('someone@example.com', { foo: 'bar' }, function (err, meta) {
						validateEmptyUpdate(err, meta);
						done();
					});
				});

				it('should handle generic queries correctly', function (done) {
					User.update({ foo: 'bar' }, function (err, meta) {
						validateEmptyUpdate(err, meta);
						done();
					});
				});
			});

			describe('promises', function () {
				it('should handle invalid updates correctly', function (done) {
					User
						.update('someone@example.com')
						.then(function (meta) {
							validateEmptyUpdate(meta);
							done();
						}, done)
						.catch(done);
				});

				it('should handle non-existent targets correctly', function (done) {
					User
						.update('someone@example.com', { foo: 'bar' })
						.then(function (meta) {
							validateEmptyUpdate(meta);
							done();
						}, done)
						.catch(done);
				});

				it('should handle generic queries correctly', function (done) {
					User
						.update({ foo: 'bar' })
						.then(function (meta) {
							validateEmptyUpdate(meta);
							done();
						}, done)
						.catch(done);
				});
			});
		});

		describe('valid update targets', function () {
			var validate = function (err, meta, count) {
				_.isNumber(meta) && (count = meta) && (meta = err) && (err = null);
				!meta && (meta = err) && (err = null);
				count = count || 2;

				assert(!err, 'User.update does not update arbitrary records correctly');
				assert.strictEqual(meta.matchedCount, count, 'User.update did not match records to update');
				assert.strictEqual(meta.upsertedCount, 0, 'User.update upsertedCount mismatch');
				assert.strictEqual(meta.upsertedId, null, 'User.update upsertedId mismatch');
				assert.strictEqual(meta.modifiedCount, count, 'User.update modifiedCount mismatch');
			};

			describe('callbacks', function () {
				beforeEach(seedCb);

				it('should correctly update an arbitrary document', function (done) {
					User.update({ authStrategy: 'random' }, function (err, meta) {
						validate(err, meta);
						done();
					});
				});

				it('should correctly update a document found with a singular query', function (done) {
					User.update('somebody@example.com', { authStrategy: 'local' }, function (err, meta) {
						validate(err, meta, 1);
						done();
					});
				});

				it('should correctly update a specific document', function (done) {
					User.update({ authStrategy: 'local' }, { authStrategy: 'admin' }, function (err, meta) {
						validate(err, meta, 1);
						done();
					});
				});
			});

			describe('promises', function () {
				beforeEach(seedPromise);

				it('should correctly update an arbitrary document', function (done) {
					User
						.update({ authStrategy: 'random' })
						.then(function (meta) {
							validate(meta);
							done();
						}, done)
						.catch(done);
				});

				it('should correctly update a document found with a singular query', function (done) {
					User
						.update('somebody@example.com', { authStrategy: 'local' })
						.then(function (meta) {
							validate(meta, 1);
							done();
						}, done)
						.catch(done);
				});

				it('should correctly update a specific document', function (done) {
					User
						.update({ authStrategy: 'local' }, { authStrategy: 'admin' })
						.then(function (meta) {
							validate(meta, 1);
							done();
						}, done)
						.catch(done);
				});
			});
		});
	});

	describe('.deleteOne', function () {
		describe('no data', function () {
			describe('callbacks', function () {
				it('should handle missing delete queries', function (done) {
					User.deleteOne(function (err, meta) {
						validateEmptyDelete(err, meta);
						done();
					});
				});

				it('should handle singular delete queries', function (done) {
					User.deleteOne('someone@example.com', function (err, meta) {
						validateEmptyDelete(err, meta);
						done();
					});
				});

				it('should handle invalid delete queries', function (done) {
					User.deleteOne({}, function (err, meta) {
						validateEmptyDelete(err, meta);
						done();
					});
				});
			});

			describe('promises', function () {
				it('should handle missing delete queries', function (done) {
					User
						.deleteOne()
						.then(function (meta) {
							validateEmptyDelete(meta);
							done();
						}, done)
						.catch(done);
				});

				it('should handle singular delete queries', function (done) {
					User
						.deleteOne('someone@example.com')
						.then(function (meta) {
							validateEmptyDelete(meta);
							done();
						}, done)
						.catch(done);
				});

				it('should handle invalid delete queries', function (done) {
					User
						.deleteOne({})
						.then(function (meta) {
							validateEmptyDelete(meta);
							done();
						}, done)
						.catch(done);
				});
			});
		});

		describe('valid data', function () {
			var validate = function (err, meta) {
				!meta && (meta = err) && (err = null);

				assert.strictEqual(err, null, 'User.deleteOne should not return an error for no data');
				assert.deepStrictEqual(meta.result, { n: 1, ok: 1 }, 'User.deleteOne remove error');
				assert.strictEqual(meta.deletedCount, 1, 'User.deleteOne didn\'t remove correctly');
			};

			describe('callbacks', function () {
				beforeEach(function (done) {
					User.insert([{ email: 'someone@example.com' }, { email: 'somebody@example.com' }], done);
				});

				it('should handle missing delete queries', function (done) {
					User.deleteOne(function (err, meta) {
						validate(err, meta);
						done();
					});
				});

				it('should handle singular delete queries', function (done) {
					User.deleteOne('someone@example.com', function (err, meta) {
						validate(err, meta);
						done();
					});
				});

				it('should handle invalid delete queries', function (done) {
					User.deleteOne({}, function (err, meta) {
						validate(err, meta);
						done();
					});
				});
			});

			describe('promises', function () {
				beforeEach(function (done) {
					User
						.insert({ email: 'someone@example.com' })
						.then(function () { done(); }, done)
						.catch(done);
				});

				it('should handle missing delete queries', function (done) {
					User
						.deleteOne()
						.then(function (meta) {
							validate(meta);
							done();
						}, done)
						.catch(done);
				});

				it('should handle singular delete queries', function (done) {
					User
						.deleteOne('someone@example.com')
						.then(function (meta) {
							validate(meta);
							done();
						}, done)
						.catch(done);
				});

				it('should handle invalid delete queries', function (done) {
					User
						.deleteOne({})
						.then(function (meta) {
							validate(meta);
							done();
						}, done)
						.catch(done);
				});
			});
		});
	});

	describe('.delete', function () {
		describe('no data', function () {
			describe('callbacks', function () {
				it('should handle missing delete queries', function (done) {
					User.delete(function (err, meta) {
						validateEmptyDelete(err, meta);
						done();
					});
				});

				it('should handle singular delete queries', function (done) {
					User.delete('someone@example.com', function (err, meta) {
						validateEmptyDelete(err, meta);
						done();
					});
				});

				it('should handle invalid delete queries', function (done) {
					User.delete({}, function (err, meta) {
						validateEmptyDelete(err, meta);
						done();
					});
				});
			});

			describe('promises', function () {
				it('should handle missing delete queries', function (done) {
					User
						.delete()
						.then(function (meta) {
							validateEmptyDelete(meta);
							done();
						}, done)
						.catch(done);
				});

				it('should handle singular delete queries', function (done) {
					User
						.delete('someone@example.com')
						.then(function (meta) {
							validateEmptyDelete(meta);
							done();
						}, done)
						.catch(done);
				});

				it('should handle invalid delete queries', function (done) {
					User
						.delete({})
						.then(function (meta) {
							validateEmptyDelete(meta);
							done();
						}, done)
						.catch(done);
				});
			});
		});

		describe('valid data', function () {
			var validate = function (err, meta) {
				!meta && (meta = err) && (err = null);

				assert.strictEqual(err, null, 'User.delete should not return an error for no data');
				assert.deepStrictEqual(meta.result, { n: 2, ok: 1 }, 'User.delete remove error');
				assert.strictEqual(meta.deletedCount, 2, 'User.delete didn\'t remove correctly');
			};

			describe('callbacks', function () {
				beforeEach(function (done) {
					User.insert([{ email: 'someone@example.com' }, { email: 'somebody@example.com' }], done);
				});

				it('should handle missing delete queries', function (done) {
					User.delete(function (err, meta) {
						validate(err, meta);
						done();
					});
				});

				it('should handle invalid delete queries', function (done) {
					User.delete({}, function (err, meta) {
						validate(err, meta);
						done();
					});
				});
			});

			describe('promises', function () {
				beforeEach(function (done) {
					User
						.insert([{ email: 'someone@example.com' }, { email: 'somebody@example.com' }])
						.then(function () { done(); }, done)
						.catch(done);
				});

				it('should handle missing delete queries', function (done) {
					User
						.delete()
						.then(function (meta) {
							validate(meta);
							done();
						}, done)
						.catch(done);
				});

				it('should handle invalid delete queries', function (done) {
					User
						.delete({})
						.then(function (meta) {
							validate(meta);
							done();
						}, done)
						.catch(done);
				});
			});
		});
	});
});
