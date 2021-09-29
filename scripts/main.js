class VSpellPoints {
    static ID_old = 'dnd5e-variant-spellpoints';

    // TODO: rename module
    static ID = 'spellpoints5e';

    static FLAGS = {
        POINTS: 'points', // was: 'spellpoints'
        USES: 'uses',
        RESOURCES: 'resources' // TODO: will replace points and uses
    }

    static resourcesPath() {
        return `flags.${VSpellPoints.ID}.${VSpellPoints.FLAGS.RESOURCES}`
    }

    static TEMPLATES = {
        POINTS: `modules/${this.ID}/templates/main.hbs`
    }

    static SETTINGS = {
        TOGGLEON: 'spellPointsToggle',
        TABLESETTINGS: 'tablesButton'
    }

    static initialize() {
        // reload not needed
        const debouncedReload = foundry.utils.debounce(window.location.reload, 100);

        // Register a world setting
        game.settings.register(this.ID, this.SETTINGS.TOGGLEON, {
            name: "Use Variant: Spell Points? ",
            hint: `Use Spell Points instead of Slots, as described in the Dungeon Master's Guide. Replaces parts of the "spell book" in the character sheet. `,
            scope: "world",      // This specifies a world-level setting
            config: true,        // This specifies that the setting appears in the configuration view
            default: false,      // The default value for the setting
            type: Boolean
        });
    }

    /* https://github.com/League-of-Foundry-Developers/foundryvtt-devMode */
    static log(...args) {
        try {
            const isDebugging = game.modules.get('_dev-mode')?.api?.getPackageDebugValue(this.ID);
            if (isDebugging) {
                console.log(this.ID, '|', ...args);
            }
        } catch (e) {}
    }
}

class VSpellPointsData {
    /** @typedef {{
     *  maxLevel: number,
     *  points: {
     *      max: number,
     *      value: number,
     *      addMax: number,
     *      temp: number
     *  },
     *  uses: {
     *      spell6: {max: number, value: number},
     *      spell7: {max: number, value: number},
     *      spell8: {max: number, value: number},
     *      spell9: {max: number, value: number}
     *  }
     * }} Resource
     * */

    /** @type Resource */
    static resourcesTemplate = {
        // max spell level
        maxLevel: 0,
        // tracking spell points
        points: {
            max: 0,
            value: 0,
            addMax: 0,
            temp: 0
        },
        // tracking uses
        uses: {
            spell6: {max: 0, value: 0},
            spell7: {max: 0, value: 0},
            spell8: {max: 0, value: 0},
            spell9: {max: 0, value: 0},
        }
    }

    // for debugging purposes
    static _deleteAllPointData() {
        game.actors.forEach((actor) => {
            this.deletePoints(actor);
            this.deleteUses(actor);
            this.deleteResources(actor);
        })
    }

    static initPoints(actor) {
        /** @type Resource */
        let actorResources = this.getResources(actor);
        VSpellPoints.log(actorResources)

        let isNotPresent = !actorResources || (actorResources && foundry.utils.isObjectEmpty(actorResources))

        let [points, level] = VSpellPointsCalcs.getMaxSpellPointsAndLevel(actor.data.data.classes)

        /** @type Resource */
        let updateResources;
        if (isNotPresent) {
            console.log(`${VSpellPoints.ID} | Initializing spell points data for: ${actor.name}`)

            // Update Resources: take template and replace initial values
            // level and points
            updateResources = foundry.utils.deepClone(this.resourcesTemplate)
            updateResources.maxLevel = level;
            updateResources.points.max = points;
            updateResources.points.value = points;

            // spell uses
            for (let j = 6; j <= level; j++) {
                updateResources.uses[`spell${j}`].max = 1
                updateResources.uses[`spell${j}`].value = 1
            }

            // persist in actor
            actor.setFlag(VSpellPoints.ID, VSpellPoints.FLAGS.RESOURCES, updateResources);
        } else if (actorResources.points.max !== points || actorResources.maxLevel !== level) {
            // TODO (maybe): Put into update actor hook
            VSpellPoints.log(`${VSpellPoints.ID} | Updating spell points data for: ${actor.name}`)

            // Update Resources
            // level and points
            updateResources = {
                maxLevel: level,
                points: { max: points },
                uses: {}
            }

            for (let j = 6; j <= 9; j++) {
                if (j <= level) updateResources.uses[`spell${j}`].max = 1
                else updateResources.uses[`spell${j}`].max = 0
            }

            // persist
            actor.setFlag(VSpellPoints.ID, VSpellPoints.FLAGS.RESOURCES, updateResources);
        } else {
            VSpellPoints.log(`Nothing to do`)
        }

        // return default values
        let defaultResources = foundry.utils.mergeObject(this.resourcesTemplate, actorResources, {insertKeys: false, overwrite: true, recursive: true})
        return defaultResources
    }

