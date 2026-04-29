"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { CategoryTreeNode } from "@/lib/types";

/** Walk the tree to find the path from root to the target category. */
function findPathInTree(
  nodes: CategoryTreeNode[],
  target: string
): CategoryTreeNode[] | null {
  for (const node of nodes) {
    if (node.name === target) return [node];
    if (node.children.length > 0) {
      const childPath = findPathInTree(node.children, target);
      if (childPath) return [node, ...childPath];
    }
  }
  return null;
}

export { findPathInTree };

export function CatalogBreadcrumb({
  category,
  categoryTree,
  onCategoryChange,
}: {
  category: string;
  categoryTree: CategoryTreeNode[];
  onCategoryChange: (cat: string) => void;
}) {
  if (!category) return null;

  const path = findPathInTree(categoryTree, category) || [];

  return (
    <nav className="flex items-center gap-1 text-sm text-muted">
      <button
        onClick={() => onCategoryChange("")}
        className="cursor-pointer hover:text-foreground transition-colors"
      >
        Catálogo
      </button>
      {path.map((node, idx) => {
        const isLast = idx === path.length - 1;
        return (
          <span key={node.name} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5" />
            {isLast ? (
              <span className="text-foreground font-medium">{node.name}</span>
            ) : (
              <button
                onClick={() => onCategoryChange(node.name)}
                className="cursor-pointer hover:text-foreground transition-colors"
              >
                {node.name}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function ProductBreadcrumb({
  category,
  productName,
  categoryTree,
}: {
  category: string | null;
  productName: string;
  categoryTree: CategoryTreeNode[];
}) {
  const path = category ? findPathInTree(categoryTree, category) || [] : [];

  return (
    <nav className="flex items-center gap-1 text-sm text-muted">
      <Link href="/catalogo" className="hover:text-foreground transition-colors">
        Catálogo
      </Link>
      {path.map((node) => (
        <span key={node.name} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5" />
          <Link
            href={`/catalogo?category=${encodeURIComponent(node.name)}`}
            className="hover:text-foreground transition-colors"
          >
            {node.name}
          </Link>
        </span>
      ))}
      <ChevronRight className="h-3.5 w-3.5" />
      <span className="line-clamp-1 text-foreground">{productName}</span>
    </nav>
  );
}
