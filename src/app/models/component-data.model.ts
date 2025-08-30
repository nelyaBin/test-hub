export interface Test {
  testName: string;
  testOwner: string;
  testTag: string;
  selected?: boolean;
  link?: string;
}

export interface ComponentData {
  componentName: string;
  isPreset: boolean;
  group: string[];
  infoText?: string;
  tests: Test[];
  selected?: boolean;
  isExpanded?: boolean; // מצב פתיחה/סגירה של הכרטיס
}