    static deletePoints(actor) {
        return actor.unsetFlag(VSpellPoints.ID, VSpellPoints.FLAGS.POINTS)
    }

    static deleteUses(actor) {
        return actor.unsetFlag(VSpellPoints.ID, VSpellPoints.FLAGS.USES)
    }

    static deleteResources(actor) {
        return actor.unsetFlag(VSpellPoints.ID, VSpellPoints.FLAGS.RESOURCES)
    }

    static getResources(actor) {
        return actor.getFlag(VSpellPoints.ID, VSpellPoints.FLAGS.RESOURCES);
    }

    // TODO: think about how to do it
    // static updateGlobalSpellPointsTable(updateData) {}
    // static updateGlobalSpellCostTable(updateData) {}
}

class VSpellPointsCalcs {
    static NONE = 0;
    static THIRD = 1;
    static HALF = 2;
    static FULL = 3;

    // map from caster name (String) to their spellcasting type
    static transformCasterType (casterType) {
        switch (casterType) {
            case 'none': return this.NONE;
            case 'pact': return this.NONE;
            case 'third': return this.THIRD;
            case 'artificer': return this.HALF; // TODO: correct?
            case 'half': return this.HALF;
            case 'full': return this.FULL;
            default: return this.NONE;
        }
    }

    // full caster use their class level for determining spell points, half caster use their class level / 2, third caster / 3
    static getSpellCastingLevel(casterType, classLevel) {
        let casterTypeNr = this.transformCasterType(casterType)
        switch (casterTypeNr) {
            case this.NONE: return 0;
            case this.THIRD: return Math.floor(classLevel / 3);
            case this.HALF: return Math.floor(classLevel / 2);
            case this.FULL: return classLevel;
            default: return 0;
        }
    }

    static getCombinedSpellCastingLevel (classes) {
        let allCastingLevels = {}
        Object.entries(classes).forEach( ([className, classProps]) =>  {
            allCastingLevels[className] = this.getSpellCastingLevel(classProps.spellcasting.progression, classProps.levels);
        });
        return [Object.values(allCastingLevels).reduce((a, b) => a + b, 0), allCastingLevels];
    }

    static getMaxSpellPointsAndLevel(classes) {
        let [spellCastingLevel, _] = this.getCombinedSpellCastingLevel(classes);
        return this.getSpellpointsByLevel(spellCastingLevel);
    }

    // point cost by spell level (starting with level 0 = cantrips)
    static _spellPointCost = [0, 2, 3, 5, 6, 7, 9, 10, 11, 13]
    static getSpellPointCost(i) {
        let clampedLevel = Math.clamped(i, 0, this._spellPointCost.length - 1)
        if (clampedLevel !== i )
            console.error(`${VSpellPoints.ID} - Spell level ${i} out of bounds: has no spell point cost`);
        return this._spellPointCost[clampedLevel];
    }

