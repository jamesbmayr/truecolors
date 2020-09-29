/*** modules ***/
	if (!CORE) { var CORE = require("../node/core") }
	if (!SESSION) { var SESSION = require("../node/session") }
	module.exports = {}

/*** creates ***/
	/* createOne */
		module.exports.createOne = createOne
		function createOne(REQUEST, callback) {
			try {
				// name
					if (!REQUEST.post.name || REQUEST.post.name.length < 4 || REQUEST.post.name.length > 16 || !CORE.isNumLet(REQUEST.post.name)) {
						callback({success: false, message: "name must be 4-16 letters and numbers"})
						return
					}

				// create
					var player = CORE.getSchema("player")
						player.sessionId = REQUEST.session.id
						player.name = REQUEST.post.name

					var game = CORE.getSchema("game")
						game.players[player.id] = player

				// query
					var query = CORE.getSchema("query")
						query.collection = "games"
						query.command = "insert"
						query.document = game

				// insert
					CORE.accessDatabase(query, function(results) {
						if (!results.success) {
							callback(results)
							return
						}

						// update session
							REQUEST.updateSession = {
								playerId: player.id,
								gameId: game.id
							}
							SESSION.updateOne(REQUEST, null, function() {
								// redirect
									callback({success: true, message: "game created", location: "../game/" + game.id})
							})
					})
			}
			catch (error) {
				CORE.logError(error)
				callback({success: false, message: "unable to " + arguments.callee.name})
			}
		}

	/* joinOne */
		module.exports.joinOne = joinOne
		function joinOne(REQUEST, callback) {
			try {
				// name
					if (!REQUEST.post.name || REQUEST.post.name.length < 4 || REQUEST.post.name.length > 16 || !CORE.isNumLet(REQUEST.post.name)) {
						callback({success: false, message: "name must be 4-16 letters and numbers"})
						return
					}

				// validate
					if (!REQUEST.post.gameId || REQUEST.post.gameId.length !== 4 || !CORE.isNumLet(REQUEST.post.gameId)) {
						callback({success: false, message: "gameId must be 4 letters and numbers"})
						return
					}

				// query
					var query = CORE.getSchema("query")
						query.collection = "games"
						query.command = "find"
						query.filters = {id: REQUEST.post.gameId}

				// find
					CORE.accessDatabase(query, function(results) {
						// not found
							if (!results.success) {
								callback({success: false, message: "no game found"})
								return
							}

						// player count
							var game = results.documents[0]
							var teamDistribution = CORE.getAsset("constants").teamDistribution
							var maximumPlayers = Object.keys(teamDistribution).sort(function(a, b) {
								return Number(b) - Number(a)
							})
							if (Object.keys(game.players).length >= maximumPlayers) {
								callback({success: false, message: "maximum player count reached"})
								return
							}

						// create player
							var player = CORE.getSchema("player")
								player.sessionId = REQUEST.session.id
								player.name = REQUEST.post.name
								player.position = Object.keys(game.players).length

						// add to game
							game.players[player.id] = player

						// query
							var query = CORE.getSchema("query")
								query.collection = "games"
								query.command = "update"
								query.filters = {id: game.id}
								query.document = game

						// update
							CORE.accessDatabase(query, function(results) {
								if (!results.success) {
									callback(results)
									return
								}

								// update session
									REQUEST.updateSession = {
										playerId: player.id,
										gameId: game.id
									}
									SESSION.updateOne(REQUEST, null, function() {
										// redirect
											callback({success: true, message: "game joined", location: "../game/" + game.id})
									})
							})
					})
			}
			catch (error) {
				CORE.logError(error)
				callback({success: false, message: "unable to " + arguments.callee.name})
			}
		}

	/* startOne */
		module.exports.startOne = startOne
		function startOne(REQUEST, callback) {
			try {
				// ???
				return false
			}
			catch (error) {
				CORE.logError(error)
				callback({success: false, message: "unable to " + arguments.callee.name})
			}
		}

/*** reads ***/
	/* readOne */
		module.exports.readOne = readOne
		function readOne(REQUEST, callback) {
			try {
				// game id
					var gameId = REQUEST.path[REQUEST.path.length - 1]

				// query
					var query = CORE.getSchema("query")
						query.collection = "games"
						query.command = "find"
						query.filters = {id: gameId}

				// find
					CORE.accessDatabase(query, function(results) {
						// not found
							if (!results.success) {
								callback({success: false, message: "no game found", location: "../../../../", recipients: [REQUEST.session.id]})
								return
							}

						// not a player
							var game = results.documents[0]
							var playerId = null
							if (Object.keys(game.players).length) {
								playerId = Object.keys(game.players).find(function(p) {
									return game.players[p].sessionId == REQUEST.session.id
								})
							}
							if (!playerId) {
								callback({success: false, message: "not a player", location: "../../../../", recipients: [REQUEST.session.id]})
								return
							}							

						// all players
							for (var i in game.players) {
								callback({success: true, message: null, playerId: i, game: sanitizeGame(CORE.duplicateObject(game), i), recipients: [game.players[i].sessionId]})
							}
					})
			}
			catch (error) {
				CORE.logError(error)
				callback({success: false, message: "unable to " + arguments.callee.name})
			}
		}

