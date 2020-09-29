# True Colors


---
<pre>
</pre>
---

## Application

## Code
The app is powered by nodeJS, written in 100% raw javascript.
It uses the following packages:
* *websocket*: for real-time communication between client and server

---
<pre>
truecolors
|
|- package.json
|
|- index.js
|
|- node_modules
|   |- websocket
|
|- node
|   |- core.js (logError, logStatus, logMessage, logTime; getEnvironment, getContentType, getSchema, getAsset; isNumLet; renderHTML, constructHeaders, duplicateObject, alphabetizeArray; hashRandom, generateRandom, chooseRandom, rollRandom; accessDatabase)
|   |- game.js (createOne; readOne, unreadOne; updateOne; deleteOne)
|   |- home.js (signIn, signOut)
|   |- session.js (createOne; readOne; updateOne)
|
|- js
|   |- game.js ()
|   |- home.js (submitSignUp, submitSignIn; switchSignUp, switchSignIn)
|   |- main.js (isNumLet; duplicateObject, sendPost, showToast; searchSelect, selectOption, cancelSearch; generateRandom, sortRandom; resizeCanvas, clearCanvas, translateCanvas, rotateCanvas, drawLine, drawCircle, drawRectangle, drawImage, drawText)
|
|- css
|   |- game.css
|   |- main.css
|
|- html
|   |- _404.html
|   |- game.html
|   |- home.html
|
|- assets
	|- logo.png
</pre>