    // which spell levels can only be cast once per long rest
    static lockedSpellLevels = [6, 7, 8, 9];

    // TODO: editable? (in Settings? Or in the character itself? Only gm or also player?)
    // TODO: check for errors
    // starting with character level 0
    // [max points, max spell level]
    static _spellPointsByLevelTable = [
        [0, 0],
        [4, 1],
        [6, 1],
        [14, 2],
        [17, 2],
        [27, 3],
        [32, 3],
        [38, 4],
        [44, 4],
        [57, 5],
        [64, 5],
        [73, 6],
        [73, 6],
        [83, 7],
        [83, 7],
        [94, 8],
        [94, 8],
        [107, 9],
        [114, 9],
        [123, 9],
        [133, 9]
    ];
    static getSpellpointsByLevel(i) {
        let clampedLevel = Math.clamped(i, 0, this._spellPointsByLevelTable.length - 1)
        if (clampedLevel !== i )
            console.error(`${VSpellPoints.ID} - Character level ${i} out of bounds: has no maximum spell points set`);
        return this._spellPointsByLevelTable[clampedLevel];
    }

    static createSpellPointsInfo(actor, data) {
        // TODO: with localization
        const spellPointsNameText = "Spell Points";
        const spellPointsTempText = "Temp"
        const spellPointsTempMaxText = "Max"
        const currentSpellPointsTooltip = "Spell points you can currently spend"
        let maxSpellPointsTooltip = "Your maximum number of spell points"

        // read from actor
        /** @type Resource */
        let userData = data;
        if (!userData) userData = {}

        let maxSpellPoints = userData.points.max;
        let tempMax = userData.points.addMax > 0 ? userData.points.addMax : "";
        let tempPoints = userData.points.temp > 0 ? userData.points.temp : "";
        let currentSpellpoints = userData.points.value;

        let [combinedLevel, allCastingLevels] = VSpellPointsCalcs.getCombinedSpellCastingLevel(actor.data.data.classes)

        let levelsTooltip = ""
        Object.entries(allCastingLevels).forEach(([name, level], index) => {
            levelsTooltip += `
                <tbody><tr>
                  <td class="attribution-value ${index === 0 ? 'mode-5' : 'mode-2'}">
                    ${level}
                  </td>
                  <td class="attribution-label">${name.capitalize()}</td>
                </tr>`
        })

        // TODO: define as template
        let spellPointsInfo = `
        <li class="attribute spellpoints">
            <h4 class="attribute-name box-title">${spellPointsNameText}</h4>
            <div class="attribute-value multiple attributable"> 
                <input name="${VSpellPoints.resourcesPath()}.points.value" type="text" value="${currentSpellpoints ?? ""}" placeholder="10" data-dtype="Number"> <!-- title="${currentSpellPointsTooltip}" -->
                <span class="sep"> / </span>
                <span class="attribute-max" title="${maxSpellPointsTooltip}"> ${maxSpellPoints} </span>
                <div class="property-attribution tooltip">
                  <table>
                    <thead>Spellcasting Levels: </thead>
                    <tbody>
                     ${levelsTooltip}
                    <tr class="total">
                      <td class="attribution-value">${combinedLevel}</td>
                      <td class="attribution-label">Total</td>
                    </tr>
                  </tbody></table>
                </div>
            </div>
            <!-- Temp and Max override
            <footer class="attribute-footer">
                <input name="${VSpellPoints.resourcesPath()}.points.temp" type="text" class="temphp" placeholder="+${spellPointsTempText}" value="${tempPoints}" data-dtype="Number">
                <input name="${VSpellPoints.resourcesPath()}.points.addMax" type="text" class="temphp" placeholder="+${spellPointsTempMaxText}" value="${tempMax}" data-dtype="Number">
            </footer> -->

        </li>`;

        return spellPointsInfo;
    }
}

Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag(VSpellPoints.ID);
});

