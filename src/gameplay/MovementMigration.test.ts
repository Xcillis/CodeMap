// @vitest-environment jsdom
import * as Blockly from 'blockly/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { migrateMovementSource, migrateMovementWorkspace } from './MovementMigration';
import { loadProgress, saveProgress } from './LocalProgress';
import { compileActionPlan, nodesToSource } from '../combat/DecisionProgram';
import { loadNodes, workspaceNodes, restoreWorkspaceState } from '../ui/SnapEditor';
import { getLesson } from './WorldQuests';
import { LessonSession } from '../combat/LessonSession';

beforeEach(() => localStorage.clear());

describe('Übertragung alter Bewegungsentwürfe', () => {
  it('überträgt alle Welt-Richtungen in Schleifen und Zweigen und stellt die Blickrichtung wieder her', () => {
    const old = 'repeat(2, () => { glutling.moveRight(); glutling.moveUp(); glutling.moveLeft(); glutling.moveDown(); });';
    const migrated = migrateMovementSource(old);
    expect(migrated).not.toMatch(/moveRight|moveUp|moveLeft|moveDown/);
    const lesson = getLesson('q01-glutspur'); if (lesson.kind !== 'puzzle') throw new Error('Rätsel erwartet');
    const definition = { ...lesson, start: { x: 3, y: 3 }, goal: { x: 6, y: 0 }, walls: [], allowed: [...lesson.allowed, 'repeat' as const] };
    for (const source of [old, migrated]) {
      const session = new LessonSession(definition, definition.allowed); session.execute({ glutling: source }, true);
      expect(session.snapshot.player).toMatchObject({ x: 3, y: 3, facing: 'east' });
    }
    const branch = migrateMovementSource('if (glutling.pathRightClear) { glutling.moveRight(); } else { glutling.moveUp(); }');
    expect(branch).toContain('pathAheadClear'); expect(compileActionPlan(branch, 'glutling').error).toBeUndefined();
    expect(migrateMovementSource('moosling.moveForward();')).toBe('moosling.moveTowardEnemy();');
    expect(migrateMovementSource('glutling.')).toBe('glutling.');
  });

  it('erhält echte Verbindungen, lose Blöcke, Koordinaten und deaktivierte Rümpfe mit eindeutigen IDs', () => {
    const workspace = new Blockly.Workspace(); const restored = new Blockly.Workspace();
    try {
      const nodes = compileActionPlan('repeat(2, () => { moosling.moveUp(); moosling.moveLeft(); }); moosling.moveTowardEnemy();', 'moosling').nodes!;
      loadNodes(workspace, nodes, 'moosling');
      const loose = workspace.newBlock('cm_move_down', 'relative-migration-1'); loose.moveBy(340, 210); loose.setDisabledReason(true, 'user');
      const state = Blockly.serialization.workspaces.save(workspace);
      // Old automatic approach block used the cm_move identifier.
      const oldState = JSON.stringify(state).replaceAll('cm_move_toward', 'cm_move');
      const transferred = migrateMovementWorkspace(oldState);
      Blockly.serialization.workspaces.load(restoreWorkspaceState(transferred), restored);
      expect(workspaceNodes(restored)).toEqual(compileActionPlan(migrateMovementSource(nodesToSource(nodes, 'moosling').replaceAll('moveTowardEnemy', 'moveForward')), 'moosling').nodes);
      const looseCopy = restored.getBlockById(loose.id)!;
      expect(looseCopy.type).toBe('cm_turn_right'); expect(looseCopy.getRelativeToSurfaceXY()).toMatchObject({ x: 340, y: 210 });
      const chain: Blockly.Block[] = []; let block: Blockly.Block | null = looseCopy;
      while (block) { chain.push(block); block = block.getNextBlock(); }
      expect(chain.map((item) => item.type)).toEqual(['cm_turn_right', 'cm_move_forward', 'cm_turn_left']);
      expect(chain.every((item) => !item.isEnabled())).toBe(true);
      const ids = restored.getAllBlocks(false).map((item) => item.id); expect(new Set(ids).size).toBe(ids.length);
      expect(migrateMovementWorkspace(transferred)).toBe(transferred);
    } finally { workspace.dispose(); restored.dispose(); }
    expect(migrateMovementWorkspace('{unfinished')).toBe('{unfinished');
  });

  it('sichert Originalfassungen und migriert beim erneuten Laden neue Vorwärtsbefehle nicht noch einmal', () => {
    const original = 'repeat(2, () => { glutling.moveUp(); }); glutling.moveForward();';
    const workspace = '{"blocks":{"blocks":[{"type":"cm_move","id":"saved"}]}}';
    localStorage.setItem('codemap-m2-progress', JSON.stringify({ programVersion: 3, lastProgram: original, programs: { 'q01-glutspur:glutling': original }, blockWorkspaces: { 'q01-glutspur:glutling': workspace },
      campaign: { version: 2, owned: [{ speciesId: 'glutling', learned: ['moveForward'] }] } }));
    const migrated = loadProgress();
    expect(migrated.movementBackup).toEqual({ lastProgram: original, programs: { 'q01-glutspur:glutling': original }, blockWorkspaces: { 'q01-glutspur:glutling': workspace } });
    expect(migrated.lastProgram).toBe(migrateMovementSource(original));
    expect(migrated.campaign.owned[0].learned).toEqual(expect.arrayContaining(['moveTowardEnemy', 'moveForward', 'moveBackward', 'turnLeft', 'turnRight']));
    saveProgress({ lastProgram: 'glutling.moveForward();' });
    const reloaded = loadProgress(); expect(reloaded.lastProgram).toBe('glutling.moveForward();');
    expect(reloaded.programs).toEqual(migrated.programs); expect(reloaded.blockWorkspaces).toEqual(migrated.blockWorkspaces);
    expect(reloaded.movementBackup).toEqual(migrated.movementBackup); expect(reloaded.campaign.movementVersion).toBe(2);
  });
});
