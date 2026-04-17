"use client";

import { useMemo, useState } from "react";
// Accordion components handle the chevron internally
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { CategoryTreeNode, TierFilter } from "@/lib/types";

const AVAILABILITY_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "Disponible", label: "Disponible" },
  { value: "Bajo Pedido", label: "Bajo Pedido" },
];

/** Filter a category tree to only include nodes matching the search query (or ancestors of matches). */
function filterTree(nodes: CategoryTreeNode[], query: string): CategoryTreeNode[] {
  if (!query) return nodes;
  const q = query.toLowerCase();
  function matches(node: CategoryTreeNode): CategoryTreeNode | null {
    const nameMatch = node.name.toLowerCase().includes(q);
    const filteredChildren = node.children.map(matches).filter(Boolean) as CategoryTreeNode[];
    if (nameMatch || filteredChildren.length > 0) {
      return { ...node, children: nameMatch ? node.children : filteredChildren };
    }
    return null;
  }
  return nodes.map(matches).filter(Boolean) as CategoryTreeNode[];
}

/** Find which top-level accordion items should be open for the active category. */
function findOpenParents(
  nodes: CategoryTreeNode[],
  target: string
): string[] {
  const result: string[] = [];
  function search(items: CategoryTreeNode[], ancestors: string[]): boolean {
    for (const node of items) {
      if (node.name === target) {
        result.push(...ancestors);
        return true;
      }
      if (node.children.length > 0) {
        if (search(node.children, [...ancestors, node.name])) return true;
      }
    }
    return false;
  }
  search(nodes, []);
  return result;
}

function CategoryItem({
  node,
  depth,
  activeCategory,
  onCategoryChange,
}: {
  node: CategoryTreeNode;
  depth: number;
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
}) {
  const isActive = activeCategory === node.name;
  const paddingLeft = depth * 12;

  if (node.children.length === 0) {
    return (
      <button
        onClick={() => onCategoryChange(node.name)}
        className={cn(
          "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors",
          isActive
            ? "bg-primary-soft font-medium text-primary"
            : "text-foreground hover:bg-surface-muted"
        )}
        style={{ paddingLeft: `${paddingLeft + 8}px` }}
      >
        <span className="line-clamp-1">{node.name}</span>
        <span className="ml-2 shrink-0 text-xs text-muted">{node.product_count}</span>
      </button>
    );
  }

  return null;
}

function CategoryBranch({
  node,
  depth,
  activeCategory,
  onCategoryChange,
}: {
  node: CategoryTreeNode;
  depth: number;
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
}) {
  const isActive = activeCategory === node.name;
  const paddingLeft = depth * 12;

  if (node.children.length === 0) {
    return (
      <CategoryItem
        node={node}
        depth={depth}
        activeCategory={activeCategory}
        onCategoryChange={onCategoryChange}
      />
    );
  }

  return (
    <AccordionItem value={node.name} className="border-0">
      <div className="flex items-center" style={{ paddingLeft: `${paddingLeft}px` }}>
        <button
          onClick={() => onCategoryChange(node.name)}
          className={cn(
            "flex-1 truncate rounded-md px-2 py-1.5 text-left text-sm transition-colors",
            isActive
              ? "bg-primary-soft font-medium text-primary"
              : "text-foreground hover:bg-surface-muted"
          )}
        >
          {node.name}
          <span className="ml-1.5 text-xs text-muted">({node.product_count})</span>
        </button>
        <AccordionTrigger className="p-1.5 hover:no-underline [&>svg]:h-3.5 [&>svg]:w-3.5" />
      </div>
      <AccordionContent className="pb-0 pt-0">
        <div className="space-y-0.5">
          {node.children.map((child) => (
            <CategoryBranch
              key={child.name}
              node={child}
              depth={depth + 1}
              activeCategory={activeCategory}
              onCategoryChange={onCategoryChange}
            />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function FilterSidebar({
  categoryTree,
  tiers: _tiers,
  activeCategory,
  activeTier: _activeTier,
  activeAvailability,
  onCategoryChange,
  onTierChange: _onTierChange,
  onAvailabilityChange,
}: {
  categoryTree: CategoryTreeNode[];
  tiers: TierFilter[];
  activeCategory: string;
  activeTier: string;
  activeAvailability: string;
  onCategoryChange: (cat: string) => void;
  onTierChange: (tier: string) => void;
  onAvailabilityChange: (avail: string) => void;
}) {
  const [categorySearch, setCategorySearch] = useState("");

  const filteredTree = useMemo(
    () => filterTree(categoryTree, categorySearch),
    [categoryTree, categorySearch]
  );

  const [openItems, setOpenItems] = useState<string[]>(() =>
    activeCategory ? findOpenParents(categoryTree, activeCategory) : []
  );

  // When searching, auto-expand all branches to reveal matches
  const effectiveOpen = useMemo(() => {
    if (categorySearch) {
      const all: string[] = [];
      function collect(nodes: CategoryTreeNode[]) {
        for (const n of nodes) {
          if (n.children.length > 0) { all.push(n.name); collect(n.children); }
        }
      }
      collect(filteredTree);
      return all;
    }
    return openItems;
  }, [categorySearch, filteredTree, openItems]);

  return (
    <aside className="space-y-5">
      {/* Categories */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Categorías
        </h3>
        <Input
          placeholder="Buscar categoria..."
          value={categorySearch}
          onChange={(e) => setCategorySearch(e.target.value)}
          className="mb-2 h-8 text-sm"
        />
        <button
          onClick={() => { onCategoryChange(""); setCategorySearch(""); }}
          className={cn(
            "mb-1 w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors",
            !activeCategory
              ? "bg-primary-soft font-medium text-primary"
              : "text-foreground hover:bg-surface-muted"
          )}
        >
          Todas las categorías
        </button>
        <Accordion
          type="multiple"
          value={effectiveOpen}
          onValueChange={(val) => { if (!categorySearch) setOpenItems(val); }}
          className="space-y-0.5"
        >
          {filteredTree.map((node) => (
            <CategoryBranch
              key={node.name}
              node={node}
              depth={0}
              activeCategory={activeCategory}
              onCategoryChange={onCategoryChange}
            />
          ))}
          {filteredTree.length === 0 && categorySearch && (
            <p className="px-2 py-3 text-xs text-muted text-center">
              Sin resultados
            </p>
          )}
        </Accordion>
      </div>

      <Separator />

      {/* Availability */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Disponibilidad
        </h3>
        <div className="flex flex-wrap gap-2">
          {AVAILABILITY_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={activeAvailability === opt.value ? "default" : "outline"}
              size="sm"
              rounded="full"
              onClick={() => onAvailabilityChange(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

    </aside>
  );
}
