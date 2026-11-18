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
    text: "Nadar es mi manera de desconectarme de la pantalla. En el agua no hay atajos: se avanza con técnica, ritmo y constancia, un largo tras otro.",
    textEn: "Swimming is how I unplug from the screen. In the water there are no shortcuts: you move forward with technique, rhythm and consistency, one lap after another.",
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
    text: "Salir a pedalear por cerros y senderos: subidas que piden resistencia, bajadas que piden foco, y la satisfacción de llegar arriba.",
    textEn: "Riding hills and trails: climbs that demand endurance, descents that demand focus, and the reward of reaching the top.",
    traits: [{ es: "Resistencia", en: "Endurance" }, { es: "Foco", en: "Focus" }, { es: "Superación", en: "Grit" }],
    photos: [],
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
