const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
let types={"ice":"","rock":"","water":"","grass":"","ground":"","fire":""};
let page="instructions";
let player={"dir":"down","loc":{"x":0,"y":0},"sprites":{"up":new Image(),"right":new Image(),"down":new Image(),"left":new Image(),"boat":new Image(),"pot":new Image()},"pokemon":[]};
let foundPokemon={"name":"","json":"","hp":0,"lvl":0,"type":"","scream":"","spriteFront":new Image(),"spriteBack":new Image()};
let currentPokemon=0;
let map=new Image();
let bgBattle=new Image();
let bgMinigame=new Image();
let pokeball=new Image();
let userDisplayText="Try Again";
let oppDisplayText="";
let animStep=0;
let displayStep=0;
let mouseClicked=false;
let mouseLoc=[0,0];
let canvasPos = canvas.getBoundingClientRect();
let pokemonLoc=0;
let ballCount=5;
let ballLoc=[];
let launchLoc=[];
let launchLocPrev=[];
let vel=0;
let velPrev=0;
let angle=0;
let anglePrev=0;
let g=10;
let ballTime=Infinity;
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let buffer = null;
let playing=false;
let matchups=
			{"fire":{"fire":0.5,"water":0.5,"grass":2,"ice":2,"ground":1,"rock":0.5}
			,"water":{"fire":2,"water":0.5,"grass":0.5,"ice":1,"ground":2,"rock":2}
			,"grass":{"fire":0.5,"water":2,"grass":0.5,"ice":1,"ground":2,"rock":2}
			,"ice":{"fire":0.5,"water":0.5,"grass":2,"ice":0.5,"ground":2,"rock":1}
			,"ground":{"fire":2,"water":1,"grass":0.5,"ice":1,"ground":1,"rock":2}
			,"rock":{"fire":2,"water":1,"grass":1,"ice":2,"ground":0.5,"rock":1}}
let mapTiles=
			[["ice","ice","ice","ground","ground","ground","ground","ground"]
			,["ice","ice","water","ground","ground","ground","ground","grass"]
			,["ice","ice","water","water","water","water","grass","grass"]
			,["ice","water","water","water","grass","grass","grass","grass"]
			,["water","water","water","grass","grass","grass","grass","grass"]
			,["water","water","water","rock","rock","rock","rock","rock"]
			,["rock","rock","rock","rock","fire","fire","fire","fire"]
			,["rock","rock","rock","fire","fire","fire","fire","fire"]]
