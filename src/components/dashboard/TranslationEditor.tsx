import { useState, useMemo, useCallback, Fragment } from "react";
import {
  Copy,
  Check,
  AlertTriangle,
  ChevronRight,
  Eye,
  Pencil,
  X,
  Save,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TreeNode, UnsavedChange } from "@/types/translation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface TranslationEditorProps {
  tree: TreeNode[];
  languages: string[];
  selectedPath: string | null;
  searchQuery: string;
  unsavedChanges: UnsavedChange[];
  onUpdateTranslation: (
    keyPath: string,
    language: string,
    value: string
  ) => void;
  onRenameKey?: (oldPath: string, newKey: string) => void;
}

interface TranslationRowProps {
  node: TreeNode;
  languages: string[];
  unsavedChanges: UnsavedChange[];
  onUpdateTranslation: (
    keyPath: string,
    language: string,
    value: string
  ) => void;
  isHighlighted: boolean;
  onPreview: (node: TreeNode) => void;
  onEditKey: (node: TreeNode) => void;
}

const TranslationRow = ({
  node,
  languages,
  unsavedChanges,
  onUpdateTranslation,
  isHighlighted,
  onPreview,
  onEditKey,
}: TranslationRowProps) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const hasChanges = (lang: string) =>
    unsavedChanges.some((c) => c.keyPath === node.path && c.language === lang);

  const getMissingLanguages = () =>
    languages.filter((lang) => !node.values?.[lang]?.trim());

  const missingLangs = getMissingLanguages();
  const hasMissing = missingLangs.length > 0;

  return (
    <tr
      className={cn(
        "border-b border-table-border transition-colors",
        "hover:bg-table-row-hover",
        isHighlighted && "bg-primary/5",
        hasMissing && "bg-warning/5"
      )}
    >
      <td className="px-4 py-4 w-80">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <code className="font-mono text-sm text-foreground bg-muted px-3 py-1.5 rounded-md block truncate">
              {node.path}
            </code>
            {hasMissing && (
              <div className="flex items-center gap-1 text-warning mt-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs font-medium">
                  Missing: {missingLangs.map((l) => l.toUpperCase()).join(", ")}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPreview(node)}
              title="Preview key"
            >
              <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEditKey(node)}
              title="Edit key name"
            >
              <Pencil className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => copyToClipboard(node.path, "path")}
              title="Copy key path"
            >
              {copiedKey === "path" ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              )}
            </Button>
          </div>
        </div>
      </td>

      {languages.map((lang) => {
        const value = node.values?.[lang] || "";
        const isMissing = !value.trim();
        const isChanged = hasChanges(lang);

        return (
          <td
            key={lang}
            className={cn("px-3 py-3", isMissing && "missing-translation")}
          >
            <div className="relative group">
              <Input
                value={value}
                onChange={(e) =>
                  onUpdateTranslation(node.path, lang, e.target.value)
                }
                placeholder={`Enter ${lang.toUpperCase()} translation...`}
                className={cn(
                  "h-10 text-sm pr-10 font-normal",
                  isMissing && "border-warning/50 focus:ring-warning/30",
                  isChanged && "border-primary"
                )}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyToClipboard(value, `${lang}-${node.path}`)}
              >
                {copiedKey === `${lang}-${node.path}` ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
              {isChanged && (
                <div className="absolute -right-1 -top-1 w-2.5 h-2.5 bg-primary rounded-full" />
              )}
            </div>
          </td>
        );
      })}
    </tr>
  );
};

