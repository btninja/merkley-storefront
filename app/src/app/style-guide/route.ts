import { NextResponse } from "next/server";

export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Style Guide | Merkley Details</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #ffa8b7;
      --primary-hover: #c4808c;
      --primary-soft: #fff0f2;
      --primary-fg: #4a4244;
      --bg: #fafafa;
      --surface: #ffffff;
      --surface-muted: #f4f4f5;
      --fg: #635a5c;
      --muted: #8a8385;
      --muted-fg: #b5adaf;
      --border: #e4e4e7;
      --success: #10b981;
      --warning: #f59e0b;
      --destructive: #ef4444;
      --info: #3b82f6;
      --radius: 12px;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Manrope', system-ui, sans-serif;
      background: var(--bg);
      color: var(--fg);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    .container { max-width: 1100px; margin: 0 auto; padding: 48px 24px; }
    h1 { font-size: 2.5rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 8px; }
    h1 span { color: var(--primary); }
    h2 {
      font-size: 1.5rem; font-weight: 700; letter-spacing: -0.01em;
      margin: 56px 0 24px; padding-top: 32px; border-top: 1px solid var(--border);
    }
    h2:first-of-type { border-top: none; margin-top: 40px; }
    h3 { font-size: 1rem; font-weight: 600; margin: 28px 0 12px; color: var(--fg); }
    p.subtitle { font-size: 1.1rem; color: var(--muted); max-width: 640px; margin-bottom: 32px; }
    .badge {
      display: inline-block; padding: 4px 12px; border-radius: 999px;
      font-size: 0.75rem; font-weight: 600; background: var(--primary-soft); color: var(--primary-hover);
      margin-bottom: 16px;
    }

    /* Logo */
    .logo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
    @media (max-width: 640px) { .logo-grid { grid-template-columns: 1fr; } }
    .logo-box {
      border-radius: var(--radius); padding: 48px; display: flex; align-items: center;
      justify-content: center; border: 1px solid var(--border);
    }
    .logo-box.light { background: #fff; }
    .logo-box.dark { background: #2a2526; border-color: #2a2526; }
    .logo-box img { height: 48px; width: auto; }
    .logo-info { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    @media (max-width: 640px) { .logo-info { grid-template-columns: 1fr; } }
    .logo-info-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px;
    }
    .logo-info-card .label { font-size: 0.8rem; font-weight: 600; margin-bottom: 8px; }
    .logo-info-card .value { font-size: 0.85rem; color: var(--muted); }
    .logo-info-card .swatch {
      width: 36px; height: 36px; border-radius: 8px; display: inline-block; vertical-align: middle; margin-right: 10px;
    }
    .rules-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
    @media (max-width: 640px) { .rules-grid { grid-template-columns: 1fr 1fr; } }
    .rule { font-size: 0.8rem; color: var(--muted); }
    .rule strong { color: var(--destructive); margin-right: 4px; }

    /* Colors */
    .color-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    @media (max-width: 640px) { .color-grid { grid-template-columns: repeat(2, 1fr); } }
    .swatch-card .preview {
      height: 72px; border-radius: var(--radius); border: 1px solid var(--border); margin-bottom: 8px;
    }
    .swatch-card .name { font-size: 0.85rem; font-weight: 600; }
    .swatch-card .hex { font-size: 0.75rem; color: var(--muted); font-family: monospace; }
    .swatch-card .var { font-size: 0.7rem; color: var(--muted-fg); font-family: monospace; }

    /* Typography */
    .type-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
      padding: 32px; margin-bottom: 24px;
    }
    .type-row { display: flex; align-items: baseline; gap: 24px; padding: 16px 0; border-bottom: 1px solid var(--border); }
    .type-row:last-child { border-bottom: none; }
    .type-label { font-size: 0.7rem; font-family: monospace; color: var(--muted); width: 120px; flex-shrink: 0; }
    .weight-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    @media (max-width: 640px) { .weight-grid { grid-template-columns: repeat(2, 1fr); } }
    .weight-box {
      background: var(--surface-muted); border-radius: var(--radius); padding: 16px;
    }
    .weight-box .sample { font-size: 1.2rem; margin-bottom: 4px; }
    .weight-box .meta { font-size: 0.7rem; font-family: monospace; color: var(--muted); }

    /* Components */
    .btn {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 10px 20px; border-radius: var(--radius); font-size: 0.875rem;
      font-weight: 500; font-family: inherit; border: 1px solid transparent;
      cursor: pointer; transition: all 0.15s;
    }
    .btn-primary { background: var(--primary); color: var(--primary-fg); }
    .btn-primary:hover { background: var(--primary-hover); color: #fff; }
    .btn-secondary { background: var(--surface-muted); color: var(--fg); }
    .btn-outline { background: transparent; border-color: var(--border); color: var(--fg); }
    .btn-ghost { background: transparent; color: var(--fg); }
    .btn-ghost:hover { background: var(--surface-muted); }
    .btn-destructive { background: var(--destructive); color: #fff; }
    .btn-sm { padding: 6px 12px; font-size: 0.75rem; }
    .btn-lg { padding: 14px 32px; font-size: 1rem; }
    .btn-pill { border-radius: 999px; }
    .badge-row { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
    .bdg {
      display: inline-block; padding: 3px 10px; border-radius: 999px;
      font-size: 0.75rem; font-weight: 500;
    }
    .bdg-default { background: var(--primary-soft); color: var(--primary-hover); }
    .bdg-secondary { background: var(--surface-muted); color: var(--fg); }
    .bdg-success { background: #d1fae5; color: #065f46; }
    .bdg-warning { background: #fef3c7; color: #92400e; }
    .bdg-destructive { background: #fee2e2; color: #991b1b; }
    .bdg-info { background: #dbeafe; color: #1e40af; }
    .bdg-outline { background: transparent; border: 1px solid var(--border); color: var(--fg); }
    .btn-row { display: flex; flex-wrap: wrap; gap: 10px; margin: 12px 0 24px; }
    .card-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 16px 0 32px; }
    @media (max-width: 640px) { .card-grid { grid-template-columns: 1fr; } }
    .card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 16px; padding: 24px; box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }
    .card.accent { border-color: var(--primary); }
    .card.soft { background: var(--primary-soft); border-color: transparent; }
    .card h4 { font-size: 0.95rem; font-weight: 600; margin-bottom: 8px; }
    .card p { font-size: 0.8rem; color: var(--muted); }
    .input-demo {
      width: 100%; height: 40px; border-radius: var(--radius); border: 1px solid var(--border);
      padding: 0 12px; font-family: inherit; font-size: 0.875rem; background: var(--surface);
      outline: none; transition: border 0.15s, box-shadow 0.15s;
    }
    .input-demo:focus { border-color: var(--primary); box-shadow: 0 0 0 2px var(--primary-soft); }
    .input-label { font-size: 0.8rem; font-weight: 500; margin-bottom: 6px; display: block; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 12px 0; }
    @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } }

    /* Layout */
    .radius-row { display: flex; flex-wrap: wrap; gap: 20px; margin: 16px 0 32px; }
    .radius-item { text-align: center; }
    .radius-box {
      width: 56px; height: 56px; background: rgba(255,168,183,0.2);
      border: 2px solid var(--primary); margin-bottom: 6px;
    }
    .radius-meta { font-size: 0.7rem; font-family: monospace; color: var(--muted); }
    .spacing-row { display: flex; align-items: center; gap: 12px; margin: 4px 0; }
    .spacing-label { font-size: 0.7rem; font-family: monospace; color: var(--muted); width: 32px; text-align: right; }
    .spacing-bar { height: 14px; background: var(--primary); border-radius: 2px; }
    .spacing-value { font-size: 0.7rem; color: var(--muted); }

    /* Tokens table */
    .token-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin: 16px 0; }
    .token-table th {
      text-align: left; padding: 12px 16px; background: var(--surface-muted);
      font-weight: 600; font-size: 0.8rem; border-bottom: 1px solid var(--border);
    }
    .token-table td {
      padding: 10px 16px; border-bottom: 1px solid var(--border); vertical-align: middle;
    }
    .token-table tr:hover { background: rgba(244,244,245,0.5); }
    .token-table .mono { font-family: monospace; font-size: 0.75rem; }
    .token-table .color-dot {
      display: inline-block; width: 14px; height: 14px; border-radius: 4px;
      border: 1px solid var(--border); vertical-align: middle; margin-right: 6px;
    }

    /* Language section */
    .lang-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 16px 0; }
    @media (max-width: 640px) { .lang-grid { grid-template-columns: 1fr; } }
    .lang-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px;
    }
    .lang-card h4 { font-size: 0.9rem; font-weight: 600; margin-bottom: 8px; color: var(--fg); }
    .lang-card .do { color: var(--success); font-weight: 600; font-size: 0.75rem; margin-bottom: 4px; }
    .lang-card .dont { color: var(--destructive); font-weight: 600; font-size: 0.75rem; margin-bottom: 4px; }
    .lang-card .example { font-size: 0.85rem; color: var(--muted); margin: 4px 0; padding-left: 12px; border-left: 2px solid var(--border); }
    .lang-card .example.good { border-color: var(--success); }
    .lang-card .example.bad { border-color: var(--destructive); }
    .tone-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin: 16px 0; }
    .tone-table th { text-align: left; padding: 10px 16px; background: var(--surface-muted); font-weight: 600; border-bottom: 1px solid var(--border); }
    .tone-table td { padding: 10px 16px; border-bottom: 1px solid var(--border); }

    /* Footer */
    .footer {
      text-align: center; padding: 48px 0 0; margin-top: 48px; border-top: 1px solid var(--border);
    }
    .footer img { height: 28px; margin-bottom: 12px; }
    .footer p { font-size: 0.8rem; color: var(--muted); }
    .footer .small { font-size: 0.7rem; margin-top: 4px; }
  </style>
