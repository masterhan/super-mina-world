// Mechanic registry — stations reference these by key.
import { MechRun } from './contract';
import { runFractions } from './fractions';
import { runNumberline } from './numberline';
import { runCircuits } from './circuits';
import { runForces } from './forces';
import { runFoodchain } from './foodchain';
import { runParticles } from './particles';
import { runLifecycle } from './lifecycle';
import { runWatercycle } from './watercycle';
import { runPlanets } from './planets';
import { runWordForge } from './wordforge';
import { runSequencer } from './sequencer';
import { runWebbuilder } from './webbuilder';
import { runArcade } from './arcade';

export const MECHANICS: Record<string, MechRun> = {
  fractions: runFractions,
  numberline: runNumberline,
  circuits: runCircuits,
  forces: runForces,
  foodchain: runFoodchain,
  particles: runParticles,
  lifecycle: runLifecycle,
  watercycle: runWatercycle,
  planets: runPlanets,
  wordforge: runWordForge,
  sequencer: runSequencer,
  webbuilder: runWebbuilder,
  arcade: runArcade
};
