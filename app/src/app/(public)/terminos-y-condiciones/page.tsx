import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Términos y Condiciones | Merkley Details",
  description:
    "Lee los términos y condiciones de uso de la plataforma de Merkley Details para cotizaciones, pedidos y servicios de detalles corporativos en República Dominicana.",
  alternates: {
    canonical: "https://merkleydetails.com/terminos-y-condiciones",
  },
};

const LAST_UPDATED = "13 de marzo de 2026";

interface PolicySection {
  title: string;
  content: string[];
}

const SECTIONS: PolicySection[] = [
  {
    title: "1. Aceptación de los Términos",
    content: [
      "Al acceder y utilizar el sitio web merkleydetails.com y los servicios ofrecidos por Merkley Details SRL (en adelante \"Merkley Details\", \"nosotros\" o \"la Empresa\"), usted acepta cumplir con estos Términos y Condiciones de uso.",
      "Si no está de acuerdo con alguno de estos términos, le solicitamos que no utilice nuestros Servicios. El uso continuado del sitio constituye la aceptación de estos términos y cualquier modificación posterior.",
      "Estos términos aplican a todos los usuarios del sitio, incluyendo visitantes, usuarios registrados y clientes.",
    ],
  },
  {
    title: "2. Descripción de los Servicios",
    content: [
      "Merkley Details es una empresa dedicada a la venta y personalización de productos corporativos, regalos empresariales y detalles promocionales. A través de nuestro sitio web ofrecemos:",
      "• Catálogo de productos corporativos y promocionales\n• Sistema de cotización en línea\n• Personalización de productos con logos, nombres y colores corporativos\n• Gestión de pedidos y facturación\n• Comunicación con nuestro equipo de ventas vía WhatsApp y correo electrónico",
      "Los productos y servicios están disponibles exclusivamente para empresas, instituciones y profesionales con domicilio o actividad comercial en la República Dominicana.",
    ],
  },
  {
    title: "3. Registro y Cuenta de Usuario",
    content: [
      "Para acceder a ciertas funcionalidades del sitio (cotizaciones, historial de pedidos, facturación), debe crear una cuenta de usuario proporcionando información veraz y actualizada.",
      "Usted es responsable de:\n• Mantener la confidencialidad de sus credenciales de acceso\n• Todas las actividades realizadas bajo su cuenta\n• Notificarnos inmediatamente si sospecha uso no autorizado de su cuenta\n• Mantener actualizada su información de contacto y datos fiscales",
      "Nos reservamos el derecho de suspender o cancelar cuentas que violen estos términos, proporcionen información falsa o realicen actividades fraudulentas.",
    ],
  },
  {
    title: "4. Cotizaciones y Pedidos",
    content: [
      "Las cotizaciones generadas a través de nuestra plataforma tienen una vigencia indicada en cada documento (generalmente 15 días calendario, salvo indicación contraria).",
      "Los precios están expresados en pesos dominicanos (DOP) y no incluyen ITBIS (18%) a menos que se indique explícitamente. Los precios pueden variar sin previo aviso para cotizaciones no confirmadas.",
      "Una cotización se considera confirmada y vinculante cuando:\n• El cliente aprueba formalmente la cotización (por escrito o a través de la plataforma)\n• Se recibe el pago inicial acordado (si aplica)\n• Se aprueba el arte o diseño de personalización (si aplica)",
      "Una vez confirmada la orden, aplican las condiciones de cancelación establecidas en nuestra Política de Devoluciones.",
    ],
  },
  {
    title: "5. Precios y Pagos",
    content: [
      "Los métodos de pago aceptados incluyen:\n• Transferencia bancaria\n• Cheque certificado\n• Tarjeta de crédito (sujeto a disponibilidad)\n• Crédito comercial (para clientes aprobados)",
      "Las condiciones de pago se establecen en cada cotización y pueden incluir:\n• Pago anticipado del 50% al confirmar la orden\n• Saldo contra entrega o según términos de crédito acordados",
      "El incumplimiento en los pagos puede resultar en la suspensión de la producción, retención de productos terminados y/o aplicación de cargos por mora según la legislación dominicana vigente.",
    ],
  },
  {
    title: "6. Personalización de Productos",
    content: [
      "Para productos personalizados, el cliente es responsable de:\n• Proporcionar archivos de arte en alta resolución y formatos adecuados\n• Verificar y aprobar las muestras digitales o físicas antes de la producción\n• Confirmar la correcta escritura de nombres, textos y datos",
      "Una vez aprobado el arte por el cliente, Merkley Details no se hace responsable por errores en textos, logotipos o diseños que hayan sido proporcionados o aprobados por el cliente.",
      "Los colores del producto final pueden presentar variaciones menores respecto a las muestras digitales, debido a las diferencias inherentes entre pantallas e impresión/producción física.",
    ],
  },
  {
    title: "7. Entrega",
    content: [
      "Los tiempos de entrega estimados se comunican al confirmar cada orden y dependen del tipo de producto, nivel de personalización y volumen del pedido.",
      "Los tiempos de entrega comienzan a contar desde la aprobación del arte y la recepción del pago inicial, no desde la fecha de la cotización.",
      "Merkley Details realizará su mejor esfuerzo para cumplir con los plazos estimados, pero no garantiza fechas exactas de entrega. Factores fuera de nuestro control (proveedores internacionales, aduanas, condiciones climáticas) pueden causar retrasos.",
      "Las entregas se realizan en la dirección indicada por el cliente dentro del Gran Santo Domingo. Entregas fuera de esta zona pueden estar sujetas a cargos adicionales de envío.",
    ],
  },
  {
    title: "8. Propiedad Intelectual",
    content: [
      "Todo el contenido del sitio web (textos, imágenes, diseños, logotipos, software) es propiedad de Merkley Details o de sus licenciantes y está protegido por las leyes de propiedad intelectual de la República Dominicana.",
      "El cliente conserva todos los derechos sobre sus logotipos, marcas y diseños proporcionados para la personalización de productos. Al proporcionarnos estos materiales, el cliente declara que tiene los derechos necesarios para su uso.",
      "Nos reservamos el derecho de utilizar fotografías de productos terminados en nuestro portafolio y redes sociales, salvo que el cliente solicite expresamente lo contrario por escrito.",
    ],
  },
  {
    title: "9. Limitación de Responsabilidad",
    content: [
      "Merkley Details no será responsable por:\n• Daños indirectos, incidentales o consecuentes derivados del uso de nuestros Servicios\n• Interrupciones temporales del sitio web por mantenimiento o causas técnicas\n• Pérdida de datos debido a fallos tecnológicos fuera de nuestro control\n• Uso indebido de productos por parte del cliente o terceros",
      "Nuestra responsabilidad máxima en cualquier caso se limita al valor total del pedido en cuestión.",
      "Estas limitaciones se aplican en la máxima medida permitida por la legislación dominicana.",
    ],
  },
  {
    title: "10. Devoluciones y Garantías",
    content: [
      "Las condiciones de devolución, cambio, garantía y reembolso se rigen por nuestra Política de Devoluciones y Reembolsos, disponible en merkleydetails.com/politica-de-devolucion.",
      "Dicha política forma parte integral de estos Términos y Condiciones.",
    ],
  },
  {
    title: "11. Privacidad",
    content: [
      "El tratamiento de sus datos personales se rige por nuestra Política de Privacidad, disponible en merkleydetails.com/politica-de-privacidad.",
      "Al utilizar nuestros Servicios, usted acepta el tratamiento de sus datos según lo descrito en dicha política.",
    ],
  },
  {
    title: "12. Modificaciones",
    content: [
      "Nos reservamos el derecho de modificar estos Términos y Condiciones en cualquier momento. Los cambios entrarán en vigor al ser publicados en esta página.",
      "Es responsabilidad del usuario revisar periódicamente estos términos. El uso continuado de los Servicios después de la publicación de modificaciones constituye la aceptación de los términos actualizados.",
    ],
  },
  {
    title: "13. Legislación Aplicable y Jurisdicción",
    content: [
      "Estos Términos y Condiciones se rigen por las leyes de la República Dominicana.",
      "Para cualquier controversia derivada del uso de nuestros Servicios, las partes se someten a la jurisdicción de los tribunales competentes de Santo Domingo, República Dominicana.",
      "Antes de acudir a instancias judiciales, las partes se comprometen a buscar una solución amigable en un plazo de 30 días desde la notificación de la controversia.",
    ],
  },
  {
    title: "14. Contacto",
    content: [
      "Para consultas sobre estos Términos y Condiciones, puede contactarnos:",
      "• Correo electrónico: info@merkleydetails.com\n• WhatsApp: Disponible en nuestra página de contacto\n• Dirección: Santo Domingo, República Dominicana\n• Horario de atención: Lunes a viernes, 9:00 AM a 6:00 PM",
    ],
  },
];

export default function TerminosCondicionesPage() {
  return (
    <>
      {/* Header */}
      <section className="border-b border-border bg-gradient-to-br from-primary-soft via-white to-surface-muted">
        <Container className="py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-1.5 text-sm font-medium text-primary">
              <FileText className="h-3.5 w-3.5" />
              Legal
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Términos y Condiciones
            </h1>
            <p className="mt-4 text-base leading-7 text-muted">
              Estos términos regulan el uso de los servicios de Merkley
              Details, incluyendo cotizaciones, pedidos, personalización y
              entrega de productos corporativos.
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
