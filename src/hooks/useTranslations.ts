import { TranslationData, TranslationNode, TreeNode, UnsavedChange } from '@/types/translation';
import { useState, useCallback, useEffect } from 'react';

// Mock API - replace with actual API calls
const mockData: TranslationData = {
  project: "Languge Management System",
  languages: ["en", "de"],
  translations: {
    auth: {
      login: {
        title: {
          en: "Login",
          de: "Anmelden"
        },
        subtitle: {
          en: "Welcome back",
          de: "Willkommen zurück"
        },
        button: {
          en: "Sign In",
          de: "Einloggen"
        },
        forgot_password: {
          en: "Forgot password?",
          de: "" // Missing translation example
        }
      },
      register: {
        title: {
          en: "Create Account",
          de: "Konto erstellen"
        },
        subtitle: {
          en: "Join us today",
          de: "Heute beitreten"
        }
      }
    },
    dashboard: {
      welcome: {
        en: "Hello User",
        de: "Hallo Benutzer"
      },
      stats: {
        title: {
          en: "Statistics",
          de: "Statistiken"
        },
        description: {
          en: "Your performance overview",
          de: "" // Missing translation
        }
      }
    },
    common: {
      buttons: {
        save: {
          en: "Save",
          de: "Speichern"
        },
        cancel: {
          en: "Cancel",
          de: "Abbrechen"
        },
        delete: {
          en: "Delete",
          de: "Löschen"
        }
      },
      errors: {
        not_found: {
          en: "Not found",
          de: "Nicht gefunden"
        },
        server_error: {
          en: "Server error",
          de: "" // Missing translation
        }
      }
    }
  }
};

