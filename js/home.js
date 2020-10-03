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

		/* settings */
			var SETTINGS = {
				backgroundCardDelay: 200,
				backgroundCardHeight: 100,
				backgroundCardWidth: 100,
				colors: ["red", "yellow", "green", "blue", "white"]
			}

	/*** elements ***/
		var ELEMENTS = {
			background: document.querySelector("#background"),
			playerNameInput: document.querySelector("#player-name-input"),
			newGameForm: document.querySelector("#new-game-form"),
			newGameButton: document.querySelector("#new-game-button"),
			joinGameForm: document.querySelector("#join-game-form"),
			gameIdInput: document.querySelector("#game-id-input"),
			joinGameButton: document.querySelector("#join-game-button")
		}

	/*** tools ***/
		/* sendPost */
			function sendPost(options, callback) {
				try {
					// create request object and send to server
						var request = new XMLHttpRequest()
							request.open("POST", location.pathname, true)
							request.onload = function() {
								if (request.readyState !== XMLHttpRequest.DONE || request.status !== 200) {
									callback({success: false, readyState: request.readyState, message: request.status})
									return
								}
								
								callback(JSON.parse(request.responseText) || {success: false, message: "unknown error"})
							}
							request.send(JSON.stringify(options))
				} catch (error) {console.log(error)}
			}

		/* receivePost */
			function receivePost(data) {
				try {
					// redirect
						if (data.location) {
							window.location = data.location
							return
						}

					// message
						if (data.message) {
							showToast(data)
						}
				} catch (error) {console.log(error)}
			}

		/* isNumLet */
			function isNumLet(string) {
				try {
					return (/^[a-zA-Z0-9]+$/).test(string)
				} catch (error) {console.log(error)}
			}

		/* chooseRandom */
			function chooseRandom(options) {
				try {
					if (!Array.isArray(options)) {
						return false
					}
					return options[Math.floor(Math.random() * options.length)]
				}
				catch (error) {console.log(error)}
			}

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
						setTimeout(function() {
							window.TOAST.innerHTML = data.message
							window.TOAST.setAttribute("success", data.success || false)
							window.TOAST.setAttribute("visibility", true)
						}, 200)

					// hide
						window.TOASTTIME = setTimeout(function() {
							window.TOAST.setAttribute("visibility", false)
						}, 5000)
				} catch (error) {console.log(error)}
			}

	/*** submits ***/
		/* submitNewGame */
			ELEMENTS.newGameForm.addEventListener(window.TRIGGERS.submit, submitNewGame)
			function submitNewGame(event) {
				try {
					// validation
						var playerName = ELEMENTS.playerNameInput.value || null
						if (!playerName || playerName.length < 4 || playerName.length > 16 || !isNumLet(playerName)) {
							showToast({success: false, message: "name must be 4-16 letters & numbers"})
							return
						}

					// post
						sendPost({
							action: "createGame",
							name: playerName
						}, receivePost)
				} catch (error) {console.log(error)}
			}

		/* submitJoinGame */
			ELEMENTS.joinGameForm.addEventListener(window.TRIGGERS.submit, submitJoinGame)
			function submitJoinGame(event) {
				try {
					// validation
						var playerName = ELEMENTS.playerNameInput.value || null
						if (!playerName || playerName.length < 4 || playerName.length > 16 || !isNumLet(playerName)) {
							showToast({success: false, message: "name must be 4-16 letters & numbers"})
							return
						}

						var gameId = ELEMENTS.gameIdInput.value || null
						if (!gameId || gameId.length !== 4 || !isNumLet(gameId)) {
							showToast({success: false, message: "game id must be 4 letters & numbers"})
							return
						}

					// post
						sendPost({
							action: "joinGame",
							name: playerName,
							gameId: gameId
						}, receivePost)
				} catch (error) {console.log(error)}
			}

	/*** background ***/
		/* updateBackground */
			var updateBackgroundLoop = null
			function updateBackground() {
				try {
					// get current cards
						var cards = Array.from(document.querySelectorAll(".background-card"))

					// pick randomly
						var card = chooseRandom(cards)
						var color = card.className.replace("background-card ", "")
					
					// new color
						do {
							var newColor = chooseRandom(SETTINGS.colors)
						}
						while (color == newColor)

					// update
						card.className = "background-card " + newColor
				} catch (error) {console.log(error)}
			}

		/* buildBackground */
			buildBackground()
			window.addEventListener(window.TRIGGERS.resize, buildBackground)
			function buildBackground() {
				try {
					// get dimensions
						var rect = ELEMENTS.background.getBoundingClientRect()

					// fill page
						do {
							// get current count
								var cardCount = Array.from(document.querySelectorAll(".background-card")).length
								var areaCovered = cardCount * SETTINGS.backgroundCardHeight * SETTINGS.backgroundCardWidth

							// create card
								var cardElement = document.createElement("div")
									cardElement.className = "background-card " + chooseRandom(SETTINGS.colors)
									cardElement.style.height = SETTINGS.backgroundCardHeight + "px"
									cardElement.style.width  = SETTINGS.backgroundCardWidth + "px"
								ELEMENTS.background.appendChild(cardElement)
						}
						while (areaCovered < rect.height * rect.width)

					// loop
						if (!updateBackgroundLoop) {
							updateBackgroundLoop = setInterval(updateBackground, SETTINGS.backgroundCardDelay)
						}
				} catch (error) {console.log(error)}
			}
})