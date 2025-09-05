import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ComponentData, Test } from '../models/component-data.model';
import { mockData } from '../../assets/data/components';

@Injectable({
  providedIn: 'root'
})
export class ComponentDataService {
  // Signal שמחזיק את כל הנתונים
  private allComponentsSignal = signal<ComponentData[]>([]);
  
  // משתנה סטטי של ComponentData במקום קריאה לJSON
  
  
  // Computed signals לסינון
  readonly presets = computed(() => 
    this.allComponentsSignal().filter(c => c.isPreset)
  );
  
  readonly customs = computed(() => 
    this.allComponentsSignal().filter(c => !c.isPreset)
  );
  
  readonly allComponents = computed(() => this.allComponentsSignal());

  constructor(private http: HttpClient) {}

  // עכשיו מחזיר את המשתנה הסטטי במקום קריאה לJSON
  getComponents(): Observable<ComponentData[]> {
    return of([...mockData]); // יוצר עותק כדי למנוע שינוי במקור
  }

  // פונקציה לטעינה ראשונית של הנתונים לSignal
  loadComponentsToSignal() {
    this.getComponents().subscribe(data => {
      this.allComponentsSignal.set(data);
    });
  }

  // הפונקציה המתוקנת - עכשיו לא מגדירה state אבסולוטי אלא מחשבת מה צריך להיות
  syncGroupSelection(group: string[], state: boolean, allData: ComponentData[]) {
    // במקום להגדיר state אבסולוטי, נחשב מה הstatus הנכון של כל custom ו-test
    this.recalculateAllSelections(allData);
    
    // עדכון הSignal עם השינויים
    this.allComponentsSignal.set([...allData]);
  }

  // פונקציה חדשה שמחשבת מחדש את כל הבחירות בהתאם לpresets הפעילים
  private recalculateAllSelections(allData: ComponentData[]) {
    // קודם כל, נאפס את כל הבחירות
    allData.filter(d => !d.isPreset).forEach(custom => {
      custom.selected = false;
      custom.tests.forEach(test => test.selected = false);
    });

    // עכשיו נעבור על כל preset פעיל ונפעיל את מה שהוא אמור לגרום לו
    const activePresets = allData.filter(d => d.isPreset && d.selected);
    
    activePresets.forEach(preset => {
      // לוגיקה ראשונה: פעלה על custom components לפי group
      allData
        .filter((d) => !d.isPreset && d.group.some((g) => preset.group.includes(g)))
        .forEach((custom) => {
          custom.selected = true;
          custom.tests.forEach((t) => (t.selected = true));
        });

      // לוגיקה שנייה: פעלה על tests ספציפיים לפי testGroup
      allData
        .filter((d) => !d.isPreset)
        .forEach((custom) => {
          custom.tests.forEach((test) => {
            if (test.testGroup?.some((g) => preset.group.includes(g))) {
              test.selected = true;
            }
          });
        });
    });

    // עכשיו נעדכן את מצב הcustom components בהתאם לטסטים שלהם
    allData.filter(d => !d.isPreset).forEach(custom => {
      const hasSelectedTests = custom.tests.some(test => test.selected);
      if (hasSelectedTests && !custom.selected) {
        // אם יש טסטים נבחרים אבל הcustom עצמו לא נבחר, זה אומר שיש partial selection
        custom.selected = false; // הcustom לא נבחר במלואו
      }
    });
  }

  // פונקציה מרכזית לעדכון בחירת preset
  togglePresetSelection(presetId: string) {
    this.allComponentsSignal.update(components => {
      const preset = components.find(c => c.componentName === presetId && c.isPreset);
      if (!preset) return components;

      preset.selected = !preset.selected;

      // חישוב מחדש של כל הבחירות
      this.recalculateAllSelections(components);

      return [...components];
    });
  }

