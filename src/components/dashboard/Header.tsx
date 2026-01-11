import {
  Moon,
  Sun,
  Download,
  Plus,
  Save,
  RotateCcw,
  Languages,
  Trash,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { deleteLanguageData } from "@/services/translationservices";
import { toast } from "sonner";

interface HeaderProps {
  projectName: string;
  languages: string[];
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onAddLanguage: (code: string) => void;
  onRemoveLanguage: (code: string) => void;
  onExport: (language?: string) => void;
  hasUnsavedChanges: boolean;
  unsavedCount: number;
  onSave: () => void;
  onDiscard: () => void;
}

export const Header = ({
  projectName,
  languages,
  theme,
  onToggleTheme,
  onAddLanguage,
  onRemoveLanguage,
  onExport,
  hasUnsavedChanges,
  unsavedCount,
  onSave,
  onDiscard,
}: HeaderProps) => {
  const [newLanguage, setNewLanguage] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isloading, setIsloading] = useState<boolean>(false);

  const handleAddLanguage = () => {
    if (newLanguage.trim()) {
      onAddLanguage(newLanguage.trim().toLowerCase());
      setNewLanguage("");
      setIsAddDialogOpen(false);
    }
  };

  const handleTranslationdata = async () => {
    setIsloading(true);
    try {
      await deleteLanguageData();
      toast.success("Translations key are deleted successfully");
    } catch (error) {
      toast.error("There is an issue in deleting the data");
    } finally {
      setIsloading(false);
    }
  };

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Languages className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg font-semibold text-foreground">
              {projectName}
            </h1>
            <p className="text-xs text-muted-foreground">Translation Manager</p>
          </div>
        </div>

        {hasUnsavedChanges && (
          <Badge
            variant="outline"
            className="bg-warning/10 text-warning border-warning/30 animate-pulse-warning"
          >
            {unsavedCount} unsaved change{unsavedCount !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Language Management */}
        <Button
          variant="destructive"
          size="sm"
          className="gap-2"
          onClick={handleTranslationdata}
        >
          <Trash2 className="w-4 h-4" />
          {isloading ? "loading....." : "Delete Translations"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Languages className="w-4 h-4" />
              {languages.length} Languages
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-popover">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Active Languages
            </div>
            {languages.map((lang) => (
              <DropdownMenuItem key={lang} className="flex justify-between">
                <span className="uppercase font-mono text-sm">{lang}</span>
                {languages.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveLanguage(lang);
                    }}
                    className="text-destructive hover:text-destructive/80 text-xs"
                  >
                    Remove
                  </button>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Language
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent className="bg-card">
                <DialogHeader>
                  <DialogTitle>Add New Language</DialogTitle>
                  <DialogDescription>
                    Enter the language code (e.g., fr, es, it)
                  </DialogDescription>
                </DialogHeader>
                <Input
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  placeholder="Language code"
                  className="font-mono uppercase"
                  maxLength={5}
                />
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddLanguage}>Add Language</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
            <DropdownMenuItem onClick={() => onExport()}>
              Export All (Multi-language)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {languages.map((lang) => (
              <DropdownMenuItem key={lang} onClick={() => onExport(lang)}>
                Export {lang.toUpperCase()} only
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Save/Discard */}
        {hasUnsavedChanges && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDiscard}
              className="gap-2 text-muted-foreground"
            >
              <RotateCcw className="w-4 h-4" />
              Discard
            </Button>
            <Button size="sm" onClick={onSave} className="gap-2">
              <Save className="w-4 h-4" />
              Save
            </Button>
          </>
        )}

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={onToggleTheme}>
          {theme === "light" ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4" />
          )}
        </Button>
      </div>
    </header>
  );
};
