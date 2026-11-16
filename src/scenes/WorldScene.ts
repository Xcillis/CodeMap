import { ARKANA_IDS } from '../gameplay/ArkanaCatalog';
import Phaser from 'phaser';
import { gameEvents } from '../game/events';
import { InteractionController, type InteractionTarget } from '../gameplay/InteractionController';
import { PlayerController } from '../gameplay/PlayerController';
import { loadProgress, saveProgress } from '../gameplay/LocalProgress';
import { Campaign, type WorldEncounter } from '../gameplay/Campaign';
import { WORLD_QUESTS, isLessonId, type LessonId, type CampaignAction } from '../gameplay/WorldQuests';
import type { MissionId } from '../combat/BattleSession';
import { touchInput } from '../input/TouchInput';
import { isArkanId } from '../gameplay/ArkanaCatalog';
import type { ArkanId } from '../combat/types';
import { QUEST_GIVERS, giverLessons, isQuestGiverId, type QuestGiverId } from '../gameplay/QuestNetwork';
import { REGIONS, VALLEY_PASS, WORLD_SIZE } from '../gameplay/WorldRegions';
import { VALLEY_OBSTACLES, valleyBlocked } from '../world/ValleyLayout';
import { drawValley } from '../world/ValleyRenderer';
import { FOREST_TREES, forestBlocked } from '../world/ForestLayout';
import { ART_KEYS, groundDepth, heroFacing, type HeroFrame } from '../art/ArtCatalog';
import { characterImage, environmentImage, preloadArt, registerArtFrames } from '../art/ArtSprites';
import { motionSprite, playMotion, preloadMotion, registerMotion } from '../art/MotionSprites';
import { motionDirection, type MotionDirection } from '../art/MotionCatalog';
import { NpcPatrol, NPC_BEHAVIORS, npcShouldPause } from '../gameplay/NpcPatrol';
import { preloadValleyArt, registerValleyArt, valleyImage } from '../art/ValleyArt';
import { addAcademyLights } from '../world/ValleyEffects';
import { preloadMountainArt, registerMountainArt } from '../art/MountainArt';

