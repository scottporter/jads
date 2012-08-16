// *************************
// ****  Entidade Heroi ****
// *************************
var HeroeEntity = me.ObjectEntity.extend({
	//Construtor:
	init:	function (x , y , settings){
		//Definir propriedades do objecto heroi na classe em vez de no mapa:
		settings.image="h_male01"; 
		settings.spritewidth=32;

		// Chamar o contrutor
		this.parent(x, y , settings);
		
		// This move
		this.movemouse = false;
		
		this.distancetotargetx = 0;
		this.distancetotargety = 0;
		this.xydivision = 0;
		
		// Configurar velocidade do jogador
		this.setVelocity(3, 3);
		
		// Configurar velocidade de travagem
		// Valores maiores tempo de travagem menor
		this.setFriction(0.5, 0.5);
		
		// adjust the bounding box
		this.updateColRect(4,24,20,23); 
		
		// disable gravity
		this.gravity = 0;
		
		//Direção inicial
		this.direction = 'down';
		
		this.collidable= true;

		//Config npc's animation
		this.addAnimation("stand-down", [4]);
		this.addAnimation("stand-left", [8]);
		this.addAnimation("stand-up", [1]);
		this.addAnimation("stand-right", [11]);
		this.addAnimation("down", [3,4,5,4]);
		this.addAnimation("left", [6,7,8]);
		this.addAnimation("up", [0,1,2,1]);
		this.addAnimation("right", [9,10,11]);
		
		// Define point of click on mouse :
		this.dest_point_X = 0;
		this.dest_point_Y = 0; 
				 
		// set the display to follow our position on both axis
		me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH);
		
		//TESTING.... 
		this.makeOneTime = true;
	},


	//Update player position.
	update : function ()
	{		
		if (me.input.isKeyPressed('left'))
		{
			this.animationspeed = me.sys.fps / 20;
			this.vel.x = -this.accel.x * me.timer.tick;
			this.setCurrentAnimation('left');
			this.direction = 'left';			
		}
		else if (me.input.isKeyPressed('right'))
		{
			this.animationspeed = me.sys.fps / 20;
			this.vel.x = this.accel.x * me.timer.tick 
			this.setCurrentAnimation('right')
			this.direction = 'right'
		}

		if (me.input.isKeyPressed('up'))
		{
			this.animationspeed = me.sys.fps / 20;
			this.vel.y = -this.accel.y * me.timer.tick 
			this.setCurrentAnimation('up')
			this.direction = 'up'
		}
		else if (me.input.isKeyPressed('down'))
		{
			this.animationspeed = me.sys.fps / 20;
			this.vel.y = this.accel.y * me.timer.tick 
			this.setCurrentAnimation('down')
			this.direction = 'down'
		}
	
		// If player Stop set stand animationa
		if (this.vel.y == 0 && this.vel.x == 0)
		{
			this.setCurrentAnimation('stand-' + this.direction)
		}

		// If question box is showing then stop the player
		if (showingQuestion){
			this.setCurrentAnimation('stand-' + this.direction);
			this.vel.x = 0;
			this.vel.y = 0;
		}		

		// Actaualizar colisão
		var res = me.game.collide(this);
		
		
		//  --- TESTING which OBJECT ---
		if (res){
			if (res.obj.type == 'NPC_OBJECT') {

				this.setCurrentAnimation('stand-' + this.direction);
			}
			
			if (res.obj.type == 'ITEM_OBJECT') {
				this.setCurrentAnimation('stand-' + this.direction);
				this.vel.x = 0;
				this.vel.y = 0;
			}
		}

		// check & update player movement
		updated = this.updateMovement();

		// update animation
		if (updated)
		{
			// Actualizar animação
			this.parent(this);
		}

		return updated;

	}
});
// *****************************
// ****  Fim Entidade Heroi ****
// *****************************



// *************************
// ****  Entidade Item  ****
// *************************
var ItemEntity = me.CollectableEntity.extend({
	
	//Construtor:
	init:	function (x , y , settings , items_data){
		// Chamar o contrutor
		this.parent(x, y , settings);
		// Item data
		this.items_data = items_data;
		
		// Random question number between 0 and number of question less one 
		var rndQuestion = randomInt( 0 , (countQtn - 1) );
		this.rndQtnData = adsQtnData[rndQuestion];
		
		this.type = 'ITEM_OBJECT';

	},
	
	onCollision : function (res, obj)
	{
		var res = me.game.collide( this );
        if( res ) {
			if( res.obj.name == 'heroe' ) {				
				// If the answer is correct then update HUD and remove item
				heroeAnswer = showQuestionLayer(this.items_data , this.rndQtnData);
				if (heroeAnswer != -1)
				{
					if ( heroeAnswer == this.rndQtnData.correta){ // if heroe correct answer			
						me.game.HUD.updateItemValue(this.items_data.categoria, parseInt(this.items_data.valor));
						
						//Keep data for all items found by the heroe
						heroeItems.push(this.items_data);
						
						hideQuestionLayer('C');
					}else if(heroeAnswer != 0){ // if heroe answer to the question but it's not the correct one
						me.game.HUD.updateItemValue(this.items_data.categoria, -(parseInt(this.items_data.valor)));
						hideQuestionLayer('W');
					}else{ // If heroe doesn't answer to the question
						hideQuestionLayer('D');
					}
					me.game.remove(this);
				}
			}
		}
	}
});

