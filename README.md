> :warning: **ALPHA VERSION - PROBABLY STILL HAS LOTS OF BUGS**: Only use on testing setups!

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

In the setup screen, use the URL https://github.com/Mary-Usagi/dnd5e-variant-spellpoints/releases/latest/download/module.json to install the module.

## TODO
### Localization

### Compatability with other modules:
* Settings to adjust spell costs and max points per level (GM only) 
* Combat HUD
  - Works, but doesn't show spell points or uses on HUD
    
    Ideas: 
    - Replace spell slot indicator below spells with `spellpoint cost / remaining spellpoints`
    - Use Spell slot indicator for remaining uses for 6th level and higher spells