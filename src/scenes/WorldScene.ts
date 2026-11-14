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
import { VALLEY_OBSTACLES } from '../world/ValleyLayout';
import { drawValley } from '../world/ValleyRenderer';

const WORLD_WIDTH = WORLD_SIZE.width;
const WORLD_HEIGHT = WORLD_SIZE.height;

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Arc;
  private playerController!: PlayerController;
  private interactionController!: InteractionController;
  private readonly campaign = new Campaign(loadProgress().campaign);
  private readonly encounterLabels = new Map<string, Phaser.GameObjects.Text>();
  private readonly arkanaVisuals = new Map<ArkanId, readonly Phaser.GameObjects.GameObject[]>();
  private fixedTargets: InteractionTarget[] = [];
  private gateBody?: Phaser.GameObjects.Rectangle;
  private gateRocks?: Phaser.GameObjects.Container;
  private dialogActive = false;
  private overlayActive = false;
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
  private readonly onReturned = () => {
    this.campaign.leaveMission(); this.publishCampaign(); this.clearInput();
  };

  constructor() {
    super('world');
  }

  create(data?: { fromTravel?: boolean }): void {
    this.dialogActive = false; this.overlayActive = false; this.gateBody = undefined; this.gateRocks = undefined;
    this.encounterLabels.clear(); this.arkanaVisuals.clear();
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
    gameEvents.on('world-returned', this.onReturned);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      gameEvents.off('dialog-closed', this.onDialogClosed); gameEvents.off('world-overlay', this.onOverlay);
      gameEvents.off('team-toggle', this.onTeamToggle); gameEvents.off('campaign-action', this.onCampaignAction);
      gameEvents.off('training-start', this.onTraining);
      gameEvents.off('world-quest-victory', this.onVictory); gameEvents.off('world-returned', this.onReturned);
      this.encounterLabels.clear();
      this.arkanaVisuals.clear();
    });
    this.publishCampaign();
  }

  update(): void {
    const interactionPressed = this.playerController.update(!this.dialogActive && !this.overlayActive);
    const nearby = this.interactionController.nearestTo(this.player.x, this.player.y);
    gameEvents.emit('interaction-hint', nearby && !this.dialogActive && !this.overlayActive ? `E oder Leertaste: ${nearby.label}` : '');

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
    for (const id of ['moosling', 'glutling'] as const) {
      if (encounters.some((encounter) => encounter.id === id)) continue;
      const visuals = this.arkanaVisuals.get(id);
      if (visuals) {
        for (const visual of visuals) visual.destroy();
        this.arkanaVisuals.delete(id);
        this.encounterLabels.delete(id);
        gameEvents.emit('interaction-hint', '');
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

  private createWorldEncounter(id: string, label: string, x: number, y: number, color: number): void {
    if (isArkanId(id) && this.campaign.has(id)) return;
    const quest = !isArkanId(id);
    const shadow = this.add.ellipse(x, y + 18, 32, 10, 0x142c35, .3).setDepth(4);
    const marker = quest
      ? this.add.rectangle(x, y, 24, 34, color).setStrokeStyle(3, 0x3d4a41).setDepth(5)
      : this.add.circle(x, y, 17, color).setStrokeStyle(3, 0xf7efc2).setDepth(5);
    const text = this.add.text(x, y - 40, label, { fontSize: '15px', color: '#fff1bd', stroke: '#243a30', strokeThickness: 4 }).setOrigin(.5).setDepth(6);
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
    if (this.campaign.region === 'forest') { for (const [x, y] of this.forestTrees()) addObstacle(x, y + 10, 30, 30); return group; }
    for (const obstacle of VALLEY_OBSTACLES) addObstacle(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    this.gateBody = addObstacle(VALLEY_PASS.x, VALLEY_PASS.y, VALLEY_PASS.width, VALLEY_PASS.height);
    return group;
  }

  private createPlayer(x: number, y: number): Phaser.GameObjects.Arc {
    const player = this.add.circle(x, y, 16, 0x4f8ddb).setStrokeStyle(3, 0xe8f2ff).setDepth(5);
    this.physics.add.existing(player);
    const body = player.body as Phaser.Physics.Arcade.Body;
    body.setCircle(14).setOffset(2, 2).setCollideWorldBounds(true);
    return player;
  }

  private createNpc(id: QuestGiverId): void {
    const { x, y, name, color } = QUEST_GIVERS[id];
    this.add.ellipse(x, y + 20, 27, 9, 0x1d2a25, 0.3).setDepth(4);
    this.add.circle(x, y, 17, color).setStrokeStyle(3, 0xf2d8ff).setDepth(5);
    this.add.triangle(x, y - 15, -14, 11, 14, 11, 0, -19, 0x40245f).setDepth(6);
    const label = this.add.text(x, y - 52, name, { fontFamily: 'Georgia, serif', fontSize: '16px', color: '#fff6d8', stroke: '#26352c', strokeThickness: 4, align: 'center' }).setOrigin(0.5).setDepth(7);
    this.encounterLabels.set(`giver:${id}`, label);
  }

  private forestTrees(): number[][] { return [[170, 160], [350, 210], [500, 160], [780, 150], [950, 220], [1300, 150], [1470, 230], [240, 800], [440, 910], [650, 780], [790, 950], [1230, 940], [1500, 700], [1350, 650], [300, 350], [830, 650]]; }
  private drawForest(): void {
    const ground = this.add.graphics(); ground.fillStyle(0x315d46).fillRect(0, 0, 1600, 1040);
    for (let x = 0; x < 1600; x += 80) for (let y = 0; y < 1040; y += 80) if ((x + y) % 160 === 0) ground.fillStyle(0x46765a, .4).fillRect(x, y, 80, 80);
    ground.lineStyle(40, 0x93865d).beginPath().moveTo(100, 520).lineTo(600, 490).lineTo(1140, 390).strokePath();
    ground.beginPath().moveTo(600, 490).lineTo(1030, 800).lineTo(1450, 915).strokePath();
    for (const [x, y] of this.forestTrees()) this.drawTree(x, y);
    this.drawPond(980, 145);
    this.add.text(160, 75, 'AETHERWALD', { fontSize: '28px', color: '#d4f6d9', stroke: '#183c30', strokeThickness: 5 });
    this.add.text(160, 113, 'Bedingungen & Verzweigungen', { fontSize: '17px', color: '#c7decb' });
  }

  private drawTree(x: number, y: number): void {
    const tree = this.add.graphics().setDepth(2);
    tree.fillStyle(0x5b3d28).fillRect(x - 7, y, 14, 30);
    tree.fillStyle(0x284f32).fillCircle(x, y - 18, 31);
    tree.fillStyle(0x397140).fillCircle(x - 16, y - 9, 23).fillCircle(x + 17, y - 9, 22).fillCircle(x + 3, y - 36, 23);
    tree.lineStyle(3, 0x1d3d28, 0.7).strokeCircle(x, y - 18, 31);
  }

  private drawBuilding(x: number, y: number): void {
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
