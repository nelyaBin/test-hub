# תיעוד מפורט - Test Hub Automation UI

## תוכן עניינים

1. [סקירה כללית](#סקירה-כללית)
2. [ארכיטקטורה כללית](#ארכיטקטורה-כללית)
3. [מבנה הפרויקט](#מבנה-הפרויקט)
4. [קבצי תצורה](#קבצי-תצורה)
5. [מודלים (Models)](#מודלים-models)
6. [שירותים (Services)](#שירותים-services)
7. [קומפוננטות (Components)](#קומפוננטות-components)
8. [דפים (Pages)](#דפים-pages)
9. [זרימת נתונים](#זרימת-נתונים)
10. [אינטגרציות](#אינטגרציות)

---

## סקירה כללית

**Test Hub Automation UI** הוא אפליקציית Angular 19 standalone המאפשרת:

- ניהול ובחירת טסטים אוטומטיים
- הרצת טסטים על סביבות שונות (Atlas URLs)
- מעקב אחר סטטוס ריצות טסטים
- הצגת דוחות אישיים וסטטוס פיתוח

האפליקציה בנויה על Angular Signals לניהול state, ומשתמשת ב-standalone components ללא NgModules.

---

## ארכיטקטורה כללית

### סקירה

האפליקציה בנויה על **ארכיטקטורה מודולרית** עם הפרדה ברורה בין שכבות. הארכיטקטורה מבוססת על **Angular 19** עם **standalone components** ו-**Signals** לניהול state.

### עקרונות עיצוב:

1. **Standalone Components** - כל הקומפוננטות הן standalone ללא NgModules

   - כל קומפוננטה מגדירה את ה-imports שלה בעצמה
   - אין צורך ב-NgModules - פשוט יותר וקל יותר לתחזוקה
   - Tree-shaking טוב יותר - רק מה שצריך נטען

2. **Signals-based State Management** - שימוש ב-Angular Signals לניהול state

   - `signal()` - למצבים פשוטים
   - `computed()` - לחישובים אוטומטיים
   - `effect()` - לפעולות צד (side effects)
   - תגובתיות אוטומטית - UI מתעדכן אוטומטית כשהנתונים משתנים

3. **Service Layer Pattern** - לוגיקה עסקית מופרדת ל-services

   - כל service אחראי על תחום ספציפי
   - Services הם singletons (`providedIn: 'root'`)
   - הפרדה בין UI ללוגיקה עסקית

4. **Computed Values** - חישובים אוטומטיים עם computed signals

   - חישובים מתבצעים רק כשצריך
   - Caching אוטומטי - לא מחשב מחדש אם הנתונים לא השתנו
   - דוגמה: `filteredPresets` מתעדכן אוטומטית כשהחיפוש משתנה

5. **Reactive Programming** - תגובתיות אוטומטית לשינויים
   - UI מגיב אוטומטית לשינויים ב-state
   - אין צורך ב-manual change detection
   - זרימת נתונים חד-כיוונית (unidirectional data flow)

### מבנה שכבות:

```
┌─────────────────────────────────────┐
│         Pages (Routes)              │
│  Homepage | Dev-Status | Report     │
│  - נקודות כניסה של האפליקציה        │
│  - מגדירות routing                 │
└──────────────┬──────────────────────┘
               │
               │ (משתמש ב-)
               │
┌──────────────▼──────────────────────┐
│      Components (UI Layer)         │
│  Cards | Lists | Forms | Summary   │
│  - הצגת נתונים למשתמש              │
│  - קלט מהמשתמש                      │
│  - אינטראקציה עם Services          │
└──────────────┬──────────────────────┘
               │
               │ (משתמש ב-)
               │
┌──────────────▼──────────────────────┐
│      Services (Business Logic)     │
│  Data | Selection | Runner | Toast │
│  - ניהול state עם Signals          │
│  - לוגיקה עסקית                     │
│  - תקשורת עם API (אם יש)            │
└──────────────┬──────────────────────┘
               │
               │ (משתמש ב-)
               │
┌──────────────▼──────────────────────┐
│      Models (Data Structures)      │
│  ComponentData | Test | Notifications│
│  - הגדרת מבני נתונים                │
│  - Type safety                      │
└─────────────────────────────────────┘
```

### הסבר מפורט על כל שכבה:

#### 1. שכבה: Pages (Routes)

**תפקיד**: נקודות הכניסה של האפליקציה - כל route מגדיר דף.

**קומפוננטות**:

- `HomepageComponent` - הדף הראשי עם בחירת טסטים
- `DevStatusComponent` - הצגת דוחות HTML
- `PersonalReportComponent` - חיפוש והצגת דוחות אישיים

**איך זה עובד**:

- `app.routes.ts` מגדיר את כל ה-routes
- Angular Router מנתב בין הדפים
- כל דף הוא standalone component

**דוגמה**:

```typescript
// app.routes.ts
{ path: 'homepage', component: HomepageComponent }
```

---

#### 2. שכבה: Components (UI Layer)

**תפקיד**: הצגת UI ואינטראקציה עם המשתמש.

**סוגי קומפוננטות**:

1. **Container Components** (קומפוננטות מכילות):

   - `ComponentListComponent` - מכילה את כל הקומפוננטות של דף הבית
   - `NavbarComponent` - תפריט ניווט

2. **Presentation Components** (קומפוננטות הצגה):

   - `ComponentCardComponent` - כרטיס בודד
   - `TestSectionComponent` - סקשן של קומפוננטות
   - `TestSummaryComponent` - סיכום
   - `ToastComponent` - הודעות

3. **Form Components** (קומפוננטות טופס):
   - `TestConfigurationComponent` - תצורת חיפוש
   - `TestRunnerComponent` - כפתור הרצה

**איך זה עובד**:

- קומפוננטות מקבלות נתונים דרך `@Input()`
- קומפוננטות שולחות אירועים דרך `@Output()`
- קומפוננטות משתמשות ב-Services דרך `inject()`
- קומפוננטות מציגות נתונים מ-Signals

**דוגמה**:

```typescript
// ComponentCardComponent
@Input() data!: ComponentData;
@Input() isPreset: boolean = false;

constructor(private service: ComponentDataService) {}

toggleSelection() {
  this.service.togglePresetSelection(this.data.componentName);
}
```

---

#### 3. שכבה: Services (Business Logic)

**תפקיד**: ניהול state ולוגיקה עסקית.

**סוגי Services**:

1. **State Management Services** (ניהול state):

   - `ComponentDataService` - ניהול נתוני קומפוננטות
   - `NotificationService` - ניהול התראות
   - `TestConfigurationManagerService` - ניהול תצורה

2. **Manager Services** (מנהלים):

   - `TestSelectionManagerService` - ניהול בחירות
   - `TestExpansionManagerService` - ניהול הרחבה
   - `TestFilteringManagerService` - ניהול סינון
   - `UiStateManagerService` - ניהול מצב UI

3. **Action Services** (פעולות):

   - `TestRunnerService` - הרצת טסטים
   - `StatusEndpointService` - עדכוני סטטוס

4. **UI Services** (UI):
   - `ToastManagerService` - הודעות toast

**איך זה עובד**:

- כל service הוא singleton (`providedIn: 'root'`)
- Services משתמשים ב-Signals לניהול state
- Services חושפים readonly signals לקומפוננטות
- Services מכילים את כל הלוגיקה העסקית

**דוגמה**:

```typescript
@Injectable({ providedIn: "root" })
export class ComponentDataService {
  private allComponentsSignal = signal<ComponentData[]>([]);

  readonly presets = computed(() =>
    this.allComponentsSignal().filter((c) => c.isPreset)
  );

  togglePresetSelection(presetId: string) {
    // לוגיקה עסקית...
  }
}
```

---

#### 4. שכבה: Models (Data Structures)

**תפקיד**: הגדרת מבני נתונים ו-Type safety.

**Models**:

- `Test` - מבנה של טסט בודד
- `ComponentData` - מבנה של קומפוננטה
- `RunNotification` - מבנה של התראה
- `ToastMessage` - מבנה של הודעת toast

**איך זה עובד**:

- Models הם TypeScript interfaces/types
- מספקים type safety בכל האפליקציה
- מגדירים את המבנה של הנתונים

**דוגמה**:

```typescript
export interface ComponentData {
  componentName: string;
  isPreset: boolean;
  group: string[];
  tests: Test[];
  selected?: boolean;
}
```

---

### זרימת נתונים (Data Flow)

#### זרימה חד-כיוונית (Unidirectional):

```
User Action
    ↓
Component Event
    ↓
Service Method
    ↓
Signal Update
    ↓
Computed Signals Recalculate
    ↓
Component Re-renders
```

**דוגמה קונקרטית**:

1. **משתמש לוחץ על checkbox** → `ComponentCardComponent.toggleSelection()`
2. **קומפוננטה קוראת ל-service** → `ComponentDataService.togglePresetSelection()`
3. **Service מעדכן signal** → `allComponentsSignal.update(...)`
4. **Computed signals מתעדכנים** → `presets()`, `customs()` מתעדכנים אוטומטית
5. **קומפוננטות מקבלות עדכון** → `ComponentListComponent` מקבל את ה-signals החדשים
6. **UI מתעדכן** → checkboxes, counters, וכו' מתעדכנים

---

### תקשורת בין שכבות:

#### 1. Pages → Components:

```typescript
// HomepageComponent
template: `<app-component-list></app-component-list>`;
```

#### 2. Components → Services:

```typescript
// ComponentListComponent
private readonly dataService = inject(ComponentDataService);
readonly presets = this.dataService.presets;
```

#### 3. Services → Models:

```typescript
// ComponentDataService
private allComponentsSignal = signal<ComponentData[]>([]);
```

#### 4. Components → Components (Parent-Child):

```typescript
// Parent
<app-component-card [data]="item" [isPreset]="true"></app-component-card>

// Child
@Input() data!: ComponentData;
@Input() isPreset: boolean = false;
```

---

### דפוסי עיצוב (Design Patterns):

1. **Singleton Pattern** - כל ה-services הם singletons
2. **Observer Pattern** - Signals משמשים כ-observables
3. **Strategy Pattern** - כל service מטפל באסטרטגיה שונה
4. **Facade Pattern** - Services מספקים ממשק פשוט ל-components
5. **Dependency Injection** - שימוש ב-`inject()` במקום constructor injection

---

### יתרונות הארכיטקטורה:

1. **הפרדת אחריות** - כל שכבה אחראית על משהו אחר
2. **קלות תחזוקה** - קל למצוא ולשנות קוד
3. **Testability** - קל לבדוק כל שכבה בנפרד
4. **Scalability** - קל להוסיף features חדשים
5. **Type Safety** - TypeScript מספק type checking
6. **Performance** - Signals מספקים change detection יעיל
7. **Reactivity** - UI מתעדכן אוטומטית

---

### חסרונות וסיכונים:

1. **Learning Curve** - צריך להבין Signals
2. **Over-engineering** - לפעמים יש יותר services מדי
3. **Signal Complexity** - computed signals יכולים להיות מורכבים

---

### סיכום הארכיטקטורה:

הארכיטקטורה מבוססת על **4 שכבות עיקריות**:

1. **Pages** - נקודות כניסה
2. **Components** - UI
3. **Services** - לוגיקה עסקית
4. **Models** - מבני נתונים

כל שכבה מתקשרת עם השכבות האחרות דרך **interfaces ברורים**:

- Pages משתמשות ב-Components
- Components משתמשות ב-Services
- Services משתמשות ב-Models

**Signals** מספקים את המנגנון לתגובתיות - כל שינוי ב-state גורם לעדכון אוטומטי ב-UI.

---

## מבנה הפרויקט

```
test-hub-main/
├── src/
│   ├── app/
│   │   ├── components/          # קומפוננטות UI
│   │   ├── pages/               # דפי האפליקציה
│   │   ├── services/            # שירותים עסקיים
│   │   ├── models/              # מודלי נתונים
│   │   ├── data/                # נתונים סטטיים
│   │   ├── app.component.ts     # קומפוננטה ראשית
│   │   ├── app.config.ts        # תצורת אפליקציה
│   │   └── app.routes.ts        # הגדרות routing
│   ├── assets/                  # קבצים סטטיים
│   ├── index.html               # HTML ראשי
│   ├── main.ts                  # נקודת כניסה
│   └── styles.scss              # עיצוב גלובלי
├── angular.json                  # תצורת Angular CLI
├── package.json                 # תלויות
└── tsconfig.json                # תצורת TypeScript
```

---

## קבצי תצורה

### `package.json`

**תפקיד**: מגדיר את התלויות והסקריפטים של הפרויקט.

**תלויות עיקריות**:

- `@angular/core: ^19.2.0` - Angular Core Framework
- `@angular/router: ^19.2.0` - ניתוב בין דפים
- `@angular/forms: ^19.2.0` - ניהול טפסים
- `rxjs: ~7.8.0` - Reactive Extensions
- `zone.js: ~0.15.0` - Zone.js לשינוי זיהוי

**סקריפטים**:

- `ng serve` - הפעלת שרת פיתוח
- `ng build` - בניית הפרויקט
- `ng watch` - בנייה עם watch mode

---

### `angular.json`

**תפקיד**: תצורת Angular CLI - מגדיר איך לבנות ולשרת את הפרויקט.

**הגדרות חשובות**:

- `sourceRoot: "src"` - תיקיית המקור
- `outputPath: "dist/my-automation-ui"` - תיקיית הפלט
- `inlineStyleLanguage: "scss"` - שימוש ב-SCSS
- `assets: ["src/favicon.ico", "src/assets"]` - קבצים סטטיים

---

### `tsconfig.json` & `tsconfig.app.json`

**תפקיד**: תצורת TypeScript - מגדיר איך TypeScript מתרגם את הקוד.

**הגדרות**:

- `target: "ES2022"` - גרסת JavaScript יעד
- `module: "ES2022"` - שיטת מודולים
- `strict: true` - מצב strict mode

---

### `src/index.html`

**תפקיד**: קובץ HTML ראשי - נקודת הכניסה של האפליקציה.

**מבנה**:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>MyAutomationUi</title>
    <base href="/" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/x-icon" href="src/assets/logo.png" />
  </head>
  <body>
    <app-root></app-root>
    <!-- נקודת הכניסה של Angular -->
  </body>
</html>
```

---

### `src/main.ts`

**תפקיד**: נקודת הכניסה של האפליקציה - מאתחל את Angular.

**מה קורה כאן**:

1. מייבא את `AppComponent`
2. מאתחל את האפליקציה עם `bootstrapApplication`
3. מספק providers:
   - `provideRouter(appRoutes)` - ניתוב
   - `provideHttpClient()` - HTTP client

**קוד**:

```typescript
bootstrapApplication(AppComponent, {
  providers: [provideRouter(appRoutes), provideHttpClient()],
});
```

---

### `src/app/app.config.ts`

**תפקיד**: תצורת האפליקציה - מגדיר providers גלובליים.

**מה מוגדר**:

- `provideZoneChangeDetection` - Zone.js עם event coalescing (שיפור ביצועים)

---

### `src/app/app.routes.ts`

**תפקיד**: מגדיר את הנתיבים (routes) של האפליקציה.

**נתיבים**:

- `/homepage` → `HomepageComponent` - דף הבית
- `/dev-status` → `DevStatusComponent` - סטטוס פיתוח
- `/personal-report` → `PersonalReportComponent` - דוח אישי
- `/` → redirect ל-`/homepage`
- `**` → redirect ל-`/homepage` (כל נתיב אחר)

---

### `src/app/app.component.ts`

**תפקיד**: הקומפוננטה הראשית - wrapper לכל האפליקציה.

**מבנה**:

- מכילה את `NavbarComponent` (תפריט עליון)
- מכילה את `<router-outlet>` (נקודת הצגת דפים)
- מגדירה עיצוב גלובלי לדף

**Template**:

```html
<app-navbar></app-navbar>
<div class="page-container">
  <router-outlet></router-outlet>
</div>
```

---

## מודלים (Models)

### `src/app/models/component-data.model.ts`

**תפקיד**: מגדיר את מבני הנתונים של הקומפוננטות והטסטים.

**ממשקים**:

#### `Test`

מגדיר מבנה של טסט בודד:

```typescript
interface Test {
  testName: string; // שם הטסט
  testOwner: string; // בעלים של הטסט
  testTag: string; // תגית הטסט (לסינון)
  selected?: boolean; // האם נבחר
  link?: string; // קישור לטסט
  testGroup?: string[]; // קבוצות שהטסט שייך אליהן
}
```

#### `ComponentData`

מגדיר מבנה של קומפוננטה (preset או custom):

```typescript
interface ComponentData {
  componentName: string; // שם הקומפוננטה
  isPreset: boolean; // האם זה preset או custom
  group: string[]; // קבוצות שהקומפוננטה שייכת אליהן
  infoText?: string; // טקסט הסבר
  tests: Test[]; // רשימת הטסטים
  selected?: boolean; // האם נבחר
  isExpanded?: boolean; // האם מורחב (להצגת טסטים)
}
```

**שימוש**: כל השירותים והקומפוננטות משתמשים במודלים אלה לניהול הנתונים.

**הסבר על שדות חשובים**:

- **`testGroup`** - קבוצות שהטסט שייך אליהן. כאשר preset נבחר, כל הטסטים עם `testGroup` שמתאים ל-`group` של ה-preset נבחרים אוטומטית.
  - דוגמה: אם preset יש `group: ["auth"]` וטסט יש `testGroup: ["auth"]`, הטסט ייבחר אוטומטית.
- **`group`** - קבוצות שהקומפוננטה שייכת אליהן. כאשר preset נבחר, כל ה-custom components עם `group` שמתאים נבחרים אוטומטית.
- **`selected`** - מצב בחירה. יכול להיות `true` (נבחר), `false` (לא נבחר), או `undefined` (לא הוגדר).
- **`isExpanded`** - האם הקומפוננטה מורחב (מציגה את רשימת הטסטים). רק ל-custom components.

---

## שירותים (Services)

כל השירותים הם **singleton** (`providedIn: 'root'`) ומשתמשים ב-**Angular Signals** לניהול state.

**מה זה Signals?**

Signals הם מנגנון חדש ב-Angular 19 לניהול state. הם מספקים:

1. **Reactivity** - תגובתיות אוטומטית לשינויים
2. **Performance** - change detection יעיל יותר
3. **Type Safety** - type-safe עם TypeScript
4. **Simplicity** - פשוט יותר מ-RxJS Observables

**סוגי Signals**:

- **`signal<T>(value)`** - signal בסיסי שמחזיק ערך

  ```typescript
  const count = signal(0);
  count.set(5); // עדכון
  count.update((v) => v + 1); // עדכון על בסיס הערך הקודם
  const value = count(); // קריאה
  ```

- **`computed(() => ...)`** - signal מחושב שמתעדכן אוטומטית

  ```typescript
  const doubled = computed(() => count() * 2);
  // doubled מתעדכן אוטומטית כשהערך של count משתנה
  ```

- **`effect(() => ...)`** - side effect שמתבצע כשהערך משתנה
  ```typescript
  effect(() => {
    console.log("Count changed:", count());
  });
  ```

**למה משתמשים ב-Signals במקום RxJS?**

- פשוט יותר - אין צורך ב-subscribe/unsubscribe
- יעיל יותר - Angular יודע בדיוק מה צריך לעדכן
- Type-safe - TypeScript מספק type checking מלא
- אוטומטי - computed signals מתעדכנים אוטומטית

---

### `ComponentDataService`

**מיקום**: `src/app/services/component-data.service.ts`

**תפקיד**: השירות המרכזי לניהול נתוני הקומפוננטות והטסטים.

**Signals**:

- `allComponentsSignal` - signal פרטי שמחזיק את כל הנתונים
- `presets` - computed signal של כל ה-presets
- `customs` - computed signal של כל ה-custom components
- `allComponents` - computed signal של כל הקומפוננטות
- `hasSelectedTests` - computed signal לבדיקה אם יש טסטים נבחרים

**פונקציות עיקריות**:

1. **`loadComponentsToSignal()`**

   - טוען נתונים מהמקור (mockData)
   - מעדכן את ה-signal הראשי

2. **`togglePresetSelection(presetId: string)`**

   - מחליף מצב בחירה של preset
   - מפעיל `recalculateAllSelections()` - מחשב מחדש את כל הבחירות:
     - איפוס כל ה-customs וה-tests
     - הפעלת customs לפי group matching
     - הפעלת tests לפי testGroup matching
     - עדכון מצב customs לפי הטסטים שלהם

3. **`toggleCustomSelection(customId: string)`**

   - מחליף מצב בחירה של custom component
   - מעדכן את כל הטסטים של הקומפוננטה
   - מפעיל `updateAllPresetsState()` - מעדכן מצב presets

4. **`toggleTestSelection(customId: string, testIndex: number)`**

   - מחליף מצב בחירה של טסט בודד
   - מעדכן מצב הקומפוננטה (full/partial/none)
   - מעדכן מצב presets

5. **`toggleExpansion(componentId: string)`**

   - מחליף מצב הרחבה של קומפוננטה (להצגת טסטים)

6. **`getSelectedTestTags(): string[]`**

   - מחזיר מערך של כל תגיות הטסטים הנבחרים

7. **`getPartialSelectionState(componentName: string)`**

   - מחזיר computed signal לבדיקת partial selection

8. **`getAllTestsSelectedState(componentName: string)`**
   - מחזיר computed signal לבדיקת בחירה מלאה

**לוגיקת בחירה מורכבת**:

הלוגיקה מבוססת על **3 רמות בחירה** שמתקשרות זו לזו:

1. **Preset Selection** (בחירת preset):

   - כאשר preset נבחר, הוא מפעיל את `recalculateAllSelections()`
   - **שלב 1**: איפוס כל הבחירות הקיימות (customs ו-tests)
   - **שלב 2**: בחירת כל ה-custom components שיש להם `group` שמתאים ל-`group` של ה-preset
     - דוגמה: preset עם `group: ["auth", "ui"]` יבחר כל custom עם `group` שמכיל "auth" או "ui"
   - **שלב 3**: בחירת כל הטסטים שיש להם `testGroup` שמתאים ל-`group` של ה-preset
     - דוגמה: preset עם `group: ["auth"]` יבחר כל test עם `testGroup: ["auth"]`
   - **שלב 4**: עדכון מצב ה-custom components לפי הטסטים שלהם (full/partial/none)

2. **Custom Selection** (בחירת custom component):

   - כאשר custom נבחר, כל הטסטים שלו נבחרים אוטומטית
   - כאשר custom מבוטל, כל הטסטים שלו מבוטלים
   - לאחר מכן, `updateAllPresetsState()` מעדכן את מצב כל ה-presets:
     - preset נבחר רק אם כל ה-customs הקשורים אליו נבחרים
     - preset נבחר רק אם כל הטסטים הרלוונטיים לפי `testGroup` נבחרים

3. **Test Selection** (בחירת טסט בודד):
   - כאשר טסט נבחר/מבוטל, מצב ה-custom component מתעדכן:
     - **full selection**: כל הטסטים נבחרים → custom נבחר
     - **none selection**: אין טסטים נבחרים → custom לא נבחר
     - **partial selection**: חלק מהטסטים נבחרים → custom לא נבחר (אבל יש בחירה חלקית)
   - לאחר מכן, `updateAllPresetsState()` מעדכן את מצב ה-presets

**דוגמה מעשית**:

```
Preset "Login Preset" עם group: ["auth"]
  ↓ (נבחר)
Custom "Login Feature" עם group: ["auth"] → נבחר
  ↓
Test "Check Login Button" עם testTag: "auth" → נבחר
Test "Check Password Field" עם testTag: "auth" → נבחר
```

אם נבטל את Test "Check Login Button":

```
Custom "Login Feature" → partial selection (לא נבחר)
Preset "Login Preset" → לא נבחר (כי לא כל הטסטים נבחרים)
```

---

### `NotificationService`

**מיקום**: `src/app/services/notification.service.ts`

**תפקיד**: ניהול התראות על ריצות טסטים.

**Types**:

```typescript
type RunStatus = "running" | "done" | "failed" | "inactive";

interface RunNotification {
  id: string;
  atlasUrl: string;
  displayName: string;
  status: RunStatus;
  startTime: Date;
  endTime?: Date;
  duration?: string;
}
```

**Signals**:

- `_notifications` - רשימת כל ההתראות
- `_isOpen` - האם פאנל ההתראות פתוח
- `_hasNewNotifications` - האם יש התראות חדשות
- `notificationCount` - מספר ההתראות
- `runningCount` - מספר ריצות פעילות
- `activeNotifications` - התראות פעילות בלבד

**פונקציות עיקריות**:

1. **`addRunNotification(atlasUrl: string): string`**

   - מוסיף התראה חדשה עם סטטוס "running"
   - מחזיר ID של ההתראה

2. **`updateRunStatus(atlasUrl: string, status: string): boolean`**

   - מעדכן סטטוס של התראה קיימת
   - מחשב משך זמן
   - מחזיר true אם נמצאה, false אחרת

3. **`togglePanel()`** - פותח/סוגר פאנל התראות

4. **`clearAll()`** - מנקה את כל ההתראות

5. **`clearCompleted()`** - מנקה רק התראות שהושלמו

6. **`removeNotification(id: string)`** - מסיר התראה ספציפית

**פונקציות עזר**:

- `getDisplayName()` - ממיר URL לשם תצוגה
  - דוגמה: `"itay"` → `"Itay"`, `"https://example.com"` → `"Example"`
- `mapStatus()` - ממיר סטטוס מחרוזת ל-RunStatus
  - מטפל בגרסאות שונות: "done", "completed", "success" → "done"
  - "running", "in_progress", "pending" → "running"
  - "failed", "error", "cancelled" → "failed"
- `calculateDuration()` - מחשב משך זמן בפורמט "Xm Ys"
  - דוגמה: 125 שניות → `"2m 5s"`, 45 שניות → `"45s"`

**איך זה עובד עם TestRunnerService**:

1. `TestRunnerService.executeTests()` קורא ל-`addRunNotification()` → יוצר התראה עם status "running"
2. כאשר הריצה מסתיימת, `StatusEndpointService` (או API אמיתי) קורא ל-`updateRunStatus()`
3. `updateRunStatus()` מעדכן את הסטטוס ל-"done" או "failed" ומחשב את משך הזמן
4. `NotificationsComponent` מציג את העדכון אוטומטית (בגלל signals)

---

### `StatusEndpointService`

**מיקום**: `src/app/services/status-endpoint.service.ts`

**תפקיד**: שירות לניהול endpoint של עדכוני סטטוס (mock implementation).

**פונקציות**:

- `setupStatusEndpoint()` - מאתחל את ה-endpoint (mock)
- `handleStatusUpdate(update: RunStatusUpdate)` - מטפל בעדכון סטטוס
- `testStatusUpdate()` - פונקציה לבדיקה ידנית

**הערה**: זהו mock service. בייצור, זה צריך להתחבר ל-WebSocket או HTTP endpoint אמיתי.

**איך זה אמור לעבוד בייצור**:

1. **WebSocket Connection** - חיבור ל-WebSocket server שמאזין לעדכוני סטטוס
2. **HTTP Polling** - polling תקופתי ל-endpoint שמחזיר סטטוס
3. **Server-Sent Events (SSE)** - שימוש ב-SSE לקבלת עדכונים בזמן אמת

**דוגמה לייצור**:

```typescript
// בייצור, זה יכול להיות:
private setupStatusEndpoint(): void {
  // WebSocket
  const ws = new WebSocket('wss://api.example.com/running-status');
  ws.onmessage = (event) => {
    const update: RunStatusUpdate = JSON.parse(event.data);
    this.handleStatusUpdate(update);
  };

  // או HTTP polling
  setInterval(() => {
    this.http.get<RunStatusUpdate[]>('/api/running-status').subscribe(updates => {
      updates.forEach(update => this.handleStatusUpdate(update));
    });
  }, 5000); // כל 5 שניות
}
```

---

### `TestConfigurationManagerService`

**מיקום**: `src/app/services/test-configuration-manager.service.ts`

**תפקיד**: ניהול תצורת הרצת הטסטים.

**Signals**:

- `_searchTerm` - מונח חיפוש
- `_atlasUrl` - URL של סביבת Atlas
- `_automationBranch` - שם branch
- `configuration` - computed signal עם כל התצורה

**פונקציות**:

- `updateSearchTerm(value: string)` - מעדכן מונח חיפוש
- `updateAtlasUrl(value: string)` - מעדכן Atlas URL
- `updateAutomationBranch(value: string)` - מעדכן branch
- `getAtlasUrlOrDefault()` - מחזיר Atlas URL או "noderprod"
- `getAutomationBranchOrDefault()` - מחזיר branch או "main"
- `reset()` - מאפס את כל התצורה

---

### `TestExpansionManagerService`

**מיקום**: `src/app/services/test-expansion-manager.service.ts`

**תפקיד**: ניהול מצב הרחבה של קומפוננטות.

**Signals**:

- `_allExpanded` - האם כל הקומפוננטות מורחבות

**פונקציות**:

- `toggleExpandAll()` - מרחיב/מכווץ את כל הקומפוננטות
  - מחזיר `{ newState: boolean, affectedCount: number }`

---

### `TestFilteringManagerService`

**מיקום**: `src/app/services/test-filtering-manager.service.ts`

**תפקיד**: סינון קומפוננטות לפי מונח חיפוש.

**Computed Signals**:

- `filteredPresets` - presets מסוננים
- `filteredCustoms` - customs מסוננים

**פונקציות**:

- `matchesSearchTerm()` - בודק אם קומפוננטה תואמת למונח חיפוש
- `getFilteredPresetsCount()` - מספר presets מסוננים
- `getFilteredCustomsCount()` - מספר customs מסוננים
- `hasFilteredResults()` - האם יש תוצאות

---

### `TestRunnerService`

**מיקום**: `src/app/services/test-runner.service.ts`

**תפקיד**: הרצת טסטים וניהול ריצות.

**Interfaces**:

```typescript
interface TestRunRequest {
  automationUrl: string;
  testags: string; // תגיות טסטים מופרדות ב-|
  automationBranch: string;
  runId: string;
  podCount: number;
}

interface TestRunResult {
  success: boolean;
  runId: string;
  testCount: number;
  error?: string;
  data?: any;
  notificationId?: string;
}
```

**Signals**:

- `_lastRunId` - ID של הריצה האחרונה
- `_isRunning` - האם יש ריצה פעילה
- `_showRunId` - האם להציג את ה-Run ID

**פונקציות עיקריות**:

1. **`executeTests(request: TestRunRequest): Promise<TestRunResult>`**

   - שולח POST request ל-API
   - יוצר התראה ב-NotificationService
   - מחזיר תוצאה

2. **`generateRunId(length: number): string`**

   - יוצר ID אקראי לריצה

3. **`copyRunIdToClipboard(): Promise<boolean>`**

   - מעתיק Run ID ל-clipboard

4. **`updateRunStatus()`** - מעדכן סטטוס ידנית (לבדיקות)

5. **`simulateStatusUpdate()`** - מדמה עדכון סטטוס (לפיתוח)

**הערה**: ה-API_URL הוא `https://example.com/run` - צריך לעדכן לכתובת אמיתית.

**פורמט הבקשה**:

```json
{
  "automationUrl": "noderprod",
  "testags": "@auth|@profile|@settings",
  "automationBranch": "main",
  "runId": "abc123xyz",
  "podCount": 3
}
```

**פורמט התגובה הצפוי**:

```json
{
  "success": true,
  "runId": "abc123xyz",
  "message": "Tests started successfully"
}
```

**תהליך הרצה מלא**:

1. `executeTests()` נקרא עם `TestRunRequest`
2. יוצר התראה ב-`NotificationService` עם status "running"
3. שולח POST request ל-API
4. אם הצליח → התראה נשארת "running" (תתעדכן מאוחר יותר)
5. אם נכשל → התראה יכולה להתעדכן ל-"failed" (אם יש error handling)
6. `StatusEndpointService` (או API) מעדכן את הסטטוס מאוחר יותר

---

### `TestSelectionManagerService`

**מיקום**: `src/app/services/test-selection-manager.service.ts`

**תפקיד**: ניהול מצבי בחירה וסטטיסטיקות.

**Computed Signals**:

- `selectedPresetsCount` - מספר presets נבחרים
- `selectedCustomsCount` - מספר customs נבחרים
- `selectedTestsCount` - מספר טסטים נבחרים
- `hasSelectedTests` - האם יש טסטים נבחרים
- `selectedTestTags` - תגיות הטסטים הנבחרים

**פונקציות**:

- `clearAllPresets()` - מנקה בחירה של כל ה-presets
- `clearAllCustoms()` - מנקה בחירה של כל ה-customs
- `calculateRequiredPods()` - מחשב כמה pods נדרשים (מספר customs נבחרים)

---

### `ToastManagerService`

**מיקום**: `src/app/services/toast-manager.service.ts`

**תפקיד**: ניהול הודעות toast (הודעות זמניות).

**Types**:

```typescript
type ToastType = "success" | "error";

interface ToastMessage {
  message: string;
  type: ToastType;
  timestamp: number;
}
```

**Signals**:

- `_currentToast` - ההודעה הנוכחית (null אם אין)

**פונקציות**:

- `showSuccess(message: string, duration?: number)` - מציג הודעת הצלחה
- `showError(message: string, duration?: number)` - מציג הודעת שגיאה
- `hideToast()` - מסתיר את ההודעה
- `showSelectionCleared()` - הודעה על ניקוי בחירות
- `showExpansionToggled()` - הודעה על הרחבה/כיווץ
- `showRunStarted()` - הודעה על התחלת ריצה
- `showRunFailed()` - הודעה על כשלון ריצה
- `showRunIdCopied()` - הודעה על העתקת Run ID

**מנגנון**: כל הודעה מוצגת למשך זמן מוגדר (ברירת מחדל 3 שניות) ואז נעלמת אוטומטית.

**איך זה עובד**:

1. `showSuccess()` או `showError()` נקראים
2. `_currentToast` signal מתעדכן עם ההודעה החדשה
3. `ToastComponent` מקבל את העדכון ומציג את ההודעה
4. `setTimeout` מוגדר למשך הזמן (3 שניות)
5. לאחר הזמן, `hideToast()` נקרא וה-signal מתאפס ל-`null`
6. `ToastComponent` מסתיר את ההודעה

**דוגמה**:

```typescript
// ב-service
this.toastManager.showSuccess('Tests started!', 3000);

// ב-component
@Input() toast: ToastMessage | null = null;

// ב-template
@if (isVisible) {
  <div class="toast">{{ message }}</div>
}
```

---

### `UiStateManagerService`

**מיקום**: `src/app/services/ui-state-manager.service.ts`

**תפקיד**: ניהול מצב UI (כמו הרחבה/כיווץ של summary).

**Signals**:

- `_showSummaryDetails` - האם להציג פרטי summary

**פונקציות**:

- `toggleSummaryDetails()` - מחליף מצב הצגת פרטים
- `setSummaryDetailsVisibility(visible: boolean)` - מגדיר מצב ידנית
- `reset()` - מאפס למצב התחלתי

---

## קומפוננטות (Components)

כל הקומפוננטות הן **standalone** ומשתמשות ב-**Signals** לתגובתיות.

---

### `NavbarComponent`

**מיקום**: `src/app/components/navbar/`

**תפקיד**: תפריט ניווט עליון.

**מבנה**:

- Logo
- קישורי ניווט (Homepage, Dev Status, Personal Report)
- `NotificationsComponent` (כפתור התראות)

**Template**:

```html
<nav class="navbar">
  <div class="logo-container">
    <img src="assets/logo2.png" alt="Site Logo" />
  </div>
  <ul>
    <li routerLinkActive="active">
      <a routerLink="/homepage">Homepage</a>
    </li>
    <!-- ... -->
  </ul>
  <app-notifications></app-notifications>
</nav>
```

---

### `ComponentCardComponent`

**מיקום**: `src/app/components/component-card/`

**תפקיד**: כרטיס בודד של קומפוננטה (preset או custom).

**Inputs**:

- `data: ComponentData` - נתוני הקומפוננטה
- `isPreset: boolean` - האם זה preset

**Computed Signals**:

- `allTestsSelected` - האם כל הטסטים נבחרו
  - מחשב אוטומטית על בסיס `ComponentDataService.getAllTestsSelectedState()`
  - מתעדכן אוטומטית כשהנתונים משתנים
- `partialSelected` - האם יש בחירה חלקית
  - `true` אם יש טסטים נבחרים אבל לא כולם
  - משמש ל-indeterminate state של checkbox

**איך Signals עובדים כאן**:

```typescript
// בקומפוננטה
readonly allTestsSelected = computed(() => {
  return this.service.getAllTestsSelectedState(this.data.componentName)();
});

// ב-template
<input
  type="checkbox"
  [checked]="allTestsSelected()"
  [indeterminate]="partialSelected()"
/>
```

כאשר `ComponentDataService` מעדכן את ה-signal, `allTestsSelected` ו-`partialSelected` מתעדכנים אוטומטית, וה-checkbox מתעדכן ב-UI.

**פונקציות**:

- `toggleSelection()` - מחליף בחירה של הקומפוננטה
- `toggleTestSelection(testIndex, event)` - מחליף בחירה של טסט בודד
- `toggleExpand(event)` - מחליף מצב הרחבה

**Template**:

- כפתור הרחבה (חץ) - רק ל-customs עם טסטים
- Checkbox ראשי (עם indeterminate state)
- שם הקומפוננטה
- אינדיקטור בחירה חלקית
- כפתור info (tooltip)
- רשימת טסטים (כאשר מורחב)

---

### `ComponentListComponent`

**מיקום**: `src/app/components/component-list/`

**תפקיד**: הקומפוננטה הראשית של דף הבית - מנהלת את כל הקומפוננטות.

**מבנה**:

- `TestConfigurationComponent` - תצורת חיפוש ו-Atlas
- `TestSectionComponent` (x2) - אחד ל-presets, אחד ל-customs
- `TestSummaryComponent` - סיכום טסטים נבחרים
- `TestRunnerComponent` - כפתור הרצה
- `ToastComponent` - הודעות toast

**Injections**:

- כל ה-manager services (configuration, selection, expansion, runner, toast, filtering, ui-state)
- משתמש ב-`inject()` function במקום constructor injection

**Exposed Signals**:

- כל ה-signals מה-services (readonly)
- הקומפוננטה חושפת את ה-signals ישירות ל-template
- דוגמה: `readonly filteredPresets = this.filteringManager.filteredPresets;`

**איך זה עובד**:

```typescript
// בקומפוננטה
readonly filteredPresets = this.filteringManager.filteredPresets;
readonly hasSelectedTests = this.selectionManager.hasSelectedTests;

// ב-template
<app-test-section [items]="filteredPresets()"></app-test-section>
<button [disabled]="!hasSelectedTests()">Run Tests</button>
```

כאשר `filteredPresets` או `hasSelectedTests` משתנים, ה-template מתעדכן אוטומטית.

**Event Handlers**:

- `onSearchTermChange()` - עדכון חיפוש
- `onAtlasUrlChange()` - עדכון Atlas URL
- `onAutomationBranchChange()` - עדכון branch
- `onClearAllPresets()` - ניקוי presets
- `onClearAllCustoms()` - ניקוי customs
- `onExpandAll()` - הרחבה/כיווץ הכל
- `onToggleSummaryDetails()` - הצגה/הסתרה של פרטי summary
- `onRunTests()` - הרצת טסטים
- `onCopyRunId()` - העתקת Run ID

**לוגיקת הרצת טסטים**:

1. בודק אם יש טסטים נבחרים
2. יוצר Run ID
3. בונה מחרוזת תגיות (`@tag1|@tag2|...`)
4. מחשב מספר pods
5. יוצר `TestRunRequest`
6. קורא ל-`TestRunnerService.executeTests()`
7. מציג toast בהתאם לתוצאה

---

### `TestSectionComponent`

**מיקום**: `src/app/components/test-section/`

**תפקיד**: סקשן של קומפוננטות (presets או customs).

**Inputs**:

- `title: string` - כותרת הסקשן
- `icon: string` - אייקון
- `items: ComponentData[]` - רשימת קומפוננטות
- `selectedCount: number` - מספר נבחרים
- `sectionType: 'presets' | 'customs'` - סוג הסקשן
- `hasSelectedItems: boolean` - האם יש נבחרים
- `noResultsMessage: string` - הודעה כשאין תוצאות

**Outputs**:

- `clearAll` - event לניקוי הכל
- `expandAll` - event להרחבה הכל

**Template**:

- כותרת עם אייקון ומונה
- כפתורי פעולה (Clear All, Expand All)
- רשת של `ComponentCardComponent`
- הודעת "אין תוצאות" אם הרשימה ריקה

---

### `TestConfigurationComponent`

**מיקום**: `src/app/components/test-configuration/`

**תפקיד**: טופס תצורה - חיפוש, Atlas URL, Branch.

**Inputs**:

- `searchTerm: string`
- `atlasUrl: string`
- `automationBranch: string`

**Outputs**:

- `searchTermChange: EventEmitter<string>`
- `atlasUrlChange: EventEmitter<string>`
- `automationBranchChange: EventEmitter<string>`

**Template**:

- 3 שדות input עם labels
- כל input מעדכן את ה-service דרך event

**איך זה עובד**:

```html
<input
  [value]="searchTerm"
  (input)="onSearchTermChange($any($event.target).value)"
/>
```

```typescript
onSearchTermChange(value: string) {
  this.searchTermChange.emit(value);
  // ComponentListComponent מקבל את זה ועדכן את TestConfigurationManagerService
}
```

כאשר המשתמש מקליד, הערך מתעדכן ב-`TestConfigurationManagerService`, מה שגורם ל-`TestFilteringManagerService.filteredPresets` ו-`filteredCustoms` להתעדכן אוטומטית (computed signals).

---

### `TestRunnerComponent`

**מיקום**: `src/app/components/test-runner/`

**תפקיד**: כפתור הרצת טסטים ומידע על ריצה.

**Inputs**:

- `hasSelectedTests: boolean`
- `selectedTestsCount: number`
- `lastRunId: string | null`
- `showRunId: boolean`
- `isRunning: boolean`

**Outputs**:

- `runTests: EventEmitter<void>`
- `copyRunId: EventEmitter<void>`

**Template**:

- כפתור "Run Selected Tests" (disabled אם אין בחירות)
- מציג מספר טסטים נבחרים
- אנימציית pulse כאשר יש בחירות

**מצבי הכפתור**:

1. **Disabled** - `hasSelectedTests === false`
   - טקסט: "Select Tests to Run"
   - לא ניתן ללחוץ
2. **Enabled** - `hasSelectedTests === true`
   - טקסט: "Run Selected Tests (X)" (X = מספר טסטים)
   - אנימציית pulse
   - ניתן ללחוץ
3. **Running** - `isRunning === true`
   - כפתור disabled
   - מציג מצב "running"

---

### `TestSummaryComponent`

**מיקום**: `src/app/components/test-summary/`

**תפקיד**: סיכום טסטים נבחרים.

**Inputs**:

- `selectedTestsCount: number`
- `selectedTestTags: string[]`
- `showDetails: boolean`
- `isVisible: boolean`

**Outputs**:

- `toggleDetails: EventEmitter<void>`

**Template**:

- מופיע רק אם `isVisible === true`
- מציג מספר טסטים נבחרים
- כפתור "View/Hide Details"
- רשימת תגיות (כאשר details פתוח)

---

### `NotificationsComponent`

**מיקום**: `src/app/components/notifications/`

**תפקיד**: פאנל התראות על ריצות טסטים.

**Injections**:

- `NotificationService`

**Exposed Signals**:

- כל ה-signals מה-service

**פונקציות**:

- `togglePanel()` - פותח/סוגר פאנל
- `clearAll()` - מנקה הכל
- `clearCompleted()` - מנקה הושלמו
- `removeNotification(id)` - מסיר התראה
- `getStatusIcon(status)` - מחזיר אייקון לפי סטטוס
- `getStatusText(status)` - מחזיר טקסט לפי סטטוס
- `getStatusClass(status)` - מחזיר class לפי סטטוס
- `formatTime(date)` - מעצב זמן

**Template**:

- כפתור התראות עם badge (מספר)
- פאנל עם:
  - כותרת וסטטיסטיקות
  - כפתורי פעולה
  - רשימת התראות
  - מצב ריק (empty state)

**HostListener**:

- `@HostListener('document:click')` - סוגר פאנל בלחיצה מחוץ לו
- בודק אם הלחיצה הייתה מחוץ ל-panel ול-button
- אם כן, קורא ל-`closePanel()`

**איך זה עובד**:

```typescript
@HostListener('document:click', ['$event'])
onDocumentClick(event: Event): void {
  const target = event.target as HTMLElement;
  const notificationPanel = document.querySelector('.notification-panel');
  const notificationButton = document.querySelector('.notification-button');

  if (this.isOpen() &&
      !notificationPanel?.contains(target) &&
      !notificationButton?.contains(target)) {
    this.closePanel();
  }
}
```

זה מבטיח שהפאנל נסגר רק כשלוחצים מחוץ לו, ולא כשלוחצים על הכפתור או בתוך הפאנל.

---

### `ToastComponent`

**מיקום**: `src/app/components/toast/`

**תפקיד**: הצגת הודעות toast זמניות.

**Inputs**:

- `toast: ToastMessage | null`

**Computed Properties**:

- `isVisible` - האם להציג
- `message` - טקסט ההודעה
- `type` - סוג ההודעה
- `toastIcon` - אייקון (✅ או ❌)

**Template**:

- מופיע רק אם `isVisible === true`
- מציג אייקון וטקסט
- class לפי סוג (success/error)

---

### `RunButtonComponent`

**מיקום**: `src/app/components/run-button-component/`

**תפקיד**: כפתור הרצה פשוט (לא בשימוש נראה, יש `TestRunnerComponent` במקום).

**הערה**: קומפוננטה זו נראית כמו שארית - `TestRunnerComponent` משמש במקומה.

---

## דפים (Pages)

---

### `HomepageComponent`

**מיקום**: `src/app/pages/homepage/`

**תפקיד**: דף הבית - מציג את `ComponentListComponent`.

**מבנה**:

```typescript
@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [ComponentListComponent],
  template: `
    <div class="homepage-container">
      <app-component-list></app-component-list>
    </div>
  `
})
```

**זהו הדף הראשי** שבו המשתמש:

- מחפש קומפוננטות (בשדה חיפוש)
- בוחר presets/customs/טסטים (לחיצה על checkboxes)
- מגדיר תצורה (Atlas URL, Branch)
- מריץ טסטים (לחיצה על "Run Selected Tests")
- רואה סיכום (מספר טסטים נבחרים ותגיות)

**זרימת עבודה טיפוסית**:

1. המשתמש נכנס לדף → `ComponentListComponent` נטען
2. `ComponentDataService` טוען את הנתונים → presets ו-customs מוצגים
3. המשתמש מחפש → `TestFilteringManagerService` מסנן את התוצאות
4. המשתמש בוחר preset → `ComponentDataService` בוחר את ה-customs וה-tests הרלוונטיים
5. המשתמש מגדיר Atlas URL ו-Branch → `TestConfigurationManagerService` שומר את הערכים
6. המשתמש לוחץ "Run" → `TestRunnerService` מריץ את הטסטים
7. `NotificationService` עוקב אחר הסטטוס → `NotificationsComponent` מציג עדכונים

---

### `DevStatusComponent`

**מיקום**: `src/app/pages/dev-status/`

**תפקיד**: הצגת דוחות HTML (Report/Lighthouse).

**מבנה**:

- `selected: 'report' | 'lighthouse'` - מצב נוכחי
- `htmlFileUrl: SafeResourceUrl | null` - URL של קובץ HTML
- `fileExists: boolean` - האם הקובץ קיים

**פונקציות**:

- `loadFile(filePath: string)` - טוען קובץ HTML
  - בודק קיום עם HTTP HEAD request (לא טוען את כל הקובץ, רק בודק אם קיים)
  - ממיר ל-SafeResourceUrl (לבטחון - Angular דורש זאת ל-iframe)
  - אם הקובץ לא קיים, מציג הודעת שגיאה
- `toggleView()` - מחליף בין Report/Lighthouse
  - משנה את `selected` בין 'report' ל-'lighthouse'
  - טוען את הקובץ המתאים (`sample-report.html` או `sample-lighthouse.html`)

**איך SafeResourceUrl עובד**:

Angular דורש שימוש ב-`DomSanitizer.bypassSecurityTrustResourceUrl()` כדי להציג URL ב-iframe. זה מונע XSS attacks אבל דורש אמון בקובץ.

**Template**:

- Toggle switch (Report/Lighthouse)
- iframe להצגת HTML
- הודעת שגיאה אם הקובץ לא קיים

**קבצים**:

- `assets/sample-report.html`
- `assets/sample-lighthouse.html`

---

### `PersonalReportComponent`

**מיקום**: `src/app/pages/personal-report/`

**תפקיד**: חיפוש והצגת דוחות אישיים לפי URL.

**מבנה**:

- `userInput: string` - קלט משתמש
- `htmlFileUrl: SafeResourceUrl | null` - URL של דוח
- `errorMessage: string | null` - הודעת שגיאה
- `selected: 'report' | 'lighthouse'` - מצב נוכחי
- `basePath: string` - נתיב בסיס

**פונקציות**:

- `searchReport()` - מחפש דוח
  - אם אין http/https, מוסיף `http://jsonplaceholder.typicode.com/` (זה דוגמה - צריך לשנות לכתובת אמיתית)
  - בודק קיום עם fetch (GET request)
  - אם הצליח, ממיר ל-SafeResourceUrl ומציג ב-iframe
  - אם נכשל, מציג הודעת שגיאה
  - **הערה**: זהו mock implementation - בייצור צריך להתחבר ל-API אמיתי
- `toggleView()` - מחליף בין Report/Lighthouse
- `showError(message)` - מציג שגיאה
- `clearError()` - מסתיר שגיאה

**Template**:

- שדה חיפוש וכפתור "Search Report"
- הודעת שגיאה
- Toggle switch (אם יש דוח)
- iframe להצגת דוח

---

## זרימת נתונים

### זרימת בחירת טסטים:

```
1. משתמש בוחר Preset
   ↓
2. ComponentCardComponent.toggleSelection()
   ↓
3. ComponentDataService.togglePresetSelection()
   ↓
4. recalculateAllSelections()
   - איפוס כל הבחירות
   - בחירת customs לפי group matching
   - בחירת tests לפי testGroup matching
   ↓
5. Signals מתעדכנים אוטומטית
   ↓
6. ComponentListComponent מקבל עדכונים
   ↓
7. UI מתעדכן (checkboxes, counters)
```

### זרימת הרצת טסטים:

```
1. משתמש לוחץ "Run Selected Tests"
   ↓
2. ComponentListComponent.onRunTests()
   ↓
3. TestRunnerService.executeTests()
   - יוצר Run ID
   - בונה testags string
   - שולח POST request
   ↓
4. NotificationService.addRunNotification()
   - יוצר התראה עם status "running"
   ↓
5. TestRunnerService מחזיר תוצאה
   ↓
6. ToastManagerService מציג הודעה
   ↓
7. StatusEndpointService (mock) מעדכן סטטוס
   ↓
8. NotificationService.updateRunStatus()
   - מעדכן סטטוס ל-"done"/"failed"
   ↓
9. NotificationsComponent מציג עדכון
```

### זרימת סינון:

```
1. משתמש מקליד בשדה חיפוש
   ↓
2. TestConfigurationComponent.onSearchTermChange()
   - מעדכן את הערך ב-input
   ↓
3. Event נשלח ל-ComponentListComponent
   ↓
4. ComponentListComponent.onSearchTermChange()
   - קורא ל-TestConfigurationManagerService.updateSearchTerm()
   ↓
5. TestConfigurationManagerService._searchTerm.set(newValue)
   - signal מתעדכן
   ↓
6. TestFilteringManagerService.filteredPresets/filteredCustoms
   - computed signals מתעדכנים אוטומטית
   - מחשבים מחדש את הרשימה המסוננת
   ↓
7. ComponentListComponent מקבל רשימות מסוננות
   - filteredPresets() ו-filteredCustoms() מחזירים ערכים חדשים
   ↓
8. TestSectionComponent מציג רק תוצאות מסוננות
   - UI מתעדכן אוטומטית
```

**דוגמה קונקרטית**:

משתמש מקליד "Login":

- `searchTerm` משתנה ל-"Login"
- `filteredPresets` מחזיר רק presets עם "Login" בשם
- `filteredCustoms` מחזיר רק customs עם "Login" בשם
- ה-UI מציג רק את התוצאות הרלוונטיות

---

## אינטגרציות

### נתונים סטטיים

**`src/assets/data/components.ts`**

- מכיל את `mockData` - מערך של `ComponentData[]`
- 15 presets + ~20 custom components
- כל preset/custom מכיל:
  - שם, groups, infoText
  - רשימת tests (עם owners, tags, testGroups)

**`src/app/data/data.json`**

- קובץ JSON עם דוגמה קטנה (4 קומפוננטות)
- לא בשימוש נראה (הקוד משתמש ב-`components.ts`)
- יכול לשמש לבדיקות או כגיבוי

**איך הנתונים נטענים**:

1. `ComponentDataService` נבנה (constructor)
2. `loadComponentsToSignal()` נקרא אוטומטית
3. `getComponents()` מחזיר `Observable<ComponentData[]>` עם `mockData`
4. הנתונים נטענים ל-`allComponentsSignal`
5. `presets` ו-`customs` (computed signals) מתעדכנים אוטומטית
6. כל הקומפוננטות שמשתמשות ב-signals האלה מקבלות את הנתונים

**שינוי מקור נתונים**:

כדי לשנות את מקור הנתונים (למשל, מ-API), צריך לשנות את `getComponents()`:

```typescript
// במקום mockData
getComponents(): Observable<ComponentData[]> {
  return this.http.get<ComponentData[]>('/api/components');
}
```

---

### קבצים סטטיים

**`src/assets/`**:

- `logo.png`, `logo2.png` - לוגואים
- `icons/expand-arrow.svg` - אייקון הרחבה
- `icons/copy-text.svg` - אייקון העתקה
- `sample-report.html` - דוגמת דוח
- `itay-report.html` - דוח אישי (אם קיים)

---

### עיצוב

**`src/styles.scss`**

- עיצוב גלובלי
- משתני SCSS:
  - `$color-bg: #242428` - רקע כהה
  - `$color-text: #55c4b2` - טקסט
  - `$color-primary: #55c4b2` - צבע ראשי
  - `$color-secondary: #327776` - צבע משני
- Mixins:
  - `@mixin card-style` - סגנון לכרטיסים
- Classes:
  - `.button` - כפתורים
  - `.search-input` - שדות חיפוש

**קומפוננטות עם SCSS נפרד**:

- כל קומפוננטה יכולה להכיל `*.component.scss` משלה
- העיצוב הם scoped לקומפוננטה (Angular עושה זאת אוטומטית)
- משתני SCSS מ-`styles.scss` זמינים בכל הקומפוננטות

**היררכיית עיצוב**:

1. `styles.scss` - עיצוב גלובלי (משתנים, mixins, classes גלובלי)
2. `*.component.scss` - עיצוב ספציפיים לקומפוננטה
3. Angular משלב את הכל ב-build time

**דוגמה**:

```scss
// styles.scss
$color-primary: #55c4b2;

// component-card.component.scss
.component-card {
  background: $color-primary; // משתמש במשתנה הגלובלי
  border: 1px solid $color-border;
}
```
### תהליך עבודה טיפוסי:

1. **טעינת נתונים**: `ComponentDataService` טוען מ-`mockData`
2. **סינון**: `TestFilteringManagerService` מסנן לפי חיפוש
3. **בחירה**: משתמש בוחר presets/customs/טסטים
4. **חישוב**: `ComponentDataService` מחשב מצבי בחירה
5. **תצורה**: משתמש מגדיר Atlas URL ו-Branch
6. **הרצה**: `TestRunnerService` מריץ טסטים
7. **מעקב**: `NotificationService` עוקב אחר סטטוס
8. **התראות**: `NotificationsComponent` מציג עדכונים

