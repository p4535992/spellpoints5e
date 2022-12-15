import { VSpellPoints } from "./scripts/VSpellPoints";
import { VSpellPointsCalcs } from "./scripts/VSpellPointsCalcs";
import { VSpellPointsData } from "./scripts/VSpellPointsData";

Hooks.once("devModeReady", ({ registerPackageDebugFlag }) => {
	registerPackageDebugFlag(VSpellPoints.ID);
});

/**
 * Once the game has initialized, set up our module
 */
Hooks.once("ready", () => {
	console.log(`${VSpellPoints.ID} | Initializing module`);
	VSpellPoints.initialize();

	// add a button to the top of the sheet that opens a dialog to enable/disable spellpoints per sheet
	// TODO: comments
	Hooks.on("getActorSheetHeaderButtons", (actorsheetCharacter, items) => {
		VSpellPoints.log("Add spellpoint button to header");
		VSpellPoints.log("RENDER", actorsheetCharacter, items);

		// disable for not trusted players
		if (!game.user.isTrusted && !game.user.isGM) return;

		let actor = actorsheetCharacter.object;

		// prevent execution if it's not a charactersheet
		if (!VSpellPointsData.isCharacter(actor)) return;

		function handleVariantChoice(choice, actor) {
			VSpellPoints.log("CLICKED ON UPDATE SHEET");
			VSpellPoints.log(choice, actor);
			VSpellPointsData.setPointsEnabled(actor, choice);
		}

		const spellPointsButton = {
			label: "",
			class: "spellpoints",
			icon: "fas fa-book",
			onclick: async (event) => {
				const clickedElement = $(event.currentTarget);
				const actorID = clickedElement.parents("[id]")?.attr("id")?.split("-").pop();
				const actor = game.actors.get(actorID);
				const previousChoice = VSpellPointsData.getPointsEnabled(actor);
				const selectedAttribute = `selected="selected"`;

				let spellLvlDialog = new Dialog({
					title: "Should spell points be used for this character?",
					content: `
                      Select if spell points should be used for this character.
                      <form class="flexcol">
                        <div class="form-group">
                          <label>Selection:  </label>
                          <select id="spellSlotVariant">
                            <option value="${VSpellPoints.STATUSCHOICES.default}" ${
						previousChoice === VSpellPoints.STATUSCHOICES.default ? selectedAttribute : ""
					}>
                                default (global setting)
                            </option>
                            <option value="${VSpellPoints.STATUSCHOICES.disabled}" ${
						previousChoice === VSpellPoints.STATUSCHOICES.disabled ? selectedAttribute : ""
					}>
                                use slots
                            </option>
                            <option value="${VSpellPoints.STATUSCHOICES.enabled}" ${
						previousChoice === VSpellPoints.STATUSCHOICES.enabled ? selectedAttribute : ""
					}>
                                use points
                            </option>
                          </select>
                        </div>

                        <div class="form-group">
                            <label>Custom Point Value</label>
                            <input type="number" id="customSpellPointCount" min="0" max="999" size="3" value="3">
                            <p class="notes">Set the max point count</p>
                        </div>

                      </form>`,
					buttons: {
						one: {
							icon: '<i class="fas fa-save"></i>',
							label: "Update Sheet",
							callback: (html) => handleVariantChoice(html.find(`#spellSlotVariant`).val(), actor),
						},
					},
					default: null,
					render: (html) => VSpellPoints.log("Register interactivity in the rendered dialog"),
				});
				await spellLvlDialog.render(true);
			},
		};
		items.unshift(spellPointsButton);
	});

	// modify actorsheet after its rendered to show the spell points
	Hooks.on("renderActorSheet5e", (actorsheet, html, _options) => {
		VSpellPoints.log("Add spellpoint UI");
		VSpellPoints.log("RENDER", actorsheet, html, _options);

		let actor = actorsheet.object;
		// prevent execution if variant is disabled
		if (VSpellPointsData.moduleManuallyEnabled(actor) === false) {
            return;
        }
		if (!VSpellPointsData.moduleEnabled() && !VSpellPointsData.moduleManuallyEnabled(actor)) {
            return;
        }

		if (!VSpellPointsData.isCharacter(actor)) {
            return;
        }

		VSpellPoints.log("render actorsheet", actorsheet, "renderActor: ", foundry.utils.deepClone(actor));

		// initialize spellpoints data in the actor, if not yet present
		const defaultResources = VSpellPointsData.initPoints(actor);

		// removes non spellcasters and single-class warlocks
		VSpellPoints.log(
			"Render Sheet: warlock, spellcaster:",
			VSpellPointsData.isWarlock(actor),
			VSpellPointsData.isSpellcaster(actor)
		);
		if (!VSpellPointsData.isSpellcaster(actor)) {
            return;
        }
		// change header of sheet
		VSpellPoints.log("It's a caster! - Level " + VSpellPointsCalcs.getCombinedSpellCastingLevel(actor_classes)[0]);

		let sheetTheme = actorsheet.constructor.name;
		let attributesList;
		let resourcesList;

		if (sheetTheme === VSpellPoints.CUSTOM_SHEETS.TIDY5E) {
			VSpellPoints.log("Using Tidy5eSheet");
			attributesList = html.find(".tidy5e-header").find(".header-attributes");
			resourcesList = html.find(".sheet-body .center-pane").find("ul.resources");
		} else {
			attributesList = html.find(".sheet-header").find(".attributes");
			resourcesList = html.find(".sheet-body .center-pane").find("ul.attributes");
		}

		if (resourcesList.length === 0) {
			VSpellPoints.log("Resources list is empty");
			resourcesList = html.find(".sheet-main-wrapper .sheet-main").find("ul.attributes");
		}

		let savedResourcesData = VSpellPointsData.getResources(actor) ?? {};

		/** @type Resource */
		let actorResources = foundry.utils.isObjectEmpty(savedResourcesData) ? defaultResources : savedResourcesData;
		VSpellPoints.log("Using pointData: ", actorResources);

		// create new attribute display in the header or the resource block
		// TODO: shorten this line
		let displayAsResource =
			Object.values(VSpellPoints.DISPLAY_CHOICE)[
				game.settings.get(VSpellPoints.ID, VSpellPoints.SETTINGS.DISPLAY)
			] === VSpellPoints.DISPLAY_CHOICE.resources;
		let spellPointsAttribute = VSpellPointsCalcs.createSpellPointsInfo(
			actor,
			actorResources,
			displayAsResource,
			sheetTheme
		);

		if (displayAsResource) {
			spellPointsAttribute.then((spellPointsInfo) => {
				let newResource = resourcesList.append(spellPointsInfo);
				actorsheet.activateListeners($(newResource).find(".spellpoints"));
			});
		} else {
			spellPointsAttribute.then((spellPointsInfo) => {
				let newAttribute = attributesList.append(spellPointsInfo);
				actorsheet.activateListeners($(newAttribute).find(".spellpoints"));
			});
		}

		// add point cost and remaining spellpoints indicator to every spell category
		// also add remaining uses if 6th level or higher
		html.find(".tab.spellbook")
			.find(".items-header.spellbook-header")
			.find(".spell-slots")
			.each(function (i) {
				let dataLevel = $(this).find(".spell-max[data-level]").attr("data-level");

				// skip spells without limited uses and pact spells
				if (!dataLevel || !dataLevel.includes("spell")) {
					return true;
				}

				let newSlotInfo;
				let newUsesInfo;
				let spellLevel = parseInt(dataLevel.replace("spell", ""));
				newSlotInfo = `
                    <span> ${VSpellPointsCalcs.getSpellPointCost(spellLevel)} </span>
                    <span class="sep"> / </span>
                    <span class="spell-max">${actorResources?.points?.value ?? 0} P</span>`;

				// for uses: skip spells under lvl 6
				if (spellLevel < 6) newUsesInfo = "";
				else {
					newUsesInfo = `
                        <div class="spell-uses" title="remaining uses">
                            (<input type="text"
                                    name="${VSpellPoints.resourcesPath()}.uses.${dataLevel}.value"
                                    value="${actorResources.uses[dataLevel]?.value ?? 0}" placeholder="0"
                                    data-dtype="Number">
                            <span class="sep"> / </span>
                            <span class="spell-max" data-level="${dataLevel}" data-slots="${
						actorResources.uses[dataLevel].override ?? actorResources.uses[dataLevel].max
					}">
                                ${actorResources.uses[dataLevel].override ?? actorResources.uses[dataLevel].max}
                                <a class="points-max-override" title="Override points">
                                    <i class="fas fa-edit"></i>
                                </a>
                            </span>)
                        </div>`;
				}
				// account for multiple sheets that set different classnames etc.
				let parent;
				let parentOptions = ["spell-level-slots", "item-name"];
				for (let option of parentOptions) {
					parent = $(this).parent().find(`.${option}`);
					if (parent.length !== 0) break;
					parent = $(this).parent().parent().find(`.${option}`);
					if (parent.length !== 0) break;
				}

				// add uses indicator to the left of point cost indicator
				$(this).parent().find("h3").addClass("points-variant");
				$(this).attr("title", "cost / remaining spell points");
				$(this).removeClass("spell-slots");
				$(this).addClass("spell-points");
				$(this).html(newSlotInfo);

				$(newUsesInfo).detach().appendTo(parent);
				$(this).detach().appendTo(parent);
				actorsheet.activateListeners($(this).parent());
			});
		// adds onclick function to change the max uses amount
		html.find(".tab.spellbook")
			.find(".points-max-override")
			.click(VSpellPointsData._onSpellUsesOverride.bind(actor));

		// set new min-width for the sheet if it hasn't been set yet
		let currentMinWidth = html.css("min-width").replace("px", "");
		if (currentMinWidth !== "auto" && currentMinWidth < actorsheet.options.width + 50) {
			html.css("min-width", `${actorsheet.options.width + 50}px`);
			actorsheet.setPosition({ width: actorsheet.options.width + 50 });
		}
	});

	Hooks.on("renderLongRestDialog", (dialog, html, options) => {
		// prevent execution if variant is disabled
		if (VSpellPointsData.moduleManuallyEnabled(dialog.actor) === false) {
            return;
        }
		if (!VSpellPointsData.moduleEnabled() && !VSpellPointsData.moduleManuallyEnabled(dialog.actor)) {
            return;
        }
		let text = $(html).find(".dialog-content").children("p").text().replace("spell slots", "spell points");
		$(html).find(".dialog-content").children("p").text(text);
	});

	// TODO: use localization stuff
	// replace the spell slot reminder in the ability use dialog
	Hooks.on("renderAbilityUseDialog", (dialog, html, object) => {
		VSpellPoints.log(dialog, html, object);
		let item = dialog.item;
		let actor = item.parent;

		// prevent execution if variant is disabled
		if (VSpellPointsData.moduleManuallyEnabled(actor) === false) {
            return;
        }
		if (!VSpellPointsData.moduleEnabled() && !VSpellPointsData.moduleManuallyEnabled(actor)) {
            return;
        }
		VSpellPoints.log(
			"Render Ability Use: warlock, spellcaster:",
			VSpellPointsData.isWarlock(actor),
			VSpellPointsData.isSpellcaster(actor)
		);
		// filters out npcs, non spellcasters and single-class warlocks
		if (!VSpellPointsData.isCharacter(actor) || !VSpellPointsData.isSpellcaster(actor)) {
            return;
        }
		// only apply on spells that cost resources
		let preparation = item?.system?.preparation;
		if (!preparation) preparation = item?.data?.data?.preparation;

		if (
			item?.data?.type !== "spell" ||
			item?.labels?.level === "Cantrip" ||
			preparation?.mode === "atwill" ||
			preparation?.mode === "innate" ||
			// || html.find("#ability-use-form").find(".form-group").find(VSpellPoints.isV10() ? "select[name=consumeSpellLevel]" : "select[name=level]").length === 0){
			html.find("#ability-use-form").find(".form-group").find("select[name=consumeSpellLevel]").length === 0
		) {
			VSpellPoints.log("not using a resource spell");
			return;
		}

		// TODO: Show red warning box if it can't be cast

		VSpellPoints.log(dialog, html, object);
		/** @type Resource */
		let actorResources = VSpellPointsData.getResources(actor);
		if (!actorResources || foundry.utils.isObjectEmpty(actorResources))
			actorResources = VSpellPointsData.initPoints(actor);

		// change consume spell slot text
		let consumeText = $(html)
			.find("#ability-use-form")
			// .find(VSpellPoints.isV10() ? "input[name='consumeSpellSlot']" : "input[name='consumeSlot']")
			.find("input[name='consumeSpellSlot']")
			.parent()
			.contents()
			.filter(function () {
				// get only text elements
				return this.nodeType === 3 && this.textContent?.trim().length > 0;
			});

		if (VSpellPointsData.isWarlock(actor)) $(consumeText)[0].textContent = "Consume Spell Points / Slots?";
		else $(consumeText)[0].textContent = "Consume Spell Points?";

		// modify the "cast at level" list
		$(html)
			.find("#ability-use-form")
			// .find(VSpellPoints.isV10() ? "select[name=consumeSpellLevel]" : "select[name=level]")
			.find("select[name=consumeSpellLevel]")
			.find("option")
			.each(function (i) {
				let spellValue = $(this).attr("value");

				let isPact = spellValue === "pact";
				if (isPact) {
					// do nothing
					return true;
				}

				let spellLevel = parseInt(spellValue);
				let cost = VSpellPointsCalcs.getSpellPointCost(spellLevel);

				// https://stackoverflow.com/questions/13627308/add-st-nd-rd-and-th-ordinal-suffix-to-a-number
				function ordinal_suffix_of(i) {
					var j = i % 10,
						k = i % 100;
					if (j === 1 && k !== 11) return i + "st";
					if (j === 2 && k !== 12) return i + "nd";
					if (j === 3 && k !== 13) return i + "rd";
					return i + "th";
				}
				let new_text = ordinal_suffix_of(spellLevel) + " Level ";

				// add spellpoint cost and spellpoints left
				new_text += `(${cost} / ${actorResources.points?.value ?? 0} Spell Points)`;

				// add uses left
				if (spellLevel >= 6) {
					let uses = actorResources?.uses[`spell${spellLevel}`]?.value ?? 0;
					let usesMax =
						actorResources?.uses[`spell${spellLevel}`]?.override ??
						actorResources?.uses[`spell${spellLevel}`]?.max ??
						0;
					new_text += uses === 1 ? ` (${uses} use left)` : ` (${uses} uses left)`;
				}
				$(this).text(new_text);
			});
	});

	/* Using libwrapper, if present,  to manage MonkeyPatched functions */
	libWrapper.register(
		VSpellPoints.ID,
		"game.dnd5e.entities.Actor5e.prototype._getRestSpellRecovery",
		function (wrapped, ...args) {
			VSpellPoints.log("libwrapper: game.dnd5e.entities.Actor5e.prototype._getRestSpellRecovery was called");
			return override_getRestSpellRecovery(wrapped).bind(this)(...args);
		},
		"WRAPPER"
	);

	libWrapper.register(
		VSpellPoints.ID,
		"game.dnd5e.entities.Item5e.prototype._getUsageUpdates",
		function (wrapped, ...args) {
			VSpellPoints.log("libwrapper: game.dnd5e.entities.Item5e.prototype._getUsageUpdates was called");
			return override_getUsageUpdates(wrapped).bind(this)(...args);
		},
		"WRAPPER"
	);
});