/*** updates ***/
	/* updateOne */
		module.exports.updateOne = updateOne
		function updateOne(REQUEST, callback) {
			// TBD
			// startGame ???
			try {
				// authenticated?
					if (!REQUEST.user || !REQUEST.user.id) {
						callback({success: false, message: "not signed in"})
						return
					}

				// validate
					if (!REQUEST.post.game || !REQUEST.post.game.id) {
						callback({success: false, message: "no game object", recipients: [REQUEST.user.id]})
						return
					}

				// action
					if (REQUEST.post.action == "clearGameChat") {
						var collection = "chats"
					}
					else if (REQUEST.post.action == "clearGameRolls") {
						var collection = "rolls"
					}
					else {
						callback({success: false, message: "unknown game update action", recipients: [REQUEST.user.id]})
						return
					}

				// query
					var query = CORE.getSchema("query")
						query.collection = "games"
						query.command = "find"
						query.filters = {id: REQUEST.post.game.id}

				// find
					CORE.accessDatabase(query, function(results) {
						if (!results.success) {
							results.recipients = [REQUEST.user.id]
							callback(results)
							return
						}

						// validate
							var game = results.documents[0]
							if (game.userId !== REQUEST.user.id) {
								callback({success: false, message: "only the game creator may clear chat or rolls", recipients: [REQUEST.user.id]})
								return
							}

						// query
							var query = CORE.getSchema("query")
								query.collection = collection
								query.command = "delete"
								query.filters = {gameId: game.id}

						// delete
							CORE.accessDatabase(query, function(results) {
								if (!results.success) {
									results.recipients = [REQUEST.user.id]
									callback(results)
									return
								}

								// query
									var query = CORE.getSchema("query")
										query.collection = "users"
										query.command = "find"
										query.filters = {gameId: game.id}

								// find
									CORE.accessDatabase(query, function(results) {
										if (!results.success) {
											results.recipients = [REQUEST.user.id]
											callback(results)
											return
										}

										// ids
											var users = results.documents
											var ids = results.documents.map(function(u) {
												return u.id
											}) || []

										// send update
											if (collection == "chats") {
												callback({success: true, message: REQUEST.user.name + " cleared the chat", chat: {delete: true}, recipients: ids})
											}
											else if (collection == "rolls") {
												callback({success: true, message: REQUEST.user.name + " cleared all rolls", roll: {delete: true}, recipients: ids})	
											}
											return
									})
							})
					})
			}
			catch (error) {
				CORE.logError(error)
				callback({success: false, message: "unable to " + arguments.callee.name})
			}
		}

/*** tools ***/
	/* sanitizeGame */
		module.exports.sanitizeGame = sanitizeGame
		function sanitizeGame(game, playerId) {
			// validate
				if (!game || !Object.keys(game.players).length) {
					return null
				}				

			// round // hide truecolors for upcoming rounds
				for (var i in game.status.trueColors) {
					if (i + 1 > game.status.round) {
						game.status.trueColors[i] = null
					}
				}

			// player status // hide everyone's status except your own
				for (var i in game.players) {
					delete game.players[i].sessionId

					if (game.players[i].id !== playerId) {
						game.players[i].status = null
					}
					if (!playerId && !(game.players[playerId].team == "evil" && game.players[i].team == "evil")) {
						game.players[i].team = null
					}
				}

			// draw & discard // hide all cards
				game.status.drawCount = game.draw.length
					delete game.draw
				game.status.discardCount = game.discard.length
					delete game.discard

			// vote & pick phases // hide everyone's cards except your own
				if (game.status.phase == "vote" || game.status.phase == "pick") {
					for (var i in game.players) {
						if (!playerId || game.players[i].id !== playerId) {
							for (var j in game.players[i].cards) {
								game.players[i].cards[j] = null
							}
						}
					}
				}

			// swap phase // if it's not your turn, hide everyone's cards
				if (game.status.phase == "swap") {
					if (!playerId || game.status.currentTurn !== playerId) {
						game.status.currentTurn = null

						for (var i in game.players) {
							for (var j in game.players[i].cards) {
								game.players[i].cards[j] = null
							}
						}
					}
				}

			// return
				return game
		}

