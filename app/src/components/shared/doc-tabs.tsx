"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReactNode } from "react";

interface DocTabsProps {
  details: ReactNode;
  documents: ReactNode;
  history: ReactNode;
  defaultTab?: "details" | "documents" | "history";
}

export function DocTabs({ details, documents, history, defaultTab = "details" }: DocTabsProps) {
  return (
    <Tabs defaultValue={defaultTab} className="w-full">
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
