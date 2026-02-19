export type Freebie = {
  id: string;
  title: string;
  image: string;
};

export type Book = {
  id: number;
  title: string;
  price: string; // "$15" | "$20" | "Coming Soon"
  description: string;
  quote: string;
  image: string;
  available: boolean;
  freebies?: Freebie[]; // only for books that include a free gift
  detailBlurb?: string; // extra paragraph for BookDetails (you’ll edit later)
};

export const books: Book[] = [
  {
    id: 1,
    title: "Carrefour",
    price: "$15",
    description:
      "Raw and honest, Carrefour navigates darkness, survival, and storytelling. A visual and emotional journey anchored by the semicolon symbol.",
    detailBlurb:
      "A clean, minimalist edition designed to be read slowly—short lines, strong silence, and a voice that stays with you.",
    quote: "This is my story—always was, always will be.",
    image: "/books/carrefour.png",
    available: true,
    freebies: [
      { id: "armageddon-insert", title: "Armageddon Insert", image: "/accessories/armageddon-insert.jpeg" },
      { id: "judas-insert", title: "Judas Insert", image: "/accessories/judas-insert.jpeg" },
      { id: "oblivion-insert", title: "Oblivion Insert", image: "/accessories/oblivion-insert.jpeg" },
    ],
  },
  {
    id: 2,
    title: "Soldier Poet King",
    price: "$20",
    description:
      "A poetic exploration of identity, impermanence, and power. Evocative and bold, this collection confronts what fades and what endures.",
    detailBlurb:
      "A bold, modern voice—mythic and personal at the same time. Strong visuals, strong lines, strong feeling.",
    quote: "Tell me why all people fade and only I remain…",
    image: "/books/soldier-poet-king.png",
    available: true,
    freebies: [
      { id: "king-bookmark", title: "King Bookmark", image: "/accessories/king-bookmark.jpeg" },
      { id: "lord-bookmark", title: "Lord Bookmark", image: "/accessories/lord-bookmark.jpeg" },
      { id: "poet-bookmark", title: "Poet Bookmark", image: "/accessories/poet-bookmark.jpeg" },
      { id: "soldier-bookmark", title: "Soldier Bookmark", image: "/accessories/soldier-bookmark.jpeg" },
    ],
  },
  {
    id: 3,
    title: "Encore",
    price: "Coming Soon",
    description:
      "The upcoming third collection from Charbel Abdallah. Encore is a continuation of poetic intensity, touching memory, longing, and artistic legacy.",
    detailBlurb:
      "A continuation of the same poetic intensity—sharper, quieter, and closer to the core.",
    quote: "Stay tuned for what's next.",
    image: "/books/encore.png",
    available: false,
  },
];