/**
 * Once the game has initialized, set up our module
 */
Hooks.once('ready', () => {
    console.log(`${VSpellPoints.ID} | Initializing module`)
    VSpellPoints.initialize();

    // TODO: find better place for the functions
    // chekc if actor is a player character
    function isCharacter(actor) {
        if (actor.data?.type !== "character") {
            VSpellPoints.log("Actor is not a player")
            return false
        }
        return true
    }

    // check if actor is spellcasters
    function isSpellcaster(actor) {
        let classes = actor?.data?.data?.classes;
        if (!classes) {
            VSpellPoints.log("Actor is not a spellcaster")
            return false;
        }

        let isCaster = VSpellPointsCalcs.getCombinedSpellCastingLevel(classes)[0] > 0;
        if (!isCaster) {
            VSpellPoints.log("Actor is not a spellcaster")
            return false
        }

        return true
    }

    // check if actor is warlock
    function isWarlock(actor) {
        if (!(actor?.data?.data?.classes)) {
            return false
        }

        if ('warlock' in actor.data.data.classes) {
            VSpellPoints.log("Actor is a Warlock")
            return true;
        }
        return false;
    }

    // check if module was enabled in the settings
    function isModuleEnabled() {
        const useModule = game.settings.get(VSpellPoints.ID,VSpellPoints.SETTINGS.TOGGLEON);
        if (!useModule) {
            VSpellPoints.log('Variant Spellpoints not used')
            return false;
        }
        return true
    }

    // modify actorsheet after its rendered to show the spell points
    Hooks.on("renderActorSheet5e", (actorsheet, html, _options) => {
        VSpellPoints.log("RENDER", actorsheet, html, _options)

        // prevent execution if variant is disabled
        if (!isModuleEnabled()) return;

        let actor = actorsheet.object;
        if (!isCharacter(actor)) return;

        VSpellPoints.log("++++++++++++++++++")
        VSpellPoints.log("render actorsheet", actorsheet)
        VSpellPoints.log("renderActor: ", foundry.utils.deepClone(actor))

        // initialize spellpoints data in the actor, if not yet present
        const defaultResources = VSpellPointsData.initPoints(actor)

        // removes non spellcasters and single-class warlocks
        VSpellPoints.log("Render Sheet: warlock, spellcaster:", isWarlock(actor), isSpellcaster(actor))
        if (!isSpellcaster(actor)) return;

        // change header of sheet
        VSpellPoints.log("It's a caster! - Level " + VSpellPointsCalcs.getCombinedSpellCastingLevel(actor.data.data.classes)[0])
        let attributesList = html.find(".sheet-header").find(".attributes")

        let savedResourcesData = VSpellPointsData.getResources(actor) ?? {}
        /** @type Resource */
        let actorResources = foundry.utils.isObjectEmpty(savedResourcesData) ? defaultResources : savedResourcesData;
        VSpellPoints.log("Using pointData: ", actorResources)

        let spellPointsAttribute = VSpellPointsCalcs.createSpellPointsInfo(actor, actorResources, actorsheet);
        let newAttribute = attributesList.append(spellPointsAttribute)

        // activate all listeners for the new html
        actorsheet.activateListeners($(newAttribute).find(".spellpoints"))

        // change the slot info to spell point cost and remaining spell points
        // and filter out warlock spells
        let itemsHeader = html
            .find(".tab.spellbook")
            .find(".items-header.spellbook-header")
            .filter(function() {
                // the name attribute marks a row with pact spells
                return ($(this).find('[name="data.spells.pact.value"]').length === 0);
            });

        itemsHeader.find("h3").addClass("points-variant")
        itemsHeader
            .find(".spell-slots")
            .each( function(i) {
                let newSlotInfo = `
                    <span> ${VSpellPointsCalcs.getSpellPointCost(i)} </span>
                    <span class="sep"> / </span>
                    <span class="spell-max">${actorResources?.points?.value ?? 0} P</span>`

                // ignore cantrips
                if (i === 0) newSlotInfo = " - "

                $(this).attr('title', 'cost / remaining spell points');
                $(this).removeClass("spell-slots")
                $(this).addClass("spell-points")
                $(this).html(newSlotInfo)
            });

        itemsHeader
            .find("h3")
            .each( function(i) {
                // ignore spells below 6th level
                if (i < 6) return true;

                let spellStr = `spell${i}`
                let usesInfo = `
                    <div class="spell-uses" title="remaining uses">
                        (<input type="text" 
                                name="${VSpellPoints.resourcesPath()}.uses.${spellStr}.value" 
                                value="${actorResources.uses[spellStr]?.value ?? 0}" placeholder="0" 
                                data-dtype="Number">
                        <span class="sep"> / </span>
                        <span class="spell-max">
                            ${ actorResources.uses[spellStr].max}
                        </span>)
                    </div><!-- <div class="flex-gap" style="display: inline-flex; flex-wrap: wrap"></div><div class="flex-gap" style="display: inline-flex; flex-wrap: wrap"></div> -->`
                $(this).after(usesInfo);
            });

        // set new min-width if it hasn't been set yet
        let currentMinWidth = html.css("min-width").replace("px", "")
        if (currentMinWidth !== "auto" && currentMinWidth < actorsheet.options.width + 50) {
            html.css("min-width", `${actorsheet.options.width + 50}px`)
            actorsheet.setPosition({width: actorsheet.options.width + 50})
        }
    });

    Hooks.on("renderLongRestDialog", (dialog, html, options) => {
        // prevent execution if variant is disabled
        if (!isModuleEnabled()) return;

        // TODO: Sachen nicht von text abhängig machen
        let text = $(html).find(".dialog-content").children("p").text().replace('spell slots', 'spell points');
        $(html).find(".dialog-content").children("p").text(text);
    })

    // TODO: use localization stuff
    // replace the spell slot reminder in the ability use dialog
    Hooks.on("renderAbilityUseDialog", (dialog, html, object) => {
        // prevent execution if variant is disabled
        if (!isModuleEnabled()) return;

        VSpellPoints.log(dialog, html, object)
        let item = dialog.item
        let actor = item.parent;

        VSpellPoints.log("Render Ability Use: warlock, spellcaster:", isWarlock(actor), isSpellcaster(actor))
        // filters out npcs, non spellcasters and single-class warlocks
        if (!isCharacter(actor) || !isSpellcaster(actor)) return;

        // TODO: Show red warning box if it can't be cast

        // only apply on spells that cost resources
        if (item?.data?.type !== "spell"
            || item?.labels?.level === "Cantrip"
            || item?.data?.data?.preparation?.mode === "atwill"
            || item?.data?.data?.preparation?.mode === "innate") {
            VSpellPoints.log("not using a resource spell")
            return;
        }

        VSpellPoints.log(dialog, html, object)
        /** @type Resource */
        let actorResources = VSpellPointsData.getResources(actor);
        if (!actorResources || foundry.utils.isObjectEmpty(actorResources))
            actorResources = VSpellPointsData.initPoints(actor);

            // change consume spell slot text
        let consumeText = $(html)
            .find("#ability-use-form")
            .find("input[name='consumeSlot']")
            .parent()
            .contents().filter(function() {
                // get only text elements
                return this.nodeType === 3;
            });

        if (isWarlock(actor))
            $(consumeText)[0].textContent="Consume Spell Points / Slots?";
        else
            $(consumeText)[0].textContent="Consume Spell Points?";

        // modify the "cast at level" list
        $(html)
            .find("#ability-use-form")
            .find("select[name='level']")
            .find("option")
            .each( function (i) {
                let textParts = $(this).text().split(" ")
                let spellValue = $(this).attr("value")

                let isPact = spellValue === 'pact'

                if (isPact) {
                    // do nothing
                } else {
                    let spellLevel = parseInt(spellValue)

                    let cost = VSpellPointsCalcs.getSpellPointCost(spellLevel)

                    let new_text = ""
                    new_text += `${textParts[0]} ${textParts[1]} `

                    // add spellpoint cost and spellpoints left
                    new_text += `(${cost} / ${actorResources.points?.value ?? 0} Spell Points)`

                    // add uses left
                    if (spellLevel >= 6) {
                        let uses = actorResources?.uses[`spell${spellLevel}`]?.value ?? 0;
                        let usesMax = actorResources?.uses[`spell${spellLevel}`]?.max ?? 0;
                        new_text += ` (${usesMax} / ${uses} uses)`
                    }
                    $(this).text(new_text);
                }
            })
    })

    // TODO: use libwrapper
    // Monkey patch the long rest function so it resets the spell points
    // TODO: Maybe only add a hook call and handle it by myself
    let oldRestSpellRecovery = game.dnd5e.entities.Actor5e.prototype._getRestSpellRecovery;
    game.dnd5e.entities.Actor5e.prototype._getRestSpellRecovery = function({ recoverPact=true, recoverSpells=true }) {

        VSpellPoints.log("recover pact:", recoverPact, "recover spells:", recoverSpells)
        VSpellPoints.log("_getRestSpellRecovery: warlock, spellcaster", isWarlock(this), isSpellcaster(this))

        // use normal function if variant usage is disabled, no spells are being recovered, its an NPC or its not a spellcaster
        if (!isModuleEnabled() || !recoverSpells || !isCharacter(this) || !isSpellcaster(this)) {
            return oldRestSpellRecovery.apply(this, arguments);
        }

        // call normal spell recovery
        let oldUpdate = oldRestSpellRecovery.apply(this, arguments);

        /** @type Resource */
        let actorResources = VSpellPointsData.getResources(this)
        if (!actorResources || foundry.utils.isObjectEmpty(actorResources))
            actorResources = VSpellPointsData.initPoints(actor);

        // and then add my own update: reset current, tempPoints, tempMax and uses
        if (actorResources?.points?.value !== undefined && actorResources?.points?.max !== undefined)
            oldUpdate[`${VSpellPoints.resourcesPath()}.points.value`] = actorResources?.points?.max ?? 0;
            oldUpdate[`${VSpellPoints.resourcesPath()}.points.temp`] = 0;
            oldUpdate[`${VSpellPoints.resourcesPath()}.points.addMax`] = 0;
            // reset uses for over 6th level spells
            Object.entries(actorResources?.uses ?? {}).forEach( ([spellLevel, data]) => {
                VSpellPoints.log(`${VSpellPoints.resourcesPath()}.uses.${spellLevel}.value`, data.max)
                oldUpdate[`${VSpellPoints.resourcesPath()}.uses.${spellLevel}.value`] = data.max
            })

        return oldUpdate;
    }


    // Monkey patch the roll spell function so it consumes spell points
    // TODO: Maybe only add a hook and handle it by myself
    let oldUsageUpdate = game.dnd5e.entities.Item5e.prototype._getUsageUpdates;
    game.dnd5e.entities.Item5e.prototype._getUsageUpdates = function({consumeQuantity, consumeRecharge, consumeResource, consumeSpellLevel, consumeUsage}) {
        let actor = this.parent;

        VSpellPoints.log("_getUsageUpdates", {consumeQuantity, consumeRecharge, consumeResource, consumeSpellLevel, consumeUsage}, this)
        // use normal function if variant is disabled or because of other factors
        // do default behaviour if no spell level is used or module is deactivated
        VSpellPoints.log("_getUsageUpdates: warlock, spellcaster, consumeSpellLevel:", isWarlock(actor), isSpellcaster(actor), consumeSpellLevel)
        if (!isModuleEnabled() || !consumeSpellLevel || !isCharacter(actor) || !isSpellcaster(actor)) {
            return oldUsageUpdate.apply(this, arguments);
        }

        // Do default behaviour if spell is cast with pact magic
        const isPactMagic = consumeSpellLevel === "pact"
        if (isPactMagic) {
            return oldUsageUpdate.apply(this, arguments);
        }

        // get the spell level that is being cast
        let spellLevelStr = consumeSpellLevel;

        // prevent default behaviour by telling the function there is no spell being consumed
        consumeSpellLevel = null

        // call normal spell recovery
        let oldUpdate = oldUsageUpdate.apply(this, [{consumeQuantity, consumeRecharge, consumeResource, consumeSpellLevel, consumeUsage}]);

        VSpellPoints.log(oldUpdate)

        /** @type Resource */
        let actorResources = VSpellPointsData.getResources(actor);
        if (!actorResources || foundry.utils.isObjectEmpty(actorResources))
            actorResources = VSpellPointsData.initPoints(actor);

        // string of spelllevel to number
        let spellLevel = parseInt("" + spellLevelStr.replace("spell", ""))

        // define when spells start to cost uses
        let usesSpellLevel = 6

        // get point cost of spell level
        let spellCost = VSpellPointsCalcs.getSpellPointCost(spellLevel)
        VSpellPoints.log("spelllevel: " + spellLevel)
        VSpellPoints.log("spellCost: " + spellCost)
        VSpellPoints.log("currentPoint: " + actorResources?.points?.value)
        VSpellPoints.log("maxSpellLevel: " + actorResources?.maxLevel)
        if (spellLevel >= usesSpellLevel) VSpellPoints.log(`usesRemaining-${spellLevelStr}: ` + actorResources?.uses[spellLevelStr]?.value ?? 0)

        // error if no or not enough spell points are left, or if level is too high, or if uses remaining
        let currentNotOk = !spellCost || !actorResources?.points?.value || actorResources?.points?.value < spellCost
        let spellLevelNotOk = !spellLevel || !actorResources?.maxLevel || spellLevel > actorResources?.maxLevel
        let noUsesRemaining = spellLevel >= usesSpellLevel ? actorResources?.uses[spellLevelStr]?.value === 0 : false

        VSpellPoints.log(`Enough points: ${!currentNotOk}, level ok: ${!spellLevelNotOk}, uses ok: ${!noUsesRemaining}`)

        // show error
        const id = this.data.data;
        if (currentNotOk || spellLevelNotOk || noUsesRemaining) {
            // TODO: localize
            // const label = game.i18n.localize(spellLevelStr === "pact" ? "DND5E.SpellProgPact" : `DND5E.SpellLevel${id.level}`);
            // ui.notifications.warn(game.i18n.format("DND5E.SpellCastNoSlots", {name: this.name, level: label}));

            if (currentNotOk) ui.notifications.warn(`You don't have enough spell points to cast ${this.name}`);
            else if (spellLevelNotOk) ui.notifications.warn(`The spell level of ${this.name} is too high`);
            else if (noUsesRemaining) ui.notifications.warn(`You have no uses left for level ${spellLevel} spells`);
            else ui.notifications.warn(`You can't cast ${this.name} at level ${spellLevel} right now`);

            return false;
        }

        // if can be cast: use spell points
        // => adjust oldUpdate data to include the new current spellpoints
        oldUpdate.actorUpdates[`${VSpellPoints.resourcesPath()}.points.value`] = Math.max((actorResources?.points?.value ?? 0) - spellCost, 0);

        // update uses of the spell
        if (spellLevel >= usesSpellLevel) oldUpdate.actorUpdates[`${VSpellPoints.resourcesPath()}.uses.${spellLevelStr}.value`] = (actorResources?.uses[spellLevelStr]?.value ?? 0) - 1
        return oldUpdate;
    }
})