</head>
<body>
<div class="container">

  <!-- Header -->
  <div class="badge">Brand Guide</div>
  <h1>Merkley Details <span>Style Guide</span></h1>
  <p class="subtitle">Complete brand reference &mdash; logo, colors, typography, components, language, and design tokens. Single source of truth for all brand decisions.</p>

  <!-- ═══════════ LOGO ═══════════ -->
  <h2>Logo &amp; Brand Mark</h2>

  <div class="logo-grid">
    <div class="logo-box light">
      <img src="/logo_merkley.svg" alt="Merkley Details Logo">
    </div>
    <div class="logo-box dark">
      <img src="/logo_merkley.svg" alt="Merkley Details Logo">
    </div>
  </div>

  <div class="logo-info">
    <div class="logo-info-card">
      <div class="label">Logo Color</div>
      <div class="value"><span class="swatch" style="background:#f6a6b6"></span> #f6a6b6</div>
    </div>
    <div class="logo-info-card">
      <div class="label">File Format</div>
      <div class="value">SVG (vector, scalable)<br><code>/logo_merkley.svg</code></div>
    </div>
    <div class="logo-info-card">
      <div class="label">Clear Space</div>
      <div class="value">Minimum 1&times; logo height on all sides</div>
    </div>
  </div>

  <h3>Usage Rules</h3>
  <div class="rules-grid">
    <div class="rule"><strong>&times;</strong> Do not stretch or distort</div>
    <div class="rule"><strong>&times;</strong> Do not change the logo color</div>
    <div class="rule"><strong>&times;</strong> Do not place on busy backgrounds</div>
    <div class="rule"><strong>&times;</strong> Do not add effects (shadows, outlines)</div>
  </div>

  <!-- ═══════════ COLORS ═══════════ -->
  <h2>Color Palette</h2>

  <h3>Brand Primary</h3>
  <div class="color-grid">
    <div class="swatch-card"><div class="preview" style="background:#ffa8b7"></div><div class="name">Primary</div><div class="hex">#ffa8b7</div><div class="var">--primary</div></div>
    <div class="swatch-card"><div class="preview" style="background:#c4808c"></div><div class="name">Primary Hover</div><div class="hex">#c4808c</div><div class="var">--primary-hover</div></div>
    <div class="swatch-card"><div class="preview" style="background:#fff0f2"></div><div class="name">Primary Soft</div><div class="hex">#fff0f2</div><div class="var">--primary-soft</div></div>
    <div class="swatch-card"><div class="preview" style="background:#4a4244"></div><div class="name">Primary Foreground</div><div class="hex">#4a4244</div><div class="var">--primary-foreground</div></div>
  </div>

  <h3>Surfaces &amp; Backgrounds</h3>
  <div class="color-grid">
    <div class="swatch-card"><div class="preview" style="background:#fafafa"></div><div class="name">Background</div><div class="hex">#fafafa</div><div class="var">--background</div></div>
    <div class="swatch-card"><div class="preview" style="background:#ffffff"></div><div class="name">Surface</div><div class="hex">#ffffff</div><div class="var">--surface</div></div>
    <div class="swatch-card"><div class="preview" style="background:#f4f4f5"></div><div class="name">Surface Muted</div><div class="hex">#f4f4f5</div><div class="var">--surface-muted</div></div>
    <div class="swatch-card"><div class="preview" style="background:#f0f0f1"></div><div class="name">Surface Hover</div><div class="hex">#f0f0f1</div><div class="var">--surface-hover</div></div>
  </div>

  <h3>Text &amp; Borders</h3>
  <div class="color-grid">
    <div class="swatch-card"><div class="preview" style="background:#635a5c"></div><div class="name">Foreground</div><div class="hex">#635a5c</div><div class="var">--foreground</div></div>
    <div class="swatch-card"><div class="preview" style="background:#8a8385"></div><div class="name">Muted</div><div class="hex">#8a8385</div><div class="var">--muted</div></div>
    <div class="swatch-card"><div class="preview" style="background:#b5adaf"></div><div class="name">Muted Foreground</div><div class="hex">#b5adaf</div><div class="var">--muted-foreground</div></div>
    <div class="swatch-card"><div class="preview" style="background:#e4e4e7"></div><div class="name">Border</div><div class="hex">#e4e4e7</div><div class="var">--border</div></div>
  </div>

  <h3>Semantic Colors</h3>
  <div class="color-grid">
    <div class="swatch-card"><div class="preview" style="background:#10b981"></div><div class="name">Success</div><div class="hex">#10b981</div><div class="var">--success</div></div>
    <div class="swatch-card"><div class="preview" style="background:#f59e0b"></div><div class="name">Warning</div><div class="hex">#f59e0b</div><div class="var">--warning</div></div>
    <div class="swatch-card"><div class="preview" style="background:#ef4444"></div><div class="name">Destructive</div><div class="hex">#ef4444</div><div class="var">--destructive</div></div>
    <div class="swatch-card"><div class="preview" style="background:#3b82f6"></div><div class="name">Info</div><div class="hex">#3b82f6</div><div class="var">--info</div></div>
  </div>

  <!-- ═══════════ TYPOGRAPHY ═══════════ -->
  <h2>Typography</h2>

  <div class="type-card">
    <div style="margin-bottom:20px">
      <span style="font-size:0.85rem;color:var(--muted)">Font Family:</span>
      <strong style="margin-left:8px">Manrope</strong>
      <span class="bdg bdg-outline" style="margin-left:8px">Google Fonts</span>
    </div>
    <div class="type-row"><span class="type-label">Display / 4xl&ndash;6xl</span><span style="font-size:2.5rem;font-weight:700;letter-spacing:-0.02em">Detalles Corporativos</span></div>
    <div class="type-row"><span class="type-label">Heading / 3xl</span><span style="font-size:1.875rem;font-weight:700;letter-spacing:-0.01em">Regalos Personalizados</span></div>
    <div class="type-row"><span class="type-label">Subheading / xl</span><span style="font-size:1.25rem;font-weight:600">Termos, Tazas y Vasos</span></div>
    <div class="type-row"><span class="type-label">Body / base</span><span style="font-size:1rem">Solicita tu cotizaci&oacute;n sin compromiso para detalles corporativos de calidad.</span></div>
    <div class="type-row"><span class="type-label">Small / sm</span><span style="font-size:0.875rem;color:var(--muted)">Entrega disponible en toda la Rep&uacute;blica Dominicana.</span></div>
    <div class="type-row"><span class="type-label">Caption / xs</span><span style="font-size:0.75rem;color:var(--muted)">Precios sujetos a cambio sin previo aviso. Aplican t&eacute;rminos y condiciones.</span></div>
  </div>

  <h3>Font Weights</h3>
  <div class="weight-grid">
    <div class="weight-box"><div class="sample" style="font-weight:400">Merkley</div><div class="meta">Regular (400)</div></div>
    <div class="weight-box"><div class="sample" style="font-weight:500">Merkley</div><div class="meta">Medium (500)</div></div>
    <div class="weight-box"><div class="sample" style="font-weight:600">Merkley</div><div class="meta">Semibold (600)</div></div>
    <div class="weight-box"><div class="sample" style="font-weight:700">Merkley</div><div class="meta">Bold (700)</div></div>
  </div>

  <!-- ═══════════ COMPONENTS ═══════════ -->
  <h2>Components</h2>

  <h3>Buttons</h3>
  <div class="btn-row">
    <button class="btn btn-primary">Default</button>
    <button class="btn btn-secondary">Secondary</button>
    <button class="btn btn-outline">Outline</button>
    <button class="btn btn-ghost">Ghost</button>
    <button class="btn btn-destructive">Destructive</button>
  </div>
  <div class="btn-row">
    <button class="btn btn-primary btn-sm">Small</button>
    <button class="btn btn-primary">Default</button>
    <button class="btn btn-primary btn-lg">Large</button>
    <button class="btn btn-primary btn-pill">Rounded Full</button>
  </div>

  <h3>Badges</h3>
  <div class="badge-row">
    <span class="bdg bdg-default">Default</span>
    <span class="bdg bdg-secondary">Secondary</span>
    <span class="bdg bdg-success">Success</span>
    <span class="bdg bdg-warning">Warning</span>
    <span class="bdg bdg-destructive">Destructive</span>
    <span class="bdg bdg-info">Info</span>
    <span class="bdg bdg-outline">Outline</span>
  </div>

  <h3>Form Elements</h3>
  <div class="form-grid">
    <div><label class="input-label">Text Input</label><input class="input-demo" placeholder="Escribe aqu&iacute;..."></div>
    <div><label class="input-label">Disabled Input</label><input class="input-demo" placeholder="No disponible" disabled style="opacity:0.5;cursor:not-allowed"></div>
  </div>

  <h3>Cards</h3>
  <div class="card-grid">
    <div class="card"><h4>Card Title</h4><p>Basic card with header and content. Uses rounded-xl, border, and shadow-sm.</p></div>
    <div class="card accent"><span class="bdg bdg-default" style="margin-bottom:12px;display:inline-block">Featured</span><h4>Highlighted Card</h4><p>Card with primary border accent for emphasis.</p></div>
    <div class="card soft"><h4>Soft Card</h4><p>Card using primary-soft background for brand warmth.</p></div>
  </div>

  <!-- ═══════════ LANGUAGE & COMMUNICATION ═══════════ -->
  <h2>Language &amp; Communication Guide</h2>

  <h3>Brand Voice</h3>
  <table class="tone-table">
    <thead><tr><th>Attribute</th><th>We Are</th><th>We Are Not</th></tr></thead>
    <tbody>
      <tr><td><strong>Tone</strong></td><td>C&aacute;lido, cercano, profesional</td><td>Fr&iacute;o, corporativo, distante</td></tr>
      <tr><td><strong>Language</strong></td><td>Espa&ntilde;ol dominicano claro y accesible</td><td>Jerga t&eacute;cnica innecesaria, spanglish excesivo</td></tr>
      <tr><td><strong>Approach</strong></td><td>Consultivo &mdash; asesoramos, no vendemos</td><td>Agresivo, pushy, vendedor de presi&oacute;n</td></tr>
      <tr><td><strong>Personality</strong></td><td>Como un aliado que te ayuda a quedar bien</td><td>Un proveedor gen&eacute;rico m&aacute;s</td></tr>
    </tbody>
  </table>

  <h3>Writing Style</h3>
  <div class="lang-grid">
    <div class="lang-card">
      <h4>Headings &amp; Titles</h4>
      <div class="do">&#10003; Usar</div>
      <div class="example good">Detalles que dejan huella</div>
      <div class="example good">Tu marca en cada regalo</div>
      <div class="dont">&#10007; Evitar</div>
      <div class="example bad">COMPRA AHORA!! OFERTAS INCRE&Iacute;BLES</div>
      <div class="example bad">Los mejores productos del mercado</div>
    </div>
    <div class="lang-card">
      <h4>Descripciones de Producto</h4>
      <div class="do">&#10003; Usar</div>
      <div class="example good">Termo t&eacute;rmico de acero inoxidable con tu logo grabado. Mantiene bebidas fr&iacute;as por 12 horas.</div>
      <div class="dont">&#10007; Evitar</div>
      <div class="example bad">Termo de la mejor calidad premium incre&iacute;ble amazing.</div>
    </div>
    <div class="lang-card">
      <h4>Llamados a la Acci&oacute;n (CTAs)</h4>
      <div class="do">&#10003; Usar</div>
      <div class="example good">Solicitar cotizaci&oacute;n</div>
      <div class="example good">Ver cat&aacute;logo completo</div>
      <div class="example good">Hablar con un asesor</div>
      <div class="dont">&#10007; Evitar</div>
      <div class="example bad">COMPRAR YA</div>
      <div class="example bad">No te lo pierdas</div>
    </div>
    <div class="lang-card">
      <h4>Comunicaci&oacute;n con Clientes</h4>
      <div class="do">&#10003; Usar</div>
      <div class="example good">&iexcl;Hola! Gracias por contactarnos. Con mucho gusto te ayudamos con tu cotizaci&oacute;n.</div>
      <div class="dont">&#10007; Evitar</div>
      <div class="example bad">Estimado se&ntilde;or/se&ntilde;ora, por medio de la presente...</div>
    </div>
  </div>

  <h3>Key Phrases &amp; Vocabulary</h3>
  <table class="tone-table">
    <thead><tr><th>Usar</th><th>En vez de</th><th>Contexto</th></tr></thead>
    <tbody>
      <tr><td><strong>Detalles corporativos</strong></td><td>Productos promocionales</td><td>T&eacute;rmino principal de la marca</td></tr>
      <tr><td><strong>Cotizaci&oacute;n sin compromiso</strong></td><td>Presupuesto / Quote</td><td>CTAs y formularios</td></tr>
      <tr><td><strong>Personalizado con tu logo</strong></td><td>Customizable / Con branding</td><td>Descripciones de producto</td></tr>
      <tr><td><strong>Entrega en toda RD</strong></td><td>Env&iacute;o nacional</td><td>Informaci&oacute;n de env&iacute;o</td></tr>
      <tr><td><strong>Tu aliado en detalles</strong></td><td>Tu proveedor de confianza</td><td>About / Tagline</td></tr>
      <tr><td><strong>Regalos que dejan huella</strong></td><td>Regalos de calidad</td><td>Marketing / Ads</td></tr>
    </tbody>
  </table>

  <h3>Numbers &amp; Formatting</h3>
  <div class="lang-grid">
    <div class="lang-card">
      <h4>Precios</h4>
      <div class="example good">RD$ 1,250.00</div>
      <div class="example bad">$1250 / DOP 1,250</div>
      <div class="value" style="margin-top:8px;font-size:0.8rem">Siempre usar RD$ con separador de miles (,) y decimales (.)</div>
    </div>
    <div class="lang-card">
      <h4>Tel&eacute;fonos</h4>
      <div class="example good">809-555-1234</div>
      <div class="example bad">8095551234 / (809) 555-1234</div>
      <div class="value" style="margin-top:8px;font-size:0.8rem">Formato: XXX-XXX-XXXX sin par&eacute;ntesis</div>
    </div>
  </div>

  <!-- ═══════════ LAYOUT ═══════════ -->
  <h2>Layout &amp; Spacing</h2>

  <h3>Border Radius</h3>
  <div class="radius-row">
    <div class="radius-item"><div class="radius-box" style="border-radius:4px"></div><div class="radius-meta">sm (4px)</div></div>
    <div class="radius-item"><div class="radius-box" style="border-radius:6px"></div><div class="radius-meta">md (6px)</div></div>
    <div class="radius-item"><div class="radius-box" style="border-radius:12px"></div><div class="radius-meta">lg (12px)</div></div>
    <div class="radius-item"><div class="radius-box" style="border-radius:16px"></div><div class="radius-meta">xl (16px)</div></div>
    <div class="radius-item"><div class="radius-box" style="border-radius:9999px"></div><div class="radius-meta">full</div></div>
  </div>

  <h3>Spacing Scale</h3>
  <div style="margin:16px 0 32px">
    <div class="spacing-row"><span class="spacing-label">1</span><div class="spacing-bar" style="width:4px"></div><span class="spacing-value">4px</span></div>
    <div class="spacing-row"><span class="spacing-label">2</span><div class="spacing-bar" style="width:8px"></div><span class="spacing-value">8px</span></div>
    <div class="spacing-row"><span class="spacing-label">3</span><div class="spacing-bar" style="width:12px"></div><span class="spacing-value">12px</span></div>
    <div class="spacing-row"><span class="spacing-label">4</span><div class="spacing-bar" style="width:16px"></div><span class="spacing-value">16px</span></div>
    <div class="spacing-row"><span class="spacing-label">6</span><div class="spacing-bar" style="width:24px"></div><span class="spacing-value">24px</span></div>
    <div class="spacing-row"><span class="spacing-label">8</span><div class="spacing-bar" style="width:32px"></div><span class="spacing-value">32px</span></div>
    <div class="spacing-row"><span class="spacing-label">12</span><div class="spacing-bar" style="width:48px"></div><span class="spacing-value">48px</span></div>
    <div class="spacing-row"><span class="spacing-label">16</span><div class="spacing-bar" style="width:64px"></div><span class="spacing-value">64px</span></div>
    <div class="spacing-row"><span class="spacing-label">20</span><div class="spacing-bar" style="width:80px"></div><span class="spacing-value">80px</span></div>
  </div>

  <!-- ═══════════ TOKENS ═══════════ -->
  <h2>Design Tokens</h2>

  <div style="overflow-x:auto">
    <table class="token-table">
      <thead><tr><th>Token</th><th>CSS Variable</th><th>Value</th><th>Usage</th></tr></thead>
      <tbody>
        <tr><td>Primary</td><td class="mono">--primary</td><td><span class="color-dot" style="background:#ffa8b7"></span><span class="mono">#ffa8b7</span></td><td>CTAs, active states, brand accents</td></tr>
        <tr><td>Primary Hover</td><td class="mono">--primary-hover</td><td><span class="color-dot" style="background:#c4808c"></span><span class="mono">#c4808c</span></td><td>Button hover, link hover</td></tr>
        <tr><td>Primary Soft</td><td class="mono">--primary-soft</td><td><span class="color-dot" style="background:#fff0f2"></span><span class="mono">#fff0f2</span></td><td>Light backgrounds, badges</td></tr>
        <tr><td>Background</td><td class="mono">--background</td><td><span class="color-dot" style="background:#fafafa"></span><span class="mono">#fafafa</span></td><td>Page background</td></tr>
        <tr><td>Surface</td><td class="mono">--surface</td><td><span class="color-dot" style="background:#ffffff"></span><span class="mono">#ffffff</span></td><td>Cards, modals, dropdowns</td></tr>
        <tr><td>Foreground</td><td class="mono">--foreground</td><td><span class="color-dot" style="background:#635a5c"></span><span class="mono">#635a5c</span></td><td>Primary text</td></tr>
        <tr><td>Muted</td><td class="mono">--muted</td><td><span class="color-dot" style="background:#8a8385"></span><span class="mono">#8a8385</span></td><td>Secondary text, captions</td></tr>
        <tr><td>Border</td><td class="mono">--border</td><td><span class="color-dot" style="background:#e4e4e7"></span><span class="mono">#e4e4e7</span></td><td>Dividers, input borders</td></tr>
        <tr><td>Ring</td><td class="mono">--ring</td><td><span class="color-dot" style="background:#ffa8b7"></span><span class="mono">#ffa8b7</span></td><td>Focus rings</td></tr>
        <tr><td>Radius</td><td class="mono">--radius</td><td class="mono">0.75rem (12px)</td><td>Base border radius</td></tr>
        <tr><td>Font</td><td class="mono">--font-manrope</td><td class="mono">Manrope</td><td>Primary typeface</td></tr>
        <tr><td>Theme</td><td class="mono">meta theme-color</td><td><span class="color-dot" style="background:#ffa8b7"></span><span class="mono">#ffa8b7</span></td><td>Browser UI chrome</td></tr>
      </tbody>
    </table>
  </div>

  <!-- Footer -->
  <div class="footer">
    <img src="/logo_merkley.svg" alt="Merkley Details">
    <p>Merkley Details Brand Style Guide &middot; March 2026</p>
    <p class="small">For internal use. Do not distribute without permission.</p>
  </div>

</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
