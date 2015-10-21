function Player(id, spawn_x, spawn_y) {
    this.id: id || 1;
    this.name: "Playerino";
    this.type: 0;

    this.x: spawn_x;
    this.y: spawn_y;
    this.tx: spawn_x;
    this.ty: spawn_y;
    this.ax: 0;
    this.ay: 0;
    this.chunk: [Math.floor(spawn_x / game_size.w), Math.floor(spawn_y / game_size.h)];
    this.direction: 0;

    this.level: 1;
    this.experience: 0;
    this.expPenalty: 0;
    this.strength: 1;
    this.agility: 1;
    this.intelligence: 1;
    this.attrPoints: 0;
    this.skillPoints: 0;
    this.healthMax: 300;
    this.healthCur: 300;
    this.manaMax: 900;
    this.manaCur: 900;
    this.healthRegenBase: 0;
    this.healthRegen: 2;
    this.healthRegenInterval: 1000;
    this.manaRegen: 300;
    this.mmr: 1400;

    this.speedBase: 400;
    this.speedCur: 400;

    this.accuracy: 1;
    this.accuracyBase: 1;
    this.critChanceBase: 0;
    this.critChance: 0;
    this.critDamageBase: 1;
    this.critDamage: 1;
    this.lifeStealBase: 0;
    this.lifeSteal: 0.15;
    this.dmgModBase: 1;
    this.dmgMod: 1;
    this.atkSpeedBase: 1;
    this.atkSpeed: 1;
    this.evasionBase: 0;
    this.evasion: 0;
    this.dmgReflectBase: 0;
    this.dmgReflect: 0;
    this.blockChanceBase: 0;
    this.blockChance: 0;
    this.magicImmunityBase: 0;
    this.magicImmunity: 0;
    this.physicalImmunityBase: 0;
    this.physicalImmunity: 0;


    this.silenced: false;
    this.stunned: false;
    this.disarmed: false;
    this.stealthed: false;
    this.bleeding: false;
    this.onFire: false;
    this.poisoned: false;

    this.moveValid: true;
    this.isDead: false;
    this.isVisible: true;
    this.isResting: false;
    this.deathTime: frameTime;
    this.lastHpRegen: frameTime;
    this.moveQ: new MovementQueue();
    this.animStart: frameTime;
    this.lastAttack: frameTime;
    this.attackCooldown: 2000;
    this.damageInfo: {
        totalDamage: 0
    };
    this.skills: [{     // 1
        cooldown: 0,
        action: 0
    }, {
        cooldown: 0,    //2
        action: 0
    }, {
        cooldown: 0,    //3
        action: 0
    }, {
        cooldown: 0,    //4
        action: 0
    }];
    this.equipment: {
        primary: {      //primary type controls player attack behaviour, attack animations and skill images
            damageMin: 5,
            damageMax: 10,
            damageMod: 0,
            dmgOverTime: 0,
            speedMod: 0,
            type: "bow",
            range: 6 * 1.45
        }, // o()XXXX[{::::::::::::::>
        secondary: {    //applies attack bonuses. no change in attack behaviour
            damageMin: 1,
            damageMax: 3,
            damageMod: 0,
            speedMod: 0,
            type: "sword",
            range: 1.45
        }, // ¤=[]:::;;>
        body: {},
        legs: {},
        boots: {
            speedMod: 1
        },
        head: {},
        backpack: []
    };

    console.log(this.chunk[0], this.chunk[1])
    this.update = function() {
        this.lastChunk = this.chunk;
        this.ax = (this.tx - this.x) * (frameTime - this.animStart) / this.speedCur;
        this.ay = (this.ty - this.y) * (frameTime - this.animStart) / this.speedCur;

        if (Math.abs(this.ax) >= 1) {
            this.moving = false;
            this.x = this.tx;
            this.ax = 0;

        }
        if (Math.abs(this.ay) >= 1) {
            this.moving = false;
            this.y = this.ty;
            this.ay = 0;
        }

        if (!this.moving) {
            var nextMove = this.moveQ.getMove();
            if (nextMove) {
                if (!map.isValid(nextMove[0], nextMove[1]) && this.moveQ.getLength() > 0) {
                    this.moveQ.findPath(this.x, this.y, clientX, clientY);
                    nextMove = this.moveQ.getMove();
                }
                if (nextMove && map.isValid(nextMove[0], nextMove[1])) {
                    this.animStart = frameTime;
                    this.moving = true;
                    // map.free(this.x, this.y);
                    this.tx = nextMove[0];
                    this.ty = nextMove[1];
                    // map.occupy(this.tx, this.ty);
                    for (var sId in onlinePlayersData)
                        io.to(sId).emit('players-move-update', {
                            tx: this.tx,
                            ty: this.ty,
                            id: this.id
                        });
                }
            }
        }
        //regenerate hp/mana every healthRegenInterval when player is resting
        if (this.healthMax != this.healthCur)
            if (frameTime - this.lastHpRegen >= this.healthRegenInterval && this.isResting)
                this.restoreHp();
        updateStats(this); //speed cap?
        if (this.experience < 0) this.experience = 0;
        //leveling up stuff
        if (this.experience >= levelExpFormula(this.level + 1))
            levelUp(this);

        //basic chunk calc & storing for future use in chunk loading
        this.chunk[0] = Math.floor(this.tx / 32);
        this.chunk[1] = Math.floor(this.ty / 16);
    }
    this.move = function(dx, dy, dir) {
        if (map.isValid(this.tx + dx, this.ty + dy))
            this.moveQ.queueMove(this.tx + dx, this.ty + dy);
    }
    this.attack = function(target_id, target_type) {
        var id = null;
        if (!this.isDead) {
            if (target_type == 1) { //if target is mob get mobs place in mobzz
                var len = mobzz.length
                for (var i = 0; i < len; i++) {
                    if (mobzz[i].id == target_id) {
                        target = mobzz[i];
                    }
                }
            } else { //thats for players
                target = allPlayers[target_id];
            }

            if (frameTime - this.lastAttack > (this.attackCooldown / this.atkSpeed) && target && dist(this, target) < this.equipment.primary.range) {
                this.lastAttack = frameTime;

                if (this.equipment.primary.type == 'bow') {
                    var los = calcLineOfSight(this.tx, this.ty, target.tx, target.ty);
                    for (sId in onlinePlayersData)
                        io.to(sId).emit('player-attack-bow', {
                            id: this.id,
                            target: los.obstacle
                        });
                    if (!los.isClear) //skip invoking damage functions
                        return;
                }

                if (target_type == 0) {
                    var damage = calcDamage(this, target);
                    var damageTaken = target.takeDamage(this.id, damage, 0);
                    //allPlayers[id].applyEffect();
                } else if (target_type == 1) {
                    var damage = calcDamage(this, target);
                    var damageTaken = target.takeDamage(this.id, damage, 0);
                    //mobzz[id].applyEffect();
                }

                this.lifeSteal && this.restoreHp(Math.floor(damageTaken * this.lifeSteal)); //lifesteal stuff
            }
        }
    }
    this.applyEffect = function() {

    }
    this.restoreHp = function(stolenHp) {
        if (!stolenHp) this.lastHpRegen = new Date().getTime();
        var heal = stolenHp || this.healthRegen;
        this.healthCur += Math.min(heal, this.healthMax - this.healthCur);
    }
    this.takeDamage = function(attackerId, damage, attackerType) {
        var dmg = Math.min(damage, this.healthCur);
        this.healthCur -= dmg;
        if (this.dmgReflect) { //damage reflection shit
            if (attackerType == 0) { //if player
                dmg = calcDamage(this, allPlayers[attackerId])
                allPlayers[attackerId].takeDamage(this.id, Math.floor(dmg * this.dmgReflect)); //dmg reflection stuff
            } else { //if mob
                var len = mobzz.length
                for (var i = 0; i < len; i++)
                    if (mobzz[i].id == attackerId)
                        var target = mobzz[i];
                dmg = calcDamage(this, target)
                target.takeDamage(this.id, Math.floor(damage * this.dmgReflect));
            }
        }



        for (sId in onlinePlayersData)
            io.to(sId).emit('player-take-damage', {
                id: this.id,
                dmg: dmg
            })

        this.damageInfo[attackerId] = this.damageInfo[attackerId] || 0;
        this.damageInfo[attackerId] += dmg;
        this.damageInfo.totalDamage += dmg;

        if (this.healthCur <= 0 && !this.isDead) {
            this.die();
        }
        return dmg;
    }
    this.die = function() {
        this.deathTime = new Date().getTime();
        this.isDead = true;
        this.isVisible = false;
        io.to(this.socket).emit('player-death', {});
    }
}