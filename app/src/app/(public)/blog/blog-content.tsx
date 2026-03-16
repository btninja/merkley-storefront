"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, ArrowRight, User, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBlogPosts, useBlogCategories } from "@/hooks/use-blog";
import type { BlogPost } from "@/lib/types";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-DO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group">
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
        <CardContent className="p-0">
          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/10 to-surface-muted">
            {post.cover_image ? (
              <Image
                src={post.cover_image}
                alt={post.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-4xl font-bold text-primary/20">MD</span>
              </div>
            )}
            {post.category && (
              <div className="absolute left-3 top-3">
                <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-xs">
                  <Tag className="mr-1 h-2.5 w-2.5" />
                  {post.category}
                </Badge>
              </div>
            )}
          </div>
          <div className="p-5">
            <div className="mb-2 flex items-center gap-3 text-xs text-muted">
              {post.published_on && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(post.published_on)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {post.author_name}
              </span>
            </div>
            <h3 className="text-lg font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
              {post.title}
            </h3>
            {post.summary && (
              <p className="mt-2 text-sm text-muted line-clamp-2">
                {post.summary}
              </p>
            )}
            <span className="mt-3 inline-flex items-center text-sm font-medium text-primary transition-transform group-hover:translate-x-1">
              Leer más <ArrowRight className="ml-1 h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function BlogCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden">
      <CardContent className="p-0">
        <Skeleton className="h-48 rounded-none" />
        <div className="p-5 space-y-3">
          <div className="flex gap-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function BlogListContent() {
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  const { data, isLoading } = useBlogPosts({ page, category: selectedCategory });
  const { data: categoriesData } = useBlogCategories();

  const posts = data?.posts || [];
  const pagination = data?.pagination;
  const categories = categoriesData?.categories || [];

  return (
    <>
      {/* Header */}
      <section className="border-b border-border bg-gradient-to-br from-primary-soft via-white to-surface-muted py-16">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight">Blog</h1>
            <p className="mt-4 text-lg text-muted">
              Ideas, tendencias y consejos sobre regalos corporativos y detalles personalizados.
            </p>
          </div>
        </Container>
      </section>

      {/* Category Filters */}
      {categories.length > 0 && (
        <section className="border-b border-border bg-white py-4">
          <Container>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={!selectedCategory ? "default" : "outline"}
                size="sm"
                rounded="full"
                onClick={() => {
                  setSelectedCategory(undefined);
                  setPage(1);
                }}
              >
                Todos
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.category_name}
                  variant={selectedCategory === cat.category_name ? "default" : "outline"}
                  size="sm"
                  rounded="full"
                  onClick={() => {
                    setSelectedCategory(cat.category_name);
                    setPage(1);
                  }}
                >
                  {cat.category_name}
                  {cat.post_count > 0 && (
                    <span className="ml-1.5 text-xs opacity-70">({cat.post_count})</span>
                  )}
                </Button>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Blog Grid */}
      <section className="py-12">
        <Container>
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <BlogCardSkeleton key={i} />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-lg font-medium text-muted">
                {selectedCategory
                  ? `No hay artículos en la categoría "${selectedCategory}" aún.`
                  : "No hay artículos publicados aún."}
              </p>
              <p className="mt-2 text-sm text-muted">
                Vuelve pronto para nuevo contenido.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </div>

              {/* Pagination */}
              {pagination && (data?.total_count ?? 0) > pagination.page_length && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <span className="px-4 text-sm text-muted">
                    Página {page} de {Math.ceil((data?.total_count ?? 0) / pagination.page_length)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.has_more}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </Container>
      </section>
    </>
  );
}
