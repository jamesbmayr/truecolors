# True Colors
True Colors is a multiplayer asymmetrical team card game by James Mayr

---
<pre>
 ________ 
|   /\   |
|/-/  \-\|
|\-\  /-/|
|___\/___|
</pre>
---

## Rules

### Start
All players have a secret role. Most players are Good, but they won't know who is Evil. (See team distribution below.)
At the beginning of each round, a color is revealed in the center. These colors will appear (in a random and unknown order): <b>red, yellow, green, blue, white</b>.
The game has <b>5</b> rounds. Each round is divided into phases.

### Phases
<ol>
	<li>
		<b>Vote</b>
		During this phase, players can see only their own cards. All players select 1 person to start the round. Once a majority agrees on a leader, that player begins the next phase, and turn order continues clockwise.
	</li>
	<li>
		<b>Swap</b>
		On your turn, look at all cards of all players. Select 1 of your own cards and swap it with 1 card of another player. You will only see cards when it is your turn.
	</li>
	<li>
		<b>Toss</b>
		All players look at their own hands and choose 1 card to discard. Other players will not see your selection.
	</li>
	<li>
		<b>Play</b>
		All players look at their own cards and choose 1 card to play. After everyone has selected, these cards will be revealed.
	</li>
	<li>
		<b>Show</b>
		If all the played cards match the round color, the Good team earns a point. Note that some cards (<b>white</b>) are wild and can qualify for any round color.
		But if even 1 card does not match, then Evil earns a point!
	</li>
</ol>
	
### Game End
The game ends after Good or Evil score enough points to win:
<ul>
	<li>Good points: <b>5</b></li>
	<li>Evil points: <b>1</b></li>
</ul>


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
|   |- core.js
|   |- game.js
|   |- session.js
|
|- js
|   |- game.js
|   |- home.js
|   |- main.js
|
|- css
|   |- game.css
|   |- home.css
|   |- main.css
|
|- html
|   |- _404.html
|   |- game.html
|   |- home.html
|
|- assets
	|- logo.png
	|- red.png
	|- yellow.png
	|- green.png
	|- blue.png
	|- white.png
</pre>
