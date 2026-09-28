const fs = require('fs');
const path = require('path');

const root = process.cwd();
const blogDir = path.join(root, 'blog');

const replacements = [
  ['DiseÃ±o', 'Diseño'],
  ['diseÃ±o', 'diseño'],
  ['automatizaciÃ³n', 'automatización'],
  ['prÃ¡cticos', 'prácticos'],
  ['pÃ¡ginas', 'páginas'],
  ['pÃ¡gina', 'página'],
  ['mÃ¡s', 'más'],
  ['Ãºtil', 'útil'],
  ['Conoce cuÃ¡nto', 'Conoce cuánto'],
  ['quÃ©', 'qué'],
  ['cuÃ¡l', 'cuál'],
  ['cÃ³mo', 'cómo'],
  ['ExplicaciÃ³n', 'Explicación'],
  ['GuÃ\xada', 'Guía'],
  ['ComparaciÃ³n', 'Comparación'],
  ['opciÃ³n', 'opción'],
  ['dÃ©biles', 'débiles'],
  ['mÃ³vil', 'móvil'],
  ['pÃ¡gina web', 'página web'],
  ['pÃ¡gina completa', 'página completa'],
  ['pÃ¡gina profesional', 'página profesional'],
  ['Conoce los errores mÃ¡s comunes', 'Conoce los errores más comunes'],
  ['Descubre cÃ³mo', 'Descubre cómo'],
  ['Aprende cÃ³mo', 'Aprende cómo'],
  ['recibir mÃ¡s', 'recibir más'],
  ['Ã¡', 'á'],
  ['Ã©', 'é'],
  ['Ã\xad', 'í'],
  ['Ã³', 'ó'],
  ['Ãº', 'ú'],
  ['Ã±', 'ñ'],
  ['Â¿', '¿'],
  ['Â¡', '¡'],
  ['Â', ''],
  ['â€œ', '“'],
  ['â€\x9d', '”'],
  ['â€˜', '‘'],
  ['â€™', '’']
];

const fileSpecific = {
  'index.html': [
    ['https://angeltechsolutions.dev/blog/#blog', 'https://blog.angeltechsolutions.dev/#blog'],
    ['https://angeltechsolutions.dev/blog/', 'https://blog.angeltechsolutions.dev/'],
    ['<script src="https://cdn.tailwindcss.com"></script>', '<link rel="stylesheet" href="/assets/tailwind.css">']
  ],
  'cuanto-cuesta-una-pagina-web-en-puerto-rico.html': [
    ['<script src="https://cdn.tailwindcss.com"></script>', '<link rel="stylesheet" href="/assets/tailwind.css">'],
    ['"url": "https://angeltechsolutions.dev/blog/cuanto-cuesta-una-pagina-web-en-puerto-rico.html"', '"url": "https://blog.angeltechsolutions.dev/cuanto-cuesta-una-pagina-web-en-puerto-rico.html"']
  ],
  'problemas-que-resuelve-una-pagina-web.html': [
    ['<script src="https://cdn.tailwindcss.com"></script>', '<link rel="stylesheet" href="/assets/tailwind.css">'],
    ['"url":"https://angeltechsolutions.dev/blog/problemas-que-resuelve-una-pagina-web.html"', '"url":"https://blog.angeltechsolutions.dev/problemas-que-resuelve-una-pagina-web.html"']
  ],
  'landing-page-vs-pagina-web-completa.html': [
    ['<script src="https://cdn.tailwindcss.com"></script>', '<link rel="stylesheet" href="/assets/tailwind.css">'],
    ['"url":"https://angeltechsolutions.dev/blog/landing-page-vs-pagina-web-completa.html"', '"url":"https://blog.angeltechsolutions.dev/landing-page-vs-pagina-web-completa.html"']
  ],
  'como-aparecer-en-google-puerto-rico.html': [
    ['<script src="https://cdn.tailwindcss.com"></script>', '<link rel="stylesheet" href="/assets/tailwind.css">'],
    ['"url":"https://angeltechsolutions.dev/blog/como-aparecer-en-google-puerto-rico.html"', '"url":"https://blog.angeltechsolutions.dev/como-aparecer-en-google-puerto-rico.html"']
  ],
  'chatbot-ia-para-negocios.html': [
    ['<script src="https://cdn.tailwindcss.com"></script>', '<link rel="stylesheet" href="/assets/tailwind.css">'],
    ['"url":"https://angeltechsolutions.dev/blog/chatbot-ia-para-negocios.html"', '"url":"https://blog.angeltechsolutions.dev/chatbot-ia-para-negocios.html"']
  ],
  'errores-comunes-pagina-web.html': [
    ['<script src="https://cdn.tailwindcss.com"></script>', '<link rel="stylesheet" href="/assets/tailwind.css">'],
    ['"url":"https://angeltechsolutions.dev/blog/errores-comunes-pagina-web.html"', '"url":"https://blog.angeltechsolutions.dev/errores-comunes-pagina-web.html"']
  ]
};

for (const file of fs.readdirSync(blogDir)) {
  const fullPath = path.join(blogDir, file);
  if (!fullPath.endsWith('.html')) continue;
  let content = fs.readFileSync(fullPath, 'utf8');

  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }

  for (const [from, to] of fileSpecific[file] || []) {
    content = content.split(from).join(to);
  }

  fs.writeFileSync(fullPath, content, 'utf8');
}

console.log('Blog files cleaned and normalized.');
