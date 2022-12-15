import CONSTANTS from "./constants.js";
import "./lib/lib.js";
export const registerSettings = function () {
	// game.settings.registerMenu(CONSTANTS.MODULE_NAME, "resetAllSettings", {
	// 	name: `${CONSTANTS.MODULE_NAME}.setting.reset.name`,
	// 	hint: `${CONSTANTS.MODULE_NAME}.setting.reset.hint`,
	// 	icon: "fas fa-coins",
	// 	type: ResetSettingsDialog,
	// 	restricted: true,
	// });
	// =====================================================================

    // Register a world setting
    game.settings.register(CONSTANTS.MODULE_NAME, this.SETTINGS.TOGGLEON, {
        name: "Use Variant: Spell Points? ",
        hint: `Use Spell Points instead of Slots, as described in the Dungeon Master's Guide. Replaces parts of the "spell book" in the character sheet. `,
        scope: "world", // This specifies a world-level setting
        config: true, // This specifies that the setting appears in the configuration view
        default: false, // The default value for the setting
        type: Boolean,
    });

    // Register a client setting
    game.settings.register(CONSTANTS.MODULE_NAME, this.SETTINGS.DISPLAY, {
        name: "Where to display Spell Points:",
        hint: `Select where on the character sheet the current spell point value should be shown. `,
        scope: "world", // This specifies a world-level setting
        config: true, // This specifies that the setting appears in the configuration view
        default: "Header", // The default value for the setting
        choices: Object.values(this.DISPLAY_CHOICE),
    });

    // Register a world setting
    game.settings.register(CONSTANTS.MODULE_NAME, this.SETTINGS.TOGGLEONCUSTOMVALUE, {
        name: "Allow Custom Spell Point Maximum?",
        hint: `Use Stuff`,
        scope: "world", // This specifies a world-level setting
        config: true, // This specifies that the setting appears in the configuration view
        default: false, // The default value for the setting
        type: Boolean,
    });

    // ========================================================================

    game.settings.register(CONSTANTS.MODULE_NAME, `spEnableSpellpoints`, {
		name: `${CONSTANTS.MODULE_NAME}.setting.spEnableSpellpoints.name`,
		hint: `${CONSTANTS.MODULE_NAME}.setting.spEnableSpellpoints.hint`,
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });

    game.settings.register(CONSTANTS.MODULE_NAME, `spResource`, {
		name: `${CONSTANTS.MODULE_NAME}.setting.spResource.name`,
		hint: `${CONSTANTS.MODULE_NAME}.setting.spResource.hint`,
        scope: "world",
        config: true,
        default: 'Spell Points',
        type: String,
    });

    game.settings.register(CONSTANTS.MODULE_NAME, `spAutoSpellpoints`, {
		name: `${CONSTANTS.MODULE_NAME}.setting.spAutoSpellpoints.name`,
		hint: `${CONSTANTS.MODULE_NAME}.setting.spAutoSpellpoints.hint`,
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });

    game.settings.register(CONSTANTS.MODULE_NAME, `spFormula`, {
		name: `${CONSTANTS.MODULE_NAME}.setting.spFormula.name`,
		hint: `${CONSTANTS.MODULE_NAME}.setting.spFormula.hint`,
        scope: "world",
        config: true,
        default: 'DMG',
        type: String,
        choices: {
            "DMG": game.i18n.localize( `${CONSTANTS.MODULE_NAME}.setting.spFormula.choice.DMG`),
            "CUSTOM": game.i18n.localize( `${CONSTANTS.MODULE_NAME}.setting.spFormula.choice.CUSTOM`),
            "DMG_CUSTOM": game.i18n.localize( `${CONSTANTS.MODULE_NAME}.setting.spFormula.choice.DMG_CUSTOM`),
            "AM_CUSTOM": game.i18n.localize( `${CONSTANTS.MODULE_NAME}.setting.spFormula.choice.AM_CUSTOM`),
        },
    });

    game.settings.register(CONSTANTS.MODULE_NAME, `warlockUseSp`, {
		name: `${CONSTANTS.MODULE_NAME}.setting.warlockUseSp.name`,
		hint: `${CONSTANTS.MODULE_NAME}.setting.warlockUseSp.hint`,
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });

    game.settings.register(CONSTANTS.MODULE_NAME, `chatMessagePrivate`, {
		name: `${CONSTANTS.MODULE_NAME}.setting.chatMessagePrivate.name`,
		hint: `${CONSTANTS.MODULE_NAME}.setting.chatMessagePrivate.hint`,
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });

    game.settings.register(CONSTANTS.MODULE_NAME, `spellPointsByLevel`, {
		name: `${CONSTANTS.MODULE_NAME}.setting.spellPointsByLevel.name`,
		hint: `${CONSTANTS.MODULE_NAME}.setting.spellPointsByLevel.hint`,
        scope: "world",
        config: true,
        default: {1:4,2:6,3:14,4:17,5:27,6:32,7:38,8:44,9:57,10:64,11:73,12:73,13:83,14:83,15:94,16:94,17:107,18:114,19:123,20:133},
        type: Object,
    });

    game.settings.register(CONSTANTS.MODULE_NAME, `spellPointsCosts`, {
		name: `${CONSTANTS.MODULE_NAME}.setting.spellPointsCosts.name`,
		hint: `${CONSTANTS.MODULE_NAME}.setting.spellPointsCosts.hint`,
        scope: "world",
        config: true,
        default: {1:2,2:3,3:5,4:6,5:7,6:9,7:10,8:11,9:13},
        type: Object,
    });

    game.settings.register(CONSTANTS.MODULE_NAME, `spEnableVariant`, {
		name: `${CONSTANTS.MODULE_NAME}.setting.spEnableVariant.name`,
		hint: `${CONSTANTS.MODULE_NAME}.setting.spEnableVariant.hint`,
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });

    game.settings.register(CONSTANTS.MODULE_NAME, `spLifeCost`, {
		name: `${CONSTANTS.MODULE_NAME}.setting.spLifeCost.name`,
		hint: `${CONSTANTS.MODULE_NAME}.setting.spLifeCost.hint`,
        scope: "world",
        config: true,
        default: 2,
        type: Number,
    });

    game.settings.register(CONSTANTS.MODULE_NAME, `spMixedMode`, {
		name: `${CONSTANTS.MODULE_NAME}.setting.spMixedMode.name`,
		hint: `${CONSTANTS.MODULE_NAME}.setting.spMixedMode.hint`,
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });

    game.settings.register(CONSTANTS.MODULE_NAME, `isCustom`, {
		name: `${CONSTANTS.MODULE_NAME}.setting.isCustom.name`,
		hint: `${CONSTANTS.MODULE_NAME}.setting.isCustom.hint`,
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });

    game.settings.register(CONSTANTS.MODULE_NAME, `spCustomFormulaBase`, {
		name: `${CONSTANTS.MODULE_NAME}.setting.spCustomFormulaBase.name`,
		hint: `${CONSTANTS.MODULE_NAME}.setting.spCustomFormulaBase.hint`,
        scope: "world",
        config: true,
        default: 0,
        type: Number,
    });

    game.settings.register(CONSTANTS.MODULE_NAME, `spCustomFormulaSlotMultiplier`, {
		name: `${CONSTANTS.MODULE_NAME}.setting.spCustomFormulaSlotMultiplier.name`,
		hint: `${CONSTANTS.MODULE_NAME}.setting.spCustomFormulaSlotMultiplier.hint`,
        scope: "world",
        config: true,
        default: 1,
        type: Number,
    });

	// ========================================================================
	game.settings.register(CONSTANTS.MODULE_NAME, "debug", {
		name: `${CONSTANTS.MODULE_NAME}.setting.debug.name`,
		hint: `${CONSTANTS.MODULE_NAME}.setting.debug.hint`,
		scope: "client",
		config: true,
		default: false,
		type: Boolean,
	});
	const settings = defaultSettings();
	for (const [name, data] of Object.entries(settings)) {
		game.settings.register(CONSTANTS.MODULE_NAME, name, data);
	}
	// for (const [name, data] of Object.entries(otherSettings)) {
	//     game.settings.register(CONSTANTS.MODULE_NAME, name, data);
	// }
};
class ResetSettingsDialog extends FormApplication {
	constructor(...args) {
		//@ts-ignore
		super(...args);
		//@ts-ignore
		return new Dialog({
			title: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.dialogs.resetsettings.title`),
			content:
				'<p style="margin-bottom:1rem;">' +
				game.i18n.localize(`${CONSTANTS.MODULE_NAME}.dialogs.resetsettings.content`) +
				"</p>",
			buttons: {
				confirm: {
					icon: '<i class="fas fa-check"></i>',
					label: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.dialogs.resetsettings.confirm`),
					callback: async () => {
						await applyDefaultSettings();
						window.location.reload();
					},
				},
				cancel: {
					icon: '<i class="fas fa-times"></i>',
					label: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.dialogs.resetsettings.cancel`),
				},
			},
			default: "cancel",
		});
	}
	async _updateObject(event, formData) {
		// do nothing
	}
}
async function applyDefaultSettings() {
	const settings = defaultSettings(true);
	// for (const [settingName, settingValue] of Object.entries(settings)) {
	//   await game.settings.set(CONSTANTS.MODULE_NAME, settingName, settingValue.default);
	// }
	const settings2 = otherSettings(true);
	for (const [settingName, settingValue] of Object.entries(settings2)) {
		//@ts-ignore
		await game.settings.set(CONSTANTS.MODULE_NAME, settingName, settingValue.default);
	}
}
function defaultSettings(apply = false) {
	return {
		//
	};
}
function otherSettings(apply = false) {
	return {
		debug: {
			name: `${CONSTANTS.MODULE_NAME}.setting.debug.name`,
			hint: `${CONSTANTS.MODULE_NAME}.setting.debug.hint`,
			scope: "client",
			config: true,
			default: false,
			type: Boolean,
		},
	};
}
