import type { ISettingRegistry } from "@jupyterlab/settingregistry";

/**
 * The state of the Labels and Formats toolbar toggles.
 */
export interface DisplayToggles {
  labels: boolean;
  formats: boolean;
}

/**
 * Remembers the Labels and Formats toggles for the user, in the plugin's settings, so a newly
 * opened file and a reloaded page start from the last choice. One setting covers every file.
 *
 * Without a settings registry, or when loading the settings fails, the choice is kept in
 * memory for the session.
 */
export class DisplayPreferences {
  static readonly DEFAULTS: Readonly<DisplayToggles> = { labels: true, formats: true };

  constructor(settings: Promise<ISettingRegistry.ISettings | null> = Promise.resolve(null)) {
    this._settings = settings.catch((error) => {
      console.warn("Jenner dataset viewer: cannot load settings", error);
      return null;
    });
  }

  /**
   * The toggles a newly opened file starts with.
   */
  async get(): Promise<DisplayToggles> {
    const settings = await this._settings;
    if (settings === null) {
      return { ...this._session };
    }
    return {
      labels: DisplayPreferences.readBoolean(settings, "labels"),
      formats: DisplayPreferences.readBoolean(settings, "formats"),
    };
  }

  /**
   * Remember one toggle.
   */
  async set<K extends keyof DisplayToggles>(key: K, value: DisplayToggles[K]): Promise<void> {
    this._session[key] = value;
    const settings = await this._settings;
    if (settings !== null) {
      await settings.set(key, value);
    }
  }

  private static readBoolean(settings: ISettingRegistry.ISettings, key: keyof DisplayToggles) {
    const value = settings.get(key).composite;
    return typeof value === "boolean" ? value : DisplayPreferences.DEFAULTS[key];
  }

  private _settings: Promise<ISettingRegistry.ISettings | null>;
  private _session: DisplayToggles = { ...DisplayPreferences.DEFAULTS };
}
