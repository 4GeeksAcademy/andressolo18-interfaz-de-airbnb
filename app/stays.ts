export type Stay = {
  id: number;
  city: string;
  title: string;
  image: string;
  price: number;
  rating: string;
  favorite: boolean;
};

export const cities = ["Viña del Mar", "Santiago", "Pucón"];

const photos = [
  "photo-1522708323590-d24dbb6b0267",
  "photo-1502672260266-1c1ef2d93688",
  "photo-1493809842364-78817add7ffb",
  "photo-1484154218962-a197022b5858",
  "photo-1560448204-e02f11c3d0e2",
  "photo-1560185008-b033106af5c3",
  "photo-1512917774080-9991f1c4c750",
  "photo-1449158743715-0a90ebb6d2d8",
  "photo-1600210492486-724fe5c67fb0",
  "photo-1600607687939-ce8a6c25118c",
];

export const stays: Stay[] = cities.flatMap((city, cityIndex) =>
  Array.from({ length: 9 }, (_, index) => ({
    id: cityIndex * 10 + index,
    city,
    title: `${cityIndex === 2 ? "Cabaña" : "Apartamento"} en ${city}`,
    image: `https://images.unsplash.com/${photos[(index + cityIndex * 3) % photos.length]}?auto=format&fit=crop&w=900&q=85`,
    price: [261050, 480157, 324900, 391500, 285300, 510800, 352000, 298700, 430200][index] - cityIndex * 27000,
    rating: ["4.9", "4.94", "4.98", "4.87", "4.95", "4.92", "4.99", "4.89", "4.96"][index],
    favorite: index !== 3 && index !== 7,
  })),
);