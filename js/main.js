window.addEventListener("load", function() {
	/*** globals ***/
		/* function library */
			window.FUNCTIONS = window.FUNCTIONS || {}

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

	/*** checks ***/
		/* isNumLet */
			window.FUNCTIONS.isNumLet = isNumLet
			function isNumLet(string) {
				try {
					return (/^[a-zA-Z0-9]+$/).test(string)
				} catch (error) {console.log(error)}
			}

	/*** tools ***/
		/* duplicateObject */
			window.FUNCTIONS.duplicateObject = duplicateObject
			function duplicateObject(obj) {
				try {
					if (typeof obj == "object") {
						return JSON.parse(JSON.stringify(obj))
					}
					else {
						return obj
					}
				} catch (error) {console.log(error)}
			}

		/* sendPost */
			window.FUNCTIONS.sendPost = sendPost
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

		/* showToast */
			window.TOASTTIME = null
			window.FUNCTIONS.showToast = showToast
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
})
