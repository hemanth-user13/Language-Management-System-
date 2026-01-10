export type TranslationValue = {
  [languageCode: string]: string;
};

export type TranslationNode = {
  [key: string]: TranslationNode | TranslationValue;
};

export interface TranslationData {
  project: string;
  languages: string[];
  translations: TranslationNode;
}

export interface FlattenedTranslation {
  keyPath: string;
  values: TranslationValue;
  depth: number;
  parentPath: string;
}

export interface TreeNode {
  key: string;
  path: string;
  depth: number;
  isLeaf: boolean;
  children?: TreeNode[];
  values?: TranslationValue;
  completeness?: number;
}

export interface UnsavedChange {
  keyPath: string;
  language: string;
  originalValue: string;
  newValue: string;
}