function clamp(min,x,max){
	return Math.min(Math.max(min,x),max);
}
function format(str){
	str2="";
	for(let i=0;i<str.length;i++){
		if(i==0||str.charAt(i-1)=="-"){
			str2+=str.charAt(i).toUpperCase()
		}else if(str.charAt(i)=="-"){
			str2+=" ";
		}else{
			str2+=str.charAt(i);
		}
	}
	return str2;
}
function drawTo(ctx,thickness,x1,y1,x2,y2,x3,y3){
	ctx.lineWidth = thickness;
	ctx.beginPath();
	ctx.moveTo(x1,y1);
	ctx.quadraticCurveTo(x2,y2,x3,y3);
	ctx.stroke();
	ctx.lineWidth = 1;
}
function drawThrough(ctx,thickness,x1,y1,x2,y2,x3,y3){
	drawTo(ctx,thickness,x1,y1,2*x2-0.5*x1-0.5*x3,2*y2-0.5*y1-0.5*y3,x3,y3);
}
function drawBaguette(ctx,thickness,x1,y1,vel,angle,g){
	let range=vel*Math.cos(angle)*(vel*Math.sin(angle)+(Math.sqrt(vel*vel*Math.sin(angle)*Math.sin(angle)+2*y1*g)))/g
	let y2=(1-(vel*vel*Math.sin(angle)*Math.cos(angle)/(range*g)))*(y1+Math.tan(angle)*range);
	let x2=(y2-y1)/Math.tan(angle)+x1;
	drawTo(ctx,thickness,x1,500-y1,x2,500-y2,range+x1,500);
}
async function loadData(){	
	const typesarr = await Promise.all(
		Object.keys(types).map(async type => {
			const res = await fetch("https://pokeapi.co/api/v2/type/"+type);
			const data = await res.json();
			return [type, data];
		})
	);
	types=Object.fromEntries(typesarr);
}
async function searchPokemon(loc){ 
	if(Math.random()>0.8){
		let type=mapTiles[player.loc.y][player.loc.x];
		let randPokemon=await getRandomPokemon(type).then((randPokemon)=>{return randPokemon});
		userDisplayText=format(randPokemon.name);
		displayStep=0;
		return randPokemon;
	}else{
		userDisplayText="Try Again";
		displayStep=0;
		return {"name":"","json":"","hp":0,"lvl":0,"type":"","scream":"","spriteFront":new Image(),"spriteBack":new Image()};
	}
}
async function getRandomPokemon(type){
	let randPokemon={"name":"","json":"","hp":0,"lvl":0,"type":"","scream":"","spriteFront":new Image(),"spriteBack":new Image()};
	randPokemon.name=types[type].pokemon[Math.floor((types[type].pokemon.length)*Math.random())].pokemon.name;
	let response= await fetch("https://pokeapi.co/api/v2/pokemon/"+randPokemon.name);
	randPokemon.json=await response.json();
	randPokemon.lvl=Math.floor(Math.random()*100);
	randPokemon.type=type;
	randPokemon.hp=randPokemon.json.stats[0].base_stat;
	await Promise.all([new Promise((resolve) => {
		randPokemon.spriteFront.src = randPokemon.json.sprites.front_default;
		randPokemon.spriteFront.onload = resolve;
	}),
	new Promise((resolve) => {
		randPokemon.spriteBack.src = randPokemon.json.sprites.back_default;
		randPokemon.spriteBack.onload = resolve;
	}),
	new Promise((resolve)=>{
		randPokemon.scream=new Audio(randPokemon.json.cries.latest);
		randPokemon.scream.oncanplaythrough=resolve;
	})]);
	return randPokemon;
}
async function loadImages(){
	await Promise.all([new Promise((resolve)=>{
		player.sprites["up"].src="/assets/player_up.png";
		player.sprites["up"].onload=resolve;
	}),
	new Promise((resolve)=>{
		player.sprites["right"].src="/assets/player_right.png";
		player.sprites["right"].onload=resolve;
	}),
	new Promise((resolve)=>{
		player.sprites["down"].src="/assets/player_down.png";
		player.sprites["down"].onload=resolve;
	}),
	new Promise((resolve)=>{
		player.sprites["left"].src="/assets/player_left.png";
		player.sprites["left"].onload=resolve;
	}),
	new Promise((resolve)=>{
		player.sprites["boat"].src="/assets/player_boat.png";
		player.sprites["boat"].onload=resolve;
	}),
	new Promise((resolve)=>{
		player.sprites["pot"].src="/assets/player_pot.png";
		player.sprites["pot"].onload=resolve;
	}),
	new Promise((resolve)=>{
		map.src="/assets/map.png";
		map.onload=resolve;
	}),
	new Promise((resolve)=>{
		bgBattle.src="/assets/bgBattle.png";
		bgBattle.onload=resolve;
	}),
	new Promise((resolve)=>{
		bgMinigame.src="/assets/bgMinigame.png";
		bgMinigame.onload=resolve;
	}),
	new Promise((resolve)=>{
		pokeball.src="/assets/pokeball.png";
		pokeball.onload=resolve;
	})]);
}
function doAttack(num){
	foundPokemon.scream.play();
	foundPokemon.hp-=Math.ceil((Math.max(0,player.pokemon[currentPokemon].json.stats[1].base_stat-(foundPokemon.json.stats[2].base_stat/2))/10)*matchups[player.pokemon[currentPokemon].type][foundPokemon.type]);
	player.pokemon[currentPokemon].hp-=Math.ceil((Math.max(0,foundPokemon.json.stats[1].base_stat-(player.pokemon[currentPokemon].json.stats[2].base_stat/2))/10)*matchups[foundPokemon.type][player.pokemon[currentPokemon].type]);
	userDisplayText="You Used "+format(player.pokemon[currentPokemon].json.moves[num-1].move.name);
	oppDisplayText=format(foundPokemon.name)+" Used "+format(foundPokemon.json.moves[Math.floor(foundPokemon.json.moves.length*Math.random())].move.name);
	displayStep=0;
	oppRenderStep=0;
	if(matchups[foundPokemon.type][player.pokemon[currentPokemon].type]==2){
		oppDisplayText+=", It was Super Effective";
		oppRenderStep=0;
	}
	if(matchups[player.pokemon[currentPokemon].type][foundPokemon.type]==2){
		userDisplayText+=", It was Super Effective";
		displayStep=0;
	}
	if(matchups[foundPokemon.type][player.pokemon[currentPokemon].type]==0.5){
		oppDisplayText+=", It was not Very Effective";
		oppRenderStep=0;
	}
	if(matchups[player.pokemon[currentPokemon].type][foundPokemon.type]==0.5){
		userDisplayText+=", It was not Very Effective";
		displayStep=0;
	}
	if(foundPokemon.hp<=0){
		oppDisplayText+=" but it Fainted";
		oppRenderStep=0;
		foundPokemon.hp=0;
	}
	if(player.pokemon[currentPokemon].hp<=0){
		userDisplayText+=" but it Fainted";
		displayStep=0;
		player.pokemon[currentPokemon].hp=0;
		currentPokemon++;
	}
}
function render(){
	animStep+=0.1;
	animStep%=10;
	displayStep+=Math.random()/3+0.25;
	let animX=Math.cos(Math.PI*animStep/5);
	let animY=-(Math.sin(Math.PI*animStep/5)**2);
	ctx.font = "25px Pixelify Sans";
	ctx.fillStyle = '#101020';
	ctx.fillRect(0,0,1200,650);
	if(page=="instructions"){
		ctx.font = "40px Pixelify Sans";
		ctx.strokeStyle="#e0e0e0";
		ctx.fillStyle = '#e0e0e0';
		ctx.fillText("Use WASD or arrow keys to move",100,200);
		ctx.fillText("Use Spacebar to capture pokemon and throw pokeballs",100,275);
		ctx.fillText("Press the coresponding number to perform an attack",100,350);
		ctx.fillText("Press Space to continue",100,425);
	}else if(page=="map"){
		ctx.drawImage(map,25,25,512,512);
		let type=mapTiles[player.loc.y][player.loc.x];
		if(type=="water"){
			ctx.drawImage(player.sprites["boat"],25+10+player.loc.x*64,25+10+player.loc.y*64+animY*2,40,40);
		}else if(type=="rock"){
			ctx.drawImage(player.sprites["pot"],25+10+player.loc.x*64,25+10+player.loc.y*64,40,40);
		}else{
			if(player.dir=="up"||player.dir=="down"){
				ctx.drawImage(player.sprites[player.dir],25+10+player.loc.x*64+animX*2,25+10+player.loc.y*64+animY*2,40,40);
			}else{
				ctx.drawImage(player.sprites[player.dir],25+10+player.loc.x*64,25+10+player.loc.y*64+animY*2,40,40);
			}
		}
		if(foundPokemon.name){
			ctx.drawImage(foundPokemon.spriteFront,811+animX*4,36+animY*4,288,288);
		}
		ctx.fillStyle = "#e0e0e0";
		ctx.fillText(userDisplayText, 800, 375);
	}else if(page=="battle"){
		ctx.drawImage(bgBattle,0,0);
		ctx.fillStyle = "#000000";
		ctx.fillRect(5,565,1190,80);
		ctx.drawImage(foundPokemon.spriteFront,811+animX*4,36+animY*4,288,288);
		ctx.fillStyle="#e0e0e0";
		ctx.fillRect(798,373,500,14);
		if(foundPokemon.hp/foundPokemon.json.stats[0].base_stat<1/3){
			ctx.fillStyle = "#f01010";
		}else{
			ctx.fillStyle = "#f09010";
		}
		ctx.fillRect(825,375,300*foundPokemon.hp/foundPokemon.json.stats[0].base_stat,10);
		ctx.fillStyle = "#101010";
		ctx.strokeText(format(foundPokemon.name), 800, 360);
		ctx.fillText(format(foundPokemon.name), 800, 360);
		ctx.strokeText(foundPokemon.hp+"/"+foundPokemon.json.stats[0].base_stat,800,405);
		ctx.fillText(foundPokemon.hp+"/"+foundPokemon.json.stats[0].base_stat,800,405);
		ctx.strokeText("lvl "+foundPokemon.lvl,1070,405);
		ctx.fillText("lvl "+foundPokemon.lvl,1070,405);
		ctx.fillStyle="#10b010";
		ctx.font ="15px Pixelify Sans"
		ctx.fillText("HP", 800, 385);
		
		if(currentPokemon<player.pokemon.length){
			ctx.font = "25px Pixelify Sans";
			ctx.drawImage(player.pokemon[currentPokemon].spriteBack,111-animX*4,111+animY*4,288,288);
			ctx.fillStyle = "#e0e0e0";
			ctx.fillRect(0,433,402,14);
			if(player.pokemon[currentPokemon].hp/player.pokemon[currentPokemon].json.stats[0].base_stat<1/3){
				ctx.fillStyle = "#f01010";
			}else{
				ctx.fillStyle = "#f09010";
			}
			ctx.fillRect(100,435,300*player.pokemon[currentPokemon].hp/player.pokemon[currentPokemon].json.stats[0].base_stat,10);
			ctx.fillStyle = "#101010";
			ctx.strokeText(format(player.pokemon[currentPokemon].name), 75, 425);
			ctx.fillText(format(player.pokemon[currentPokemon].name), 75, 425);
			ctx.strokeText(player.pokemon[currentPokemon].hp+"/"+player.pokemon[currentPokemon].json.stats[0].base_stat,75,465);
			ctx.fillText(player.pokemon[currentPokemon].hp+"/"+player.pokemon[currentPokemon].json.stats[0].base_stat,75,465);
			ctx.strokeText("lvl "+player.pokemon[currentPokemon].lvl,345,465);
			ctx.fillText("lvl "+player.pokemon[currentPokemon].lvl,345,465);
			ctx.fillStyle="#10b010";
			ctx.font ="15px Pixelify Sans"
			ctx.fillText("HP", 75, 445);
			
			ctx.fillStyle = "#f09010";
			ctx.fillRect(750,425,175,50);
			ctx.strokeRect(750,425,175,50);
			ctx.fillStyle="#101010";
			ctx.fillText("(1) "+format(player.pokemon[currentPokemon].json.moves[0].move.name),755,450);
			ctx.fillStyle = "#f09010";
			ctx.fillRect(975,425,175,50);
			ctx.strokeRect(975,425,175,50);
			ctx.fillStyle="#101010";
			ctx.fillText("(2) "+format(player.pokemon[currentPokemon].json.moves[1].move.name),980,450);
			ctx.fillStyle = "#f09010";
			ctx.fillRect(750,500,175,50);
			ctx.strokeRect(750,500,175,50);
			ctx.fillStyle="#101010";
			ctx.fillText("(3) "+format(player.pokemon[currentPokemon].json.moves[2].move.name),755,525);
			ctx.fillStyle = "#f09010";
			ctx.fillRect(975,500,175,50);
			ctx.strokeRect(975,500,175,50);
			ctx.fillStyle="#101010";
			ctx.fillText("(4) "+format(player.pokemon[currentPokemon].json.moves[3].move.name),980,525);
		}
		ctx.font = "30px Pixelify Sans";
		ctx.fillStyle = "#e0e0e0";
		ctx.fillText(userDisplayText.substr(0,displayStep),100,595);
		ctx.fillText(oppDisplayText.substr(0,displayStep-userDisplayText.length),100,625);
		
	}else if(page=="minigame"){
		ctx.drawImage(bgMinigame,0,0);
		ctx.fillStyle = "#000000";
		ctx.fillRect(5,565,1190,80);
		ctx.drawImage(foundPokemon.spriteFront,pokemonLoc+animX*4-46,500-46+animY*4,92,92);
		
		ctx.font = "30px Pixelify Sans";
		ctx.fillStyle = "#e0e0e0";
		ctx.fillText(userDisplayText.substr(0,displayStep),100,595);
		ctx.fillText(oppDisplayText.substr(0,displayStep-userDisplayText.length),100,625);
		if(launchLocPrev){
			ctx.strokeStyle="#707070";
			drawBaguette(ctx,5,launchLocPrev[0],500-launchLocPrev[1],velPrev,Math.PI-anglePrev,g);
		}
		if(foundPokemon.name){
			userDisplayText="You Have "+ballCount+" Pokeballs left";
			if(mouseClicked && ballCount){
				let launchDist=Math.sqrt((mouseLoc[0]-105)*(mouseLoc[0]-105)+(mouseLoc[1]-400)*(mouseLoc[1]-400));
				angle=Math.atan2((mouseLoc[1]-400),(mouseLoc[0]-105));
				if(launchDist>75){
					launchLoc=[105+75*Math.cos(angle),400+75*Math.sin(angle)];
					launchDist=75;
				}else{
					launchLoc=mouseLoc;
				}
				vel=launchDist*1.4;
				ballLoc=launchLoc;

				ctx.strokeStyle="#502010";
				drawThrough(ctx,5,85,400,launchLoc[0],launchLoc[1],125,400);
				ballTime=0;
			}else{
				if(ballTime==0){
					ballCount--;
					displayStep=0;
				}
				ballTime+=0.075;
				ballLoc=[vel*Math.cos(Math.PI+angle)*ballTime+launchLoc[0],vel*Math.sin(Math.PI+angle)*ballTime+g*ballTime*ballTime/2+launchLoc[1]]
				if((ballLoc[0]-pokemonLoc)*(ballLoc[0]-pokemonLoc)+(ballLoc[1]-500+46)*(ballLoc[1]-500+46)<=(46*46*2)){
					userDisplayText="You Caught "+format(foundPokemon.name);
					displayStep=0;
					ballLoc=[];
					launchLocPrev=launchLoc;
					velPrev=vel;
					anglePrev=angle;
					player.pokemon.push(foundPokemon);
					foundPokemon={"name":"","json":"","hp":0,"lvl":0,"type":"","scream":"","spriteFront":new Image(),"spriteBack":new Image()};
				}
				if(ballLoc.length && ballLoc[1]>=500){
					ballLoc=[];
					launchLocPrev=launchLoc;
					velPrev=vel;
					anglePrev=angle;
				}
			}
			if(ballLoc.length&&launchLoc.length){
				ctx.drawImage(pokeball,ballLoc[0]-8,ballLoc[1]-8);
			}else if(ballCount>0){
				ctx.drawImage(pokeball,105-8,400-8);
			}
		}
	}else if(page=="gameover"){
		ctx.fillStyle="#f0f0f0";
		ctx.font = "50px Pixelify Sans";
		ctx.fillText("Game Over",475,325);
	}
}