// **************************************
// ****  Distribuir items pelo mapa  ****
// **************************************
var ItemSpawnEntity = me.InvisibleEntity.extend({
	
	//Construtor:
    init: function(x, y, settings) {
        this.parent(x, y, settings);
        this.gravity = 0;
		
		var item = [];
		
		var count = 0;
		
		var collision_layer = me.game.currentLevel.getLayerByName("collision");
		
		// parse all the collision layer tiles 
		for ( var x = 0; x < collision_layer.width; x++) 
		{ 
		   for ( var y = 0; y < collision_layer.height; y++) 
		   { 
				var testTile = collision_layer.layerData[x][y];   
				
				// If tile of layer collision is null then we can put an item
				if (testTile == null){
					// Item probability
					var item_probability = Number.prototype.random(0, 30);
					// Total of items
					total_items = ads_items_data.length - 1;
					random_item = Number.prototype.random(0, total_items);					
					if ( item_probability == 5 ){
						item[count] = new ItemEntity(parseInt(32*x), parseInt(32*y), 
								{image: ads_items_data[random_item].imagem.replace(".png",""),
								spritewidth: 32, spriteheight: 32}, ads_items_data[random_item]);
						count++;
						// console.log("Populate Map... X:" + parseInt(32*x) +
									// "   Y:" + parseInt(32*y) + 
									// " dss  Count:" + count + "    Item: " + random_item);
					}
				
				}
		   } 
		} 

		// Adicionar items na camada 2
		$.each(item, function(i, item){
			me.game.add(item,3);
			me.game.sort();
		});	

		// ** DEBUG ADD kEYS - Chave osso - ADD KEYS from the gamedata.json
		item = new ItemEntity(parseInt(32*9), parseInt(32*5), 
		{image: ads_items_data[15].imagem.replace(".png",""),
		spritewidth: 32, spriteheight: 32}, ads_items_data[15]);
		me.game.add(item,3);
		me.game.sort();
		// **************************************************************
		
	}
});

// **************************************
// ****  TEST INVISIBLE ENTITY  ****
// **************************************
var TriggerEntity = me.InvisibleEntity.extend({
	
	//Constructor
	init: function( x , y , settings , triggerData){
		
		this.parent(x, y , settings );
		
		this.collidable = true;
		
		this.triggerData = triggerData;
		
		// prepare data to message box
		this.msgData = {};
		this.msgData.msgImage = 'sprites/items/' + triggerData.imageName;
		this.msgData.msgName = "Mensagem:";
		this.msgData.msg = triggerData.message;		
		
		this.type = triggerData.type;
		
		// If trigger is a door get layer door and coolision. Set where the door open
		if (this.type == 'DOOR_OBJECT'){
			this.doorLayer = me.game.currentLevel.getLayerByName("door");
			this.collisionLayer = me.game.currentLevel.getLayerByName("collision");
			
			this.openX = this.triggerData.tileTarget.x;
			this.openY = this.triggerData.tileTarget.y;
		
			//Check if door is open
			this.tileTarget = false;
			
			// Enable/disable dialogue box
			this.showMessage = false;
		}

	},

	update : function (){
		// Check collision
		var res = me.game.collide( this );
        if( res ) {
			if( res.obj.name == 'heroe' ) {
				if (this.type == 'DOOR_OBJECT'){
					var solution = this.triggerData.solution;
					var openDoor = false;
					
					//check if heroe have the key			
					$.each(heroeItems, function(i,data)
					{
						if (data.valor == solution){
							console.log('Heroe have the key.');
							openDoor = true;
							return false;
						}
					});
		
					if (openDoor){
						// Open the door
						this.doorLayer.clearTile(this.openX,this.openY);
						this.collisionLayer.clearTile(this.openX,this.openY);
						
						//***** TEST TELEPORT AND FADE MAP
						var player = me.game.getEntityByName('Heroe');
						
						player[0].pos.x = 46*32;
						player[0].pos.y = 5*32;
						//TODO - Fade out /in viewport 
						me.game.viewport.fadeOut('#000000',1000);

						//Remove this object
						me.game.remove(this);
					}else{
						console.log("Heroe don't have the key.");
						adsGame.message.show(this.msgData);
					}	
				} // End door object
			} // End heroe collision
		}else{
			if (this.type == 'DOOR_OBJECT')
				adsGame.message.hide();
			
		}
	}
});

// **************************************
// ****  TEST INVISIBLE ENTITY SPAWN ****
// **************************************
var TriggerSpawnEntity = me.InvisibleEntity.extend({
	//Constructor
	init: function( x , y , settings){
		// call the parent constructor
		this.parent(x, y, settings);
		
		var triggerData = {};
		triggerData.coordinates = {x:6,y:10};
		triggerData.type = 'DOOR_OBJECT';
		triggerData.tileTarget = {x:6,y:10};
		triggerData.message = "Precisas da Chave Caveira<br>para abrir a porta.";
		triggerData.imageName = "chaveosso.png";
		triggerData.solution = "chaveosso";
		
		
		var settings = {};
		settings.width = 32;
		settings.height = 32;
		
		// Door = new DoorEntity( 6*32 , 9*32, {image: "doorcheck", spritewidth: 32, spriteheight: 32});
		heroeDoorCell = new TriggerEntity( 6*32 , 9*32, settings , triggerData);
		me.game.add(heroeDoorCell,3);
		me.game.sort();
	}
});
