import { registerSettings } from "./settings";

export class VSpellPoints {
	static ID = "spellpoints5e";
	static isActive = true;
	static unsupportedModules = [];

	static FLAGS = {
		POINTS: "points", // legacy
		USES: "uses", // legacy
		RESOURCES: "resources",
		ENABLED: "enabled",
		CUSTOMPOINTVALUE: "custompointvalue",
	};

	static STATUSCHOICES = {
		enabled: "enabled",
		disabled: "disabled",
		default: "default",
	};

	static resourcesPath() {
		return `flags.${VSpellPoints.ID}.${VSpellPoints.FLAGS.RESOURCES}`;
	}

	static CUSTOM_SHEETS = {
		DEFAULT: "ActorSheet5eCharacter",
		TIDY5E: "Tidy5eSheet",
	};

	static TEMPLATES = {
		LEVELS_TOOLTIP: `modules/${this.ID}/templates/levels-tooltip.hbs`,
		ActorSheet5eCharacter: {
			ATTRIBUTE: `modules/${this.ID}/templates/attribute.hbs`,
			RESOURCE: `modules/${this.ID}/templates/attribute.hbs`,
		},
		Tidy5eSheet: {
			ATTRIBUTE: `modules/${this.ID}/templates/tidy5e-attribute.hbs`,
			RESOURCE: `modules/${this.ID}/templates/tidy5e-resource.hbs`,
		},
	};

	static SETTINGS = {
		TOGGLEON: "spellPointsToggle",
		DISPLAY: "headerOrResourceToggle",
		TOGGLEONCUSTOMVALUE: "spellPointsToggleCustomValue",
		TABLESETTINGS: "tablesButton",
	};

	static DISPLAY_CHOICE = {
		header: "Header",
		resources: "Resources",
	};

	static initialize() {
		// load templates
		delete _templateCache[this.TEMPLATES.LEVELS_TOOLTIP];
		delete _templateCache[this.TEMPLATES.ActorSheet5eCharacter.ATTRIBUTE];
		delete _templateCache[this.TEMPLATES.ActorSheet5eCharacter.RESOURCE];
		delete _templateCache[this.TEMPLATES.Tidy5eSheet.ATTRIBUTE];
		delete _templateCache[this.TEMPLATES.Tidy5eSheet.RESOURCE];

		loadTemplates([
			this.TEMPLATES.LEVELS_TOOLTIP,
			this.TEMPLATES.ActorSheet5eCharacter.ATTRIBUTE,
			this.TEMPLATES.ActorSheet5eCharacter.RESOURCE,
			this.TEMPLATES.Tidy5eSheet.ATTRIBUTE,
			this.TEMPLATES.Tidy5eSheet.RESOURCE,
		]);

		// disable module if unsupported module is active
		if (this.unsupportedModuleActive()) {
			this.isActive = false;
		}

		registerSettings();
	}

	/* https://github.com/League-of-Foundry-Developers/foundryvtt-devMode */
	static log(...args) {
		try {
			const isDebugging = game.modules.get("_dev-mode")?.api?.getPackageDebugValue(this.ID);
			if (isDebugging) {
				console.log(this.ID, "|", ...args);
			}
		} catch (e) {}
	}

	// check if unsupported module is enabled
	static unsupportedModuleActive() {
		let unsupported = false;
		this.unsupportedModules.forEach(function (name) {
			if (game.modules.get(name)?.active) {
				console.error(
					`${VSpellPoints.ID} | module ${name} is active, which is not supported yet, disabling ${VSpellPoints.ID}`
				);
				ui.notifications.error(
					`${VSpellPoints.ID}: module ${name} is active, which is not supported yet, disabling ${VSpellPoints.ID}`
				);
				unsupported = true;
			}
		});
		return unsupported;
	}

	// static isV10() {
	//   return !foundry.utils.isNewerVersion(10, game.version ?? game?.data?.version);
	// }

	// ADDITIONAL 2022-12-15

	/**
	 * Get a map of formulas to override values specific to those formulas.
	 */
	static get formulas() {
		return {
			DMG: {
				isCustom: "false",
				spellPointsByLevel: {
					1: 4,
					2: 6,
					3: 14,
					4: 17,
					5: 27,
					6: 32,
					7: 38,
					8: 44,
					9: 57,
					10: 64,
					11: 73,
					12: 73,
					13: 83,
					14: 83,
					15: 94,
					16: 94,
					17: 107,
					18: 114,
					19: 123,
					20: 133,
				},
				spellPointsCosts: { 1: "2", 2: "3", 3: "5", 4: "6", 5: "7", 6: "9", 7: "10", 8: "11", 9: "13" },
			},
			CUSTOM: {
				isCustom: "true",
			},
			DMG_CUSTOM: {
				isCustom: "true",
				spCustomFormulaBase: "0",
				spCustomFormulaSlotMultiplier: "1",
				spellPointsCosts: { 1: "2", 2: "3", 3: "5", 4: "6", 5: "7", 6: "9", 7: "10", 8: "11", 9: "13" },
			},
			AM_CUSTOM: {
				isCustom: "true",
				spCustomFormulaBase:
					"ceil((1*@spells.spell1.max + 2*@spells.spell2.max + 3*@spells.spell3.max + 4*@spells.spell4.max + 5*@spells.spell5.max + 6*@spells.spell6.max + 7*@spells.spell7.max + 8*@spells.spell8.max + 9*@spells.spell9.max) / 2) + @attributes.spelldc - 8 - @attributes.prof",
				spCustomFormulaSlotMultiplier: "0",
				spellPointsCosts: { 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "12", 7: "14", 8: "24", 9: "27" },
			},
		};
	}

	static isActorCharacter(actor) {
		return getProperty(actor, "type") == "character";
	}

	static isMixedActorSpellPointEnabled(actor) {
		if (actor.flags !== undefined) {
			if (actor.flags[CONSTANTS.MODULE_NAME] !== undefined) {
				if (actor.flags[CONSTANTS.MODULE_NAME].enabled !== undefined) {
					return actor.flags[CONSTANTS.MODULE_NAME].enabled;
				}
			}
		}
		return false;
	}

	/**
	 * Evaluates the given formula with the given actors data. Uses FoundryVTT's Roll
	 * to make this evaluation.
	 * @param {string|number} formula The rollable formula to evaluate.
	 * @param {object} actor The actor used for variables.
	 * @return {number} The result of the formula.
	 */
	static withActorData(formula, actor) {
		let dataObject = actor.getRollData();
		dataObject.flags = actor.flags;
		const r = new Roll(formula.toString(), dataObject);
		r.evaluate({ async: false });
		return r.total;
	}
}
