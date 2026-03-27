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
  twitter: {
    card: "summary_large_image",
    title: "Blog | Merkley Details",
    description:
      "Ideas, tendencias y consejos sobre regalos corporativos, detalles personalizados y eventos empresariales en República Dominicana.",
    images: ["https://merkleydetails.com/og-image.jpg"],
  },
};

export default function BlogPage() {
  return <BlogListContent />;
}