function override_getRestSpellRecovery(oldRestSpellRecovery) {
	return function ({ recoverPact = true, recoverSpells = true }) {
		VSpellPoints.log("recover pact:", recoverPact, "recover spells:", recoverSpells);
		VSpellPoints.log(
			"_getRestSpellRecovery: warlock, spellcaster",
			VSpellPointsData.isWarlock(this),
			VSpellPointsData.isSpellcaster(this)
		);

		// use normal function if variant usage is disabled, no spells are being recovered, its an NPC or its not a spellcaster
		if (
			VSpellPointsData.moduleManuallyEnabled(this) === false ||
			(!VSpellPointsData.moduleEnabled() && !VSpellPointsData.moduleManuallyEnabled(this)) ||
			!recoverSpells ||
			!VSpellPointsData.isCharacter(this) ||
			!VSpellPointsData.isSpellcaster(this)
		) {
			return oldRestSpellRecovery.apply(this, arguments);
		}

		// call normal spell recovery
		let oldUpdate = oldRestSpellRecovery.apply(this, arguments);

		/** @type Resource */
		let actorResources = VSpellPointsData.getResources(this);
		if (!actorResources || foundry.utils.isObjectEmpty(actorResources))
			actorResources = VSpellPointsData.initPoints(actor);

		// and then add my own update: reset current, tempPoints, tempMax and uses
		if (actorResources?.points?.value !== undefined && actorResources?.points?.max !== undefined)
			oldUpdate[`${VSpellPoints.resourcesPath()}.points.value`] = actorResources?.points?.max ?? 0;
		oldUpdate[`${VSpellPoints.resourcesPath()}.points.temp`] = 0;
		oldUpdate[`${VSpellPoints.resourcesPath()}.points.addMax`] = 0;
		// reset uses for over 6th level spells
		Object.entries(actorResources?.uses ?? {}).forEach(([spellLevel, data]) => {
			VSpellPoints.log(`${VSpellPoints.resourcesPath()}.uses.${spellLevel}.value`, data.max);
			oldUpdate[`${VSpellPoints.resourcesPath()}.uses.${spellLevel}.value`] = data.override ?? data.max;
		});

		return oldUpdate;
	};
}

