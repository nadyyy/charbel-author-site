export type Freebie = {
  id: string;
  title: string;
  image: string;
};

export type BookPurchaseType = "physical" | "ebook";

export type Book = {
  id: number;
  title: string;
  price: string; // display price, e.g. "$15" | "$20" | "Coming Soon"
  cartPrice: number;
  description: string;
  quote: string;
  image: string;
  available: boolean;
  freebies?: Freebie[]; // only for books that include a free gift
  detailBlurb?: string; // extra paragraph for BookDetails (you’ll edit later)
  listCtaLabel?: string;
  detailCtaLabel?: string;
  purchaseType?: BookPurchaseType;
  downloadPath?: string;
};

export const books: Book[] = [
  {
    id: 1,
    title: "Carrefour",
    price: "$15",
    cartPrice: 15,
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
    cartPrice: 20,
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
    price: "$10",
    cartPrice: 10,
    description:
      "The newly released third collection from Charbel Abdallah. Encore is a continuation of poetic intensity, touching memory, longing, and artistic legacy.",
    detailBlurb:
      "A continuation of the same poetic intensity—sharper, quieter, and closer to the core.",
    quote: "I was here. I felt it all",
    image: "/books/encore.png",
    available: true,
    freebies: [
      {
        id: "bookmark-encore",
        title: "Encore Bookmark",
        image: "/accessories/encore-bookmark.jpeg",
      },
    ],
    detailCtaLabel: "Place Order",
  },
  {
    id: 4,
    title: "Icarus",
    price: "Free E-Book",
    cartPrice: 0,
    description:
      "A deeply personal collection of poetry born from loss, memory, and love that refuses to fade. Minimalist in form yet heavy in emotion, Icarus speaks to anyone who has loved deeply and lost unfairly.",
    detailBlurb:
      "Written as a tribute to a brother, a friend, a soul gone too soon, Icarus explores grief not as an end, but as a transformation.",
    quote: "Of learning that even when wings melt, something in us still learns how to fly.",
    image: "/books/icarus.png",
    available: true,
    purchaseType: "ebook",
    downloadPath: "/books/icarus.pdf",
    listCtaLabel: "Download PDF",
    detailCtaLabel: "Download PDF",
  },
];

export function isEbookBook(book: Book) {
  return book.purchaseType === "ebook";
}
