export interface TermsSection {
  title: string;
  paragraphs: string[];
}

export const TERMS_SECTIONS: TermsSection[] = [
  {
    title: "Proceso de Orden",
    paragraphs: [
      "Para iniciar la producción se requiere un anticipo del 50% del total de la orden.",
      "El pago del 100% contra entrega solo aplica con orden de compra o cotización firmada y sellada, enviada por correo electrónico.",
      "Al aceptar la cotización, el cliente acepta íntegramente estos Términos y Condiciones.",
    ],
  },
  {
    title: "Disponibilidad de Inventario",
    paragraphs: [
      "Todos los productos están sujetos a disponibilidad y existencias al momento de confirmar la orden.",
      "En caso de agotamiento, se ofrecerá un producto equivalente.",
    ],
  },
  {
    title: "Revisión y Aprobación de Artes",
    paragraphs: [
      "El cliente es responsable de revisar y aprobar artes, textos y diseños antes de producción.",
      "Merkley Details no se responsabiliza por errores en información previamente aprobada.",
    ],
  },
  {
    title: "Cambios Posteriores a la Aprobación",
    paragraphs: [
      "Una vez aprobada la orden, no se permiten cambios en productos, cantidades, diseños o personalización.",
      "Cualquier modificación será cotizada como una nueva orden y podrá afectar los plazos de entrega.",
    ],
  },
  {
    title: "Aprobación y Fecha de Entrega",
    paragraphs: [
      "La fecha de entrega se acuerda antes de aprobar la orden y funciona como fecha límite.",
      "El plazo regular de entrega es de 5 a 10 días laborables.",
      "En temporada alta, el plazo puede ajustarse según la capacidad operativa.",
      "Una vez completada la orden, el cliente debe estar disponible para recibirla, aun si se finaliza antes de la fecha límite.",
    ],
  },
  {
    title: "Tiempos de Respuesta del Cliente",
    paragraphs: [
      "Los plazos de entrega se calculan a partir de:\n• Recepción del pago\n• Aprobación de artes\n• Confirmación final de la orden",
      "Retrasos por parte del cliente extienden automáticamente los tiempos de entrega.",
    ],
  },
  {
    title: "Envíos y Logística",
    paragraphs: [
      "El costo de envío varía según ubicación y volumen.",
      "Las cotizaciones incluyen envío a una sola localidad.",
      "Envíos a múltiples localidades o sucursales conllevan un costo adicional por destino, calculado desde nuestras instalaciones.",
    ],
  },
  {
    title: "Órdenes Divididas",
    paragraphs: [
      "La división de una orden en cajas por sucursal o destino genera un costo adicional por empaque y logística.",
    ],
  },
  {
    title: "Órdenes Urgentes",
    paragraphs: [
      "Pedidos solicitados con 3 días o menos de antelación a la fecha de entrega tendrán un recargo del 30% sobre el total de la orden.",
    ],
  },
  {
    title: "Entrega, Recepción y Reclamaciones",
    paragraphs: [
      "La firma de la orden de recibo confirma que el producto fue recibido conforme en cantidad y calidad, tras verificación al momento de la entrega.",
      "No se aceptan reclamaciones por faltantes o daños visibles una vez firmada la orden de recibo.",
      "Cualquier reclamación posterior deberá realizarse dentro del plazo establecido por la empresa y con evidencia verificable (fotos, videos y número de pedido).",
      "No se procesarán reclamaciones fuera de plazo ni sin pruebas.",
      "En caso de errores imputables a Merkley Details, la empresa asumirá los costos de reposición y logística.",
      "Las reclamaciones serán evaluadas en un máximo de 48 horas laborables tras recibir toda la información.",
    ],
  },
  {
    title: "Almacenamiento de Órdenes Completadas",
    paragraphs: [
      "Las órdenes finalizadas deberán ser retiradas o recibidas dentro de un plazo máximo de 5 días laborables, contados desde que la orden esté lista.",
      "Pasado este plazo, podrán aplicarse cargos por almacenamiento o reprogramación de entrega.",
    ],
  },
  {
    title: "Cancelaciones",
    paragraphs: [
      "No se permiten cancelaciones una vez aprobada la orden.",
      "En casos excepcionales, las cancelaciones posteriores estarán sujetas al pago del 50% del total de la orden, no reembolsable.",
    ],
  },
  {
    title: "Muestras",
    paragraphs: [
      "Las muestras se cobran al 100% del valor del producto.",
      "Tiempo de elaboración: 3 a 5 días laborables.",
      "Las muestras no son reembolsables.",
    ],
  },
  {
    title: "Personalización",
    paragraphs: [
      "La personalización aplica únicamente a artículos marcados como personalizables en el catálogo y la cotización.",
      "No se aceptan cambios ni devoluciones por errores en nombres, textos o diseños aprobados por el cliente.",
    ],
  },
  {
    title: "Devoluciones y Garantías",
    paragraphs: [
      "Productos personalizados: No aplican cambios ni devoluciones tras la aprobación, salvo defectos de fábrica (no aplica a artículos electrónicos).",
      "La personalización no se repite; solo se sustituye el producto base, si aplica garantía.",
      "Productos electrónicos: Garantía de 5 días calendario desde la entrega para reportar fallos de fábrica.",
      "El reporte debe realizarse con foto o video, en un plazo máximo de 7 días calendario.",
      "La garantía no cubre golpes, humedad, mal uso o alteraciones externas.",
      "Cambios y reposiciones: No se realizan reembolsos.",
      "Se ofrecerán reposiciones o vales de crédito si el producto está fuera de stock.",
      "No incluye reimpresión de personalización ni empaque.",
    ],
  },
  {
    title: "Facturación",
    paragraphs: [
      "Las facturas deben solicitarse al momento de enviar la orden, firmadas y selladas.",
      "Facturas fiscales disponibles para montos superiores a RD$2,000.",
    ],
  },
  {
    title: "Pagos y Facturación",
    paragraphs: [
      "Las facturas solo pueden ser modificadas hasta el día 10 del mes siguiente a la orden.",
      "Todas las facturas tienen un plazo de crédito de 30 días desde su emisión.",
      "Saldos no pagados después de 60 días generarán un interés moratorio del 5% mensual hasta su pago total.",
    ],
  },
  {
    title: "Notas de Crédito Internas",
    paragraphs: [
      "Aplican por pagos en exceso o diferencias atribuibles al cliente.",
      "Uso exclusivo en Merkley Details; no reembolsables ni transferibles.",
      "Vigencia de 180 días calendario desde su emisión.",
      "Deben indicarse al realizar un nuevo pedido y no aplican una vez emitida la factura fiscal final.",
    ],
  },
  {
    title: "Fuerza Mayor",
    paragraphs: [
      "Merkley Details no será responsable por retrasos ocasionados por causas ajenas a su control.",
      "En estos casos, los plazos podrán ajustarse sin penalidad.",
    ],
  },
  {
    title: "Comunicación Oficial",
    paragraphs: [
      "Toda coordinación, aprobación o reclamación deberá realizarse únicamente a través de los canales oficiales de Merkley Details.",
    ],
  },
];

export const TERMS_FOOTER =
  "Al aceptar la cotización, el cliente reconoce haber leído, comprendido y aceptado estos Términos y Condiciones, los cuales forman parte integral de la relación comercial con Merkley Details.";

// Legacy flat string for backward compat
export const TERMS_AND_CONDITIONS = TERMS_SECTIONS.map(
  (s) => `${s.title}\n${s.paragraphs.join("\n")}`
).join("\n\n");
