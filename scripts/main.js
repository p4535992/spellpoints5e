
class VSpellPoints {
    static ID = 'dnd5e-variant-spellpoints';

    static FLAGS = {
        POINTS: 'spellpoints',
        USES: 'uses'
    }

    static TEMPLATES = {
        POINTS: `modules/${this.ID}/templates/main.hbs`
    }

    static SETTINGS = {
        TOGGLEON: 'spellPointsToggle'
    }

    static initialize() {
        // Register a world setting
        const debouncedReload = foundry.utils.debounce(window.location.reload, 100);

        // TODO: fix reload (onchange)
        game.settings.register(this.ID, this.SETTINGS.TOGGLEON, {
            name: "Use Variant: Spell Points? ",
            hint: `Use Spell Points instead of Slots, as described in the Dungeon Master's Guide. Replaces parts of the "spell book" in the character sheet. `,
            scope: "world",      // This specifies a world-level setting
            config: true,        // This specifies that the setting appears in the configuration view
            default: false,      // The default value for the setting
            type: Boolean
        });
    }
}



class VSpellPointsData {
    /**
    static vars = {
        MAXPOINTS: "maxPoints",
        MAXSPELLLEVEL: "maxSpellLevel",
        TEMPMAX: "tempMax",
        TEMPPOINTS: "tempPoints",
        CURRENTPOINTS: "currentPoints"
    }

    static dataTemplate = {
        [this.vars.MAXPOINTS]: 0,
        [this.vars.MAXSPELLLEVEL]: 0,
        [this.vars.TEMPMAX]: 0,
        [this.vars.TEMPPOINTS]: 0,
        [this.vars.CURRENTPOINTS]: 0,
    } */

    /** @typedef {{
     *  maxPoints: number|string,
     *  maxSpellLevel: number|string,
     *  tempMax: number|string,
     *  tempPoints: number|string,
     *  currentPoints: number|string
     * }} Vars */

    /** @type Vars */
    static vars = {
        maxPoints: "maxPoints",
        maxSpellLevel: "maxSpellLevel",
        tempMax: "tempMax",
        tempPoints: "tempPoints",
        currentPoints: "currentPoints"
    }

    /** @type Vars */
    static dataTemplate = {
        maxPoints: 0,
        maxSpellLevel: 0,
        tempMax: 0,
        tempPoints: 0,
        currentPoints: 0,
    }

    /** @typedef {{
     *   "spell6.max": number,
     *   "spell7.max": number,
     *   "spell8.max": number,
     *   "spell9.max": number,
     *   "spell6.value": number,
     *   "spell7.value": number,
     *   "spell8.value": number,
     *   "spell9.value": number,
     * }} Uses */

    /** @type Uses */
    static usesTemplate = {
        "spell6": {max: 0, value: 0},
        "spell7": {max: 0, value: 0},
        "spell8": {max: 0, value: 0},
        "spell9": {max: 0, value: 0},
    }

    // for debugging purposes
    static _deleteAllPointData() {
        game.actors.forEach((actor) => {
            this.deletePoints(actor);
            this.deleteUses(actor);
        })
    }

