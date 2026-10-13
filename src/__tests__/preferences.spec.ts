import type { ISettingRegistry } from "@jupyterlab/settingregistry";

import { DisplayPreferences } from "../preferences";

/**
 * Enough of ISettings for DisplayPreferences: user values over schema defaults.
 */
function fakeSettings(user: Record<string, boolean> = {}) {
  const defaults: Record<string, boolean> = { labels: true, formats: true };
  const settings = {
    user,
    get: (key: string) => ({ composite: key in user ? user[key] : defaults[key] }),
    set: jest.fn(async (key: string, value: boolean) => {
      user[key] = value;
    }),
  };
  return settings;
}

describe("DisplayPreferences", () => {
  it("should start with both toggles on", async () => {
    const preferences = new DisplayPreferences(
      Promise.resolve(fakeSettings() as unknown as ISettingRegistry.ISettings),
    );
    expect(await preferences.get()).toEqual({ labels: true, formats: true });
  });

  it("should read the toggles from the settings", async () => {
    const preferences = new DisplayPreferences(
      Promise.resolve(fakeSettings({ formats: false }) as unknown as ISettingRegistry.ISettings),
    );
    expect(await preferences.get()).toEqual({ labels: true, formats: false });
  });

  it("should save a toggle to the settings", async () => {
    const settings = fakeSettings();
    const preferences = new DisplayPreferences(
      Promise.resolve(settings as unknown as ISettingRegistry.ISettings),
    );
    await preferences.set("labels", false);
    expect(settings.set).toHaveBeenCalledWith("labels", false);
    expect(settings.user).toEqual({ labels: false });

    // A second viewer reading the same settings starts from the saved choice.
    const other = new DisplayPreferences(
      Promise.resolve(settings as unknown as ISettingRegistry.ISettings),
    );
    expect(await other.get()).toEqual({ labels: false, formats: true });
  });

  it("should keep the toggles for the session without settings", async () => {
    const preferences = new DisplayPreferences();
    await preferences.set("formats", false);
    expect(await preferences.get()).toEqual({ labels: true, formats: false });
  });

  it("should fall back to the session when the settings fail to load", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const preferences = new DisplayPreferences(Promise.reject(new Error("no schema")));
    expect(await preferences.get()).toEqual({ labels: true, formats: true });
    await preferences.set("labels", false);
    expect(await preferences.get()).toEqual({ labels: false, formats: true });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
