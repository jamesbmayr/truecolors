window.addEventListener("load", function() {
	/*** globals ***/
		/* constants */
			var CONSTANTS = {
				circle: 360
			}

		/* ids */
			var PLAYERID = null

		/* elements */
			var ELEMENTS = {
				gameTable: {
					element: document.querySelector("#game-table"),
					start: {
						form: document.querySelector("#game-table-start-form"),
						button: document.querySelector("#game-table-start-button")
					},
					center: {
						element: document.querySelector("#game-table-center"),
						draw: document.querySelector("#game-table-center-draw"),
						discard: document.querySelector("#game-table-center-discard"),
						message: document.querySelector("#game-table-center-message"),
						tracker: {
							element: document.querySelector("#game-table-center-tracker"),
							round1: {
								element: document.querySelector("#game-table-center-tracker-round-1"),
								card: document.querySelector("#game-table-center-tracker-round-1 .game-table-center-tracker-round-card"),
								token: document.querySelector("#game-table-center-tracker-round-1 .game-table-center-tracker-round-token")
							},
							round2: {
								element: document.querySelector("#game-table-center-tracker-round-2"),
								card: document.querySelector("#game-table-center-tracker-round-2 .game-table-center-tracker-round-card"),
								token: document.querySelector("#game-table-center-tracker-round-2 .game-table-center-tracker-round-token")
							},
							round3: {
								element: document.querySelector("#game-table-center-tracker-round-3"),
								card: document.querySelector("#game-table-center-tracker-round-3 .game-table-center-tracker-round-card"),
								token: document.querySelector("#game-table-center-tracker-round-3 .game-table-center-tracker-round-token")
							},
							round4: {
								element: document.querySelector("#game-table-center-tracker-round-4"),
								card: document.querySelector("#game-table-center-tracker-round-4 .game-table-center-tracker-round-card"),
								token: document.querySelector("#game-table-center-tracker-round-4 .game-table-center-tracker-round-token")
							},
							round5: {
								element: document.querySelector("#game-table-center-tracker-round-5"),
								card: document.querySelector("#game-table-center-tracker-round-5 .game-table-center-tracker-round-card"),
								token: document.querySelector("#game-table-center-tracker-round-5 .game-table-center-tracker-round-token")
							}
						}
					},
					players: {
						element: document.querySelector("#game-table-players")
					}
				}
			}

	/*** SOCKET ***/
		/* start */
			var SOCKET = null
			var SOCKETCHECK = null
			checkSocket()

		/* checkSocket */
			function checkSocket() {
				createSocket()
				SOCKETCHECK = setInterval(function() {
					try {
						if (!SOCKET) {
							try {
								createSocket()
							}
							catch (error) {console.log(error)}
						}
						else {
							clearInterval(SOCKETCHECK)
						}
					}
					catch (error) {console.log(error)}
				}, 5000)
			}

		/* createSocket */
			function createSocket() {
				try {
					SOCKET = new WebSocket(location.href.replace("http","ws"))
					SOCKET.onopen = function() {
						SOCKET.send(null)
					}
					SOCKET.onerror = function(error) {
						window.FUNCTIONS.showToast({success: false, message: error})
					}
					SOCKET.onclose = function() {
						window.FUNCTIONS.showToast({success: false, message: "disconnected"})
						SOCKET = null
						checkSocket()
					}
					SOCKET.onmessage = function(message) {
						try {
							var post = JSON.parse(message.data)
							if (post && (typeof post == "object")) {
								receiveSocket(post)
							}
						}
						catch (error) {console.log(error)}
					}
				}
				catch (error) {console.log(error)}
			}

		/* receiveSocket */
			function receiveSocket(data) {
				try {
					console.log(data)
					// meta
						// redirect
							if (data.location) {
								window.location = data.location
								return
							}
							
						// failure
							if (!data || !data.success) {
								window.FUNCTIONS.showToast({success: false, message: data.message || "unknown websocket error"})
								return
							}

						// toast
							if (data.message) {
								FUNCTIONS.showToast(data)
							}

					// ids
						// player id
							if (data.playerId) {
								PLAYERID = data.playerId
							}

					// data
						// game data
							if (data.game) {
								document.getElementById("data").innerText = JSON.stringify(data.game, null, "\t") // ???
								displayCenter(data.game.status)
								displayPlayers(data.game.players)
							}
				} catch (error) {console.log(error)}
			}

	/*** builds ***/
		/* buildPlayer */
			function buildPlayer(player) {
				try {
					// element
						var playerElement = document.createElement("div")
							playerElement.className = "player"
							playerElement.id = "game-table-player-" + player.id
						ELEMENTS.gameTable.players[player.id] = playerElement
						ELEMENTS.gameTable.players.element.appendChild(playerElement)

					// name
						var nameElement = document.createElement("button")
							nameElement.className = "player-name"
							nameElement.innerText = player.name
							nameElement.addEventListener(window.TRIGGERS.click, selectPlayer)
						playerElement.appendChild(nameElement)

					// team
						var teamElement = document.createElement("div")
							teamElement.className = "player-team"
						playerElement.appendChild(teamElement)

					// cards
						var cardsElement = document.createElement("div")
							cardsElement.className = "player-cards"
						playerElement.appendChild(cardsElement)

					// return element
						return playerElement
				} catch (error) {console.log(error)}
			}

		/* buildCard */
			function buildCard(card, container) {
				try {
					// create card element
						var cardElement = document.createElement("button")
							cardElement.className = "card"
							cardElement.addEventListener(window.TRIGGERS.click, selectCard)
							if (card && card.id) { cardElement.id = card.id }
							if (card && card.color && card.status.faceup) { cardElement.setAttribute("color", card.color) }
							if (card && card.status.selectedForPlay) { cardElement.setAttribute("selectedForPlay", true) }
							if (card && card.status.selectedForSwap) { cardElement.setAttribute("selectedForSwap", true) }
							if (card && card.status.selectedForDiscard) { cardElement.setAttribute("selectedForDiscard", true) }
						container.appendChild(cardElement)

					// return
						return cardElement
				} catch (error) {console.log(error)}
			}

	/*** displays ***/
		/* displayCenter */
			function displayCenter(status) {
				try {
					// draw
						ELEMENTS.gameTable.center.draw.innerText = status.drawCount || 0

					// discard
						ELEMENTS.gameTable.center.discard.innerText = status.discardCount || 0

					// message
						ELEMENTS.gameTable.center.message.innerText = status.message ? status.message : (
							(status.phase + " phase") +
							(status.currentTurn ? (PLAYERID && PLAYERID == status.currentTurn ? ": your turn" : ": waiting...") : "")
						)

					// tracker
						for (var i = 0; i < status.trueColors.length; i++) {
							// card
								if (status.trueColors[i]) {
									ELEMENTS.gameTable.center.tracker["round" + (i + 1)].card.setAttribute("color", status.trueColors[i])
								}

							// token
								if (status.points[i]) {
									ELEMENTS.gameTable.center.tracker["round" + (i + 1)].token.setAttribute("team", status.points[i])
								}
						}
				} catch (error) {console.log(error)}
			}

		/* displayPlayers */
			function displayPlayers(players) {
				try {
					// display individuals
						for (var i in players) {
							displayPlayer(players[i])
						}

					// rotation
						var playerCount = Object.keys(players).length
						var angle = Math.round(CONSTANTS.circle / playerCount)
						var countOffset = PLAYERID ? players[PLAYERID].position : 0

						for (var i in players) {
							var playerElement = ELEMENTS.gameTable.players[players[i].id]
								playerElement.style.transform = "rotate(" + ((players[i].position - countOffset) * angle) + "deg)"
						}
				} catch (error) {console.log(error)}
			}

		/* displayPlayer */
			function displayPlayer(player) {
				try {
					// find player element
						var playerElement = ELEMENTS.gameTable.players[player.id]
						if (!playerElement) {
							playerElement = buildPlayer(player)
						}

					// highlight if it is this player's turn (only self will know)
						if (player.status && player.status.isTurn) {
							playerElement.setAttribute("isTurn", true)
						}
						else {
							playerElement.removeAttribute("isTurn")
						}

					// indicate team (only self, plus evil know each other)
						if (player.team) {
							playerElement.querySelector(".player-team").innerText = player.team
						}
						else {
							playerElement.querySelector(".player-team").innerText = "???"
						}

					// if this player has voted for someone, find that player
						// TBD ???

					// clear cards
						var cardsElement = playerElement.querySelector(".player-cards")
							cardsElement.innerHTML = ""

					// display cards
						for (var i in player.cards) {
							buildCard(player.cards[i], cardsElement)
						}
				} catch (error) {console.log(error)}
			}

	/*** submits ***/
		/* startGame */
			ELEMENTS.gameTable.start.form.addEventListener(window.TRIGGERS.submit, startGame)
			function startGame(event) {
				try {
					// ???
						return false

					// sendPost
						SOCKET.send({
							action: "startGame"
						})
				} catch (error) {console.log(error)}
			}

		/* selectPlayer */
			function selectPlayer(event) {
				try {
					console.log(event) // ???
				} catch (error) {console.log(error)}
			}

		/* selectCard */
			function selectCard(event) {
				try {
					console.log(event) // ???
				} catch (error) {console.log(error)}
			}
})