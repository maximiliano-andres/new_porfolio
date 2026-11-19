/* "Hobbies" window: the person behind the code. Texts are yours to edit (Spanish + English twin).

   HOW TO ADD YOUR PHOTOS
   1. Put the images in frontend/public/img/hobbies/ (WebP or JPG, about 1200 px on the long side and < 300 KB:
        cwebp -q 82 -resize 1200 0 foto.jpg -o natacion-1.webp
   2. List them in `photos` below, e.g.
        photos: [{ src: "/img/hobbies/natacion-1.webp", alt: "Nadando en la piscina", altEn: "Swimming laps", w: 1200, h: 900 }],
      (w/h = the image's real size: the gallery reserves the space, so nothing jumps while it loads)
   3. npm run build. Each hobby shows its photos as a stack of polaroids that open in a lightbox.
   With no photos, the hobby shows only its animated illustration. */
import { Bike, BookOpen, Waves } from "lucide-react";

export const HOBBIES = [
  {
    id: "swimming",
    Icon: Waves,
    color: "#38bdf8",
    name: "Natación",
    nameEn: "Swimming",
    tagline: "Largo tras largo",
    taglineEn: "Lap after lap",
    text: `Nadar es mi manera de desconectarme de la pantalla. Durante mi adolescencia fui nadador federado, una etapa que marcó mucho mi forma de enfrentar los desafíos. Entrenar constantemente, competir y aprender a trabajar en equipo me enseñó el valor de la disciplina, la constancia, la concentración y el compromiso.

En el agua no hay atajos: se avanza con técnica, ritmo y perseverancia, un largo tras otro. Con el tiempo entendí que esa misma mentalidad también se refleja en mi forma de trabajar: aprender, comunicarme, adaptarme, mantener la calma ante los desafíos y ser constante hasta alcanzar un objetivo.`,
    textEn: `Swimming is how I disconnect from the screen. During my teenage years I was a competitive swimmer, a period that greatly shaped how I face challenges. Consistent training, competing, and teamwork taught me the value of discipline, persistence, focus, and commitment.

In the water there are no shortcuts: you move forward with technique, rhythm, and perseverance, one lap after another. Over time I realized that this exact mindset reflects how I work: learning, communicating, adapting, staying calm through challenges, and staying consistent until achieving the goal.`,
    traits: [{ es: "Disciplina", en: "Discipline" }, { es: "Constancia", en: "Consistency" }, { es: "Técnica", en: "Technique" }],
    photos: [],
  },
  {
    id: "mtb",
    Icon: Bike,
    color: "#f97316",
    name: "Mountain bike",
    nameEn: "Mountain biking",
    tagline: "Cerro arriba",
    taglineEn: "Uphill",
    text: `Practicar enduro es otra de mis formas de desconectarme de la pantalla. Salir a pedalear por cerros y senderos combina resistencia, técnica y concentración: las subidas exigen constancia y las bajadas, foco y capacidad para reaccionar rápido ante lo que aparece en el camino.

Me gusta porque nunca se trata exactamente del mismo recorrido. Hay que adaptarse al terreno, tomar decisiones en segundos y mantener el control incluso cuando las condiciones cambian. Es una actividad que me ha enseñado a disfrutar los desafíos, ser perseverante y confiar en la experiencia para seguir avanzando, incluso cuando el camino se pone difícil.`,
    textEn: `Practicing enduro is another way I disconnect from the screen. Riding through mountains and trails combines endurance, technique, and concentration: climbs demand consistency, while descents require focus and the ability to react quickly to whatever comes along the trail.

I enjoy it because no two rides are exactly the same. You have to adapt to the terrain, make decisions in a matter of seconds, and stay in control when conditions change. It has taught me to embrace challenges, stay persistent, and trust my experience to keep moving forward, even when the trail gets difficult.`,
    traits: [{ es: "Resistencia", en: "Endurance" }, { es: "Foco", en: "Focus" }, { es: "Superación", en: "Grit" }],
    photos: [
      { src: "/img/hobbies/bici1.webp", alt: "Mountain bike en el cerro", altEn: "Mountain biking on the trail", w: 853, h: 1280 },
      { src: "/img/hobbies/bici2.webp", alt: "Sendero de enduro", altEn: "Enduro trail ride", w: 897, h: 1280 },
      { src: "/img/hobbies/bici3.webp", alt: "Ruta en bicicleta", altEn: "Bike trail", w: 585, h: 1040 },
      { src: "/img/hobbies/bici4.webp", alt: "Descenso y adrenalina", altEn: "Downhill descent", w: 900, h: 1600 },
      { src: "/img/hobbies/bici5.webp", alt: "Pedaleando en la naturaleza", altEn: "Riding through nature", w: 720, h: 1280 },
    ],
  },
  {
    id: "study",
    Icon: BookOpen,
    color: "#a78bfa",
    name: "Estudio constante",
    nameEn: "Constant learning",
    tagline: "Siempre aprendiendo",
    taglineEn: "Always learning",
    text: "Aprender es parte de mi rutina: cursos, documentación y proyectos propios donde pruebo lo que estudio. Este portafolio es uno de ellos.",
    textEn: "Learning is part of my routine: courses, documentation and side projects where I try out what I study. This portfolio is one of them.",
    traits: [{ es: "Curiosidad", en: "Curiosity" }, { es: "Mejora continua", en: "Continuous improvement" }],
    photos: [],
  },
];
