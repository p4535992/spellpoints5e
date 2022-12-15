export class VSpellPoints {
    static ID = 'spellpoints5e';
    static isActive = true;
    static unsupportedModules = []

    static FLAGS = {
        POINTS: 'points', // legacy
        USES: 'uses', // legacy
        RESOURCES: 'resources',
        ENABLED: 'enabled',
        CUSTOMPOINTVALUE: 'custompointvalue'
    }

    static STATUSCHOICES = {
        enabled: "enabled",
        disabled: "disabled",
        default: "default"
    }

    static resourcesPath() {
        return `flags.${VSpellPoints.ID}.${VSpellPoints.FLAGS.RESOURCES}`
    }

    static CUSTOM_SHEETS = {
      DEFAULT: "ActorSheet5eCharacter",
      TIDY5E: "Tidy5eSheet"
    }

    static TEMPLATES = {
      LEVELS_TOOLTIP: `modules/${this.ID}/templates/levels-tooltip.hbs`,
      ActorSheet5eCharacter: {
          ATTRIBUTE: `modules/${this.ID}/templates/attribute.hbs`,
          RESOURCE: `modules/${this.ID}/templates/attribute.hbs`,
      },
      Tidy5eSheet: {
          ATTRIBUTE: `modules/${this.ID}/templates/tidy5e-attribute.hbs`,
          RESOURCE: `modules/${this.ID}/templates/tidy5e-resource.hbs`,
      }
    }

    static SETTINGS = {
        TOGGLEON: 'spellPointsToggle',
        DISPLAY: 'headerOrResourceToggle',
        TOGGLEONCUSTOMVALUE: 'spellPointsToggleCustomValue',
        TABLESETTINGS: 'tablesButton'
    }

    static DISPLAY_CHOICE = {
        header: "Header",
        resources: 'Resources'
    }

    static initialize() {
        // load templates
        delete _templateCache[this.TEMPLATES.LEVELS_TOOLTIP];
        delete _templateCache[this.TEMPLATES.ActorSheet5eCharacter.ATTRIBUTE];
        delete _templateCache[this.TEMPLATES.ActorSheet5eCharacter.RESOURCE];
        delete _templateCache[this.TEMPLATES.Tidy5eSheet.ATTRIBUTE];
        delete _templateCache[this.TEMPLATES.Tidy5eSheet.RESOURCE];

        loadTemplates([this.TEMPLATES.LEVELS_TOOLTIP,
            this.TEMPLATES.ActorSheet5eCharacter.ATTRIBUTE,
            this.TEMPLATES.ActorSheet5eCharacter.RESOURCE,
            this.TEMPLATES.Tidy5eSheet.ATTRIBUTE,
            this.TEMPLATES.Tidy5eSheet.RESOURCE]);

        // disable module if unsupported module is active
        if (this.unsupportedModuleActive()) {
            this.isActive = false;
        }

        // Register a world setting
        game.settings.register(this.ID, this.SETTINGS.TOGGLEON, {
            name: "Use Variant: Spell Points? ",
            hint: `Use Spell Points instead of Slots, as described in the Dungeon Master's Guide. Replaces parts of the "spell book" in the character sheet. `,
            scope: "world",      // This specifies a world-level setting
            config: true,        // This specifies that the setting appears in the configuration view
            default: false,      // The default value for the setting
            type: Boolean
        });

        // Register a client setting
        game.settings.register(this.ID, this.SETTINGS.DISPLAY, {
            name: "Where to display Spell Points:",
            hint: `Select where on the character sheet the current spell point value should be shown. `,
            scope: "world",      // This specifies a world-level setting
            config: true,        // This specifies that the setting appears in the configuration view
            default: 'Header',      // The default value for the setting
            choices: Object.values(this.DISPLAY_CHOICE)
        });

        // Register a world setting
        game.settings.register(this.ID, this.SETTINGS.TOGGLEONCUSTOMVALUE, {
            name: "Allow Custom Spell Point Maximum?",
            hint: `Use Stuff`,
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

    // check if unsupported module is enabled
    static unsupportedModuleActive() {
        let unsupported = false;
        this.unsupportedModules.forEach( function (name) {
            if (game.modules.get(name)?.active) {
                console.error(`${VSpellPoints.ID} | module ${name} is active, which is not supported yet, disabling ${VSpellPoints.ID}`)
                ui.notifications.error(`${VSpellPoints.ID}: module ${name} is active, which is not supported yet, disabling ${VSpellPoints.ID}`);
                unsupported = true;
            }
        })
        return unsupported;
    }

    // static isV10() {
    //   return !foundry.utils.isNewerVersion(10, game.version ?? game?.data?.version);
    // }
}
