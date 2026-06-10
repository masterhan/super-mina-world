import Phaser from 'phaser';
import { makeTextures } from '../core/textures';
import { registerBank } from '../core/questions';
import { loadProfiles, loadSave, writeSave } from '../core/save';
import { setSession } from '../core/session';
import { ATLAS_CLASSIC_BANK } from '../data/banks/atlas-classic';
import { BIODOME_BANK } from '../data/banks/biodome';
import { STORMBYTE_BANK } from '../data/banks/stormbyte';
import { ORBITAL_BANK } from '../data/banks/orbital';
import { MATTERWORKS_BANK } from '../data/banks/matterworks';
import { ATLAS_BANK } from '../data/banks/atlas';
import { LEXICON_BANK } from '../data/banks/lexicon';
import { MAINFRAME_BANK } from '../data/banks/mainframe';

// Boot: generated pixel textures (no asset downloads on the critical path —
// real CC0 sprite art re-binds these keys later), question banks, save/profile
// load, then route: fresh save → Intro, returning player → straight to the map.
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    makeTextures(this);

    registerBank(ATLAS_CLASSIC_BANK);
    registerBank(BIODOME_BANK);
    registerBank(STORMBYTE_BANK);
    registerBank(ORBITAL_BANK);
    registerBank(MATTERWORKS_BANK);
    registerBank(ATLAS_BANK);
    registerBank(LEXICON_BANK);
    registerBank(MAINFRAME_BANK);

    const idx = loadProfiles();
    const id = idx.active || 'p1';
    const save = loadSave(id);
    const persist = () => writeSave(id, save);
    setSession({ save, persist });

    if (save.introDone) this.scene.start('Overworld', { save, persist });
    else this.scene.start('Intro', { save, persist });
  }
}