    static initPoints(actor) {
        let actorSpellPoints = this.getPoints(actor);
        let actorUses = this.getUses(actor)
        console.log(actorSpellPoints)
        console.log(actorUses)
        let isNotPresent = !actorSpellPoints ||
            !actorUses ||
            (actorSpellPoints && Object.keys(actorSpellPoints).length === 0) ||
            (actorUses && Object.keys(actorUses).length === 0)

        let [points, level] = VSpellPointsCalcs.getMaxSpellPointsAndLevel(actor.data.data.classes)

        let updatePoints;
        let updateUses;

        if (isNotPresent) {
            console.log(`${VSpellPoints.ID} | Initializing spell points data for: ${actor.name}`)

            // update spell points
            /** @type {{tempMax: number, currentPoints: number, maxPoints: number, tempPoints: number, maxSpellLevel: number}} */
            updatePoints = {
                ...this.dataTemplate,
                [this.vars.maxPoints]: points,
                [this.vars.currentPoints]: points,
                [this.vars.maxSpellLevel]: level
            }

            let updateUses = {
                ...this.usesTemplate
            }

            for (let j = 6; j <= level; j++) {
                updateUses[`spell${j}.max`] = 1
                updateUses[`spell${j}.value`] = 1
            }

            // TODO: combine both set flags to one update
            actor.setFlag(VSpellPoints.ID, VSpellPoints.FLAGS.POINTS, updatePoints);
            actor.setFlag(VSpellPoints.ID, VSpellPoints.FLAGS.USES, updateUses);

        } else if (actorSpellPoints.maxPoints !== points || actorSpellPoints.maxSpellLevel !== level) {
            // TODO (maybe): Put into update actor hook
            console.log(`${VSpellPoints.ID} | Updating spell points data for: ${actor.name}`)

            updatePoints = {
                maxPoints: points,
                maxSpellLevel: level
            }
            console.log(updatePoints)


            updateUses = {
                "spell6": {max: 0},
                "spell7": {max: 0},
                "spell8": {max: 0},
                "spell9": {max: 0},
            }

            for (let j = 6; j <= level; j++) {
                updateUses[`spell${j}`].max = 1
            }
            console.log(updateUses)

            actor.setFlag(VSpellPoints.ID, VSpellPoints.FLAGS.POINTS, updatePoints);
            actor.setFlag(VSpellPoints.ID, VSpellPoints.FLAGS.USES, updateUses);
        } else {
            console.log(`${VSpellPoints.ID} | Nothing to do`)
        }

        // return default values
        return {
            defaultPoints: { ...this.dataTemplate, ...actorSpellPoints, ...updatePoints },
            defaultUses: { ...this.usesTemplate,...actorUses, ...updateUses }
        }
    }

    /**
     * @param {Object} actor
     * @param {Partial<Vars>} updateData
     */
    static updatePoints(actor, updateData) {
        let [points, level] = VSpellPointsCalcs.getMaxSpellPointsAndLevel(actor.data.data.classes)

        let userStats = this.getPoints(actor)
        if (!userStats) userStats = {}

        // construct the update to send
        const update = {
            ...updateData
        }

        // no negative spell points or higher than max
        if (update.currentPoints !== undefined)
            update.currentPoints = Math.clamped(update.currentPoints, 0, (update.maxPoints ?? userStats.maxPoints) + (update.tempMax ?? userStats.tempMax))

        actor.setFlag(VSpellPoints.ID, VSpellPoints.FLAGS.POINTS, update);
    }

    static deletePoints(actor) {
        return actor.unsetFlag(VSpellPoints.ID, VSpellPoints.FLAGS.POINTS)
    }

    static deleteUses(actor) {
        return actor.unsetFlag(VSpellPoints.ID, VSpellPoints.FLAGS.USES)
    }

    static getPoints(actor) {
        return actor.getFlag(VSpellPoints.ID, VSpellPoints.FLAGS.POINTS);
    }