  // פונקציה לעדכון בחירת custom component
  toggleCustomSelection(customId: string) {
    this.allComponentsSignal.update(components => {
      const custom = components.find(c => c.componentName === customId && !c.isPreset);
      if (!custom) return components;

      const newState = !custom.selected;
      custom.selected = newState;
      
      // עדכון כל הטסטים של הcustom הזה
      custom.tests.forEach(test => {
        test.selected = newState;
      });

      // עדכון כל הpresets הרלוונטיים בהתאם למצב החדש
      this.updateAllPresetsState(components);

      return [...components];
    });
  }

  // פונקציה לעדכון מצב הexpansion
  toggleExpansion(componentId: string) {
    this.allComponentsSignal.update(components => {
      const component = components.find(c => c.componentName === componentId);
      if (component) {
        component.isExpanded = !component.isExpanded;
      }
      return [...components];
    });
  }

  // פונקציה לעדכון מצב כל הpresets בהתאם למצב הcustoms
  private updateAllPresetsState(components: ComponentData[]) {
    components
      .filter(d => d.isPreset)
      .forEach(preset => {
        // בודק customs שקשורים לpreset לפי group
        const relatedCustomsByGroup = components.filter(c => 
          !c.isPreset && c.group.some(g => preset.group.includes(g))
        );

        // בודק customs שיש להם טסטים עם testGroup שמתאים לpreset
        const customsWithRelevantTests = components.filter(c => !c.isPreset)
          .filter(custom => 
            custom.tests.some(test => 
              test.selected && test.testGroup?.some(g => preset.group.includes(g))
            )
          );

        // הpresets יהיה נבחר רק אם:
        // 1. כל הcustoms הקשורים אליו לפי group נבחרים
        // 2. וכל הטסטים הרלוונטיים לפי testGroup נבחרים
        const allRelatedCustomsSelected = relatedCustomsByGroup.length > 0 && 
          relatedCustomsByGroup.every(c => c.selected);

        const allRelevantTestsSelected = components
          .filter(c => !c.isPreset)
          .every(custom => 
            custom.tests
              .filter(test => test.testGroup?.some(g => preset.group.includes(g)))
              .every(test => test.selected)
          );

        // בודק אם יש בכלל טסטים או customs שקשורים לpreset הזה
        const hasRelatedItems = relatedCustomsByGroup.length > 0 || 
          components.some(c => !c.isPreset && 
            c.tests.some(test => test.testGroup?.some(g => preset.group.includes(g)))
          );

        preset.selected = hasRelatedItems && allRelatedCustomsSelected && allRelevantTestsSelected;
      });
  }

  // פונקציה לקבלת כל הטסטים הנבחרים
  getSelectedTestTags(): string[] {
    const selectedTags = new Set<string>();
    
    this.allComponentsSignal().forEach(component => {
      if (!component.isPreset) {
        component.tests.forEach(test => {
          if (test.selected) {
            selectedTags.add(test.testTag);
          }
        });
      }
    });

    return Array.from(selectedTags);
  }

  // computed לבדיקה אם יש טסטים נבחרים
  readonly hasSelectedTests = computed(() => {
    return this.getSelectedTestTags().length > 0;
  });

  // computed לבדיקת partial selection של component
  getPartialSelectionState(componentName: string) {
    return computed(() => {
      const component = this.allComponentsSignal().find(c => c.componentName === componentName);
      if (!component || component.isPreset || !component.tests.length) {
        return false;
      }
      
      const selectedCount = component.tests.filter(t => t.selected).length;
      return selectedCount > 0 && selectedCount < component.tests.length;
    });
  }

  // computed לבדיקת בחירה מלאה של component
  getAllTestsSelectedState(componentName: string) {
    return computed(() => {
      const component = this.allComponentsSignal().find(c => c.componentName === componentName);
      if (!component) return false;
      
      return component.tests?.length 
        ? component.tests.every(t => t.selected)
        : !!component.selected;
    });
  }
}