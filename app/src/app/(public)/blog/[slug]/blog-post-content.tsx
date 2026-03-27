"use client";

import Link from "next/link";
import Image from "next/image";
import DOMPurify from "isomorphic-dompurify";
import { ArrowLeft, Calendar, User, Tag } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBlogPost } from "@/hooks/use-blog";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-DO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogPostContent({ slug }: { slug: string }) {
  const { data, isLoading, error } = useBlogPost(slug);
  const post = data?.post;

  if (isLoading) {
    return (
      <Container className="py-12">
        <Skeleton className="mb-4 h-6 w-32" />
        <Skeleton className="mb-6 h-10 w-3/4" />
        <Skeleton className="mb-4 h-4 w-48" />
        <Skeleton className="mb-8 h-72 w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </Container>
    );
  }

  if (error || !post) {
    return (
      <Container className="py-20 text-center">
        <h1 className="text-2xl font-bold">Artículo no encontrado</h1>
        <p className="mt-2 text-muted">
          El artículo que buscas no existe o ha sido removido.
        </p>
        <Button asChild className="mt-6" variant="outline" rounded="full">
          <Link href="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al blog
          </Link>
        </Button>
      </Container>
    );
  }

  return (
    <>
      {/* Back link */}
      <section className="border-b border-border bg-surface-muted/30 py-4">
        <Container>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al blog
          </Link>
        </Container>
      </section>

      {/* Article */}
      <article className="py-10">
        <Container size="sm">
          {/* Meta */}
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-muted">
            {post.category && (
              <Badge variant="secondary" className="text-xs">
                <Tag className="mr-1 h-2.5 w-2.5" />
                {post.category}
              </Badge>
            )}
            {post.published_on && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(post.published_on)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {post.author_name}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {post.title}
          </h1>

          {/* Summary */}
          {post.summary && (
            <p className="mt-4 text-lg text-muted leading-relaxed">
              {post.summary}
            </p>
          )}

          {/* Cover Image */}
          {post.cover_image && (
            <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-xl">
              <Image
                src={post.cover_image}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, 720px"
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-stone mt-10 max-w-none
              prose-headings:font-semibold prose-headings:tracking-tight
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:leading-relaxed prose-p:text-muted
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-lg
              prose-li:text-muted
              prose-strong:text-foreground"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
          />

          {/* Bottom CTA */}
          <div className="mt-16 rounded-xl border border-border bg-surface-muted/30 p-8 text-center">
            <h3 className="text-xl font-semibold">
              ¿Necesitas detalles corporativos?
            </h3>
            <p className="mt-2 text-sm text-muted">
              Explora nuestro catálogo y solicita una cotización sin compromiso.
            </p>
            <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" rounded="full" asChild>
                <Link href="/catalogo">Ver Catálogo</Link>
              </Button>
              <Button size="lg" variant="outline" rounded="full" asChild>
                <Link href="/contacto">Contactar</Link>
              </Button>
            </div>
          </div>
        </Container>
      </article>
    </>
  );
}
