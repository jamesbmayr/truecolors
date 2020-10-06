window.addEventListener("load", function() {
	/*** globals ***/
		/* triggers */
			window.TRIGGERS = {
				submit: "submit",
				change: "change",
				input: "input",
				focus: "focus",
				blur: "blur",
				resize: "resize",
				keydown: "keydown",
				keyup: "keyup"
			}
			if ((/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i).test(navigator.userAgent)) {
				window.TRIGGERS.click = "touchstart"
				window.TRIGGERS.mousedown = "touchstart"
				window.TRIGGERS.mousemove = "touchmove"
				window.TRIGGERS.mouseup = "touchend"
				window.TRIGGERS.mouseenter = "touchstart"
				window.TRIGGERS.mouseleave = "touchend"
				window.TRIGGERS.rightclick = "contextmenu"
			}
			else {
				window.TRIGGERS.click = "click"
				window.TRIGGERS.mousedown = "mousedown"
				window.TRIGGERS.mousemove = "mousemove"
				window.TRIGGERS.mouseup = "mouseup"
				window.TRIGGERS.mouseenter = "mouseenter"
				window.TRIGGERS.mouseleave = "mouseleave"
				window.TRIGGERS.rightclick = "contextmenu"
			}

		/* defaults */
			document.addEventListener("dblclick", function(event) {
				event.preventDefault()
			})

			document.addEventListener("contextmenu", function(event) {
				event.preventDefault()
			})

		/* constants */
			var CONSTANTS = {
				circle: 360
			}

		/* ids */
			var PLAYERID = null

		/* elements */
			var ELEMENTS = {
				start: {
					form: document.querySelector("#start-form"),
					button: document.querySelector("#start-button")
				},
				gameTable: {
					element: document.querySelector("#game-table"),
					center: {
						element: document.querySelector("#game-table-center"),
						draw: {
							element: document.querySelector("#game-table-center-draw"),
							count: document.querySelector("#game-table-center-draw-count")
						},
						discard: {
							element: document.querySelector("#game-table-center-discard"),
							count: document.querySelector("#game-table-center-discard-count")
						},
						message: document.querySelector("#game-table-center-message-inner"),
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

	/*** tools ***/
		/* showToast */
			window.TOASTTIME = null
			function showToast(data) {
				try {
					// clear existing countdowns
						if (window.TOASTTIME) {
							clearTimeout(window.TOASTTIME)
							window.TOASTTIME = null
						}

					// append
						if (!window.TOAST) {
							window.TOAST = document.createElement("div")
							window.TOAST.id = "toast"
							window.TOAST.setAttribute("visibility", false)
							window.TOAST.setAttribute("success", false)
							document.body.appendChild(window.TOAST)
						}

					// show
						window.TOAST.innerHTML = data.message
						window.TOAST.setAttribute("success", data.success || false)
						window.TOAST.setAttribute("visibility", true)

					// hide
						window.TOASTTIME = setTimeout(function() {
							window.TOAST.setAttribute("visibility", false)
						}, 5000)
				} catch (error) {console.log(error)}
			}

	/*** socket ***/
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
						showToast({success: false, message: error})
					}
					SOCKET.onclose = function() {
						showToast({success: false, message: "disconnected"})
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
					// meta
						// redirect
							if (data.location) {
								window.location = data.location
								return
							}
							
						// failure
							if (!data || !data.success) {
								showToast({success: false, message: data.message || "unknown websocket error"})
								return
							}

						// toast
							if (data.message) {
								showToast(data)
							}

					// ids
						// player id
							if (data.playerId) {
								PLAYERID = data.playerId
							}

					// data
						// game data
							if (data.game) {
								console.log(data) // ???
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
							nameElement.value = player.id
							nameElement.addEventListener(window.TRIGGERS.click, selectPlayer)
						playerElement.appendChild(nameElement)

					// team
						var teamElement = document.createElement("div")
							teamElement.className = "player-team"
						nameElement.appendChild(teamElement)

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
							if (card && card.id) { cardElement.value = card.id }
							if (card && card.color) { cardElement.setAttribute("color", card.color) }
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
					// start?
						if (status.startTime) {
							ELEMENTS.start.form.setAttribute("visibility", false)
							ELEMENTS.gameTable.center.element.removeAttribute("outoffocus")
						}

					// draw
						ELEMENTS.gameTable.center.draw.count.innerText = status.drawCount || 0

					// discard
						ELEMENTS.gameTable.center.discard.count.innerText = status.discardCount || 0

					// message
						ELEMENTS.gameTable.center.message.innerText = status.message ? status.message : (
							(status.phase + " phase") +
							(status.currentTurn ? (PLAYERID && PLAYERID == status.currentTurn ? ": your turn" : ": waiting...") : "")
						)

					// tracker
						for (var i = 0; i < status.trueColors.length; i++) {
							// card
								if (status.trueColors[i]) {
									ELEMENTS.gameTable.center.tracker["round" + (i + 1)].card.setAttribute("color", status.trueColors[i].color)
								}

							// token
								if (status.points[i]) {
									ELEMENTS.gameTable.center.tracker["round" + (i + 1)].token.innerText = status.points[i]
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
								playerElement.style.transform = "translateX(-50%) translateY(-50%) rotate(" + ((players[i].position - countOffset) * angle) + "deg) translateY(200%) "
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
							playerElement.querySelector(".player-team").setAttribute("team", player.team)
						}
						else {
							playerElement.querySelector(".player-team").innerText = "?"
						}

					// if this player is you
						if (player.id == PLAYERID) {
							for (var i in ELEMENTS.gameTable.players) {
								ELEMENTS.gameTable.players[i].removeAttribute("selectedForVote")
							}

							if (player.status && player.status.vote) {
								var votedForPlayer = ELEMENTS.gameTable.players[player.status.vote]
								votedForPlayer.setAttribute("selectedForVote", true)
							}
						}

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
			ELEMENTS.start.form.addEventListener(window.TRIGGERS.submit, startGame)
			function startGame(event) {
				try {
					// sendPost
						SOCKET.send(JSON.stringify({
							action: "startGame"
						}))
				} catch (error) {console.log(error)}
			}

		/* selectPlayer */
			function selectPlayer(event) {
				try {
					// sendPost
						SOCKET.send(JSON.stringify({
							action: "selectPlayer",
							selectedPlayerId: event.target.value
						}))
				} catch (error) {console.log(error)}
			}

		/* selectCard */
			function selectCard(event) {
				try {
					// sendPost
						SOCKET.send(JSON.stringify({
							action: "selectCard",
							selectedCardId: event.target.value
						}))
				} catch (error) {console.log(error)}
			}
})