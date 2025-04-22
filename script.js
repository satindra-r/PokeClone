const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
let types={"ice":"","rock":"","water":"","grass":"","ground":"","fire":""};
let page="instructions";
let player={"dir":"down","loc":{"x":0,"y":0},"sprites":{"up":new Image(),"right":new Image(),"down":new Image(),"left":new Image()},"pokemon":[]};
let foundPokemon={"name":"","json":"","hp":0,"lvl":0,"type":"","scream":"","spriteFront":new Image(),"spriteBack":new Image()};
let currentPokemon=0;
let map=new Image();
let bg=new Image();
let userDisplayText="Try Again";
let oppDisplayText="";
let animStep=0;
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
	if(Math.random()>-0.8){
		let type=mapTiles[player.loc.y][player.loc.x];
		return getRandomPokemon(type).then((randPokemon)=>{return randPokemon});
	}else{
		userDisplayText="Try Again";
		return {"name":"","json":"","sprite":new Image()};
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
		player.sprites["up"].src="player_up.png";
		player.sprites["up"].onload=resolve;
	}),
	new Promise((resolve)=>{
		player.sprites["right"].src="player_right.png";
		player.sprites["right"].onload=resolve;
	}),
	new Promise((resolve)=>{
		player.sprites["down"].src="player_down.png";
		player.sprites["down"].onload=resolve;
	}),
	new Promise((resolve)=>{
		player.sprites["left"].src="player_left.png";
		player.sprites["left"].onload=resolve;
	}),
	new Promise((resolve)=>{
		map.src="map.png";
		map.onload=resolve;
	}),
	new Promise((resolve)=>{
		bg.src="bg.png";
		bg.onload=resolve;
	})])
	player.sprites["right"].src="player_right.png";
	player.sprites["down"].src="player_down.png";
	player.sprites["left"].src="player_left.png";
	map.src="map.png";
}
function render(){
	animStep+=0.1;
	animStep%=10;
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
		if(player.dir=="up"||player.dir=="down"){
			ctx.drawImage(player.sprites[player.dir],25+10+player.loc.x*64+animX*2,25+10+player.loc.y*64+animY*2,40,40);
		}else{
			ctx.drawImage(player.sprites[player.dir],25+10+player.loc.x*64,25+10+player.loc.y*64+animY*2,40,40);
		}
		
		if(foundPokemon.name){
			ctx.drawImage(foundPokemon.spriteFront,811+animX*4,36+animY*4,288,288);
			ctx.fillStyle = "#e0e0e0";
			ctx.fillText(foundPokemon.name, 800, 350);
		}else{
			ctx.fillStyle = "#e0e0e0";
			ctx.fillText(userDisplayText, 800, 375);
		}
	}else if(page=="battle"){
		ctx.drawImage(bg,0,0);
		ctx.fillStyle = "#000000";
		ctx.fillRect(5,565,1190,80);
		ctx.drawImage(foundPokemon.spriteFront,811+animX*4,36+animY*4,288,288);
		ctx.fillStyle="#e0e0e0";
		ctx.fillRect(798,373,500,14);
		ctx.fillStyle = "#f09010";
		ctx.fillRect(825,375,300*foundPokemon.hp/foundPokemon.json.stats[0].base_stat,10);
		ctx.fillStyle = "#101010";
		ctx.strokeText(foundPokemon.name, 800, 360);
		ctx.fillText(foundPokemon.name, 800, 360);
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
			ctx.fillStyle = "#f09010";
			ctx.fillRect(100,435,300*player.pokemon[currentPokemon].hp/player.pokemon[currentPokemon].json.stats[0].base_stat,10);
			ctx.fillStyle = "#101010";
			ctx.strokeText(player.pokemon[currentPokemon].name, 75, 425);
			ctx.fillText(player.pokemon[currentPokemon].name, 75, 425);
			ctx.strokeText(player.pokemon[currentPokemon].hp+"/"+player.pokemon[currentPokemon].json.stats[0].base_stat,75,465);
			ctx.fillText(player.pokemon[currentPokemon].hp+"/"+player.pokemon[currentPokemon].json.stats[0].base_stat,75,465);
			ctx.strokeText("lvl "+player.pokemon[currentPokemon].lvl,345,465);
			ctx.fillText("lvl "+player.pokemon[currentPokemon].lvl,345,465);
			ctx.fillStyle="#10b010";
			ctx.font ="15px Pixelify Sans"
			ctx.fillText("HP", 75, 445);
			
			ctx.fillStyle = "#909090";
			ctx.fillRect(750,425,175,50);
			ctx.fillStyle="#101010";
			ctx.fillText("(1) "+player.pokemon[currentPokemon].json.moves[0].move.name,755,450);
			ctx.fillStyle = "#909090";
			ctx.fillRect(975,425,175,50);
			ctx.fillStyle="#101010";
			ctx.fillText("(2) "+player.pokemon[currentPokemon].json.moves[1].move.name,980,450);
			ctx.fillStyle = "#909090";
			ctx.fillRect(750,500,175,50);
			ctx.fillStyle="#101010";
			ctx.fillText("(3) "+player.pokemon[currentPokemon].json.moves[2].move.name,755,525);
			ctx.fillStyle = "#909090";
			ctx.fillRect(975,500,175,50);
			ctx.fillStyle="#101010";
			ctx.fillText("(4) "+player.pokemon[currentPokemon].json.moves[3].move.name,980,525);
		}
		ctx.font = "30px Pixelify Sans";
		ctx.fillStyle = "#e0e0e0";
		ctx.fillText(userDisplayText,100,595);
		ctx.fillText(oppDisplayText,100,625);
		
	}
}
loadData();
loadImages();
setInterval(render, 10);
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
					}else{
						page="battle";
						userDisplayText="";
						oppDisplayText="";
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
				if(Math.random()>foundPokemon.hp/foundPokemon.json.stats[0].base_stat){
					userDisplayText="You Caught "+foundPokemon.name;
					player.pokemon.push(foundPokemon);
					foundPokemon={"name":"","json":"","hp":0,"lvl":0,"type":"","scream":"","spriteFront":new Image(),"spriteBack":new Image()};
					page="map"
				}else{
					userDisplayText="Couldn't Catch "+foundPokemon.name;
					oppDisplayText="";
				}
			}else{
				page="map";
				foundPokemon={"name":"","json":"","hp":0,"lvl":0,"type":"","scream":"","spriteFront":new Image(),"spriteBack":new Image()};
				userDisplayText="Try Again";
			}
		}else if("1"<=event.key<="4"){
			if(foundPokemon.hp>0&&currentPokemon<player.pokemon.length&&event.key-1<player.pokemon[currentPokemon].json.moves.length){
				foundPokemon.scream.play();
				foundPokemon.hp-=Math.ceil((Math.max(0,player.pokemon[currentPokemon].json.stats[1].base_stat-(foundPokemon.json.stats[2].base_stat/2))/10)*matchups[player.pokemon[currentPokemon].type][foundPokemon.type]);
				player.pokemon[currentPokemon].hp-=Math.ceil((Math.max(0,foundPokemon.json.stats[1].base_stat-(player.pokemon[currentPokemon].json.stats[2].base_stat/2))/10)*matchups[foundPokemon.type][player.pokemon[currentPokemon].type]);
				userDisplayText="You Used "+player.pokemon[currentPokemon].json.moves[event.key-1].move.name;
				oppDisplayText=foundPokemon.name+" Used "+foundPokemon.json.moves[Math.floor(foundPokemon.json.moves.length*Math.random())].move.name;
				if(matchups[foundPokemon.type][player.pokemon[currentPokemon].type]==2){
					oppDisplayText+=", It was super effective";
				}
				if(matchups[player.pokemon[currentPokemon].type][foundPokemon.type]==2){
					userDisplayText+=", It was super effective";
				}
				if(matchups[foundPokemon.type][player.pokemon[currentPokemon].type]==0.5){
					oppDisplayText+=", It was not very effective";
				}
				if(matchups[player.pokemon[currentPokemon].type][foundPokemon.type]==0.5){
					userDisplayText+=", It was not very effective";
				}
				if(foundPokemon.hp<=0){
					oppDisplayText+=" but it fainted";
					foundPokemon.hp=0;
				}
				if(player.pokemon[currentPokemon].hp<=0){
					userDisplayText+=" but it fainted";
					player.pokemon[currentPokemon].hp=0;
					currentPokemon++;
				}
			}
		}
	}
});
