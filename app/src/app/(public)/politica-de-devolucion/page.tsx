/**
 * TEMPLATE — legal scaffold. Must be reviewed and customized per tenant
 * jurisdiction before production.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LegalTemplateBanner } from "@/components/legal-template-banner";

export const metadata: Metadata = {
  title: "Política de Devoluciones y Reembolsos",
  description:
    "Política de devoluciones, cambios, garantías y reembolsos para productos corporativos.",
};

const LAST_UPDATED = "13 de marzo de 2026";

interface PolicySection {
  title: string;
  content: string[];
}

const SECTIONS: PolicySection[] = [
  {
    title: "1. Alcance",
    content: [
      "Esta política aplica a todas las compras realizadas a través de merkleydetails.com y canales oficiales de Merkley Details, con domicilio en Santo Domingo, República Dominicana.",
      "Al realizar un pedido, el cliente acepta los términos aquí establecidos, los cuales complementan nuestros Términos y Condiciones generales.",
    ],
  },
  {
    title: "2. Productos Personalizados",
    content: [
      "Debido a la naturaleza de nuestro negocio, la mayoría de nuestros productos son personalizados con logos, nombres, colores corporativos u otros elementos específicos del cliente.",
      "Los productos personalizados no admiten cambios ni devoluciones una vez aprobado el arte y confirmada la orden de producción, salvo que presenten defectos de fabricación comprobables.",
      "En caso de defecto de fábrica en un producto personalizado, se sustituirá el producto base. La personalización (grabado, impresión, bordado) no se repite; se aplicará únicamente al producto de reemplazo si es técnicamente posible.",
    ],
  },
  {
    title: "3. Productos No Personalizados (Estándar)",
    content: [
      "Para productos estándar (no personalizados) que presenten defectos de fábrica o no correspondan a lo solicitado, el cliente podrá solicitar un cambio o reposición dentro de los 7 días calendario siguientes a la fecha de entrega.",
      "El producto debe estar en su empaque original, sin uso y en las mismas condiciones en que fue recibido.",
      "No se aceptan devoluciones por cambio de preferencia, error en la selección del producto por parte del cliente, ni por diferencias menores de color o textura inherentes al proceso de fabricación.",
    ],
  },
  {
    title: "4. Productos Electrónicos",
    content: [
      "Los productos electrónicos tienen una garantía de 5 días calendario desde la fecha de entrega para reportar fallos de fábrica.",
      "El reporte debe realizarse con evidencia fotográfica o de video, junto con el número de pedido, dentro de un plazo máximo de 7 días calendario.",
      "La garantía no cubre daños por golpes, humedad, mal uso, alteraciones externas ni desgaste normal.",
    ],
  },
  {
    title: "5. Proceso de Reclamación",
    content: [
      "Toda reclamación debe realizarse a través de los canales oficiales de Merkley Details (correo electrónico o WhatsApp) e incluir:",
      "• Número de pedido o cotización\n• Descripción detallada del problema\n• Evidencia fotográfica o de video del defecto\n• Fecha de recepción del producto",
      "Las reclamaciones serán evaluadas en un máximo de 48 horas laborables tras recibir toda la documentación requerida.",
      "No se procesarán reclamaciones fuera del plazo establecido ni sin la evidencia correspondiente.",
    ],
  },
  {
    title: "6. Inspección al Momento de Entrega",
    content: [
      "El cliente o su representante debe verificar la cantidad y el estado de los productos al momento de la entrega.",
      "La firma de la orden de recibo confirma que el producto fue recibido conforme en cantidad y calidad.",
      "No se aceptan reclamaciones por faltantes o daños visibles una vez firmada la orden de recibo.",
    ],
  },
  {
    title: "7. Reembolsos",
    content: [
      "Merkley Details no realiza reembolsos monetarios. En caso de que una reclamación sea procedente, se ofrecerá:",
      "• Reposición del producto defectuoso (sujeto a disponibilidad)\n• Vale de crédito interno por el monto correspondiente, válido por 180 días calendario",
      "Los vales de crédito son de uso exclusivo en Merkley Details, no son reembolsables ni transferibles, y deben indicarse al momento de realizar un nuevo pedido.",
      "La reposición o vale de crédito no incluye reimpresión de personalización ni empaque especial.",
    ],
  },
  {
    title: "8. Cancelaciones de Órdenes",
    content: [
      "No se permiten cancelaciones una vez aprobada la orden y confirmado el inicio de producción.",
      "En casos excepcionales evaluados por Merkley Details, las cancelaciones estarán sujetas a un cargo del 50% del total de la orden, monto que no es reembolsable.",
      "Órdenes que no hayan entrado en producción podrán ser canceladas sin penalidad, siempre que se notifique por escrito antes del inicio de la fabricación.",
    ],
  },
  {
    title: "9. Muestras",
    content: [
      "Las muestras se cobran al 100% del valor del producto y tienen un tiempo de elaboración de 3 a 5 días laborables.",
      "Las muestras no son reembolsables ni se acreditan al monto de la orden final.",
    ],
  },
  {
    title: "10. Marco Legal",
    content: [
      "Esta política se rige por las leyes de la República Dominicana, incluyendo la Ley General de Protección de los Derechos del Consumidor o Usuario (Ley No. 358-05) y su reglamento de aplicación.",
      "Para cualquier controversia no resuelta directamente con Merkley Details, el cliente podrá acudir a Pro Consumidor (Instituto Nacional de Protección de los Derechos del Consumidor) o a los tribunales competentes de la República Dominicana.",
    ],
  },
  {
    title: "11. Contacto",
    content: [
      "Para consultas sobre esta política, devoluciones o reclamaciones, comuníquese con nosotros:",
      "• Correo: info@merkleydetails.com\n• WhatsApp: disponible en nuestra página de contacto\n• Horario de atención: lunes a viernes, 9:00 AM a 6:00 PM",
    ],
  },
];

export default function PoliticaDevolucionPage() {
  return (
    <>
      {/* Header */}
      <section className="border-b border-border bg-gradient-to-br from-primary-soft via-white to-surface-muted">
        <Container className="py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-1.5 text-sm font-medium text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Política Comercial
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Política de Devoluciones y Reembolsos
            </h1>
            <p className="mt-4 text-base leading-7 text-muted">
              En Merkley Details nos comprometemos con la calidad de nuestros
              productos. A continuación detallamos las condiciones para
              devoluciones, cambios, garantías y reembolsos.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Última actualización: {LAST_UPDATED}
            </p>
          </div>
        </Container>
      </section>

      {/* Content */}
      <section className="py-16">
        <Container size="sm">
          <LegalTemplateBanner />
          <div className="space-y-10">
            {SECTIONS.map((section) => (
              <div key={section.title}>
                <h2 className="text-xl font-semibold tracking-tight">
                  {section.title}
                </h2>
                <div className="mt-3 space-y-3">
                  {section.content.map((paragraph, i) => (
                    <p
                      key={i}
                      className="text-sm leading-7 text-muted whitespace-pre-line"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Back link */}
          <div className="mt-16 flex justify-center">
            <Button variant="outline" rounded="full" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Inicio
              </Link>
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
