window.addEventListener("load", function() {
	/*** elements ***/
		var ELEMENTS = {
			playerNameInput: document.querySelector("#player-name-input"),
			newGameForm: document.querySelector("#new-game-form"),
			newGameButton: document.querySelector("#new-game-button"),
			joinGameForm: document.querySelector("#join-game-form"),
			gameIdInput: document.querySelector("#game-id-input"),
			joinGameButton: document.querySelector("#join-game-button")
		}

	/*** receives ***/
		/* receivePost */
			function receivePost(data) {
				// redirect
					if (data.location) {
						window.location = data.location
						return
					}

				// message
					if (data.message) {
						window.FUNCTIONS.showToast(data)
					}
			}

	/*** submits ***/
		/* submitNewGame */
			ELEMENTS.newGameForm.addEventListener(window.TRIGGERS.submit, submitNewGame)
			function submitNewGame(event) {
				// validation
					var playerName = ELEMENTS.playerNameInput.value || null
					if (!playerName || playerName.length < 4 || playerName.length > 16 || !window.FUNCTIONS.isNumLet(playerName)) {
						window.FUNCTIONS.showToast({success: false, message: "name must be 4-16 letters & numbers"})
						return
					}

				// post
					window.FUNCTIONS.sendPost({
						action: "createGame",
						name: playerName
					}, receivePost)
			}

		/* submitJoinGame */
			ELEMENTS.joinGameForm.addEventListener(window.TRIGGERS.submit, submitJoinGame)
			function submitJoinGame(event) {
				// validation
					var playerName = ELEMENTS.playerNameInput.value || null
					if (!playerName || playerName.length < 4 || playerName.length > 16 || !window.FUNCTIONS.isNumLet(playerName)) {
						window.FUNCTIONS.showToast({success: false, message: "name must be 4-16 letters & numbers"})
						return
					}

					var gameId = ELEMENTS.gameIdInput.value || null
					if (!gameId || gameId.length !== 4 || !window.FUNCTIONS.isNumLet(gameId)) {
						window.FUNCTIONS.showToast({success: false, message: "game id must be 4 letters & numbers"})
						return
					}

				// post
					window.FUNCTIONS.sendPost({
						action: "joinGame",
						name: playerName,
						gameId: gameId
					}, receivePost)
			}
})