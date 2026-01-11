import { useState, useCallback, useEffect } from 'react';
import { Header } from './Header';
import { TreeView } from './TreeView';
import { TranslationEditor } from './TranslationEditor';
import { useTranslations } from '@/hooks/useTranslations';
import { useTheme } from '@/hooks/useTheme';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const Dashboard = () => {
  const {
    data,
    loading,
    error,
    unsavedChanges,
    hasUnsavedChanges,
    updateTranslation,
    addLanguage,
    removeLanguage,
    saveChanges,
    discardChanges,
    buildTree,
    exportToJson,
    renameKey
  } = useTranslations();

  const { theme, toggleTheme } = useTheme();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [missingFilter, setMissingFilter] = useState<string[]>([]);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleExport = useCallback((language?: string) => {
    const json = exportToJson(language);
    if (!json) return;

    const fileName = language 
      ? `translations-${language}.json`
      : 'translations-all.json';
    
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${fileName}`);
  }, [exportToJson]);

  const handleSave = useCallback(async () => {
    const success = await saveChanges();
    if (success) {
      toast.success('Changes saved successfully');
    } else {
      toast.error('Failed to save changes');
    }
  }, [saveChanges]);

  const handleDiscard = useCallback(() => {
    setShowDiscardDialog(true);
  }, []);

  const confirmDiscard = useCallback(() => {
    discardChanges();
    setShowDiscardDialog(false);
    toast.info('Changes discarded');
  }, [discardChanges]);

  const handleAddLanguage = useCallback((code: string) => {
    addLanguage(code);
    toast.success(`Added language: ${code.toUpperCase()}`);
  }, [addLanguage]);

  const handleRemoveLanguage = useCallback((code: string) => {
    removeLanguage(code);
    toast.success(`Removed language: ${code.toUpperCase()}`);
  }, [removeLanguage]);

  const handleRenameKey = useCallback((oldPath: string, newKey: string) => {
    renameKey(oldPath, newKey);
  }, [renameKey]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading translations...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive text-xl font-medium">Failed to load translations</p>
          <p className="text-muted-foreground mt-2 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  const tree = buildTree(data.translations);

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header
        projectName={data.project}
        languages={data.languages}
        theme={theme}
        onToggleTheme={toggleTheme}
        onAddLanguage={handleAddLanguage}
        onRemoveLanguage={handleRemoveLanguage}
        onExport={handleExport}
        hasUnsavedChanges={hasUnsavedChanges}
        unsavedCount={unsavedChanges.length}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <TreeView
          tree={tree}
          languages={data.languages}
          selectedPath={selectedPath}
          onSelectPath={setSelectedPath}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          missingFilter={missingFilter}
          onMissingFilterChange={setMissingFilter}
        />
        
        <main className="flex-1 flex flex-col overflow-hidden bg-card">
          <TranslationEditor
            tree={tree}
            languages={data.languages}
            selectedPath={selectedPath}
            searchQuery={searchQuery}
            missingFilter={missingFilter}
            unsavedChanges={unsavedChanges}
            onUpdateTranslation={updateTranslation}
            onRenameKey={handleRenameKey}
          />
        </main>
      </div>

      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              You have {unsavedChanges.length} unsaved change{unsavedChanges.length !== 1 ? 's' : ''}. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscard} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};