    static getUses(actor) {
        return actor.getFlag(VSpellPoints.ID, VSpellPoints.FLAGS.USES);
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
    static transformCasterType (casterClass) {
        switch (casterClass) {
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
            case this.NONE:
                return 0;
            case this.THIRD:
                return Math.floor(classLevel / 3);
            case this.HALF:
                return Math.floor(classLevel / 2);
            case this.FULL:
                return classLevel;
            default:
                return 0;
        }
    }

    static getCombinedSpellCastingLevel (classes, returnAll) {
        let combinedLevel = 0;
        let allCastingLevels = {}
        Object.entries(classes).forEach( ([_className, classProps]) =>  {
            let level = this.getSpellCastingLevel(classProps.spellcasting.progression, classProps.levels);
            combinedLevel += level
            allCastingLevels[_className] = level;
        });

        if (returnAll)
            return [combinedLevel, allCastingLevels];
        return combinedLevel;
    }

    static getMaxSpellPointsAndLevel(classes) {
        let spellCastingLevel = this.getCombinedSpellCastingLevel(classes);
        return this.spellPointsByLevelTable[spellCastingLevel];
    }

    // TODO: json <===========

    // point cost by spell level (starting with level 0 = cantrips)
    static spellPointCost = [0, 2, 3, 5, 6, 7, 9, 10, 11, 13]

    // which spell levels can only be cast once per long rest
    static lockedSpellLevels = [6, 7, 8, 9];


    // TODO: editable? (in Settings? Or in the character itself? Only gm or also player?)
    // TODO: check for errors
    // starting with character level 0
    // [max points, max spell level]
    static spellPointsByLevelTable = [
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


    static createSpellPointsInfo(actor, data) {
        // TODO: with localization
        const spellPointsNameText = "Spell Points";
        const spellPointsTempText = "Temp"
        const spellPointsTempMaxText = "Max"
        const currentSpellPointsTooltip = "Spell points you can currently spend"
        let maxSpellPointsTooltip = "Your maximum number of spell points"

        // read from actor
        let userData = data;
        if (!userData) userData = {}

        let maxSpellPoints = userData.maxPoints;
        let tempMax = userData.tempMax > 0 ? userData.tempMax : "";
        let tempPoints = userData.tempPoints > 0 ? userData.tempPoints : "";
        let currentSpellpoints = userData.currentPoints;

        let [combinedLevel, allCastingLevels] = VSpellPointsCalcs.getCombinedSpellCastingLevel(actor.data.data.classes, true)

        // maxSpellPointsTooltip += `&#013;Because the combined spell casting level from all your classes is: ${combinedLevel}`
        // maxSpellPointsTooltip += `&#013;&#013;Spellcasting level by class: `
        // Object.entries(allCastingLevels).forEach(([name, level]) => {
        //     maxSpellPointsTooltip += `&#013;${name.capitalize()}: ${level}`
        // })

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
        // TODO: add little gear icon to change max spellpoints
        let spellPointsInfo = `
        <li class="attribute spellpoints">
            <h4 class="attribute-name box-title">${spellPointsNameText}</h4>
            <div class="attribute-value multiple attributable">
                <input name="flags.${VSpellPoints.ID}.${VSpellPoints.FLAGS.POINTS}.currentPoints" type="text" value="${currentSpellpoints ?? ""}" placeholder="10" data-dtype="Number"> <!-- title="${currentSpellPointsTooltip}" -->
                <span class="sep"> / </span>
                <span style="padding: 1px 3px" title="${maxSpellPointsTooltip}"> ${maxSpellPoints} </span>
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
                <input name="flags.${VSpellPoints.ID}.${VSpellPoints.FLAGS.POINTS}.tempPoints" type="text" class="temphp" placeholder="+${spellPointsTempText}" value="${tempPoints}" data-dtype="Number">
                <input name="flags.${VSpellPoints.ID}.${VSpellPoints.FLAGS.POINTS}.tempMax" type="text" class="temphp" placeholder="+${spellPointsTempMaxText}" value="${tempMax}" data-dtype="Number">
            </footer> -->

        </li>`;

        return spellPointsInfo;
    }
}

/**
 * Once the game has initialized, set up our module
 */
Hooks.once('ready', () => {
    console.log('dnd5e-variant-spellpoints | Initializing module')
    VSpellPoints.initialize();

    // TODO: find better place for the functions
    // ignore non player characters
    function isCharacter(actor) {
        if (actor.data?.type !== "character") {
            console.log("dnd5e-variant-spellpoints | Actor is not a player")
            return false
        }
        return true
    }

    // ignore non-spellcasters
    function isSpellcaster(actor) {
        let classes = actor?.data?.data?.classes;
        if (!classes) {
            console.log("dnd5e-variant-spellpoints | Actor is not a spellcaster")
            return false;
        }

        let isCaster = VSpellPointsCalcs.getCombinedSpellCastingLevel(classes) > 0;
        if (!isCaster) {
            console.log("dnd5e-variant-spellpoints | Actor is not a spellcaster")
            return false
        }

        return true
    }

    // ignore warlock (TODO: for now)
    function isWarlock(actor) {
        if (!(actor?.data?.data?.classes)) {
            return false
        }

        if ('warlock' in actor.data.data.classes) {
            console.log("dnd5e-variant-spellpoints | Actor is a Warlock (Will be ignored for now)")
            return true;
        }
    }

    // check if module was enabled in the settings
    function isModuleEnabled() {
        const useModule = game.settings.get(VSpellPoints.ID,VSpellPoints.SETTINGS.TOGGLEON);
        if (!useModule) {
            console.log('dnd5e-variant-spellpoints | Variant Spellpoints not used')
            return false;
        }
        return true
    }

    // modify actorsheet after its rendered to show the spell points
    Hooks.on("renderActorSheet5e", (actorsheet, html, _options) => {
        // prevent execution if variant is disabled
        // TODO: warlock
        if (!isModuleEnabled()) return;
        console.log(actorsheet)

        let actor = actorsheet.object;
        if (!isCharacter(actor)) return;

        // initialize spellpoints data in the actor, if not yet present
        const {defaultPoints, defaultUses} = VSpellPointsData.initPoints(actor)

        console.log("++++++++++++++++++")
        console.log("renderActor: ", foundry.utils.deepClone(actor))
        // try to set the initial spellpoint values if they are not yet there
        // VariantSpellPointsData.initUserSpellPoints(actor)

        if (isWarlock(actor) || !isSpellcaster(actor)) return;

        // change header of sheet
        console.log("It's a caster! - Level " + VSpellPointsCalcs.getCombinedSpellCastingLevel(actor.data.data.classes))
        let attributesList = html.find(".sheet-header").find(".attributes")

        let savedPointData = VSpellPointsData.getPoints(actor) ?? {}
        let savedUsesData = VSpellPointsData.getUses(actor) ?? {}

        let pointData = foundry.utils.isObjectEmpty(savedPointData) ? defaultPoints : savedPointData;
        let usesData = foundry.utils.isObjectEmpty(savedUsesData) ? defaultUses : savedUsesData;

        console.log("Using pointData: ", pointData)
        console.log("Using usesData: ", usesData)

        let spellPointsAttribute = VSpellPointsCalcs.createSpellPointsInfo(actor, pointData, actorsheet);
        let newAttribute = attributesList.append(spellPointsAttribute)

        // activate all listeners for the new html
        actorsheet.activateListeners($(newAttribute).find(".spellpoints"))

        // change the slot info to spell point cost and remaining spell points
        let itemsHeader = html.find(".tab.spellbook").find(".items-header.spellbook-header")

        itemsHeader
            .find(".spell-slots")
            .each( function(i) {
                let newSlotInfo = `
                    <span> ${VSpellPointsCalcs.spellPointCost[i]} </span>
                    <span class="sep"> / </span>
                    <span class="spell-max">${pointData.currentPoints ?? 0} P</span>`

                // ignore cantrips
                if (i === 0) newSlotInfo = " - "

                $(this).attr('title', 'cost / remaining spell points');
                $(this).html(newSlotInfo)
            });

        itemsHeader
            .find("h3")
            .each( function(i) {
                // ignore spells below 6th level
                if (i < 6) return true;

                // TODO: remove space between level and uses
                let spellStr = `spell${i}`
                let usesInfo = `
                    <div class="spell-slots" title="remaining uses" style="display: block; ">
                        (<input type="text" 
                                name="flags.${VSpellPoints.ID}.${VSpellPoints.FLAGS.USES}.${spellStr}.value" 
                                value="${usesData[spellStr].value}" placeholder="0" 
                                data-dtype="Number">
                        <span class="sep"> / </span>
                        <span class="spell-max">
                            ${usesData[spellStr].max}
                        </span>)
                    </div><div class="flex-gap" style="display: inline-flex; flex-wrap: wrap"></div><div class="flex-gap" style="display: inline-flex; flex-wrap: wrap"></div>`
                $(this).after(usesInfo);
            });

        // make the sheet a little wider by default
        // TODO: still looks a little weird sometimes, needs fixing
        // actorsheet.setPosition({width: actorsheet.options.width + 50})
        $(html).css("min-width", `${actorsheet.options.width + 50}px`)
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

        console.log(dialog, html, object)
        let item = dialog.item
        let actor = item.parent;

        if (isWarlock(actor) || !isCharacter(actor) || !isSpellcaster(actor)) return;

        // TODO: Show red warning box if it can't be cast

        // only apply on spells
        if (item?.data?.type !== "spell") {
            console.log("not using a spell")
            return;
        }

        console.log(dialog, html, object)
        let usesData = VSpellPointsData.getUses(actor)
        let pointData = VSpellPointsData.getPoints(actor)

        // change consume spell slot text
        let consumeText = $(html)
            .find("#ability-use-form")
            .find("input[name='consumeSlot']")
            .parent()
            .contents().filter(function() {
                // get only text elements
                return this.nodeType === 3;
            });
        $(consumeText)[0].textContent="Consume Spell Points?";

        // modify the "cast at level" list
        $(html)
            .find("#ability-use-form")
            .find("select[name='level']")
            .find("option")
            .each( function (i) {
                let textParts = $(this).text().split(" ")
                let spellLevel = parseInt($(this).attr("value"))
                let cost = VSpellPointsCalcs.spellPointCost[spellLevel]

                let new_text = ""
                new_text += `${textParts[0]} ${textParts[1]} `

                // add spellpoint cost and spellpoints left
                new_text += `(${cost} / ${pointData.currentPoints ?? 0} Spell Points)`

                // add uses left
                if (spellLevel >= 6) {
                    let uses = usesData[`spell${spellLevel}`].value
                    let usesMax = usesData[`spell${spellLevel}`].max
                    new_text += ` (1 / ${uses} uses)`
                }
                $(this).text(new_text);
            })
    })

    // TODO: use libwrapper
    // Monkey patch the long rest function so it resets the spell points
    // TODO: Maybe only add a hook call and handle it by myself
    let oldRestSpellRecovery = game.dnd5e.entities.Actor5e.prototype._getRestSpellRecovery;
    game.dnd5e.entities.Actor5e.prototype._getRestSpellRecovery = function({ recoverPact=true, recoverSpells=true }) {
        // use normal function if variant is disabled or because of other factors
        if (!isModuleEnabled() || isWarlock(this) || !isCharacter(this) || !isSpellcaster(this)) {
            return oldRestSpellRecovery.apply(this, arguments);;
        }

        // call normal spell recovery
        let oldUpdate = oldRestSpellRecovery.apply(this, arguments);

        let actorSpellpoints = VSpellPointsData.getPoints(this);
        let actorUses = VSpellPointsData.getUses(this);

        // and then add my own update: reset current, tempPoints, tempMax and uses
        if (actorSpellpoints.currentPoints !== undefined && actorSpellpoints.maxPoints !== undefined)
            oldUpdate[`flags.${VSpellPoints.ID}.${VSpellPoints.FLAGS.POINTS}.${VSpellPointsData.vars.currentPoints}`] = actorSpellpoints.maxPoints
            oldUpdate[`flags.${VSpellPoints.ID}.${VSpellPoints.FLAGS.POINTS}.${VSpellPointsData.vars.tempPoints}`] = 0
            oldUpdate[`flags.${VSpellPoints.ID}.${VSpellPoints.FLAGS.POINTS}.${VSpellPointsData.vars.tempMax}`] = 0
            // reset uses for over 6th level spells
            Object.entries(actorUses).forEach( ([spellLevel, data]) => {
                console.log(`flags.${VSpellPoints.ID}.${VSpellPoints.FLAGS.USES}.${spellLevel}.value`, data.max)
                oldUpdate[`flags.${VSpellPoints.ID}.${VSpellPoints.FLAGS.USES}.${spellLevel}.value`] = data.max
            })

        return oldUpdate;
    }


    // Monkey patch the roll spell function so it consumes spell points
    // TODO: Maybe only add a hook and handle it by myself
    let oldUsageUpdate = game.dnd5e.entities.Item5e.prototype._getUsageUpdates;
    game.dnd5e.entities.Item5e.prototype._getUsageUpdates = function({consumeQuantity, consumeRecharge, consumeResource, consumeSpellLevel, consumeUsage}) {
        let actor = this.parent;

        // use normal function if variant is disabled or because of other factors
        // do default behaviour if no spell level is used or module is deactivated
        if (!isModuleEnabled() || !consumeSpellLevel || isWarlock(actor) || !isCharacter(actor) || !isSpellcaster(actor)) {
            return oldUsageUpdate.apply(this, arguments);
        }

        // TODO: Warlock exceptions for pact spells, pact slots, etc.
        const castMode = this.data?.data?.preparation?.mode
        const isPactMagic = castMode === "pact"

        // get the spell level that is being cast
        let spellLevelStr = consumeSpellLevel;

        // prevent default behaviour by telling the function there is no spell being consumed
        consumeSpellLevel = null

        // call normal spell recovery
        let oldUpdate = oldUsageUpdate.apply(this, [{consumeQuantity, consumeRecharge, consumeResource, consumeSpellLevel, consumeUsage}]);

        console.log(oldUpdate)

        let actorSpellpoints = VSpellPointsData.getPoints(actor);
        let actorSpellUses = VSpellPointsData.getUses(actor);

        // string of spelllevel to number
        let spellLevel = parseInt("" + spellLevelStr.replace("spell", ""))

        // define when spells start to cost uses
        let usesSpellLevel = 6

        // get point cost of spell level
        let spellCost = VSpellPointsCalcs.spellPointCost[spellLevel]
        console.log("spelllevel: " + spellLevel)
        console.log("spellCost: " + spellCost)
        console.log("currentPoint: " + actorSpellpoints.currentPoints)
        console.log("maxSpellLevel: " + actorSpellpoints.maxSpellLevel)
        if (spellLevel >= usesSpellLevel) console.log(`usesRemaining-${spellLevelStr}: ` + actorSpellUses[spellLevelStr].value)

        // error if no or not enough spell points are left, or if level is too high, or if uses remaining
        let currentNotOk = !spellCost || !actorSpellpoints.currentPoints || actorSpellpoints.currentPoints < spellCost
        let spellLevelNotOk = !spellLevel || !actorSpellpoints.maxSpellLevel || spellLevel > actorSpellpoints.maxSpellLevel
        let noUsesRemaining = spellLevel >= usesSpellLevel ? actorSpellUses[spellLevelStr].value === 0 : false

        console.log(`Enough points: ${!currentNotOk}, level ok: ${!spellLevelNotOk}, uses ok: ${!noUsesRemaining}`)

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
        oldUpdate.actorUpdates[`flags.${VSpellPoints.ID}.${VSpellPoints.FLAGS.POINTS}.${VSpellPointsData.vars.currentPoints}`] = Math.max(actorSpellpoints.currentPoints - spellCost, 0);

        // update uses of the spell
        if (spellLevel >= usesSpellLevel) oldUpdate.actorUpdates[`flags.${VSpellPoints.ID}.${VSpellPoints.FLAGS.USES}.${spellLevelStr}.value`] = actorSpellUses[spellLevelStr].value - 1

        // TODO: TEMP POINTS (not for now)

        return oldUpdate;
    }
})
