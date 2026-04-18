"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReactNode } from "react";

export type DocTabValue = "details" | "documents" | "history";

interface DocTabsProps {
  details: ReactNode;
  documents: ReactNode;
  history: ReactNode;
  defaultTab?: DocTabValue;
  /** Controlled mode — pass with onValueChange to drive tab from outside
   *  (e.g. an action button that needs to switch tabs before scrolling
   *  into content that only mounts when its tab is active). */
  value?: DocTabValue;
  onValueChange?: (value: DocTabValue) => void;
}

export function DocTabs({
  details,
  documents,
  history,
  defaultTab = "details",
  value,
  onValueChange,
}: DocTabsProps) {
  return (
    <Tabs
      className="w-full"
      defaultValue={value === undefined ? defaultTab : undefined}
      value={value}
      onValueChange={onValueChange as ((v: string) => void) | undefined}
    >
      <TabsList>
        <TabsTrigger value="details">Detalles</TabsTrigger>
        <TabsTrigger value="documents">Documentos</TabsTrigger>
        <TabsTrigger value="history">Historial</TabsTrigger>
      </TabsList>
      <TabsContent value="details">{details}</TabsContent>
      <TabsContent value="documents">{documents}</TabsContent>
      <TabsContent value="history">{history}</TabsContent>
    </Tabs>
  );
}
