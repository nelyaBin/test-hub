import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { ComponentData } from "../models/component-data.model";

@Injectable({
  providedIn: "root",
})
export class ComponentDataService {
  private data: ComponentData[] = [
    {
      componentName: "Login Preset",
      isPreset: true,
      selected: false,
      infoText: "Handles login functionality",
      tests: [],
      group: ["auth"],
    },
    {
      componentName: "Signup Preset",
      isPreset: true,
      selected: false,
      infoText: "Handles signup functionality",
      tests: [],
      group: ["auth"],
    },
    {
      componentName: "Profile Preset",
      isPreset: true,
      selected: false,
      infoText: "Profile management",
      tests: [],
      group: ["profile"],
    },
    {
      componentName: "Settings Preset",
      isPreset: true,
      selected: false,
      infoText: "Settings & preferences",
      tests: [],
      group: ["settings"],
    },

    // Custom Features
    {
      componentName: "Login Feature",
      isPreset: false,
      selected: false,
      infoText: "Custom login checks",
      tests: [
        {
          testName: "Check Login Button",
          testOwner: "Alice",
          testTag: "auth",
          selected: false,
          link: "https://www.youtube.com/",
        },
        {
          testName: "Check Password Field",
          testOwner: "Bob",
          testTag: "auth",
          selected: false,
        },
      ],
      group: ["auth"],
    },
    {
      componentName: "Signup Feature",
      isPreset: false,
      selected: false,
      infoText: "Custom signup flow",
      tests: [
        {
          testName: "Check Email Field",
          testOwner: "Alice",
          testTag: "auth",
          selected: false,
        },
        {
          testName: "Check Password Strength",
          testOwner: "Bob",
          testTag: "auth",
          selected: false,
        },
      ],
      group: ["auth"],
    },
    {
      componentName: "Profile Edit Feature",
      isPreset: false,
      selected: false,
      infoText: "Edit profile info",
      tests: [
        {
          testName: "Edit Name",
          testOwner: "Charlie",
          testTag: "profile",
          selected: false,
        },
        {
          testName: "Edit Picture",
          testOwner: "Dana",
          testTag: "profile",
          selected: false,
        },
      ],
      group: ["profile"],
    },
    {
      componentName: "Profile Privacy Feature",
      isPreset: false,
      selected: false,
      infoText: "Manage privacy settings",
      tests: [
        {
          testName: "Toggle Privacy",
          testOwner: "Charlie",
          testTag: "profile",
          selected: false,
        },
      ],
      group: ["profile"],
    },
    {
      componentName: "Settings Notifications Feature",
      isPreset: false,
      selected: false,
      infoText: "Notifications settings",
      tests: [
        {
          testName: "Enable Email Alerts",
          testOwner: "Eve",
          testTag: "settings",
          selected: false,
        },
        {
          testName: "Enable Push Alerts",
          testOwner: "Eve",
          testTag: "settings",
          selected: false,
        },
      ],
      group: ["settings"],
    },
    {
      componentName: "Settings Theme Feature",
      isPreset: false,
      selected: false,
      infoText: "Change UI theme",
      tests: [
        {
          testName: "Dark Mode",
          testOwner: "Eve",
          testTag: "settings",
          selected: false,
        },
      ],
      group: ["settings"],
    },
  ];

  getComponents(): Observable<ComponentData[]> {
    return of(this.data);
  }

  // 🔹 פונקציה שמפעילה/מכבה custom לפי group
  syncGroupSelection(group: string[], state: boolean) {
    this.data
      .filter((d) => !d.isPreset && d.group.some((g) => group.includes(g)))
      .forEach((custom) => {
        custom.selected = state;
        custom.tests.forEach((t) => (t.selected = state));
      });
  }
}
