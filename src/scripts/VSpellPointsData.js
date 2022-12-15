import { VSpellPoints } from "./VSpellPoints";

export class VSpellPointsData {
    /** @typedef {{
     *  maxLevel: number,
     *  points: {
     *      max: number,
     *      value: number,
     *      addMax: number,
     *      temp: number
     *  },
     *  uses: {
     *      spell6: {max: number, value: number, override: number},
     *      spell7: {max: number, value: number, override: number},
     *      spell8: {max: number, value: number, override: number},
     *      spell9: {max: number, value: number, override: number}
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
            spell6: {max: 0, value: 0, override: null},
            spell7: {max: 0, value: 0, override: null},
            spell8: {max: 0, value: 0, override: null},
            spell9: {max: 0, value: 0, override: null},
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

        let actor_classes = actor.classes;
        if (!actor_classes) actor_classes = actor.data.data.classes;
        let [points, level] = VSpellPointsCalcs.getMaxSpellPointsAndLevel(actor_classes);

        /** @type Resource */
        let updateResources;
        if (isNotPresent) {
            console.log(`${VSpellPoints.ID} | Initializing spell points data for: ${actor.name}`)

            // Update Resources: take template and replace initial values
            // level and points
            updateResources = foundry.utils.deepClone(this.resourcesTemplate)
            updateResources.maxLevel = level;
            updateResources.points.max = points + 999;
            updateResources.points.value = points + 111;

            // spell uses
            for (let j = 6; j <= level; j++) {
                updateResources.uses[`spell${j}`].max = 1
                updateResources.uses[`spell${j}`].value = 1
            }

            // persist in actor
            actor.setFlag(VSpellPoints.ID, VSpellPoints.FLAGS.RESOURCES, updateResources);
        } else if (actorResources.points.max !== points || actorResources.maxLevel !== level) {
            VSpellPoints.log(`${VSpellPoints.ID} | Updating spell points data for: ${actor.name}`)

            // Update Resources
            // level and points
            updateResources = {
                maxLevel: level,
                points: { max: points + 777 },
                uses: {}
            }

            for (let j = 6; j <= 9; j++) {
                updateResources.uses[`spell${j}`] = {}
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

    static getPointsEnabled(actor) {
        return actor.getFlag(VSpellPoints.ID, VSpellPoints.FLAGS.ENABLED);
    }
    static setPointsEnabled(actor, enable) {
        return actor.setFlag(VSpellPoints.ID, VSpellPoints.FLAGS.ENABLED, enable);
    }

    static setCustomPointsValue(actor, customSpellPointCount) {
        return actor.setFlag(VSpellPoints.ID, VSpellPoints.FLAGS.CUSTOMPOINTVALUE, customPointValue);
    }

    static getCustomPointsValue(actor) {
        return actor.getFlag(VSpellPoints.ID, VSpellPoints.FLAGS.CUSTOMPOINTVALUE);
    }


    // check if actor is a player character
    static isCharacter(actor) {
        if (actor.data?.type !== "character") {
            VSpellPoints.log("Actor is not a player")
            return false
        }
        return true
    }

    // check if actor is spellcasters
    static isSpellcaster(actor) {
        let actor_classes = actor?.classes;
        if (!actor_classes) actor_classes = actor?.data?.data?.classes;

        if (!actor_classes) {
            VSpellPoints.log("Actor doesn't have a class")
            return false;
        }

        let isCaster = VSpellPointsCalcs.getCombinedSpellCastingLevel(actor_classes)[0] > 0;
        if (!isCaster) {
            VSpellPoints.log("Actor is not a spellcaster")
            return false
        }
        return true
    }

    // check if actor is warlock
    static isWarlock(actor) {
        let actor_classes = actor?.classes;
        if (!actor_classes) actor_classes = actor?.data?.data?.classes;

        if (!(actor_classes)) {
              return false
        }

        if ('warlock' in actor_classes) {
            VSpellPoints.log("Actor is a Warlock")
            return true;
        }
        return false;
    }

    // check if module was enabled in the settings
    static moduleEnabled() {
        const useModule = game.settings.get(VSpellPoints.ID,VSpellPoints.SETTINGS.TOGGLEON);
        if (!useModule || !VSpellPoints.isActive) {
            VSpellPoints.log('Variant Spellpoints not used')
            return false;
        }
        return true
    }

    /**
     * Returns whether spell points were manually enabled for this specific character
     *
     * Returns undefined if default/no choice, true if manually enabled, false if manually disabled
     * @param actor
     * @returns {boolean|undefined}
     */
    static moduleManuallyEnabled(actor) {
        const actorSetting = VSpellPointsData.getPointsEnabled(actor);
        switch (actorSetting) {
            case undefined: return undefined;
            case VSpellPoints.STATUSCHOICES.enabled: return true;
            case VSpellPoints.STATUSCHOICES.disabled: return false;
            case VSpellPoints.STATUSCHOICES.default: return undefined;
            default: return undefined;
        }
    }

    /**
     * Handle enabling editing for a spell point override value
     * @param {MouseEvent} event The originating click event
     * @private
     */
    static async _onSpellUsesOverride (event) {
        const span = event.currentTarget.parentElement;
        const level = span.dataset.level;
        const override = this.data.flags[VSpellPoints.ID].resources.uses[level].override || span.dataset.slots;
        const input = document.createElement("INPUT");
        input.type = "text";
        input.name = `${VSpellPoints.resourcesPath()}.uses.${level}.override`;
        input.value = override;
        input.placeholder = span.dataset.slots;
        input.dataset.dtype = "Number";

        // Replace the HTML
        const parent = span.parentElement;
        parent.removeChild(span);
        parent.removeChild(parent.lastChild); // remove closing bracket
        parent.appendChild(input);
        parent.appendChild(document.createTextNode(")")); // add closing bracket
    }

    // TODO: editable tables
    // static updateGlobalSpellPointsTable(updateData) {}
    // static updateGlobalSpellCostTable(updateData) {}
}