export const useTranslations = () => {
  const [data, setData] = useState<TranslationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState<UnsavedChange[]>([]);
  const [originalData, setOriginalData] = useState<TranslationData | null>(null);

  const fetchTranslations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call - replace with actual fetch
      await new Promise(resolve => setTimeout(resolve, 500));
      setData(mockData);
      setOriginalData(JSON.parse(JSON.stringify(mockData)));
    } catch (err) {
      setError('Failed to fetch translations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTranslations();
  }, [fetchTranslations]);

  const updateTranslation = useCallback((keyPath: string, language: string, value: string) => {
    if (!data || !originalData) return;

    const keys = keyPath.split('.');
    const newData = JSON.parse(JSON.stringify(data)) as TranslationData;
    
    let current: any = newData.translations;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    const lastKey = keys[keys.length - 1];
    if (current[lastKey]) {
      current[lastKey][language] = value;
    }

    // Track unsaved changes
    let originalCurrent: any = originalData.translations;
    for (let i = 0; i < keys.length - 1; i++) {
      originalCurrent = originalCurrent[keys[i]];
    }
    const originalValue = originalCurrent[lastKey]?.[language] || '';

    setUnsavedChanges(prev => {
      const existing = prev.findIndex(c => c.keyPath === keyPath && c.language === language);
      
      if (value === originalValue) {
        // Remove change if reverted to original
        return prev.filter((_, i) => i !== existing);
      }
      
      const change: UnsavedChange = {
        keyPath,
        language,
        originalValue,
        newValue: value
      };

      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = change;
        return updated;
      }
      
      return [...prev, change];
    });

    setData(newData);
  }, [data, originalData]);

  const renameKey = useCallback((oldPath: string, newKeyName: string) => {
    if (!data) return;

    const keys = oldPath.split('.');
    const newData = JSON.parse(JSON.stringify(data)) as TranslationData;
    
    // Navigate to parent
    let parent: any = newData.translations;
    for (let i = 0; i < keys.length - 1; i++) {
      parent = parent[keys[i]];
    }
    
    const oldKey = keys[keys.length - 1];
    
    // Rename the key
    if (parent[oldKey] !== undefined) {
      parent[newKeyName] = parent[oldKey];
      delete parent[oldKey];
    }

    setData(newData);
    
    // Track as unsaved change
    setUnsavedChanges(prev => [
      ...prev,
      {
        keyPath: oldPath,
        language: '__key_rename__',
        originalValue: oldKey,
        newValue: newKeyName
      }
    ]);
  }, [data]);

  const addLanguage = useCallback((languageCode: string) => {
    if (!data) return;
    if (data.languages.includes(languageCode)) return;

    const addLanguageToNode = (node: TranslationNode): TranslationNode => {
      const result: TranslationNode = {};
      
      for (const [key, value] of Object.entries(node)) {
        if (typeof value === 'object' && value !== null) {
          // Check if it's a leaf node (has language codes as keys)
          const keys = Object.keys(value);
          const isLeaf = keys.some(k => data.languages.includes(k));
          
          if (isLeaf) {
            result[key] = { ...(value as Record<string, string>), [languageCode]: '' };
          } else {
            result[key] = addLanguageToNode(value as TranslationNode);
          }
        }
      }
      
      return result;
    };

    setData({
      ...data,
      languages: [...data.languages, languageCode],
      translations: addLanguageToNode(data.translations)
    });
  }, [data]);

  const removeLanguage = useCallback((languageCode: string) => {
    if (!data) return;
    if (data.languages.length <= 1) return;

    const removeLanguageFromNode = (node: TranslationNode): TranslationNode => {
      const result: TranslationNode = {};
      
      for (const [key, value] of Object.entries(node)) {
        if (typeof value === 'object' && value !== null) {
          const keys = Object.keys(value);
          const isLeaf = keys.some(k => data.languages.includes(k));
          
          if (isLeaf) {
            const { [languageCode]: _, ...rest } = value as Record<string, string>;
            result[key] = rest;
          } else {
            result[key] = removeLanguageFromNode(value as TranslationNode);
          }
        }
      }
      
      return result;
    };

    setData({
      ...data,
      languages: data.languages.filter(l => l !== languageCode),
      translations: removeLanguageFromNode(data.translations)
    });
  }, [data]);

  const saveChanges = useCallback(async () => {
    if (!data) return;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setOriginalData(JSON.parse(JSON.stringify(data)));
      setUnsavedChanges([]);
      return true;
    } catch {
      return false;
    }
  }, [data]);

  const discardChanges = useCallback(() => {
    if (originalData) {
      setData(JSON.parse(JSON.stringify(originalData)));
      setUnsavedChanges([]);
    }
  }, [originalData]);

  const buildTree = useCallback((node: TranslationNode, path: string = '', depth: number = 0): TreeNode[] => {
    if (!data) return [];
    
    return Object.entries(node).map(([key, value]) => {
      const currentPath = path ? `${path}.${key}` : key;
      const isLeaf = Object.keys(value).some(k => data.languages.includes(k));
      
      if (isLeaf) {
        const values = value as Record<string, string>;
        const filledCount = data.languages.filter(lang => values[lang]?.trim()).length;
        const completeness = (filledCount / data.languages.length) * 100;
        
        return {
          key,
          path: currentPath,
          depth,
          isLeaf: true,
          values: values,
          completeness
        };
      }
      
      const children = buildTree(value as TranslationNode, currentPath, depth + 1);
      const totalCompleteness = children.reduce((sum, child) => {
        if (child.isLeaf) return sum + (child.completeness || 0);
        return sum + (child.completeness || 0);
      }, 0);
      const avgCompleteness = children.length > 0 ? totalCompleteness / children.length : 100;
      
      return {
        key,
        path: currentPath,
        depth,
        isLeaf: false,
        children,
        completeness: avgCompleteness
      };
    });
  }, [data]);

  const exportToJson = useCallback((language?: string): Record<string, unknown> | null => {
    if (!data) return null;

    const extractLanguage = (node: TranslationNode, lang: string): Record<string, unknown> => {
      const result: Record<string, unknown> = {};
      
      for (const [key, value] of Object.entries(node)) {
        if (typeof value === 'object' && value !== null) {
          const keys = Object.keys(value);
          const isLeaf = keys.some(k => data.languages.includes(k));
          
          if (isLeaf) {
            result[key] = (value as Record<string, string>)[lang] || '';
          } else {
            result[key] = extractLanguage(value as TranslationNode, lang);
          }
        }
      }
      
      return result;
    };

    if (language) {
      return extractLanguage(data.translations, language);
    }
    
    return data.translations as Record<string, unknown>;
  }, [data]);

  return {
    data,
    loading,
    error,
    unsavedChanges,
    hasUnsavedChanges: unsavedChanges.length > 0,
    updateTranslation,
    renameKey,
    addLanguage,
    removeLanguage,
    saveChanges,
    discardChanges,
    buildTree,
    exportToJson,
    refetch: fetchTranslations
  };
};
