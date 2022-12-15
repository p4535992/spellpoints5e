import { VSpellPoints } from "./VSpellPoints";

export class VSpellPointsCalcs {
	static NONE = 0;
	static THIRD = 1;
	static HALF = 2;
	static FULL = 3;
	static ART = 4;

	// map from caster name (String) to their spellcasting type
	static transformCasterType(casterType) {
		switch (casterType) {
			case "none":
				return this.NONE;
			case "pact":
				return this.NONE;
			case "third":
				return this.THIRD;
			case "artificer":
				return this.ART; // Artificer
			case "half":
				return this.HALF;
			case "full":
				return this.FULL;
			default:
				return this.NONE;
		}
	}

	// full caster use their class level for determining spell points, half caster use their class level / 2, third caster / 3
	static getSpellCastingLevel(casterType, classLevel) {
		let casterTypeNr = this.transformCasterType(casterType);
		switch (casterTypeNr) {
			case this.NONE:
				return 0;
			case this.THIRD:
				return Math.floor(classLevel / 3);
			case this.HALF:
				return Math.floor(classLevel / 2);
			case this.FULL:
				return classLevel;
			case this.ART:
				return Math.max(1, Math.floor(classLevel / 2)); // Artificers are half caster spellslots on lvl 1
			default:
				return 0;
		}
	}

	static getCombinedSpellCastingLevel(classes) {
		let allCastingLevels = {};
		Object.entries(classes).forEach(([className, classProps]) => {
			let class_levels = classProps.levels;
			if (!class_levels) class_levels = classProps.data.data.levels;

			let class_progression = classProps.spellcasting?.progression;
			if (!class_progression) class_progression = classProps.data?.data?.spellcasting?.progression;
			allCastingLevels[className.capitalize()] = this.getSpellCastingLevel(class_progression, class_levels);
		});
		return [Object.values(allCastingLevels).reduce((a, b) => a + b, 0), allCastingLevels];
	}

	static getMaxSpellPointsAndLevel(classes) {
		let [spellCastingLevel, _] = this.getCombinedSpellCastingLevel(classes);
		return this.getSpellpointsByLevel(spellCastingLevel);
	}

	// point cost by spell level (starting with level 0 = cantrips)
	static _spellPointCost = [0, 2, 3, 5, 6, 7, 9, 10, 11, 13];
	static getSpellPointCost(i) {
		let clampedLevel = Math.clamped(i, 0, this._spellPointCost.length - 1);
		if (clampedLevel !== i)
			console.error(`${VSpellPoints.ID} - Spell level ${i} out of bounds: has no spell point cost`);
		return this._spellPointCost[clampedLevel];
	}

	// which spell levels can only be cast once per long rest
	static lockedSpellLevels = [6, 7, 8, 9];

	// TODO: editable
	// starting with character level 0
	// [max points, max spell level]
	static _spellPointsByLevelTable = VSpellPoints.formulas.DMG.spellPointsByLevel;
	// static _spellPointsByLevelTable = [
	// 	[0, 0],
	// 	[4, 1],
	// 	[6, 1],
	// 	[14, 2],
	// 	[17, 2],
	// 	[27, 3],
	// 	[32, 3],
	// 	[38, 4],
	// 	[44, 4],
	// 	[57, 5],
	// 	[64, 5],
	// 	[73, 6],
	// 	[73, 6],
	// 	[83, 7],
	// 	[83, 7],
	// 	[94, 8],
	// 	[94, 8],
	// 	[107, 9],
	// 	[114, 9],
	// 	[123, 9],
	// 	[133, 9],
	// ];

	static getSpellpointsByLevel(i) {
		let clampedLevel = Math.clamped(i, 0, this._spellPointsByLevelTable.length - 1);
		if (clampedLevel !== i)
			console.error(`${VSpellPoints.ID} - Character level ${i} out of bounds: has no maximum spell points set`);
		return this._spellPointsByLevelTable[clampedLevel];
	}

	static async createSpellPointsInfo(actor, data, asResource, sheetTheme) {
		// read from actor
		/** @type Resource */
		let userData = data;
		if (!userData) userData = {};

		let tempMax = userData.points.addMax > 0 ? userData.points.addMax : "";
		let tempPoints = userData.points.temp > 0 ? userData.points.temp : "";
		let actor_classes = actor.classes;
		if (!actor_classes) actor_classes = actor.data.data.classes;

		let [combinedLevel, allCastingLevels] = VSpellPointsCalcs.getCombinedSpellCastingLevel(actor_classes);
		const levelsTooltipData = {
			allCastingLevels,
			combinedLevel,
		};

		let levelsTooltip = asResource
			? null
			: await renderTemplate(VSpellPoints.TEMPLATES.LEVELS_TOOLTIP, levelsTooltipData);

		// TODO: with localization
		const template_data = {
			spellPointsNameText: "Spell Points",
			spellPointsAbbreviationText: "SP",
			maxSpellPointsTooltip: "Your maximum number of spell points",
			currentSpellpoints: userData.points.value,
			maxSpellPoints: userData.points.max,
			// combinedLevel,
			// allCastingLevels,
			asResource,
			resourcePath: VSpellPoints.resourcesPath(),
			levelsTooltip,
		};

		if (!VSpellPoints.TEMPLATES.hasOwnProperty(sheetTheme)) {
			sheetTheme = VSpellPoints.CUSTOM_SHEETS.DEFAULT;
		}

		let template = VSpellPoints.TEMPLATES[sheetTheme][asResource ? "RESOURCE" : "ATTRIBUTE"];

		let spellPointsInfo = await renderTemplate(template, template_data);
		return spellPointsInfo;
	}
}