function loadOST() {
	return fetch('/assets/OST.mp3')
	  .then(response => response.arrayBuffer())
	  .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
	  .then(decodedBuffer => {
		buffer = decodedBuffer;
	  });
	 }
  
function playOST() {
	if (buffer&&!playing) {
		const source = audioContext.createBufferSource();
		source.buffer = buffer;
		source.connect(audioContext.destination);
		source.start(0);	
	}
	playing=true;
}
  window.addEventListener('load', () => {
	loadOST();
  });
  
document.addEventListener('keydown', playOST);

loadData();
loadImages();
setInterval(render, 10);
window.addEventListener('load', loadOST);
window.addEventListener('keydown', function(event) {
	if(page=="instructions"){
		if(event.key==" "){
			page="map";
		}
	}else if(page=="map"){
		switch(event.key){
			case "ArrowUp":
			case "w":
				player.dir="up";
				player.loc.y=clamp(0,player.loc.y-1,7);
				searchPokemon(player.loc).then((randPokemon)=>{foundPokemon=randPokemon;});
			break;
			case "ArrowRight":
			case "d":
				player.dir="right";
				player.loc.x=clamp(0,player.loc.x+1,7);
				searchPokemon(player.loc).then((randPokemon)=>{foundPokemon=randPokemon;});
			break;
			case "ArrowDown":
			case "s":
				player.dir="down";
				player.loc.y=clamp(0,player.loc.y+1,7);
				searchPokemon(player.loc).then((randPokemon)=>{foundPokemon=randPokemon;});
			break;
			case "a":
			case "ArrowLeft":
				player.dir="left";
				player.loc.x=clamp(0,player.loc.x-1,7);
				searchPokemon(player.loc).then((randPokemon)=>{foundPokemon=randPokemon;});
			break;
			case " ":
				if(foundPokemon.name!=""){
					if(player.pokemon==""){ 
						player.pokemon.push(foundPokemon);
						foundPokemon={"name":"","json":"","hp":0,"lvl":0,"type":"","scream":"","spriteFront":new Image(),"spriteBack":new Image()};
						userDisplayText="Starter Chosen";
						displayStep=0;
					}else{
						page="battle";
						foundPokemon.scream.play();
						userDisplayText="";
						oppDisplayText="";
						displayStep=0;
						oppRenderStep=0;
						currentPokemon=0;
						for(let i=0;i<player.pokemon.length;i++){
							player.pokemon[i].hp=player.pokemon[i].json.stats[0].base_stat;
						}
					}
				}
		}
	}else if(page=="battle"){
		if(event.key==" "){
			if(foundPokemon.hp>0&&currentPokemon<player.pokemon.length){
				if(foundPokemon.hp/foundPokemon.json.stats[0].base_stat<1/3){
					page="minigame"
					pokemonLoc=650+Math.random()*400;
					ballCount=5;
					userDisplayText="";
					oppDisplayText="";
					displayStep=0;
					ballLoc=[];
					ballTime=Infinity;
					launchLocPrev=[];
				}else{
					userDisplayText="Couldn't Catch "+format(foundPokemon.name)+" Because its HP is too high";
					oppDisplayText="";
					displayStep=0;
					oppRenderStep=0;
				}
			}else{
				page="gameover";
			}
		}else if("1"<=event.key<="4"){
			if(foundPokemon.hp>0&&currentPokemon<player.pokemon.length&&event.key-1<player.pokemon[currentPokemon].json.moves.length){
				doAttack(event.key);
			}
		}
	}else if(page=="minigame"){
		if(foundPokemon.name==""&&event.key==" "){
			page="map";
		}else if(ballCount==0&&event.key==" "){
			page="map";
			userDisplayText="Couldn't Catch "+format(foundPokemon.name)+" Because You Ran Out of Pokeballs"
			displayStep=0;
		}
	}
});
window.addEventListener(('mousemove'), function(event){
	mouseLoc = [event.clientX-canvasPos.left,event.clientY-canvasPos.top];
});
window.addEventListener(('mousedown'), function(event){
	mouseLoc = [event.clientX-canvasPos.left,event.clientY-canvasPos.top];
	mouseClicked=true;
	if(page=="battle"){
		if(foundPokemon.hp>0&&currentPokemon<player.pokemon.length){
			if(750<=mouseLoc[0] && mouseLoc[0]<=750+175 && 425<=mouseLoc[1] && mouseLoc[1]<=425+50){
				doAttack(1);
			}
			if(975<=mouseLoc[0] && mouseLoc[0]<=975+175 && 425<=mouseLoc[1] && mouseLoc[1]<=425+50){
				doAttack(2);
			}
			if(750<=mouseLoc[0] && mouseLoc[0]<=750+175 && 500<=mouseLoc[1] && mouseLoc[1]<=500+50){
				doAttack(3);
			}
			if(975<=mouseLoc[0] && mouseLoc[0]<=975+175 && 500<=mouseLoc[1] && mouseLoc[1]<=500+50){
				doAttack(4);
			}
		}
	}
});
window.addEventListener(('mouseup'), function(event){
	mouseClicked=false;	
});