const WORLD_WIDTH = WORLD_SIZE.width;
const WORLD_HEIGHT = WORLD_SIZE.height;

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Arc;
  private playerArt?: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
  private playerFacing: HeroFrame = 'hero-down';
  private playerController!: PlayerController;
  private interactionController!: InteractionController;
  private readonly campaign = new Campaign(loadProgress().campaign);
  private readonly encounterLabels = new Map<string, Phaser.GameObjects.Text>();
  private readonly arkanaVisuals = new Map<ArkanId, readonly Phaser.GameObjects.GameObject[]>();
  private readonly npcVisuals = new Map<QuestGiverId, { root: Phaser.GameObjects.Container; art?: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite; label: Phaser.GameObjects.Text; patrol: NpcPatrol; facing: MotionDirection; directional: boolean }>();
  private fixedTargets: InteractionTarget[] = [];
  private gateBody?: Phaser.GameObjects.Rectangle;
  private gateRocks?: Phaser.GameObjects.Container;
  private dialogActive = false;
  private overlayActive = false;
  private interactionHint?: string;
  private readonly onDialogClosed = () => { this.dialogActive = false; this.clearInput(); };
  private readonly onOverlay = (open: boolean) => { this.overlayActive = open; this.clearInput(); };
  private readonly onTeamToggle = (id: string) => { const message = this.campaign.toggleTeam(id); this.publishCampaign(); gameEvents.emit('world-notice', message); };
  private readonly onTraining = (mission: MissionId, team: ArkanId[]) => this.launchEncounter(this.campaign.beginTraining(mission, team));
  private readonly onCampaignAction = (action: CampaignAction) => {
    if (action === 'open-training') { gameEvents.emit('world-training-open'); return; }
    if (action.startsWith('quests:')) {
      const giver = action.slice(7);
      if (isQuestGiverId(giver) && this.campaign.visitGiver(giver)) { this.publishCampaign(); gameEvents.emit('world-giver-open', giver); }
      return;
    }
    if (action === 'travel-forest' || action === 'travel-valley') {
      const previous = this.campaign.region; const message = this.campaign.apply(action);
      if (previous !== this.campaign.region) { saveProgress({ campaign: this.campaign.snapshot }); this.clearInput(); this.scene.restart({ fromTravel: true }); }
      else gameEvents.emit('world-notice', message);
      return;
    }
    if (action.startsWith('lesson:') || action.startsWith('prepare-lesson:')) {
      const id = action.slice(action.indexOf(':') + 1);
      if (isLessonId(id)) this.launchEncounter(action.startsWith('prepare-lesson:') ? this.campaign.prepareMission(id) : this.campaign.beginMission(id));
    } else {
      const message = this.campaign.apply(action); this.publishCampaign(); gameEvents.emit('world-notice', message);
    }
  };
  private readonly onVictory = (id: LessonId) => {
    const completion = this.campaign.finishMission(id);
    if (completion) { this.publishCampaign(); gameEvents.emit('quest-completed', completion); }
  };
  private readonly onContinue = (id: LessonId) => {
    const encounter = isLessonId(id) ? this.campaign.continueMission(id) : 'Unbekannte Folgequest.';
    if (typeof encounter === 'string') { gameEvents.emit('quest-continue-error', encounter); return; }
    this.publishCampaign(); this.clearInput(); gameEvents.emit('battle-continued', encounter);
  };
  private readonly onReturned = () => {
    this.campaign.leaveMission(); this.publishCampaign(); this.clearInput();
  };

  constructor() {
    super('world');
  }
  preload(): void { preloadArt(this); preloadMotion(this); if (this.campaign.region === 'valley') { preloadValleyArt(this); preloadMountainArt(this); } }

  create(data?: { fromTravel?: boolean }): void {
    registerArtFrames(this); registerMotion(this); if (this.campaign.region === 'valley') { registerValleyArt(this); registerMountainArt(this); } this.npcVisuals.clear(); this.playerArt = undefined; this.playerFacing = 'hero-down';
    this.dialogActive = false; this.overlayActive = false; this.gateBody = undefined; this.gateRocks = undefined;
    this.encounterLabels.clear(); this.arkanaVisuals.clear();
    this.interactionHint = undefined;
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.drawLandscape();
    const obstacles = this.createObstacles();
    const region = REGIONS[this.campaign.region]; const spawn = data?.fromTravel ? region.arrival : region.spawn;
    this.player = this.createPlayer(spawn.x, spawn.y);
    this.physics.add.collider(this.player, obstacles);
    this.playerController = new PlayerController(this, this.player);
    const people = (Object.keys(QUEST_GIVERS) as QuestGiverId[]).filter((id) => QUEST_GIVERS[id].region === this.campaign.region);
    const training = this.campaign.region === 'valley' ? { x: 1000, y: 720 } : { x: 380, y: 650 };
    this.fixedTargets = [...people.map((id) => ({ id: `giver:${id}`, label: QUEST_GIVERS[id].name, x: QUEST_GIVERS[id].x, y: QUEST_GIVERS[id].y, range: 75 })),
      { id: 'training', label: 'Freie Trainingsarena', ...training, range: 70 },
      { id: 'travel', label: this.campaign.region === 'valley' ? 'Zum Aetherwald reisen' : 'Ins Tal zurückreisen', ...region.exit, range: 55 },
      ...(this.campaign.region === 'valley' ? [{ id: 'landslide', label: 'Runenwinde am Steinrutsch', x: 1360, y: 520, range: 65 }] : [])];
    for (const person of people) this.createNpc(person);
    this.createWorldEncounter('training', 'Freie Trainingsarena', training.x, training.y, 0x80c6d3);
    this.createWorldEncounter('travel', this.campaign.region === 'valley' ? '→ Aetherwald' : '← Tal von Aetheria', region.exit.x, region.exit.y, 0xb9e4d4);
    if (this.campaign.region === 'valley') this.createWorldEncounter('landslide', 'Runenwinde · Steinrutsch', 1360, 520, 0xe1c970);
    this.interactionController = new InteractionController(this.fixedTargets);

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(1.12);
    gameEvents.on('dialog-closed', this.onDialogClosed);
    gameEvents.on('world-overlay', this.onOverlay);
    gameEvents.on('team-toggle', this.onTeamToggle);
    gameEvents.on('campaign-action', this.onCampaignAction);
    gameEvents.on('training-start', this.onTraining);
    gameEvents.on('world-quest-victory', this.onVictory);
    gameEvents.on('quest-continue', this.onContinue);
    gameEvents.on('world-returned', this.onReturned);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      gameEvents.off('dialog-closed', this.onDialogClosed); gameEvents.off('world-overlay', this.onOverlay);
      gameEvents.off('team-toggle', this.onTeamToggle); gameEvents.off('campaign-action', this.onCampaignAction);
      gameEvents.off('training-start', this.onTraining);
      gameEvents.off('world-quest-victory', this.onVictory); gameEvents.off('world-returned', this.onReturned);
      gameEvents.off('quest-continue', this.onContinue);
      this.encounterLabels.clear();
      this.arkanaVisuals.clear(); this.npcVisuals.clear();
    });
    this.publishCampaign();
  }

  update(_time: number, delta: number): void {
    const interactionPressed = this.playerController.update(!this.dialogActive && !this.overlayActive);
    if (this.playerArt) {
      const velocity = (this.player.body as Phaser.Physics.Arcade.Body).velocity;
      const facing = heroFacing(velocity.x, velocity.y, this.playerFacing); const moving = velocity.lengthSq() > 0;
      if (this.playerArt instanceof Phaser.GameObjects.Sprite) playMotion(this.playerArt, facing, moving ? 'walk' : 'idle');
      else if (facing !== this.playerFacing) {
        const frame = this.textures.getFrame(ART_KEYS.characters, facing);
        this.playerArt.setTexture(ART_KEYS.characters, facing).setDisplaySize(64 * frame.width / frame.height, 64);
      }
      this.playerFacing = facing;
      this.playerArt.setPosition(this.player.x, this.player.y + 15).setDepth(groundDepth(this.player.y + 15));
    }
    this.updateNpcs(delta);
    const nearby = this.interactionController.nearestTo(this.player.x, this.player.y);
    this.showInteractionHint(nearby && !this.dialogActive && !this.overlayActive ? `E oder Leertaste: ${nearby.label}` : '');

    if (interactionPressed && nearby && !this.dialogActive && !this.overlayActive) {
      this.dialogActive = true;
      gameEvents.emit('dialog-opened', this.campaign.interact(nearby.id));
      this.publishCampaign();
    }
  }

  private publishCampaign(): void {
    const state = this.campaign.snapshot;
    saveProgress({ campaign: state, questCompleted: state.introduced });
    gameEvents.emit('campaign-updated', state);
    gameEvents.emit('quest-updated', this.campaign.objective, WORLD_QUESTS.every((quest) => state.completed.includes(quest.id)));
    const encounters = this.campaign.availableEncounters;
    for (const id of ARKANA_IDS) {
      if (encounters.some((encounter) => encounter.id === id)) continue;
      const visuals = this.arkanaVisuals.get(id);
      if (visuals) {
        for (const visual of visuals) visual.destroy();
        this.arkanaVisuals.delete(id);
        this.encounterLabels.delete(id);
        this.showInteractionHint('');
      }
    }
    for (const encounter of encounters) if (!this.arkanaVisuals.has(encounter.id)) this.createWorldEncounter(encounter.id, encounter.name, encounter.x, encounter.y, encounter.color);
    this.interactionController.setTargets([...this.fixedTargets, ...encounters.map((encounter) => ({ id: encounter.id, label: `${encounter.name} begegnen`, x: encounter.x, y: encounter.y, range: 70 }))]);
    for (const id of Object.keys(QUEST_GIVERS) as QuestGiverId[]) {
      const quests = giverLessons(id); const available = state.introduced && this.campaign.has('glutling') ? quests.filter((quest) => this.campaign.questReady(quest) && !state.completed.includes(quest)).length : 0;
      this.encounterLabels.get(`giver:${id}`)?.setText(`${QUEST_GIVERS[id].name}\n${available ? `! ${available} Aufgabe(n) bereit` : quests.every((quest) => state.completed.includes(quest)) ? '✓ Aufgaben abgeschlossen' : 'Aufgaben & Folgequests'}`);
    }
    if (this.gateBody?.body) (this.gateBody.body as Phaser.Physics.Arcade.StaticBody).enable = !this.campaign.forestUnlocked;
    this.gateRocks?.setVisible(!this.campaign.forestUnlocked);
    if (this.campaign.region === 'valley') this.encounterLabels.get('landslide')?.setText(this.campaign.forestUnlocked ? '✓ Steinrutsch geräumt · Ostpass frei' : '! Steinrutsch · Runenwinde');
  }

  private launchEncounter(encounter: WorldEncounter | string): void {
    if (typeof encounter === 'string') { gameEvents.emit('world-notice', encounter); return; }
    this.publishCampaign(); this.clearInput(); this.scene.pause('world'); this.scene.launch('battle', encounter);
  }

  private clearInput(): void { touchInput.clear(); this.input.keyboard?.resetKeys(); }
  private showInteractionHint(text: string): void {
    if (this.interactionHint === text) return;
    this.interactionHint = text; gameEvents.emit('interaction-hint', text);
  }

  private createWorldEncounter(id: string, label: string, x: number, y: number, color: number): void {
    if (isArkanId(id) && this.campaign.has(id)) return;
    const quest = !isArkanId(id);
    const shadow = this.add.ellipse(x, y + 18, 32, 10, 0x142c35, .3).setDepth(4);
    const art = isArkanId(id) ? motionSprite(this, id, x, y + 18, 54) ?? characterImage(this, id, x, y + 18, 54) : (this.campaign.region === 'valley' ? valleyImage(this, 'runestone', x, y + 18, 32, 43) : undefined) ?? environmentImage(this, 'runestone', x, y + 18, 32, 43);
    if (art) art.setDepth(groundDepth(y + 18));
    const marker = art ?? (quest
      ? this.add.rectangle(x, y, 24, 34, color).setStrokeStyle(3, 0x3d4a41).setDepth(5)
      : this.add.circle(x, y, 17, color).setStrokeStyle(3, 0xf7efc2).setDepth(5));
    const text = this.add.text(x, y - 50, label, { fontSize: '15px', color: '#fff1bd', stroke: '#243a30', strokeThickness: 4 }).setOrigin(.5).setDepth(10000);
    this.encounterLabels.set(id, text);
    if (isArkanId(id)) this.arkanaVisuals.set(id, [shadow, marker, text]);
  }

  private drawLandscape(): void {
    if (this.campaign.region === 'forest') { this.drawForest(); return; }
    this.gateRocks = drawValley(this).landslide;
    this.drawBuilding(1040, 255);
  }

  private createObstacles(): Phaser.Physics.Arcade.StaticGroup {
    const group = this.physics.add.staticGroup();
    const addObstacle = (x: number, y: number, width: number, height: number) => {
      const body = this.add.rectangle(x, y, width, height, 0x000000, 0);
      this.physics.add.existing(body, true);
      group.add(body);
      return body;
    };
    if (this.campaign.region === 'forest') { for (const [x, y] of FOREST_TREES) addObstacle(x, y + 10, 30, 30); return group; }
    for (const obstacle of VALLEY_OBSTACLES) addObstacle(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    this.gateBody = addObstacle(VALLEY_PASS.x, VALLEY_PASS.y, VALLEY_PASS.width, VALLEY_PASS.height);
    return group;
  }

  private createPlayer(x: number, y: number): Phaser.GameObjects.Arc {
    const player = this.add.circle(x, y, 16, 0x4f8ddb).setStrokeStyle(3, 0xe8f2ff).setDepth(5);
    this.physics.add.existing(player);
    const body = player.body as Phaser.Physics.Arcade.Body;
    body.setCircle(14).setOffset(2, 2).setCollideWorldBounds(true);
    this.playerArt = motionSprite(this, 'hero-down', x, y + 15) ?? characterImage(this, 'hero-down', x, y + 15);
    if (this.playerArt) { player.setAlpha(0); this.playerArt.setDepth(groundDepth(y + 15)); }
    return player;
  }

  private createNpc(id: QuestGiverId): void {
    const { x, y, name, color } = QUEST_GIVERS[id];
    const root = this.add.container(x, y).setDepth(groundDepth(y + 19));
    root.add(this.add.ellipse(0, 20, 27, 9, 0x1d2a25, .3));
    const directional = id === 'brann' ? motionSprite(this, 'brann-down', 0, 19, 68) : undefined;
    const art = directional ?? motionSprite(this, id, 0, 19, 68) ?? characterImage(this, id, 0, 19, 68);
    if (art) root.add(art);
    else {
      root.add(this.add.circle(0, 0, 17, color).setStrokeStyle(3, 0xf2d8ff));
      root.add(this.add.triangle(0, -15, -14, 11, 14, 11, 0, -19, 0x40245f));
    }
    const label = this.add.text(x, y - 65, name, { fontFamily: 'Georgia, serif', fontSize: '16px', color: '#fff6d8', stroke: '#26352c', strokeThickness: 4, align: 'center' }).setOrigin(.5).setDepth(10000);
    this.npcVisuals.set(id, { root, art, label, patrol: new NpcPatrol({ x, y }, NPC_BEHAVIORS[id]), facing: 'down', directional: Boolean(directional) });
    this.encounterLabels.set(`giver:${id}`, label);
  }

  private updateNpcs(delta: number): void {
    for (const [id, visual] of this.npcVisuals) {
      const current = visual.patrol.position;
      const frozen = npcShouldPause(current, this.player, this.dialogActive || this.overlayActive);
      const next = visual.patrol.step(delta, frozen, (point) => this.campaign.region === 'valley'
        ? !valleyBlocked(point, this.campaign.forestUnlocked, 18)
        : !forestBlocked(point, 18));
      visual.root.setPosition(next.x, next.y).setDepth(groundDepth(next.y + 19)); visual.label.setPosition(next.x, next.y - 65);
      this.interactionController.moveTarget(`giver:${id}`, next.x, next.y);
      if (visual.art instanceof Phaser.GameObjects.Sprite) {
        visual.facing = motionDirection(next.dx, next.dy, visual.facing);
        playMotion(visual.art, id === 'brann' && visual.directional ? `brann-${visual.facing}` : id, next.moving ? 'walk' : 'idle', next.dx);
      }
    }
  }

  private drawForest(): void {
    const illustrated = this.textures.exists(ART_KEYS.groundTile);
    if (illustrated) this.add.tileSprite(0, 0, 1600, 1040, ART_KEYS.groundTile).setOrigin(0).setTileScale(1.4).setTint(0x8bbd9b);
    const ground = this.add.graphics().setDepth(.1);
    if (!illustrated) ground.fillStyle(0x315d46).fillRect(0, 0, 1600, 1040);
    for (const [x, y] of FOREST_TREES) this.drawTree(x, y);
    this.drawPond(980, 145);
    this.add.text(160, 75, 'AETHERWALD', { fontSize: '28px', color: '#d4f6d9', stroke: '#183c30', strokeThickness: 5 }).setDepth(10000);
    this.add.text(160, 113, 'Bedingungen & Verzweigungen', { fontSize: '17px', color: '#c7decb' }).setDepth(10000);
  }

  private drawTree(x: number, y: number): void {
    const art = environmentImage(this, 'oak', x, y + 26, 140);
    if (art) { art.setDepth(groundDepth(y + 26)); return; }
    const tree = this.add.graphics().setDepth(2);
    tree.fillStyle(0x5b3d28).fillRect(x - 7, y, 14, 30);
    tree.fillStyle(0x284f32).fillCircle(x, y - 18, 31);
    tree.fillStyle(0x397140).fillCircle(x - 16, y - 9, 23).fillCircle(x + 17, y - 9, 22).fillCircle(x + 3, y - 36, 23);
    tree.lineStyle(3, 0x1d3d28, 0.7).strokeCircle(x, y - 18, 31);
  }

  private drawBuilding(x: number, y: number): void {
    const illustrated = valleyImage(this, 'academy', x, y + 150, 300, 310);
    const art = illustrated ?? environmentImage(this, 'academy', x, y + 150, 300, 310);
    if (art) {
      art.setDepth(groundDepth(y + 150));
      if (illustrated) addAcademyLights(this, illustrated);
      this.add.text(x, y - 178, 'Akademie von Aetheria', { fontFamily: 'Georgia, serif', fontSize: '24px', color: '#fff1be', stroke: '#283928', strokeThickness: 5 }).setOrigin(.5).setDepth(10000);
      return;
    }
    const building = this.add.graphics().setDepth(1);
    building.fillStyle(0x75503d).fillRect(x - 135, y - 10, 270, 160);
    building.fillStyle(0x3b2a32).fillTriangle(x - 160, y - 10, x + 160, y - 10, x, y - 150);
    building.fillStyle(0x987450).fillTriangle(x - 142, y - 12, x + 142, y - 12, x, y - 132);
    building.fillStyle(0x2b2020).fillRect(x - 23, y + 70, 46, 80);
    building.fillStyle(0xbacfe4).fillRect(x - 100, y + 36, 40, 36).fillRect(x + 60, y + 36, 40, 36);
    this.add.text(x, y - 178, 'Akademie von Aetheria', { fontFamily: 'Georgia, serif', fontSize: '24px', color: '#fff1be', stroke: '#283928', strokeThickness: 5 }).setOrigin(0.5).setDepth(4);
  }

  private drawPond(x: number, y: number): void {
    const pond = this.add.graphics();
    pond.fillStyle(0x3a7893).fillEllipse(x, y, 250, 150);
    pond.lineStyle(7, 0x89b9b0).strokeEllipse(x, y, 250, 150);
    pond.lineStyle(2, 0xb4e4e2, 0.8).strokeEllipse(x - 22, y - 10, 100, 45);
  }
}
