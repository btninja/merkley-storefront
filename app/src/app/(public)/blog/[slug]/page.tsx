import type { Metadata } from "next";
import BlogPostContent from "./blog-post-content";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  // Fetch post data for metadata
  const ERP_BASE = process.env.FRAPPE_BASE_URL || "https://erp.merkleydetails.com";
  try {
    const res = await fetch(
      `${ERP_BASE}/api/method/merkley_web.api.blog.get_blog_post?slug=${encodeURIComponent(slug)}`,
      { next: { revalidate: 300 } }
    );
    if (res.ok) {
      const data = await res.json();
      const post = data?.message?.post;
      if (post) {
        return {
          title: `${post.meta_title || post.title} | Merkley Details`,
          description: post.meta_description || post.summary || "",
          openGraph: {
            title: post.meta_title || post.title,
            description: post.meta_description || post.summary || "",
            images: post.og_image ? [{ url: post.og_image }] : [],
            type: "article",
            publishedTime: post.published_on || undefined,
            authors: [post.author_name],
          },
          alternates: {
            canonical: `https://merkleydetails.com/blog/${slug}`,
          },
        };
      }
    }
  } catch {
    // Fall through to default metadata
  }

  return {
    title: "Blog | Merkley Details",
    description: "Artículo del blog de Merkley Details.",
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  return <BlogPostContent slug={slug} />;
}
