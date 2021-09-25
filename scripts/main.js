class VariantSpellPointsData {

    static updateUserSpellPoints(actor, updateData) {
        let [points, level] = VariantSpellPointsCalcs.getMaxSpellPointsAndLevel(actor.data.data.classes)

        let userStats = this.getUserSpellPoints(actor)
        if (!userStats) userStats = {}

        // construct the update to send
        const update = {
            maxPoints: points,
            maxSpellLevel: level,
            ...updateData
        }
        update.tempMax = userStats.tempMax ? userStats.tempMax : 0;
        update.tempPoints = userStats.tempPoints ? userStats.tempPoints : 0;

        update.currentPoints = userStats.currentPoints !== undefined ? userStats.currentPoints : update.maxPoints;
        // no negative spell points
        update.currentPoints = Math.max(0, Math.min(update.currentPoints, update.maxPoints + update.tempMax))

        // update the database with the updated ToDo list
        return actor.setFlag(VariantSpellPoints.ID, VariantSpellPoints.FLAGS.SPELLPOINTS, update);
    }

    static deleteUserSpellPoints(actor) {
        return actor.unsetFlag(VariantSpellPoints.ID, VariantSpellPoints.FLAGS.SPELLPOINTS)
    }

    static getUserSpellPoints(actor) {
        return actor.getFlag(VariantSpellPoints.ID, VariantSpellPoints.FLAGS.SPELLPOINTS);
    }

    // TODO: think about how to do it
    static updateGlobalSpellPointsTable(updateData) {}
    static updateGlobalSpellCostTable(updateData) {}


}

class VariantSpellPoints {
    static ID = 'dnd5e-variant-spellpoints';

    static FLAGS = {
        SPELLPOINTS: 'spellpoints'
    }

    static TEMPLATES = {
        SPELLPOINTS: `modules/${this.ID}/templates/main.hbs`
    }
}

class VariantSpellPointsCalcs {

    static NONE = 0;
    static THIRD = 1;
    static HALF = 2;
    static FULL = 3;

    // map from caster name to their spellcasting type
    static casterTypeToNr (casterClass) {
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
        let casterTypeNr = this.casterTypeToNr(casterType)

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

    static getCombinedSpellCastingLevel (classes) {
        let combinedLevel = 0;
        Object.entries(classes).forEach( ([_className, classProps]) =>  {
            combinedLevel += this.getSpellCastingLevel(classProps.spellcasting.progression, classProps.levels);
        });
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


    static createSpellPointsInfo(actor) {
        // TODO: with localization
        const spellPointsNameText = "Spell Points";
        const spellPointsTempText = "Temp"
        const spellPointsTempMaxText = "Max"
        const currentSpellPointsTooltip = "Spell points you can currently spend"
        const maxSpellPointsTooltip = "Your maximum number of spell points"

        // read from actor
        let userData = VariantSpellPointsData.getUserSpellPoints(actor);
        if (!userData) userData = {}

        let maxSpellPoints = userData.maxPoints;
        let maxSpellLevel = userData.maxSpellLevel;
        let tempMax = userData.tempMax > 0 ? userData.tempMax : "";
        let tempPoints = userData.tempPoints > 0 ? userData.tempPoints : "";
        let currentSpellpoints = userData.currentPoints;


        // TODO: define as template
        // TODO: add little gear icon to change max spellpoints
        // TODO: add tooltip (like for armor class) that shows the spell levels per class
        // TODO: add temp hp and max override
        // TODO: standard sheet size is too small, needs to be bigger
        let spellPointsInfo = `
        <li class="attribute spellpoints">
            <h4 class="attribute-name box-title">${spellPointsNameText}</h4>
            <div class="attribute-value multiple">
                <input name="flags.${VariantSpellPoints.ID}.${VariantSpellPoints.FLAGS.SPELLPOINTS}.currentPoints" type="text" value="${currentSpellpoints}" placeholder="10" data-dtype="Number" title="${currentSpellPointsTooltip}">
                <span class="sep"> / </span>
                <span style="padding: 1px 3px" title="${maxSpellPointsTooltip}"> ${maxSpellPoints} </span>
            </div>
            <footer class="attribute-footer">
                <input name="flags.${VariantSpellPoints.ID}.${VariantSpellPoints.FLAGS.SPELLPOINTS}.tempPoints" type="text" class="temphp" placeholder="+${spellPointsTempText}" value="${tempPoints}" data-dtype="Number">
                <input name="flags.${VariantSpellPoints.ID}.${VariantSpellPoints.FLAGS.SPELLPOINTS}.tempMax" type="text" class="temphp" placeholder="+${spellPointsTempMaxText}" value="${tempMax}" data-dtype="Number">
            </footer>
        </li>`;

        return spellPointsInfo;
    }
}

Hooks.once('ready', () => {
    console.log('dnd5e-variant-spellpoints | Initializing')

    // TODO: make it work for npcs too?
    Hooks.on("renderActorSheet5e", (actorsheet, html, options) => {

        let actor = actorsheet.object;
        console.log("++++++++++++++++++")
        console.log(actor)
        // try to set the initial spellpoint values if they are not yet there
        // VariantSpellPointsData.initUserSpellPoints(actor)

        // update everything to reflect possible changes in classes
        VariantSpellPointsData.updateUserSpellPoints(actor, {})


        let classes = actor.data.data.classes;

        let isCaster = VariantSpellPointsCalcs.getCombinedSpellCastingLevel(classes) > 0;

        if (isCaster) {

            console.log("It's a caster! - Level " + VariantSpellPointsCalcs.getCombinedSpellCastingLevel(classes))
            let attributesList = html.find(".sheet-header").find(".attributes")
            attributesList.append(VariantSpellPointsCalcs.createSpellPointsInfo(actor))
        } else {
            console.log("Boooo, no caster.")
        }

    });
})
