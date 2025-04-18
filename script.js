const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
let types={"ice":"","rock":"","water":"","grass":"","ground":"","fire":""};
let page="loading";
let dataLoaded=false;
let imagesLoaded=false;
let player={"dir":"down","loc":{"x":0,"y":0},"sprites":{"up":new Image(),"right":new Image(),"down":new Image(),"left":new Image()},"pokemon":[]};
let foundPokemon={"name":"","json":"","hp":0,"spriteFront":new Image(),"spriteBack":new Image()};
let currentPokemon=0;
let map=new Image();
let userDisplayText="Try Again";
let oppDisplayText="";
let animStep=0;
let mapTiles=
			[["ice","ice","ice","rock","rock","rock","rock","rock"]
			,["ice","ice","water","rock","rock","rock","rock","grass"]
			,["ice","ice","water","water","water","water","grass","grass"]
			,["ice","water","water","water","grass","grass","grass","grass"]
			,["water","water","water","grass","grass","grass","grass","grass"]
			,["water","water","water","ground","ground","ground","ground","ground"]
			,["ground","ground","ground","ground","fire","fire","fire","fire"]
			,["ground","ground","ground","fire","fire","fire","fire","fire"]]
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
	//TODO revert after testing 
	if(Math.random()>-0.8){
		let type=mapTiles[player.loc.y][player.loc.x];
		return getRandomPokemon(type).then((randPokemon)=>{return randPokemon});
	}else{
		userDisplayText="Try Again";
		return {"name":"","json":"","sprite":new Image()};
	}
}
async function getRandomPokemon(type){
	let randPokemon={"name":"","json":"","hp":0,"spriteFront":new Image(),"spriteBack":new Image()};
	randPokemon.name=types[type].pokemon[Math.floor((types[type].pokemon.length)*Math.random())].pokemon.name;
	let response= await fetch("https://pokeapi.co/api/v2/pokemon/"+randPokemon.name);
	randPokemon.json=await response.json();
	randPokemon.hp=randPokemon.json.stats[0].base_stat;
	await Promise.all([new Promise((resolve) => {
		randPokemon.spriteFront.onload = resolve;
		randPokemon.spriteFront.src = randPokemon.json.sprites.front_default;
	}),
	new Promise((resolve) => {
		randPokemon.spriteBack.onload = resolve;
		randPokemon.spriteBack.src = randPokemon.json.sprites.back_default;
	})]);
	return randPokemon;
}
function loadImages(){
	player.sprites["up"].src="player_up.png";
	player.sprites["right"].src="player_right.png";
	player.sprites["down"].src="player_down.png";
	player.sprites["left"].src="player_left.png";
	map.src="map.png";
	//TODO fix with async
	page="map";
}
function render(){
	animStep+=1;
	animStep%=10;
	let animX=Math.cos(Math.PI*animStep/5);
	let animY=-(Math.sin(Math.PI*animStep/5)**2);
	ctx.font = "25px Arial";
	ctx.fillStyle = '#101020';
	ctx.fillRect(0,0,1200,650);
	if(page=="loading"){
		//TODO add loading screen
	}else if(page=="map"){
		ctx.drawImage(map,25,25,512,512);
		if(player.dir=="up"||player.dir=="down"){
			ctx.drawImage(player.sprites[player.dir],16+10+player.loc.x*64+animX*2,16+10+player.loc.y*64+animY*2,40,40);
		}else{
			ctx.drawImage(player.sprites[player.dir],16+10+player.loc.x*64,16+10+player.loc.y*64+animY*2,40,40);
		}
		
		if(foundPokemon.name){
			ctx.drawImage(foundPokemon.spriteFront,811+animX*4,43+animY*4,288,288);
			ctx.fillStyle = "#e0e0e0";
			ctx.fillText(foundPokemon.name, 800, 350);
		}else{
			ctx.fillStyle = "#e0e0e0";
			ctx.fillText(userDisplayText, 800, 375);
		}
	}else if(page=="battle"){
		ctx.drawImage(foundPokemon.spriteFront,811+animX*4,43+animY*4,288,288);
		ctx.fillStyle = "#10b010";
		ctx.fillRect(800,375,300*foundPokemon.hp/foundPokemon.json.stats[0].base_stat,25);
		ctx.fillStyle = "#e0e0e0";
		ctx.fillText(foundPokemon.name, 800, 350);
		ctx.fillText(foundPokemon.hp,800,400);
		
		if(currentPokemon<player.pokemon.length){
			ctx.drawImage(player.pokemon[currentPokemon].spriteBack,111-animX*4,229+animY*4,288,288);
			ctx.fillStyle = "#10b010";
			ctx.fillRect(100,575,300*player.pokemon[currentPokemon].hp/player.pokemon[currentPokemon].json.stats[0].base_stat,25);
			ctx.fillStyle = "#e0e0e0";
			ctx.fillText(player.pokemon[currentPokemon].name, 100, 550);
			ctx.fillText(player.pokemon[currentPokemon].hp,100,600);
			ctx.font = "15px Arial";
			if(player.pokemon[currentPokemon].json.abilities[0]){
				ctx.fillStyle = "#909090";
				ctx.fillRect(750,450,175,50);
				ctx.fillStyle="#101010";
				ctx.fillText("(1) "+player.pokemon[currentPokemon].json.abilities[0].ability.name,755,475);
			}
			if(player.pokemon[currentPokemon].json.abilities[1]){
				ctx.fillStyle = "#909090";
				ctx.fillRect(975,450,175,50);
				ctx.fillStyle="#101010";
				ctx.fillText("(2) "+player.pokemon[currentPokemon].json.abilities[1].ability.name,980,475);
			}
			if(player.pokemon[currentPokemon].json.abilities[2]){
				ctx.fillStyle = "#909090";
				ctx.fillRect(750,525,175,50);
				ctx.fillStyle="#101010";
				ctx.fillText("(3) "+player.pokemon[currentPokemon].json.abilities[2].ability.name,755,550);
			}
			if(player.pokemon[currentPokemon].json.abilities[3]){
				ctx.fillStyle = "#909090";
				ctx.fillRect(975,525,175,50);
				ctx.fillStyle="#101010";
				ctx.fillText("(4) "+player.pokemon[currentPokemon].json.abilities[3].ability.name,980,550);
			}
		}
		ctx.font = "15px Arial";
		ctx.fillStyle = "#e0e0e0";
		ctx.fillText(userDisplayText,100,630);
		ctx.fillText(oppDisplayText,800,60);
		
	}
}
loadData();
loadImages();
setInterval(render, 100);
window.addEventListener('keydown', function(event) {
	if(page=="map"){
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
						foundPokemon={"name":"","json":"","hp":0,"spriteFront":new Image(),"spriteBack":new Image()};
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
					foundPokemon={"name":"","json":"","hp":0,"spriteFront":new Image(),"spriteBack":new Image()};
				}else{
					userDisplayText="Couldn't Catch "+foundPokemon.name;
				}
			}else{
				page="map";
			}
		}else if("1"<=event.key<="4"){
			if(currentPokemon<player.pokemon.length&&event.key-1<player.pokemon[currentPokemon].json.abilities.length){
				//Add sound
				foundPokemon.hp-=player.pokemon[currentPokemon].json.stats[1].base_stat-(foundPokemon.json.stats[2].base_stat/2);
				player.pokemon[currentPokemon].hp-=foundPokemon.json.stats[1].base_stat-(player.pokemon[currentPokemon].json.stats[2].base_stat/2);
				userDisplayText="You Used "+player.pokemon[currentPokemon].json.abilities[event.key-1].ability.name;
				oppDisplayText=foundPokemon.name+" Used "+foundPokemon.json.abilities[Math.floor(foundPokemon.json.abilities.length*Math.random())].ability.name;
				if(foundPokemon.hp<=0){
					oppDisplayText+=" and Fainted";
					foundPokemon.hp=0;
				}
				if(player.pokemon[currentPokemon].hp<=0){
					currentPokemon++;
					userDisplayText+=" and Fainted";
					player.pokemon[currentPokemon].hp=0;
				}
			}
		}
	}
});