export const TranslationEditor = ({
  tree,
  languages,
  selectedPath,
  searchQuery,
  unsavedChanges,
  onUpdateTranslation,
  onRenameKey,
}: TranslationEditorProps) => {
  const [previewNode, setPreviewNode] = useState<TreeNode | null>(null);
  const [editKeyNode, setEditKeyNode] = useState<TreeNode | null>(null);
  const [newKeyName, setNewKeyName] = useState("");

  // Flatten tree to get all leaf nodes
  const flattenedNodes = useMemo(() => {
    const nodes: TreeNode[] = [];

    const flatten = (items: TreeNode[]) => {
      items.forEach((item) => {
        if (item.isLeaf) {
          nodes.push(item);
        } else if (item.children) {
          flatten(item.children);
        }
      });
    };

    flatten(tree);
    return nodes;
  }, [tree]);

  // Filter nodes based on search and selection
  const filteredNodes = useMemo(() => {
    let filtered = flattenedNodes;

    // Filter by selected path (show all children of selected namespace)
    if (selectedPath) {
      filtered = filtered.filter(
        (node) =>
          node.path === selectedPath || node.path.startsWith(selectedPath + ".")
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (node) =>
          node.path.toLowerCase().includes(query) ||
          (node.values &&
            Object.values(node.values).some((v) =>
              v.toLowerCase().includes(query)
            ))
      );
    }

    return filtered;
  }, [flattenedNodes, selectedPath, searchQuery]);

  // Group by namespace for better organization
  const groupedNodes = useMemo(() => {
    const groups: { [namespace: string]: TreeNode[] } = {};

    filteredNodes.forEach((node) => {
      const parts = node.path.split(".");
      const namespace = parts.slice(0, -1).join(".") || "root";

      if (!groups[namespace]) {
        groups[namespace] = [];
      }
      groups[namespace].push(node);
    });

    return groups;
  }, [filteredNodes]);

  const namespaces = Object.keys(groupedNodes).sort();

  const handlePreview = useCallback((node: TreeNode) => {
    setPreviewNode(node);
  }, []);

  const handleEditKey = useCallback((node: TreeNode) => {
    setEditKeyNode(node);
    const lastKey = node.path.split(".").pop() || "";
    setNewKeyName(lastKey);
  }, []);

  const handleSaveKeyName = useCallback(() => {
    if (!editKeyNode || !newKeyName.trim()) return;

    if (onRenameKey) {
      onRenameKey(editKeyNode.path, newKeyName.trim());
      toast.success("Key renamed successfully");
    } else {
      toast.info("Key renaming will be available after saving");
    }

    setEditKeyNode(null);
    setNewKeyName("");
  }, [editKeyNode, newKeyName, onRenameKey]);

  if (flattenedNodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p className="text-lg">No translations loaded</p>
      </div>
    );
  }

  if (filteredNodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-xl font-medium">No matching translations</p>
          <p className="text-sm mt-2">Try adjusting your search or selection</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-auto scrollbar-thin">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-table-header">
            <tr>
              <th className="text-left px-4 py-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-table-border w-80">
                Key
              </th>
              {languages.map((lang) => (
                <th
                  key={lang}
                  className="text-left px-3 py-4 text-sm font-semibold uppercase tracking-wider border-b border-table-border min-w-[280px]"
                >
                  <Badge
                    variant="outline"
                    className="font-mono text-sm px-3 py-1"
                  >
                    {lang.toUpperCase()}
                  </Badge>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {namespaces.map((namespace) => (
              <Fragment key={namespace}>
                {namespaces.length > 1 && (
                  <tr className="bg-muted/30">
                    <td
                      colSpan={languages.length + 1}
                      className="px-4 py-3 text-sm font-medium text-muted-foreground"
                    >
                      <div className="flex items-center gap-2">
                        <ChevronRight className="w-4 h-4" />
                        <span className="font-mono">{namespace}</span>
                        <span className="ml-2 text-muted-foreground/60">
                          ({groupedNodes[namespace].length} keys)
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
                {groupedNodes[namespace].map((node) => (
                  <TranslationRow
                    key={node.path}
                    node={node}
                    languages={languages}
                    unsavedChanges={unsavedChanges}
                    onUpdateTranslation={onUpdateTranslation}
                    isHighlighted={selectedPath === node.path}
                    onPreview={handlePreview}
                    onEditKey={handleEditKey}
                  />
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewNode} onOpenChange={() => setPreviewNode(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono text-lg">Key Preview</DialogTitle>
            <DialogDescription className="font-mono text-sm bg-muted px-3 py-2 rounded-md mt-2">
              {previewNode?.path}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {previewNode &&
              languages.map((lang) => (
                <div key={lang} className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground uppercase">
                    {lang}
                  </label>
                  <div
                    className={cn(
                      "p-3 rounded-md border text-sm",
                      previewNode.values?.[lang]?.trim()
                        ? "bg-muted/50"
                        : "bg-warning/10 border-warning/30 text-warning"
                    )}
                  >
                    {previewNode.values?.[lang]?.trim() || "(Empty)"}
                  </div>
                </div>
              ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewNode(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Key Dialog */}
      <Dialog open={!!editKeyNode} onOpenChange={() => setEditKeyNode(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Key Name</DialogTitle>
            <DialogDescription className="font-mono text-sm bg-muted px-3 py-2 rounded-md mt-2">
              Current: {editKeyNode?.path}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Key Name</label>
              <Input
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Enter new key name..."
                className="font-mono"
              />
              {editKeyNode && (
                <p className="text-xs text-muted-foreground">
                  New path will be:{" "}
                  {editKeyNode.path.split(".").slice(0, -1).join(".") +
                    "." +
                    newKeyName}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditKeyNode(null)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveKeyName} disabled={!newKeyName.trim()}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
