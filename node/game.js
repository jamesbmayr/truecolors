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

						// already a player?
							var game = results.documents[0]
							if (Object.keys(game.players).find(function(p) { return game.players[p].sessionId == REQUEST.session.id })) {
								callback({success: true, message: "re-joining game", location: "../game/" + game.id})
								return
							}

						// player count
							var teamDistribution = CORE.getAsset("constants").teamDistribution
							var maximumPlayers = Number(Object.keys(teamDistribution).sort(function(a, b) {
								return Number(b) - Number(a)
							}))
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
							game.updated = new Date().getTime()

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
								callback({success: true, message: null, playerId: i, game: sanitizeGame(game, i), recipients: [game.players[i].sessionId]})
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
			try {
				// game id
					var gameId = REQUEST.path[REQUEST.path.length - 1]
					if (!gameId || gameId.length !== 4) {
						callback({success: false, message: "invalid game id", recipients: [REQUEST.session.id]})
						return
					}

				// action
					if (!REQUEST.post || !REQUEST.post.action) {
						callback({success: false, message: "missing update action", recipients: [REQUEST.session.id]})
						return
					}

				// query
					var query = CORE.getSchema("query")
						query.collection = "games"
						query.command = "find"
						query.filters = {id: gameId}

				// find
					CORE.accessDatabase(query, function(results) {
						if (!results.success) {
							results.recipients = [REQUEST.user.id]
							callback(results)
							return
						}

						// not a player?
							var game = results.documents[0]
							if (!Object.keys(game.players).find(function(p) { return game.players[p].sessionId == REQUEST.session.id }).length) {
								callback({success: false, message: "not a player", recipients: [REQUEST.session.id]})
								return
							}

						// already ended?
							if (game.status && game.status.endTime) {
								callback({success: false, message: "game already ended", recipients: [REQUEST.session.id]})
								return
							}

						// action switch
							if (REQUEST.post.action == "startGame") {
								startGame(REQUEST, game, callback)
								return
							}
							else if (REQUEST.post.action == "selectPlayer") {
								selectPlayer(REQUEST, game, callback)
								return
							}
							else if (REQUEST.post.action == "selectCard") {
								selectCard(REQUEST, game, callback)
								return
							}
							else {
								callback({success: false, message: "invalid update action: " + REQUEST.post.action, recipients: [REQUEST.session.id]})
								return
							}
					})
			}
			catch (error) {
				CORE.logError(error)
				callback({success: false, message: "unable to " + arguments.callee.name})
			}
		}

	/* startGame */
		module.exports.startGame = startGame
		function startGame(REQUEST, game, callback) {
			try {
				// already started?
					if (game.startTime) {
						callback({success: false, message: "game already started", recipients: [REQUEST.session.id]})
						return
					}

				// too few players
					var constants = CORE.getAsset("constants")
					var minimumPlayers = Number(Object.keys(constants.teamDistribution).sort(function(a, b) {
						return Number(a) - Number(b)
					})[0])
					var playerIds = Object.keys(game.players)
					if (playerIds.length < minimumPlayers) {
						callback({success: false, message: "game requires at least " + minimumPlayers + " players", recipients: [REQUEST.session.id]})
						return
					}

				// assign teams
					var goodCount = 0
					var evilCount = 0
					var distribution = constants.teamDistribution[String(playerIds.length)]
					
					playerIds = CORE.sortRandom(playerIds)
					for (var i in playerIds) {
						if (goodCount < distribution.good) {
							goodCount++
							game.players[playerIds[i]].team = "good"
						}
						else {
							evilCount++
							game.players[playerIds[i]].team = "evil"
						}
					}

				// shuffle true colors
					game.status.trueColors = CORE.sortRandom(game.status.trueColors)

				// shuffle deck
					game.draw = CORE.sortRandom(game.draw)

				// distribute cards
					for (var i in playerIds) {
						var player = game.players[playerIds[i]]
						while (player.cards.length < constants.handSize) {
							game = moveCard(game, {cardId: game.draw[0].id, fromId: "draw", toId: playerIds[i]})
						}
					}

				// start game
					game.updated = game.status.startTime = new Date().getTime()
					game.status.round = 1
					game.status.phase = "vote"
					game.status.message = "select a player to go first"

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

						// all players
							for (var i in game.players) {
								callback({success: true, message: null, game: sanitizeGame(game, i), recipients: [game.players[i].sessionId]})
							}
					})
			}
			catch (error) {
				CORE.logError(error)
				callback({success: false, message: "unable to " + arguments.callee.name})
			}
		}

	/* selectPlayer */
		module.exports.selectPlayer = selectPlayer
		function selectPlayer(REQUEST, game, callback) {
			try {
				// not started?
					if (!game.status.startTime) {
						callback({success: false, message: "game not started", recipients: [REQUEST.session.id]})
						return
					}

				// wrong phase
					if (game.status.phase !== "vote") {
						callback({success: false, message: "not vote phase", recipients: [REQUEST.session.id]})
						return
					}

				// no vote
					if (!REQUEST.post.selectedPlayerId) {
						callback({success: false, message: "no player selected", recipients: [REQUEST.session.id]})
						return
					}

				// invalid vote
					if (!game.players[REQUEST.post.selectedPlayerId]) {
						callback({success: false, message: "invalid player selection", recipients: [REQUEST.session.id]})
						return
					}

				// update
					var thisPlayerId = Object.keys(game.players).find(function(p) {
						return game.players[p].sessionId == REQUEST.session.id
					})
					game.players[thisPlayerId].status.vote = REQUEST.post.selectedPlayerId
					game.status.message = "select a player to go first (no majority yet!)"
					game.updated = new Date().getTime()

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

						// update this player
							callback({success: true, message: "you voted! wait for other players...", game: sanitizeGame(game, thisPlayerId), recipients: [REQUEST.session.id]})

						// no consensus round leader?
							var roundLeaderId = determineRoundLeader(game)
							if (!roundLeaderId) {
								return
							}

						// clear votes
							for (var i in game.players) {
								game.players[i].status.vote = null
							}

						// set turn order
							game.players[roundLeaderId].status.isTurn = true
							game.status.roundLeader = roundLeaderId
							game.status.currentTurn = roundLeaderId

							game.status.phase = "swap"
							game.status.message = game.players[game.status.roundLeader].name + " leads the round of swaps"
							game.updated = new Date().getTime()

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

								// update players
									forceDelay(function() {
										for (var i in game.players) {
											callback({success: true, message: null, game: sanitizeGame(game, i), recipients: [game.players[i].sessionId]})
										}

										// round leader starts
											callback({success: true, message: "your turn! select one of your cards", recipients: [game.players[roundLeaderId].sessionId]})
									}, CORE.getAsset("constants").delayTime)
							})
					})
			}
			catch (error) {
				CORE.logError(error)
				callback({success: false, message: "unable to " + arguments.callee.name})
			}
		}

	/* selectCard */
		module.exports.selectCard = selectCard
		function selectCard(REQUEST, game, callback) {
			try {
				// not started?
					if (!game.status.startTime) {
						callback({success: false, message: "game not started", recipients: [REQUEST.session.id]})
						return
					}

				// wrong phase
					if (game.status.phase !== "swap" && game.status.phase !== "toss" && game.status.phase !== "play") {
						callback({success: false, message: "not the right phase", recipients: [REQUEST.session.id]})
						return
					}

				// thisPlayer
					var thisPlayerId = Object.keys(game.players).find(function(p) {
						return game.players[p].sessionId == REQUEST.session.id
					})

				// swap phase
					if (game.status.phase == "swap") {
						// not your turn
							if (game.status.currentTurn !== thisPlayerId) {
								callback({success: false, message: "not your turn", recipients: [REQUEST.session.id]})
								return
							}

						// no card
							if (!REQUEST.post.selectedCardId) {
								callback({success: false, message: "no card selected", recipients: [REQUEST.session.id]})
								return
							}

						// selecting own card?
							var card = game.players[thisPlayerId].cards.find(function(c) { return c.id == REQUEST.post.selectedCardId }) || null
							if (card) {
								// select only this card for swap
									for (var c in game.players[thisPlayerId].cards) {
										game.players[thisPlayerId].cards[c].status.selectedForSwap = false
									}
									card.status.selectedForSwap = true

								// update game
									game.updated = new Date().getTime()

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

										callback({success: true, message: "card selected! select another player's card to swap with", game: sanitizeGame(game, thisPlayerId), recipients: [game.players[thisPlayerId].sessionId]})
									})
								return
							}

						// selecting another player's card
							var otherPlayerId = Object.keys(game.players).find(function(p) {
								return p !== thisPlayerId && game.players[p].cards.find(function(c) {
									return c.id == REQUEST.post.selectedCardId
								})
							})

						// can't find card
							if (!otherPlayerId) {
								callback({success: false, message: "unable to locate card", recipients: [REQUEST.session.id]})
								return
							}

						// haven't selected own card yet?
							var ownCardForSwap = game.players[thisPlayerId].cards.find(function(c) { return c.status.selectedForSwap })
							if (!ownCardForSwap) {
								callback({success: false, message: "select one of your own cards first!", recipients: [REQUEST.session.id]})
								return
							}

						// unselect cards
							ownCardForSwap.status.selectedForSwap = false
							otherCardForSwap = game.players[otherPlayerId].cards.find(function(c) {
								return c.id == REQUEST.post.selectedCardId
							})
							otherCardForSwap.status.selectedForSwap = false

						// move cards
							var ownCardForSwapId = ownCardForSwap.id
							game = moveCard(game, {cardId: REQUEST.post.selectedCardId, fromId: otherPlayerId, toId: thisPlayerId})
							game = moveCard(game, {cardId: ownCardForSwapId, fromId: thisPlayerId, toId: otherPlayerId})

						// update game
							game.updated = new Date().getTime()

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

								// update this player
									callback({success: true, message: "cards swapped!", game: sanitizeGame(game, thisPlayerId), recipients: [game.players[thisPlayerId].sessionId]})

								// next player?
									var nextPlayerId = getNextPlayerId(game, thisPlayerId)
									if (nextPlayerId) {
										// update turn
											game.players[thisPlayerId].status.isTurn = false
											game.players[nextPlayerId].status.isTurn = true
											game.status.currentTurn = nextPlayerId
											game.updated = new Date().getTime()

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

												// update players
													forceDelay(function() {
														callback({success: true, message: "wait for all players...", game: sanitizeGame(game, thisPlayerId), recipients: [game.players[thisPlayerId].sessionId]})
														callback({success: true, message: "your turn! select one of your cards", game: sanitizeGame(game, nextPlayerId), recipients: [game.players[nextPlayerId].sessionId]})
													}, CORE.getAsset("constants").delayTime)
											})
										return
									}

								// no next player --> toss phase
									game.players[thisPlayerId].status.isTurn = false
									game.status.roundLeader = null
									game.status.currentTurn = null

									game.status.phase = "toss"
									game.status.message = "select one of your cards to discard"
									game.updated = new Date().getTime()

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

										// update players
											forceDelay(function() {
												for (var i in game.players) {
													callback({success: true, message: null, game: sanitizeGame(game, i), recipients: [game.players[i].sessionId]})
												}
											}, CORE.getAsset("constants").delayTime)
									})
							})
						return
					}
			
				// toss phase
					if (game.status.phase == "toss") {
						// no card
							if (!REQUEST.post.selectedCardId) {
								callback({success: false, message: "no card selected", recipients: [REQUEST.session.id]})
								return
							}

						// find card
							var card = game.players[thisPlayerId].cards.find(function(c) { return c.id == REQUEST.post.selectedCardId }) || null
							if (!card) {
								callback({success: false, message: "invalid card selection", recipients: [REQUEST.session.id]})
								return
							}

						// select only this card for discard
							for (var c in game.players[thisPlayerId].cards) {
								game.players[thisPlayerId].cards[c].status.selectedForDiscard = false
							}
							card.status.selectedForDiscard = true

						// update game
							game.updated = new Date().getTime()

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

								// update player
									callback({success: true, message: "card selected! wait for all players", game: sanitizeGame(game, thisPlayerId), recipients: [game.players[thisPlayerId].sessionId]})
								
								// still waiting on someone?
									for (var i in game.players) {
										if (!game.players[i].cards.find(function(c) { return c.status.selectedForDiscard })) {
											return
										}
									}

								// all selected --> discard
									for (var i in game.players) {
										var selectedCard = game.players[i].cards.find(function(c) { return c.status.selectedForDiscard })
											selectedCard.status.selectedForDiscard = false
										game = moveCard(game, {cardId: selectedCard.id, fromId: i, toId: "discard"})
									}

								// play phase
									game.status.phase = "play"
									game.status.message = "select one of your cards to play"
									game.updated = new Date().getTime()

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

										// update all players
											forceDelay(function() {
												for (var i in game.players) {
													callback({success: true, message: null, game: sanitizeGame(game, i), recipients: [game.players[i].sessionId]})
												}
											}, CORE.getAsset("constants").delayTime)
									})
							})
						return
					}

				// play phase
					if (game.status.phase == "play") {
						// no card
							if (!REQUEST.post.selectedCardId) {
								callback({success: false, message: "no card selected", recipients: [REQUEST.session.id]})
								return
							}

						// find card
							var card = game.players[thisPlayerId].cards.find(function(c) { return c.id == REQUEST.post.selectedCardId }) || null
							if (!card) {
								callback({success: false, message: "invalid card selection", recipients: [REQUEST.session.id]})
								return
							}

						// select only this card for play
							for (var c in game.players[thisPlayerId].cards) {
								game.players[thisPlayerId].cards[c].status.selectedForPlay = false
							}
							card.status.selectedForPlay = true

						// update game
							game.updated = new Date().getTime()

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

								// update player
									callback({success: true, message: "card selected! wait for all players", game: sanitizeGame(game, thisPlayerId), recipients: [game.players[thisPlayerId].sessionId]})
								
								// still waiting on someone?
									for (var i in game.players) {
										if (!game.players[i].cards.find(function(c) { return c.status.selectedForPlay })) {
											return
										}
									}

								// all selected --> show
									for (var i in game.players) {
										var selectedCard = game.players[i].cards.find(function(c) { return c.status.selectedForPlay })
											selectedCard.status.selectedForPlay = false
											selectedCard.status.faceup = true
									}

								// show phase
									var roundPoint = determineRoundPoint(game)
									game.status.phase = "show"
									game.status.points.push(roundPoint)
									game.status.message = "played cards revealed: " + roundPoint + " earns a point"
									game.updated = new Date().getTime()

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

										// update players
											forceDelay(function() {
												for (var i in game.players) {
													callback({success: true, message: null, game: sanitizeGame(game, i), recipients: [game.players[i].sessionId]})
												}

												// game continues?
													var winningTeam = determineGameWinner(game)
													if (!winningTeam) {
														// discard faceup cards
															for (var i in game.players) {
																var faceupCard = game.players[i].cards.find(function(c) { return c.status.faceup })
																	faceupCard.status.faceup = false
																game = moveCard(game, {cardId: faceupCard.id, fromId: i, toId: "discard"})
															}

														// draw 2 new cards
															for (var i in game.players) {
																for (var j = 0; j < 2; j++) {
																	if (!game.draw.length) {
																		game = shuffleDiscardIntoDraw(game)
																	}

																	game = moveCard(game, {cardId: game.draw[0].id, fromId: "draw", toId: i})
																}
															}

														// vote phase
															game.status.round++
															game.status.phase = "vote"
															game.status.message = "select a player to go first this round"
															game.updated = new Date().getTime()

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

																// update players
																	forceDelay(function() {
																		for (var i in game.players) {
																			callback({success: true, message: null, game: sanitizeGame(game, i), recipients: [game.players[i].sessionId]})
																		}
																	}, CORE.getAsset("constants").delayTime * 2)
															})
														return
													}

												// game over
													game.status.message = winningTeam + " wins the game!"
													game.status.endTime = game.updated = new Date().getTime()

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

														// update players
															forceDelay(function() {
																for (var i in game.players) {
																	callback({success: true, message: null, game: sanitizeGame(game, i), recipients: [game.players[i].sessionId]})
																}
															}, CORE.getAsset("constants").delayTime * 2)
													})
											}, CORE.getAsset("constants").delayTime)
									})
							})
					}
			}
			catch (error) {
				CORE.logError(error)
				callback({success: false, message: "unable to " + arguments.callee.name})
			}
		}

