import { useState, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  Search,
  AlertCircle,
  CheckCircle2,
  Home,
  ChevronsUpDown,
  Filter,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TreeNode } from "@/types/translation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface TreeViewProps {
  tree: TreeNode[];
  languages: string[];
  selectedPath: string | null;
  onSelectPath: (path: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  missingFilter: string[];
  onMissingFilterChange: (languages: string[]) => void;
}

interface TreeNodeItemProps {
  node: TreeNode;
  selectedPath: string | null;
  onSelectPath: (path: string | null) => void;
  expandedPaths: Set<string>;
  onToggleExpand: (path: string) => void;
  matchingPaths: Set<string>;
}

const TreeNodeItem = ({
  node,
  selectedPath,
  onSelectPath,
  expandedPaths,
  onToggleExpand,
  matchingPaths,
}: TreeNodeItemProps) => {
  const isExpanded = expandedPaths.has(node.path);
  const isSelected = selectedPath === node.path;
  const isMatching = matchingPaths.has(node.path);
  const hasMatchingChildren = node.children?.some(
    (child) =>
      matchingPaths.has(child.path) ||
      child.children?.some((grandchild) => matchingPaths.has(grandchild.path))
  );

  const completeness = node.completeness || 100;
  const isComplete = completeness === 100;
  const isMissing = completeness < 100;

  if (!isMatching && !hasMatchingChildren && matchingPaths.size > 0) {
    return null;
  }

  return (
    <div className="animate-fade-in">
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200",
          "hover:bg-tree-hover",
          isSelected && "bg-tree-selected ring-1 ring-primary/30",
          !isMatching &&
            hasMatchingChildren &&
            matchingPaths.size > 0 &&
            "opacity-60"
        )}
        style={{ paddingLeft: `${node.depth * 20 + 12}px` }}
        onClick={() => {
          if (node.isLeaf) {
            onSelectPath(node.path);
          } else {
            onToggleExpand(node.path);
            onSelectPath(node.path);
          }
        }}
      >
        {!node.isLeaf && (
          <button
            className="p-1 hover:bg-muted rounded-md transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.path);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        )}

        {node.isLeaf ? (
          <FileText className="w-5 h-5 text-primary/70 flex-shrink-0" />
        ) : (
          <Folder
            className={cn(
              "w-5 h-5 flex-shrink-0",
              isExpanded ? "text-primary" : "text-muted-foreground"
            )}
          />
        )}

        <span
          className={cn(
            "font-mono text-sm flex-1 truncate",
            isSelected && "font-semibold text-primary"
          )}
        >
          {node.key}
        </span>

        {/* Completeness indicator */}
        {node.isLeaf &&
          (isMissing ? (
            <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
          ))}

        {!node.isLeaf && (
          <span
            className={cn(
              "text-xs font-mono px-2 py-1 rounded-md font-medium",
              isComplete
                ? "bg-success/10 text-success"
                : "bg-warning/10 text-warning"
            )}
          >
            {Math.round(completeness)}%
          </span>
        )}
      </div>

      {!node.isLeaf && isExpanded && node.children && (
        <div className="relative">
          <div
            className="absolute left-0 top-0 bottom-0 tree-line"
            style={{ marginLeft: `${node.depth * 20 + 22}px` }}
          />
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.path}
              node={child}
              selectedPath={selectedPath}
              onSelectPath={onSelectPath}
              expandedPaths={expandedPaths}
              onToggleExpand={onToggleExpand}
              matchingPaths={matchingPaths}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const TreeView = ({
  tree,
  languages,
  selectedPath,
  onSelectPath,
  searchQuery,
  onSearchChange,
  missingFilter,
  onMissingFilterChange,
}: TreeViewProps) => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    new Set(["auth", "dashboard", "common"])
  );

  const matchingPaths = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();

    const matches = new Set<string>();
    const query = searchQuery.toLowerCase();

    const searchNode = (node: TreeNode) => {
      const pathMatch = node.path.toLowerCase().includes(query);
      const valueMatch =
        node.isLeaf &&
        node.values &&
        Object.values(node.values).some((v) => v.toLowerCase().includes(query));

      if (pathMatch || valueMatch) {
        matches.add(node.path);
        // Also add parent paths
        const parts = node.path.split(".");
        for (let i = 1; i < parts.length; i++) {
          matches.add(parts.slice(0, i).join("."));
        }
      }

      node.children?.forEach(searchNode);
    };

    tree.forEach(searchNode);
    return matches;
  }, [tree, searchQuery]);

  // Auto-expand matching paths
  useMemo(() => {
    if (matchingPaths.size > 0) {
      setExpandedPaths((prev) => new Set([...prev, ...matchingPaths]));
    }
  }, [matchingPaths]);

  const handleToggleExpand = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allPaths = new Set<string>();
    const collectPaths = (nodes: TreeNode[]) => {
      nodes.forEach((node) => {
        if (!node.isLeaf) {
          allPaths.add(node.path);
          if (node.children) collectPaths(node.children);
        }
      });
    };
    collectPaths(tree);
    setExpandedPaths(allPaths);
  };

  const collapseAll = () => {
    setExpandedPaths(new Set());
  };

  // Breadcrumb navigation
  const breadcrumbs = selectedPath ? selectedPath.split(".") : [];

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      onSelectPath(null);
    } else {
      const path = breadcrumbs.slice(0, index + 1).join(".");
      onSelectPath(path);
      setExpandedPaths((prev) => new Set([...prev, path]));
    }
  };

  return (
    <aside className="w-80 border-r border-border bg-sidebar flex flex-col h-full">
      {/* Breadcrumb Navigation */}
      {selectedPath && (
        <div className="px-3 py-2 border-b border-sidebar-border bg-muted/30">
          <div className="flex items-center gap-1 flex-wrap text-sm">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-primary hover:text-primary"
              onClick={() => handleBreadcrumbClick(-1)}
            >
              <Home className="w-4 h-4" />
            </Button>
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center">
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 px-2 font-mono text-sm",
                    index === breadcrumbs.length - 1
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => handleBreadcrumbClick(index)}
                >
                  {crumb}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-3 border-b border-sidebar-border space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search keys or values..."
            className="pl-9 h-10 text-sm bg-background"
          />
        </div>

        {/* Missing translations filter */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={missingFilter.length > 0 ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs flex-1"
              >
                <Filter className="w-3 h-3 mr-1" />
                Missing
                {missingFilter.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 px-1.5 text-[10px]"
                  >
                    {missingFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Show missing in</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={
                  missingFilter.length === languages.length &&
                  languages.length > 0
                }
                onCheckedChange={(checked) => {
                  onMissingFilterChange(checked ? [...languages] : []);
                }}
              >
                All Languages
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              {languages.map((lang) => (
                <DropdownMenuCheckboxItem
                  key={lang}
                  checked={missingFilter.includes(lang)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onMissingFilterChange([...missingFilter, lang]);
                    } else {
                      onMissingFilterChange(
                        missingFilter.filter((l) => l !== lang)
                      );
                    }
                  }}
                >
                  {lang.toUpperCase()}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {missingFilter.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onMissingFilterChange([])}
              title="Clear filter"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Active filter display */}
        {missingFilter.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {missingFilter.map((lang) => (
              <Badge
                key={lang}
                variant="outline"
                className="text-xs bg-warning/10 text-warning border-warning/30"
              >
                {lang.toUpperCase()} missing
              </Badge>
            ))}
          </div>
        )}

        {/* Expand/Collapse controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={expandAll}
          >
            <ChevronsUpDown className="w-3 h-3 mr-1" />
            Expand All
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={collapseAll}
          >
            Collapse All
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {tree.map((node) => (
          <TreeNodeItem
            key={node.path}
            node={node}
            selectedPath={selectedPath}
            onSelectPath={onSelectPath}
            expandedPaths={expandedPaths}
            onToggleExpand={handleToggleExpand}
            matchingPaths={matchingPaths}
          />
        ))}
      </div>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span>Complete</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-warning" />
            <span>Missing</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
