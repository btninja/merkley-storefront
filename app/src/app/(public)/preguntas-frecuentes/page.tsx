import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";

export const metadata: Metadata = {
  title: "Preguntas Frecuentes",
  description:
    "Resuelve tus dudas sobre pedidos, envíos, personalización, precios y facturación en Merkley Details. Regalos corporativos para empresas en República Dominicana.",
  alternates: {
    canonical: "https://merkleydetails.com/preguntas-frecuentes",
  },
  openGraph: {
    title: "Preguntas Frecuentes | Merkley Details",
    description:
      "Todo lo que necesitas saber sobre nuestros detalles corporativos: pedidos, envíos, personalización y más.",
  },
};

const FAQ_SECTIONS = [
  {
    title: "Productos y Catálogo",
    items: [
      {
        question: "¿Qué productos ofrecen?",
        answer:
          "Ofrecemos una amplia variedad de detalles y regalos corporativos personalizados: canastas, kits empresariales, artículos promocionales, textiles y más. Explora nuestro catálogo completo o consulta nuestras colecciones por temporada.",
      },
      {
        question: "¿Cuál es el rango de precios de sus productos?",
        answer:
          "Nuestros precios varían según el producto y nivel de personalización. Puedes ver los precios directamente en cada producto del catálogo. Para pedidos grandes o personalizaciones especiales, solicita una cotización.",
      },
      {
        question: "¿Puedo personalizar los productos?",
        answer:
          "Sí. Muchos productos permiten personalización como tag con el logo de tu empresa, nombre o frase especial, stickers o empaques decorativos. Las opciones de personalización se indican en la descripción de cada artículo.",
      },
      {
        question: "¿Todos los productos son para regalar?",
        answer:
          "Sí, todos nuestros productos están diseñados para obsequiar, combinando presentación, creatividad y un toque especial que los hace ideales para equipos de trabajo y clientes.",
      },
      {
        question: "¿Tienen todos los productos en existencia?",
        answer:
          'Los productos marcados como "Hay existencias" en la web están disponibles para compra inmediata. Si un producto aparece sin disponibilidad, contáctanos para alternativas.',
      },
    ],
  },
  {
    title: "Pedidos y Proceso",
    items: [
      {
        question: "¿Cómo puedo realizar un pedido?",
        answer:
          "Selecciona los productos y cantidades deseadas (mínimo 12 unidades por modelo), crea tu cuenta y envía tu solicitud de cotización. Nuestro equipo te responderá en menos de 24 horas.",
      },
      {
        question: "¿Cuáles son los pasos para hacer una orden?",
        answer:
          "1) Solicitar la cotización. 2) Aprobarla (con sello o correo formal). 3) Realizar el pago. 4) Coordinar la fecha de entrega.",
      },
      {
        question: "¿Puedo cancelar mi orden?",
        answer:
          "Una vez aprobada la cotización, no se permiten cancelaciones sin penalidad. Si necesitas cancelar, se aplica un cargo del 50% no reembolsable, ya que la producción inicia de inmediato.",
      },
    ],
  },
  {
    title: "Envíos y Entregas",
    items: [
      {
        question: "¿Realizan envíos?",
        answer:
          "Sí, hacemos envíos a todo el país. El costo depende del volumen del pedido y la dirección de entrega.",
      },
      {
        question: "¿Cuál es el tiempo de entrega?",
        answer:
          "Requerimos entre 3 a 5 días laborables para preparar tu pedido. Este tiempo puede variar según la personalización y el volumen.",
      },
      {
        question: "¿Pueden dividir el pedido para diferentes sucursales?",
        answer:
          "Sí, podemos dividirlo y enviar a distintas sucursales. Este servicio tiene un costo adicional dependiendo de la cantidad y las direcciones de entrega.",
      },
      {
        question: "¿Puedo ver los productos en persona?",
        answer:
          "Somos una tienda 100% en línea enfocada en empresas y marcas. Si lo deseas, podemos compartirte nuestro perfil comercial una vez proporciones un correo corporativo.",
      },
    ],
  },
  {
    title: "Pagos y Facturación",
    items: [
      {
        question: "¿Cómo se realiza el pago?",
        answer:
          "Aceptamos transferencia bancaria y pagos en línea. Los detalles de pago se incluyen en tu cotización aprobada.",
      },
      {
        question: "¿Los precios incluyen ITBIS?",
        answer:
          "No. El ITBIS se agrega al final de la cotización o en el proceso de compra online.",
      },
      {
        question: "¿Ofrecen descuentos por volumen?",
        answer:
          "Sí, todos los precios del catálogo ya incluyen descuentos por volumen. A mayor cantidad, mejor precio.",
      },
      {
        question: "¿Ofrecen factura con comprobante fiscal?",
        answer:
          "Sí, nuestros servicios son para empresas por lo que emitimos facturas con NCF (Número de Comprobante Fiscal).",
      },
    ],
  },
];

// Flatten all FAQ items for schema
const allFaqItems = FAQ_SECTIONS.flatMap((section) => section.items);

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: allFaqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function PreguntasFrecuentesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-soft via-white to-surface-muted">
        <Container className="py-16 md:py-20">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>

          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Preguntas{" "}
              <span className="text-primary">Frecuentes</span>
            </h1>
            <p className="mt-4 text-lg text-muted leading-relaxed">
              Todo lo que necesitas saber sobre nuestros productos, pedidos,
              envíos y facturación.
            </p>
          </div>
        </Container>
      </section>

      {/* FAQ Content */}
      <Container className="py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-12">
          {FAQ_SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="mb-6 text-xl font-bold tracking-tight border-l-4 border-primary pl-4">
                {section.title}
              </h2>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <details
                    key={item.question}
                    className="group rounded-xl border border-border/60 bg-white transition-all hover:border-primary/30 hover:shadow-sm"
                  >
                    <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 text-left font-medium text-foreground [&::-webkit-details-marker]:hidden">
                      <span>{item.question}</span>
                      <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="border-t border-border/40 px-5 pb-5 pt-4">
                      <p className="text-muted leading-relaxed whitespace-pre-line">
                        {item.answer}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mx-auto mt-16 max-w-xl text-center">
          <div className="rounded-2xl bg-surface-muted/40 p-8">
            <h3 className="text-lg font-semibold">
              ¿No encontraste lo que buscabas?
            </h3>
            <p className="mt-2 text-sm text-muted">
              Nuestro equipo está listo para ayudarte con cualquier consulta
              adicional.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/contacto"
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Contactar ventas
              </Link>
              <Link
                href="/catalogo"
                className="inline-flex items-center justify-center rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted"
              >
                Ver catálogo
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