/*** tools ***/	
	/* forceDelay */
		module.exports.forceDelay = forceDelay
		function forceDelay(callback, delay) {
			try {
				setTimeout(callback, delay)
			}
			catch (error) {
				CORE.logError(error)
			}
		}

	/* moveCard */
		module.exports.moveCard = moveCard
		function moveCard(game, data) {
			try {
				// no game?
					if (!game) {
						return null
					}

				// missing data?
					if (!data || !data.cardId || !data.fromId || !data.toId) {
						CORE.logError("missing data for moving card")
						return game
					}

				// from
					// from draw
						if (data.fromId == "draw") {
							var cardIndex = -1
							for (var i in game.draw) {
								if (game.draw[i].id == data.cardId) {
									cardIndex = i
									break
								}
							}
							if (cardIndex == -1) {
								CORE.logError("cannot find card " + data.cardId + " in draw")
								return game
							}
							var cardClone = CORE.duplicateObject(game.draw[cardIndex])
							game.draw.splice(cardIndex, 1)
						}

					// from player
						else {
							if (!game.players[data.fromId]) {
								CORE.logError("cannot find player " + data.fromId + " to take card " + data.cardId)
								return game
							}

							var cardIndex = -1
							for (var i in game.players[data.fromId].cards) {
								if (game.players[data.fromId].cards[i].id == data.cardId) {
									cardIndex = i
									break
								}
							}
							if (cardIndex == -1) {
								CORE.logError("cannot find card " + data.cardId + " on player " + data.fromId)
								return game
							}
							var cardClone = CORE.duplicateObject(game.players[data.fromId].cards[cardIndex])
							game.players[data.fromId].cards.splice(cardIndex, 1)
						}

				// to
					// to discard
						if (data.toId == "discard") {
							game.discard.push(cardClone)
						}

					// to player
						else {
							if (!game.players[data.toId]) {
								CORE.logError("cannot find player " + data.toId + " to give card " + data.cardId)
								return game
							}

							game.players[data.toId].cards.push(cardClone)
						}

				// return game
					return game
			}
			catch (error) {
				CORE.logError(error)
			}
		}

	/* determineRoundLeader */
		module.exports.determineRoundLeader = determineRoundLeader
		function determineRoundLeader(game) {
			try {
				// all players voted?
					var contenders = {}
					for (var i in game.players) {
						if (!game.players[i].status.vote) {
							return null
						}
						else {
							contenders[i] = 0
						}
					}

				// count votes
					for (var i in game.players) {
						contenders[game.players[i].status.vote]++
					}

				// find victor
					var threshold = Math.floor(Object.keys(game.players).length / 2) + 1
					return Object.keys(contenders).find(function(c) {
						return contenders[c] >= threshold
					}) || null
			}
			catch (error) {
				CORE.logError(error)
			}
		}

	/* getNextPlayerId */
		module.exports.getNextPlayerId = getNextPlayerId
		function getNextPlayerId(game, thisPlayerId) {
			try {
				// positions
					var playerCount = Object.keys(game.players).length
					var roundLeaderPosition = game.players[game.status.roundLeader].position
					var thisPlayerPosition = game.players[thisPlayerId].position

				// next player position
					var nextPlayerPosition = thisPlayerPosition + 1
					if (nextPlayerPosition >= playerCount) {
						nextPlayerPosition = 0
					}

				// full circle?
					if (nextPlayerPosition == roundLeaderPosition) {
						return null
					}

				// next player
					return Object.keys(game.players).find(function(p) { return game.players[p].position == nextPlayerPosition }) || null
			}
			catch (error) {
				CORE.logError(error)
			}
		}

	/* determineRoundPoint */
		module.exports.determineRoundPoint = determineRoundPoint
		function determineRoundPoint(game) {
			try {
				// trueColor
					var trueColor = game.status.trueColors[game.status.round - 1].color
					var wildcardColors = CORE.getAsset("constants").wildcardColors || []

				// examine faceup cards
					for (var i in game.players) {
						var faceupCard = game.players[i].cards.find(function(c) { return c.status.faceup })
						if (faceupCard.color !== trueColor && !wildcardColors.includes(faceupCard.color)) {
							return "evil"
						}
					}

				// otherwise, true
					return "good"
			}
			catch (error) {
				CORE.logError(error)
			}
		}

	/* shuffleDiscardIntoDraw */
		module.exports.shuffleDiscardIntoDraw = shuffleDiscardIntoDraw
		function shuffleDiscardIntoDraw(game) {
			try {
				// clone & shuffle
					var cloneCards = sortRandom(game.discard)

				// reset
					game.discard = []
					game.draw = cloneCards

				// return
					return game
			}
			catch (error) {
				CORE.logError(error)
			}
		}

	/* determineGameWinner */
		module.exports.determineGameWinner = determineGameWinner
		function determineGameWinner(game) {
			try {
				// points
					var goodPoints = 0
					var evilPoints = 0
					for (var i in game.status.points) {
						if (game.status.points[i] == "good") {
							goodPoints++
						}
						else if (game.status.points[i] == "evil") {
							evilPoints++
						}
					}

				// count
					if (goodPoints >= CORE.getAsset("constants").goodPointsToWin) {
						return "good"
					}
					else if (evilPoints >= CORE.getAsset("constants").evilPointsToWin) {
						return "evil"
					}

				// no winner
					return null
			}
			catch (error) {
				CORE.logError(error)
			}
		}

	/* sanitizeGame */
		module.exports.sanitizeGame = sanitizeGame
		function sanitizeGame(gameInput, playerId) {
			try {
				// validate
					if (!gameInput || !Object.keys(gameInput.players).length) {
						return null
					}

				// create a copy
					var game = CORE.duplicateObject(gameInput)

				// round // hide trueColors for upcoming rounds
					for (var i in game.status.trueColors) {
						if (i > game.status.round - 1) {
							game.status.trueColors[i] = null
						}
					}

				// player status // hide everyone's team except if you are evil
					for (var i in game.players) {
						delete game.players[i].sessionId
						
						if (!game.status.endTime) {
							if (!playerId || (game.players[playerId].team !== "evil" && playerId !== i)) {
								game.players[i].team = null
							}
						}
					}

				// draw & discard // hide all cards
					game.status.drawCount = game.draw.length
						delete game.draw
					game.status.discardCount = game.discard.length
						delete game.discard

				// show phase // hide everyone's cards except faceup cards
					if (game.status.phase == "show") {
						for (var i in game.players) {
							if (!playerId || game.players[i].id !== playerId) {
								for (var j in game.players[i].cards) {
									if (!game.players[i].cards[j].status.faceup) {
										game.players[i].cards[j] = null
									}
								}
							}
						}
					}

				// vote & pick phases // hide everyone's cards except your own
					if (game.status.phase == "vote" || game.status.phase == "toss" || game.status.phase == "play") {
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
			catch (error) {
				CORE.logError(error)
			}
		}
