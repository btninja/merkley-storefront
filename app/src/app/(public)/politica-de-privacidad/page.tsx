import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Política de Privacidad | Merkley Details",
  description:
    "Conoce cómo Merkley Details recopila, usa y protege tu información personal en nuestra plataforma de detalles corporativos y regalos personalizados.",
  alternates: {
    canonical: "https://merkleydetails.com/politica-de-privacidad",
  },
};

const LAST_UPDATED = "13 de marzo de 2026";

interface PolicySection {
  title: string;
  content: string[];
}

const SECTIONS: PolicySection[] = [
  {
    title: "1. Introducción",
    content: [
      "Merkley Details SRL (en adelante \"Merkley Details\", \"nosotros\" o \"nuestro\"), con domicilio en Santo Domingo, República Dominicana, se compromete a proteger la privacidad de los datos personales de sus usuarios, clientes y visitantes.",
      "Esta Política de Privacidad describe cómo recopilamos, utilizamos, almacenamos, compartimos y protegemos su información personal cuando utiliza nuestro sitio web merkleydetails.com, nuestra plataforma de cotizaciones en línea, y cualquier servicio asociado (colectivamente, los \"Servicios\").",
      "Al acceder a nuestros Servicios, usted acepta las prácticas descritas en esta política. Si no está de acuerdo, le solicitamos no utilizar nuestros Servicios.",
    ],
  },
  {
    title: "2. Información que Recopilamos",
    content: [
      "Recopilamos los siguientes tipos de información:",
      "Información proporcionada directamente por usted:\n• Nombre completo y datos de contacto (correo electrónico, teléfono, WhatsApp)\n• Nombre de la empresa, RNC (Registro Nacional del Contribuyente) y sector industrial\n• Dirección de facturación y entrega\n• Credenciales de acceso (correo electrónico y contraseña cifrada)\n• Preferencias de productos y detalles de cotizaciones solicitadas\n• Comunicaciones que nos envíe (correos, mensajes de WhatsApp, formularios de contacto)",
      "Información recopilada automáticamente:\n• Dirección IP y datos aproximados de ubicación geográfica\n• Tipo de navegador, sistema operativo y dispositivo\n• Páginas visitadas, tiempo de permanencia y patrones de navegación\n• Cookies y tecnologías similares de seguimiento (ver sección 7)",
    ],
  },
  {
    title: "3. Cómo Utilizamos su Información",
    content: [
      "Utilizamos su información personal para los siguientes fines:",
      "• Crear y gestionar su cuenta de usuario en nuestra plataforma\n• Procesar cotizaciones, órdenes de compra y facturación\n• Personalizar productos según sus especificaciones (logos, colores corporativos, etc.)\n• Comunicarnos con usted sobre el estado de sus pedidos, cotizaciones y servicios\n• Enviar información comercial relevante sobre nuevos productos, temporadas y promociones (con su consentimiento)\n• Mejorar nuestros Servicios, analizar tendencias de uso y optimizar la experiencia del usuario\n• Cumplir con obligaciones legales, fiscales y regulatorias aplicables en República Dominicana\n• Prevenir fraude y proteger la seguridad de nuestros Servicios",
    ],
  },
  {
    title: "4. Compartición de Información",
    content: [
      "No vendemos, alquilamos ni comercializamos su información personal con terceros. Solo compartimos datos en las siguientes circunstancias:",
      "• Proveedores de servicios: Compartimos información necesaria con proveedores que nos ayudan a operar nuestros Servicios (procesadores de pago, servicios de mensajería, proveedores de infraestructura tecnológica). Estos proveedores están obligados contractualmente a proteger su información.\n• Obligación legal: Cuando sea requerido por ley, orden judicial o solicitud de una autoridad competente de la República Dominicana.\n• Protección de derechos: Para proteger nuestros derechos legales, seguridad o propiedad, o los de nuestros usuarios.\n• Con su consentimiento: En cualquier otro caso, solicitaremos su autorización explícita antes de compartir su información.",
    ],
  },
  {
    title: "5. Almacenamiento y Seguridad",
    content: [
      "Su información personal se almacena en servidores seguros ubicados en centros de datos con medidas de protección física y lógica adecuadas.",
      "Implementamos medidas de seguridad técnicas y organizativas para proteger su información, incluyendo:\n• Cifrado de datos en tránsito mediante SSL/TLS\n• Contraseñas almacenadas con hash criptográfico (nunca en texto plano)\n• Acceso restringido a datos personales solo al personal autorizado\n• Monitoreo continuo de actividades sospechosas\n• Copias de seguridad periódicas",
      "Aunque tomamos medidas razonables para proteger su información, ningún método de transmisión o almacenamiento electrónico es 100% seguro. No podemos garantizar seguridad absoluta.",
    ],
  },
  {
    title: "6. Retención de Datos",
    content: [
      "Conservamos su información personal durante el tiempo necesario para cumplir con los fines descritos en esta política, a menos que la ley exija o permita un período de retención más prolongado.",
      "• Datos de cuenta: Mientras su cuenta permanezca activa, y hasta 2 años después de su última actividad.\n• Datos de transacciones: Según los requisitos fiscales y contables de la República Dominicana (generalmente 10 años).\n• Datos de comunicaciones: Hasta 3 años después de la última interacción.\n• Datos de análisis: De forma agregada y anonimizada, sin límite de tiempo.",
      "Puede solicitar la eliminación de su cuenta y datos personales en cualquier momento (ver sección 8).",
    ],
  },
  {
    title: "7. Cookies y Tecnologías de Seguimiento",
    content: [
      "Nuestro sitio web utiliza cookies y tecnologías similares para mejorar su experiencia:",
      "• Cookies esenciales: Necesarias para el funcionamiento del sitio (autenticación, carrito de cotización, preferencias de sesión). No se pueden desactivar.\n• Cookies de análisis: Nos ayudan a entender cómo se utiliza el sitio para mejorarlo. Utilizamos Umami Analytics, una solución de análisis web que respeta la privacidad y no utiliza cookies de seguimiento personal.\n• Cookies funcionales: Recuerdan sus preferencias (idioma, región) para personalizar su experiencia.",
      "Puede gestionar las cookies a través de la configuración de su navegador. Tenga en cuenta que desactivar ciertas cookies puede afectar la funcionalidad del sitio.",
    ],
  },
  {
    title: "8. Sus Derechos",
    content: [
      "De acuerdo con la legislación aplicable de la República Dominicana, usted tiene los siguientes derechos sobre su información personal:",
      "• Acceso: Solicitar una copia de los datos personales que tenemos sobre usted.\n• Rectificación: Corregir datos inexactos o incompletos.\n• Eliminación: Solicitar la eliminación de sus datos personales (sujeto a obligaciones legales de retención).\n• Oposición: Oponerse al tratamiento de sus datos para fines de marketing directo.\n• Portabilidad: Solicitar sus datos en un formato estructurado y de uso común.\n• Retiro de consentimiento: Retirar su consentimiento para el tratamiento de datos en cualquier momento.",
      "Para ejercer cualquiera de estos derechos, contáctenos a info@merkleydetails.com. Responderemos a su solicitud en un plazo máximo de 30 días.",
    ],
  },
  {
    title: "9. Comunicaciones de Marketing",
    content: [
      "Con su consentimiento, podemos enviarle comunicaciones comerciales sobre productos, temporadas y promociones de Merkley Details.",
      "Puede optar por no recibir estas comunicaciones en cualquier momento mediante:\n• El enlace de \"Cancelar suscripción\" incluido en cada correo electrónico\n• Contactándonos directamente a info@merkleydetails.com\n• A través de la configuración de su cuenta",
      "La cancelación de comunicaciones de marketing no afecta las comunicaciones transaccionales relacionadas con sus pedidos y cotizaciones.",
    ],
  },
  {
    title: "10. Menores de Edad",
    content: [
      "Nuestros Servicios están dirigidos a empresas y profesionales. No recopilamos intencionalmente información personal de menores de 18 años.",
      "Si descubrimos que hemos recopilado datos de un menor, los eliminaremos de inmediato. Si usted cree que un menor nos ha proporcionado información personal, contáctenos a info@merkleydetails.com.",
    ],
  },
  {
    title: "11. Cambios a esta Política",
    content: [
      "Nos reservamos el derecho de actualizar esta Política de Privacidad en cualquier momento. Los cambios se publicarán en esta página con una nueva fecha de \"Última actualización\".",
      "Si realizamos cambios sustanciales, le notificaremos mediante correo electrónico o un aviso destacado en nuestro sitio web.",
      "El uso continuado de nuestros Servicios después de la publicación de los cambios constituye su aceptación de la política actualizada.",
    ],
  },
  {
    title: "12. Marco Legal",
    content: [
      "Esta política se rige por las leyes de la República Dominicana, incluyendo la Constitución de la República Dominicana (Artículo 44 sobre el derecho a la intimidad y al honor personal) y la Ley No. 172-13 sobre Protección Integral de los Datos Personales.",
      "Para cualquier controversia relacionada con esta política, las partes se someten a la jurisdicción de los tribunales competentes de Santo Domingo, República Dominicana.",
    ],
  },
  {
    title: "13. Contacto",
    content: [
      "Si tiene preguntas, inquietudes o solicitudes relacionadas con esta Política de Privacidad o el tratamiento de sus datos personales, puede contactarnos:",
      "• Correo electrónico: info@merkleydetails.com\n• WhatsApp: Disponible en nuestra página de contacto\n• Dirección: Santo Domingo, República Dominicana\n• Horario de atención: Lunes a viernes, 9:00 AM a 6:00 PM",
    ],
  },
];

export default function PoliticaPrivacidadPage() {
  return (
    <>
      {/* Header */}
      <section className="border-b border-border bg-gradient-to-br from-primary-soft via-white to-surface-muted">
        <Container className="py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-1.5 text-sm font-medium text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Privacidad
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Política de Privacidad
            </h1>
            <p className="mt-4 text-base leading-7 text-muted">
              En Merkley Details valoramos y respetamos su privacidad. Esta
              política describe cómo recopilamos, utilizamos y protegemos su
              información personal.
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
