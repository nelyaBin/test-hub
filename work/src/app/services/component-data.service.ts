import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { ComponentData } from "../models/component-data.model";

@Injectable({
  providedIn: "root",
})
export class ComponentDataService {
  constructor(private http: HttpClient) {}

  // במקום משתנה מקומי, נטען את ה-JSON
  getComponents(): Observable<ComponentData[]> {
    return this.http.get<ComponentData[]>("assets/data/components.json");
  }

  // 🔹 פונקציה שמפעילה/מכבה custom לפי group
  syncGroupSelection(group: string[], state: boolean, allData: ComponentData[]) {
    // לוגיקה קיימת – בוחרת custom לפי group של הכרטיסים
    allData
      .filter((d) => !d.isPreset && d.group.some((g) => group.includes(g)))
      .forEach((custom) => {
        custom.selected = state;
        custom.tests.forEach((t) => (t.selected = state));
      });

    // לוגיקה חדשה – בוחרת טסטים לפי testGroup גם אם הכרטיס עצמו לא שייך ל-group
    allData
      .filter((d) => !d.isPreset)
      .forEach((custom) => {
        custom.tests.forEach((test) => {
          if (test.testGroup?.some((g) => group.includes(g))) {
            test.selected = state;
          }
        });
      });
  }
}