function override_getUsageUpdates(oldUsageUpdate) {
	return function ({ consumeQuantity, consumeRecharge, consumeResource, consumeSpellLevel, consumeUsage, ...args }) {
		let actor = this.parent;

		consumeSpellSlot = args.consumeSlot || args.consumeSpellSlot;

		VSpellPoints.log(
			"_getUsageUpdates",
			{
				consumeQuantity,
				consumeRecharge,
				consumeResource,
				consumeSpellLevel,
				consumeUsage,
				consumeSpellSlot,
			},
			this
		);

		/* consume Resource on non-spells. TODO: will maybe be changed in the future */
		// check if a resource gets consumed and that resource is the spell points
		let isResource = false;
		if (consumeResource && this.data?.data?.consume?.target?.includes(VSpellPoints.resourcesPath())) {
			isResource = true;
		}

		// use normal function if variant is disabled or because of other factors
		// do default behaviour if no spell level is used or module is deactivated
		VSpellPoints.log(
			"_getUsageUpdates: warlock, spellcaster:",
			VSpellPointsData.isWarlock(actor),
			VSpellPointsData.isSpellcaster(actor)
		);
		if (
			VSpellPointsData.moduleManuallyEnabled(actor) === false ||
			(!isResource &&
				((!VSpellPointsData.moduleEnabled() && !VSpellPointsData.moduleManuallyEnabled(actor)) ||
					!consumeSpellLevel ||
					!VSpellPointsData.isCharacter(actor) ||
					!VSpellPointsData.isSpellcaster(actor)))
		) {
			VSpellPoints.log("Spell points not affected");
			return oldUsageUpdate.apply(this, arguments);
		}

		// Do default behaviour if spell is cast with pact magic
		const isPactMagic = consumeSpellLevel === "pact";
		if (isPactMagic) {
			VSpellPoints.log("Spell points not affected");
			return oldUsageUpdate.apply(this, arguments);
		}

		// get the spell level that is being cast
		let spellLevelStr = consumeSpellLevel;

		// prevent default behaviour by telling the function there is no spell being consumed
		consumeSpellLevel = null;

		// call normal spell recovery
		let oldUpdate = oldUsageUpdate.apply(this, [
			{
				consumeQuantity,
				consumeRecharge,
				consumeResource,
				consumeSpellLevel,
				consumeUsage,
				consumeSlot: consumeSpellSlot, // <V10
				consumeSpellSlot: false, // V10; we never want to consume the slot when using spell points
			},
		]);

		VSpellPoints.log(oldUpdate);

		/** @type Resource */
		let actorResources = VSpellPointsData.getResources(actor);
		if (!actorResources || foundry.utils.isObjectEmpty(actorResources))
			actorResources = VSpellPointsData.initPoints(actor);

		// define when spells start to cost uses
		let usesSpellLevel = 6;

		let spellCost;
		let currentNotOk;
		let spellLevelNotOk;
		let noUsesRemaining;
		let spellLevel;
		// normal use or used as resource?
		if (isResource) {
			spellCost = 0;
			spellLevel = 0;
			// is the resource a spell slot or the points?
			if (this.data?.data?.consume?.target?.includes("uses")) {
				spellLevelStr = this.data?.data?.consume?.target
					?.replace(VSpellPoints.resourcesPath(), "")
					.replace(".uses.", "")
					.replace(".value", "");
				spellLevel = parseInt("" + spellLevelStr?.replace("spell", "")) || 0;

				currentNotOk = false;
				spellLevelNotOk = !spellLevel || !actorResources?.maxLevel || spellLevel > actorResources?.maxLevel;
				noUsesRemaining =
					spellLevel >= usesSpellLevel ? actorResources?.uses[spellLevelStr]?.value === 0 : false;
			} else {
				spellCost = this.data?.data?.consume?.amount;

				currentNotOk =
					!spellCost || !actorResources?.points?.value || actorResources?.points?.value < spellCost;
				spellLevelNotOk = false;
				noUsesRemaining = false;
			}
		} else {
			// string of spell level to number
			spellLevel = parseInt("" + spellLevelStr?.replace("spell", "")) || 0;

			// get point cost of spell level
			if (consumeSpellSlot) {
				spellCost = VSpellPointsCalcs.getSpellPointCost(spellLevel);
				VSpellPoints.log(
					"spelllevel: " + spellLevel,
					"spellCost: " + spellCost,
					"currentPoint: " + actorResources?.points?.value,
					"maxSpellLevel: " + actorResources?.maxLevel
				);
				if (spellLevel >= usesSpellLevel)
					VSpellPoints.log(
						`usesRemaining-${spellLevelStr}: ` + actorResources?.uses[spellLevelStr]?.value ?? 0
					);

				// error if no or not enough spell points are left, or if level is too high, or if uses remaining
				currentNotOk =
					!spellCost || !actorResources?.points?.value || actorResources?.points?.value < spellCost;
				spellLevelNotOk = !spellLevel || !actorResources?.maxLevel || spellLevel > actorResources?.maxLevel;
				noUsesRemaining =
					spellLevel >= usesSpellLevel ? actorResources?.uses[spellLevelStr]?.value === 0 : false;
			} else {
				spellCost = 0; // Don't consume spell points
				spellLevel = 0; // Don't consume 'uses' either
				currentNotOk = false;
				spellLevelNotOk = false;
				noUsesRemaining = false;
			}
		}

		VSpellPoints.log(
			`Enough points: ${!currentNotOk}, level ok: ${!spellLevelNotOk}, uses ok: ${!noUsesRemaining}`
		);

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
		oldUpdate.actorUpdates[`${VSpellPoints.resourcesPath()}.points.value`] = Math.max(
			(actorResources?.points?.value ?? 0) - spellCost,
			0
		);

		// update uses of the spell
		if (spellLevel >= usesSpellLevel)
			oldUpdate.actorUpdates[`${VSpellPoints.resourcesPath()}.uses.${spellLevelStr}.value`] =
				(actorResources?.uses[spellLevelStr]?.value ?? 0) - 1;
		return oldUpdate;
	};
}
