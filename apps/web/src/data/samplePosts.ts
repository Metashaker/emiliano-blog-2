import type { Post } from '../lib/ghost';

// Built-in sample content so the site runs before Ghost is connected.
// Replace by setting GHOST_URL + GHOST_CONTENT_API_KEY in .env.
export const samplePosts: Post[] = [
  {
    id: 'sample-1-en',
    slug: 'from-patterns-to-programs',
    lang: 'en',
    title: 'From Patterns to Programs',
    excerpt:
      'What cutting fabric taught me about cutting scope — the surprising overlap between tailoring and software.',
    html: `<p>For years my tools were shears, chalk, and a dress form. A garment is a system: constraints of body, cloth, and movement resolved into a single object. Software turned out to feel eerily familiar.</p><p>A pattern is an interface. A seam is a contract. And a bad fit, like a bad abstraction, is obvious the moment someone tries to move.</p><h2>Constraints are a gift</h2><p>The blank canvas is a myth. In fashion the body is the spec; in software the problem is. The discipline is the same: listen to the constraint before you cut.</p>`,
    publishedAt: '2026-07-02T09:00:00.000Z',
    readingTime: 4,
    tags: ['craft', 'career'],
    translationKey: 'tk-1',
  },
  {
    id: 'sample-1-es',
    slug: 'de-patrones-a-programas',
    lang: 'es',
    title: 'De patrones a programas',
    excerpt:
      'Lo que cortar tela me enseñó sobre acotar el alcance: la sorprendente cercanía entre la sastrería y el software.',
    html: `<p>Durante años mis herramientas fueron tijeras, tiza y un maniquí. Una prenda es un sistema: las restricciones del cuerpo, la tela y el movimiento resueltas en un solo objeto. El software resultó extrañamente familiar.</p><p>Un patrón es una interfaz. Una costura es un contrato. Y un mal calce, como una mala abstracción, se nota apenas alguien intenta moverse.</p><h2>Las restricciones son un regalo</h2><p>El lienzo en blanco es un mito. En la moda el cuerpo es la especificación; en el software lo es el problema. La disciplina es la misma: escucha la restricción antes de cortar.</p>`,
    publishedAt: '2026-07-02T09:00:00.000Z',
    readingTime: 4,
    tags: ['oficio', 'carrera'],
    translationKey: 'tk-1',
  },
  {
    id: 'sample-2-en',
    slug: 'reading-log-summer',
    lang: 'en',
    title: 'A Reading Log',
    excerpt:
      'Three books that rewired how I think about attention, systems, and the long game.',
    html: `<p>I keep a running log of what I read and, more importantly, what changed because of it. Here are three from this season.</p><p><em>Seeing Like a State</em> reframed every dashboard I have ever built. <em>The Timeless Way of Building</em> is secretly a book about software. And a slim volume of Cavafy reminded me that the journey clause is load-bearing.</p>`,
    publishedAt: '2026-06-18T09:00:00.000Z',
    readingTime: 3,
    tags: ['books'],
    translationKey: 'tk-2',
  },
  {
    id: 'sample-2-es',
    slug: 'diario-de-lectura-verano',
    lang: 'es',
    title: 'Un diario de lectura',
    excerpt:
      'Tres libros que reconfiguraron cómo pienso la atención, los sistemas y el largo plazo.',
    html: `<p>Llevo un registro de lo que leo y, sobre todo, de lo que cambió por leerlo. Aquí van tres de esta temporada.</p><p><em>Seeing Like a State</em> replanteó cada panel que he construido. <em>The Timeless Way of Building</em> es, en secreto, un libro sobre software. Y un delgado volumen de Cavafis me recordó que el viaje es lo que sostiene todo.</p>`,
    publishedAt: '2026-06-18T09:00:00.000Z',
    readingTime: 3,
    tags: ['libros'],
    translationKey: 'tk-2',
  },
  {
    id: 'sample-3-en',
    slug: 'building-in-public',
    lang: 'en',
    title: 'Notes on Building in Public',
    excerpt:
      'Why I am publishing the architecture of this very blog before it is finished.',
    html: `<p>This site is being built in the open. The plan, the trade-offs, even the hosting math — all of it lives alongside the writing. Publishing the scaffolding is a forcing function: it keeps the decisions honest.</p><p>Phase one is a free, bilingual blog. Later phases add membership and a shared identity across a small constellation of products. But today, it is just words on a dark field of stars.</p>`,
    publishedAt: '2026-08-01T09:00:00.000Z',
    readingTime: 2,
    tags: ['work', 'meta'],
    // No translationKey pair -> demonstrates the "no translation" fallback.
  },
];
