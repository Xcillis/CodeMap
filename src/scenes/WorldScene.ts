import Phaser from 'phaser';
import { gameEvents } from '../game/events';
import { InteractionController } from '../gameplay/InteractionController';
import { PlayerController } from '../gameplay/PlayerController';
import { loadProgress, saveProgress } from '../gameplay/LocalProgress';
import { Campaign, type WorldEncounter } from '../gameplay/Campaign';
import { WORLD_QUESTS, isLessonId, type LessonId, type CampaignAction } from '../gameplay/WorldQuests';
import type { MissionId } from '../combat/BattleSession';
import { touchInput } from '../input/TouchInput';
import { isArkanId } from '../gameplay/ArkanaCatalog';
import type { ArkanId } from '../combat/types';

const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 1040;

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Arc;
  private playerController!: PlayerController;
  private interactionController!: InteractionController;
  private readonly campaign = new Campaign(loadProgress().campaign);
  private readonly encounterLabels = new Map<string, Phaser.GameObjects.Text>();
  private readonly arkanaVisuals = new Map<ArkanId, readonly Phaser.GameObjects.GameObject[]>();
  private dialogActive = false;
  private overlayActive = false;
  private pendingReward?: string;
  private readonly onDialogClosed = () => { this.dialogActive = false; this.clearInput(); };
  private readonly onOverlay = (open: boolean) => { this.overlayActive = open; this.clearInput(); };
  private readonly onTeamToggle = (id: string) => { const message = this.campaign.toggleTeam(id); this.publishCampaign(); gameEvents.emit('world-notice', message); };
  private readonly onTraining = (mission: MissionId, team: ArkanId[]) => this.launchEncounter(this.campaign.beginTraining(mission, team));
  private readonly onCampaignAction = (action: CampaignAction) => {
    if (action === 'open-training') { gameEvents.emit('world-training-open'); return; }
    if (action.startsWith('lesson:')) {
      const id = action.slice(7);
      if (isLessonId(id)) this.launchEncounter(this.campaign.beginMission(id));
    } else {
      const message = this.campaign.apply(action); this.publishCampaign(); gameEvents.emit('world-notice', message);
    }
  };
  private readonly onVictory = (id: LessonId) => {
    const reward = this.campaign.completeMission(id);
    if (reward) { this.pendingReward = reward; this.publishCampaign(); }
  };
  private readonly onReturned = () => {
    this.campaign.leaveMission(); this.publishCampaign(); this.clearInput();
    if (this.pendingReward) {
      this.dialogActive = true;
      gameEvents.emit('dialog-opened', { speaker: 'QUEST ABGESCHLOSSEN', text: this.pendingReward });
      this.pendingReward = undefined;
    }
  };

  constructor() {
    super('world');
  }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.drawLandscape();
    const obstacles = this.createObstacles();
    this.player = this.createPlayer(330, 735);
    this.physics.add.collider(this.player, obstacles);
    this.playerController = new PlayerController(this, this.player);
    this.createNpc(915, 540);
    this.createWorldEncounter('glutling', 'Glutling', 600, 650, 0xef934a);
    this.createWorldEncounter('moosling', 'Moosling', 1290, 650, 0x78bc69);
    this.createWorldEncounter('training', 'Freie Trainingsarena', 1000, 720, 0x80c6d3);
    for (const quest of WORLD_QUESTS) this.createWorldEncounter(`lesson:${quest.id}`, quest.target, quest.x, quest.y, 0xe1c970);
    this.interactionController = new InteractionController([
      { id: 'arkanist-eldren', label: 'Arkanist Eldren', x: 915, y: 540, range: 75 },
      { id: 'glutling', label: 'Glutling begegnen', x: 600, y: 650, range: 70 },
      { id: 'moosling', label: 'Moosspur untersuchen', x: 1290, y: 650, range: 70 },
      { id: 'training', label: 'Freie Trainingsarena', x: 1000, y: 720, range: 70 },
      ...WORLD_QUESTS.map((quest) => ({ id: `lesson:${quest.id}`, label: quest.target, x: quest.x, y: quest.y, range: 70 })),
    ]);

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
    gameEvents.emit('quest-updated', this.campaign.objective, state.completed.includes('q03-wiederkehr'));
    for (const id of ['moosling', 'glutling'] as const) {
      if (!this.campaign.has(id)) continue;
      const visuals = this.arkanaVisuals.get(id);
      if (visuals) {
        for (const visual of visuals) visual.destroy();
        this.arkanaVisuals.delete(id);
        this.encounterLabels.delete(id);
        gameEvents.emit('interaction-hint', '');
      }
      this.interactionController.removeTarget(id);
    }
    for (const quest of WORLD_QUESTS) this.encounterLabels.get(`lesson:${quest.id}`)?.setText(`${state.completed.includes(quest.id) ? '✓' : '!'} ${quest.target}`);
  }

  private launchEncounter(encounter: WorldEncounter | string): void {
    if (typeof encounter === 'string') { gameEvents.emit('world-notice', encounter); return; }
    this.publishCampaign(); this.clearInput(); this.scene.pause('world'); this.scene.launch('battle', encounter);
  }

  private clearInput(): void { touchInput.clear(); this.input.keyboard?.resetKeys(); }

  private createWorldEncounter(id: string, label: string, x: number, y: number, color: number): void {
    if (isArkanId(id) && this.campaign.has(id)) return;
    const quest = id.startsWith('lesson:') || id === 'training';
    const shadow = this.add.ellipse(x, y + 18, 32, 10, 0x142c35, .3).setDepth(4);
    const marker = quest
      ? this.add.rectangle(x, y, 24, 34, color).setStrokeStyle(3, 0x3d4a41).setDepth(5)
      : this.add.circle(x, y, 17, color).setStrokeStyle(3, 0xf7efc2).setDepth(5);
    const text = this.add.text(x, y - 40, label, { fontSize: '15px', color: '#fff1bd', stroke: '#243a30', strokeThickness: 4 }).setOrigin(.5).setDepth(6);
    this.encounterLabels.set(id, text);
    if (isArkanId(id)) this.arkanaVisuals.set(id, [shadow, marker, text]);
  }

  private drawLandscape(): void {
    const ground = this.add.graphics();
    ground.fillStyle(0x5d8e4f).fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    for (let x = 0; x < WORLD_WIDTH; x += 40) {
      for (let y = 0; y < WORLD_HEIGHT; y += 40) {
        if ((x / 40 + y / 40) % 2 === 0) ground.fillStyle(0x639654, 0.32).fillRect(x, y, 40, 40);
      }
    }
    ground.lineStyle(36, 0xbda670, 1);
    ground.beginPath().moveTo(90, 770).lineTo(530, 720).lineTo(780, 620).lineTo(1120, 575).lineTo(1510, 650).strokePath();
    ground.lineStyle(36, 0xbda670, 1);
    ground.beginPath().moveTo(780, 620).lineTo(775, 230).strokePath();
    ground.lineStyle(5, 0xd8c88e, 0.6);
    ground.beginPath().moveTo(90, 770).lineTo(530, 720).lineTo(780, 620).lineTo(1120, 575).lineTo(1510, 650).strokePath();
    this.drawBuilding(1040, 255);
    this.drawPond(270, 245);
    [[180, 510], [350, 420], [565, 265], [590, 845], [920, 215], [1260, 405], [1410, 825], [1180, 860], [1420, 260], [770, 900], [100, 210], [430, 875]].forEach(([x, y]) => this.drawTree(x, y));
  }

  private createObstacles(): Phaser.Physics.Arcade.StaticGroup {
    const group = this.physics.add.staticGroup();
    const addObstacle = (x: number, y: number, width: number, height: number) => {
      const body = this.add.rectangle(x, y, width, height, 0x000000, 0);
      this.physics.add.existing(body, true);
      group.add(body);
    };
    addObstacle(1040, 295, 280, 155);
    [[180, 520], [350, 430], [565, 275], [590, 855], [920, 225], [1260, 415], [1410, 835], [1180, 870], [1420, 270], [770, 910], [100, 220], [430, 885]].forEach(([x, y]) => addObstacle(x, y, 30, 30));
    return group;
  }

  private createPlayer(x: number, y: number): Phaser.GameObjects.Arc {
    const player = this.add.circle(x, y, 16, 0x4f8ddb).setStrokeStyle(3, 0xe8f2ff).setDepth(5);
    this.physics.add.existing(player);
    const body = player.body as Phaser.Physics.Arcade.Body;
    body.setCircle(14).setOffset(2, 2).setCollideWorldBounds(true);
    return player;
  }

  private createNpc(x: number, y: number): void {
    this.add.ellipse(x, y + 20, 27, 9, 0x1d2a25, 0.3).setDepth(4);
    this.add.circle(x, y, 17, 0x8c55bc).setStrokeStyle(3, 0xf2d8ff).setDepth(5);
    this.add.triangle(x, y - 15, -14, 11, 14, 11, 0, -19, 0x40245f).setDepth(6);
    this.add.text(x, y - 52, 'Arkanist Eldren', { fontFamily: 'Georgia, serif', fontSize: '16px', color: '#fff6d8', stroke: '#26352c', strokeThickness: 4 }).setOrigin(0.5).setDepth(7);
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
