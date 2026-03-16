import type { Metadata } from "next";
import BlogListContent from "./blog-content";

export const metadata: Metadata = {
  title: "Blog | Merkley Details",
  description:
    "Ideas, tendencias y consejos sobre regalos corporativos, detalles personalizados y eventos empresariales en República Dominicana.",
  alternates: {
    canonical: "https://merkleydetails.com/blog",
  },
  openGraph: {
    title: "Blog | Merkley Details",
    description:
      "Ideas, tendencias y consejos sobre regalos corporativos, detalles personalizados y eventos empresariales.",
  },
};

export default function BlogPage() {
  return <BlogListContent />;
}
