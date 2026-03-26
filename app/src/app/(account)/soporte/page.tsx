"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageCircle,
  Send,
  Plus,
  ArrowLeft,
  Loader2,
  Clock,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useSupportMessages } from "@/hooks/use-portal";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import type { SupportConversation, SupportMessage } from "@/lib/api";

function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("es-DO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatConversationDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-DO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ConversationList({
  conversations,
  isLoading,
  onSelect,
  onNewChat,
}: {
  conversations: SupportConversation[];
  isLoading: boolean;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Conversaciones</h2>
        <Button size="sm" onClick={onNewChat}>
          <Plus className="h-4 w-4" />
          Nuevo Chat
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <Card className="mx-auto max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="mt-4">Sin conversaciones</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted leading-relaxed mb-4">
              Inicia una conversación con nuestro equipo de soporte.
            </p>
            <Button onClick={onNewChat}>
              <Plus className="h-4 w-4" />
              Nuevo Chat
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Card
              key={conv.conversation_id}
              className="cursor-pointer transition-colors hover:bg-surface-muted/50"
              onClick={() => onSelect(conv.conversation_id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">
                      {conv.subject}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      {formatConversationDate(conv.last_message_at || conv.created_at)}
                    </p>
                  </div>
                  <Badge
                    variant={conv.status === "Abierto" ? "default" : "secondary"}
                    className="text-[10px] px-2 py-0.5 shrink-0"
                  >
                    {conv.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function NewChatForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (conversationId: string) => void;
}) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await api.initiateSupportChat(message.trim(), subject.trim());
      onCreated(result.conversation_id);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo iniciar el chat.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">Nuevo Chat</h2>
      </div>

      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Asunto
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Describe brevemente tu consulta"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Mensaje
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe tu mensaje..."
                rows={4}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !subject.trim() || !message.trim()}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Enviar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ChatView({
  conversationId,
  onBack,
}: {
  conversationId: string;
  onBack: () => void;
}) {
  const { customer } = useAuth();
  const { data, isLoading, mutate } = useSupportMessages(conversationId);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [data?.messages, scrollToBottom]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    const text = message.trim();
    setMessage("");
    setIsSending(true);

    try {
      await api.sendSupportMessage(conversationId, text);
      mutate();
    } catch (error) {
      setMessage(text);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo enviar el mensaje.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] lg:h-[calc(100vh-12rem)]">
      {/* Chat Header */}
      <div className="flex items-center gap-3 pb-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold truncate">
            {data?.conversation.subject || "Cargando..."}
          </h2>
          {data?.conversation.status && (
            <Badge
              variant={data.conversation.status === "Abierto" ? "default" : "secondary"}
              className="text-[10px] px-2 py-0.5 mt-0.5"
            >
              {data.conversation.status}
            </Badge>
          )}
        </div>
      </div>

      <Separator />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-0">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
              >
                <Skeleton className="h-16 w-3/4" />
              </div>
            ))}
          </div>
        ) : data?.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted">No hay mensajes aún</p>
          </div>
        ) : (
          data?.messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.direction === "out"}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <Separator />

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 pt-4">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          disabled={isSending}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || isSending}
          className="shrink-0 h-10 w-10"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}

function MessageBubble({
  message,
  isOwn,
}: {
  message: SupportMessage;
  isOwn: boolean;
}) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-surface-muted rounded-bl-md"
        }`}
      >
        {!isOwn && (
          <p
            className={`text-[10px] font-medium mb-0.5 ${
              isOwn ? "text-primary-foreground/70" : "text-primary"
            }`}
          >
            {message.sender_name}
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <div
          className={`flex items-center gap-1 mt-1 ${
            isOwn ? "justify-end" : "justify-start"
          }`}
        >
          <Clock className={`h-2.5 w-2.5 ${isOwn ? "text-primary-foreground/50" : "text-muted"}`} />
          <span
            className={`text-[10px] ${
              isOwn ? "text-primary-foreground/50" : "text-muted"
            }`}
          >
            {formatMessageTime(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}

type ViewState =
  | { type: "list" }
  | { type: "new" }
  | { type: "chat"; conversationId: string };

export default function SoportePage() {
  const [view, setView] = useState<ViewState>({ type: "list" });
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const { toast } = useToast();

  const loadConversations = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const result = await api.getSupportConversations();
      setConversations(result.conversations);
    } catch {
      // Silent — empty list shown
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleBack = () => {
    loadConversations();
    setView({ type: "list" });
  };

  return (
    <div className="space-y-6">
      {view.type === "list" && (
        <>
          <PageHeader
            title="Soporte"
            description="Comunícate con nuestro equipo"
          />
          <ConversationList
            conversations={conversations}
            isLoading={isLoadingList}
            onSelect={(id) => setView({ type: "chat", conversationId: id })}
            onNewChat={() => setView({ type: "new" })}
          />
        </>
      )}

      {view.type === "new" && (
        <>
          <PageHeader title="Soporte" />
          <NewChatForm
            onCancel={handleBack}
            onCreated={(id) => setView({ type: "chat", conversationId: id })}
          />
        </>
      )}

      {view.type === "chat" && (
        <>
          <PageHeader title="Soporte" />
          <ChatView
            conversationId={view.conversationId}
            onBack={handleBack}
          />
        </>
      )}
    </div>
  );
}
