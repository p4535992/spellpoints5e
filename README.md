> :warning: **ALPHA VERSION - PROBABLY STILL HAS LOTS OF BUGS**: Only use on testing setups!

# Variant Spells Rule for dnd5e

This module implements the [Variant Spell Points Rule](https://www.dndbeyond.com/sources/dmg/dungeon-masters-workshop#VariantSpellPoints) as described in the Dungeon Master's Guide. 

* Adds a Spell Point Tracking System to every Actor that is a spellcaster
  * Displays the remaining spell points etc. in the sheet header for easy access
* Replaces parts of the Spellbook in the sheet to show point costs and remaining uses
* Automatically resets Spellpoints on long rest and consumes them when a spell is used
* Works with multiclassing
* NPC's and non-spellcasters don't change

![Screenshot](images/screenshot.jpg)

## Installation Instructions

In the setup screen, use the URL https://github.com/Mary-Usagi/dnd5e-variant-spellpoints/releases/latest/download/module.json to install the module.

## TODO
### Localization

### Compatability with other modules:

* Combat HUD
  - Works, but doesn't show spell points or uses on HUD
    
    Ideas: 
    - Replace spell slot indicator below spells with `spellpoint cost / remaining spellpoints`
    - Use Spell slot indicator for remaining uses for 6th level and higher spells