> :warning: **BETA VERSION - PROBABLY STILL HAS BUGS**

# Variant Spells Rule for dnd5e

This module implements the [Variant Spell Points Rule](https://www.dndbeyond.com/sources/dmg/dungeon-masters-workshop#VariantSpellPoints) as described in the Dungeon Master's Guide. 

* Adds a Spell Point tracking system to every actor that is a spellcaster
  * Displays the remaining spell points etc. in the sheet header for easy access
* shows point costs and remaining uses in the spellbook
* Automatically resets spell points on long rest and consumes them when a spell is used
* Works with multi-classing
* NPC's and non-spellcasters still use spell slots

![Screenshot](images/screenshot.jpg)

## Installation Instructions

> :arrow_right: [optional] Install the [libWrapper](https://foundryvtt.com/packages/lib-wrapper) module to avoid conflicts.

1. In `Configuration and Setup` go to `Add-on Modules` 
2. Click on `Install Module`
3. Paste the following URL into the `Manifest URL` text box at the bottom: 
   - https://github.com/Mary-Usagi/dnd5e-variant-spellpoints/releases/latest/download/module.json


## TODO
- **Settings to adjust spell costs and max points per level (GM only)**
- **Localization**
- **Compatability with other modules:**
  - :red_square: **Tidy5e Sheet**: Incompatible, because it also edits the actor sheet
  - :yellow_square: **Combat HUD**: Works, but doesn't show spell points or uses on the HUD
     - Replace spell slot indicator below spells with `spellpoint cost / remaining spellpoints`
     - Use Spell slot indicator for remaining uses for 6th level and higher spells