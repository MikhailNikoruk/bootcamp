import type { Sport, Venue } from "../types";

export const sports: Sport[] = [
  {
    id: "football",
    name: "Футбол",
    icon: "⚽",
    description: "Командные игры на открытых полях",
  },
  {
    id: "basketball",
    name: "Баскетбол",
    icon: "🏀",
    description: "Площадки 3x3 и полноформатные корты",
  },
  {
    id: "volleyball",
    name: "Волейбол",
    icon: "🏐",
    description: "Песок и универсальные сетки",
  },
  {
    id: "running",
    name: "Бег",
    icon: "🏃",
    description: "Треки и зоны интервальных тренировок",
  },
];

export const districts = ["Центр", "Север", "Юг", "Запад", "Восток"];

export const venues: Venue[] = [
  {
    id: "arena-tverskaya",
    name: "Арена Тверская",
    district: "Центр",
    sports: ["football", "running"],
    occupancyNow: 12,
    capacity: 20,
    trend: [7, 9, 12, 10, 12],
    qualityScore: 4.7,
    address: "ул. Тверская, 10",
  },
  {
    id: "park-yug",
    name: "Южный Парк Спорт",
    district: "Юг",
    sports: ["football", "volleyball"],
    occupancyNow: 4,
    capacity: 18,
    trend: [2, 3, 4, 4, 5],
    qualityScore: 4.4,
    address: "ул. Красная, 25",
  },
  {
    id: "basket-center",
    name: "Баскет Центр",
    district: "Центр",
    sports: ["basketball", "volleyball"],
    occupancyNow: 9,
    capacity: 12,
    trend: [4, 5, 7, 8, 9],
    qualityScore: 4.8,
    address: "Комсомольский пр-т, 3",
  },
  {
    id: "west-court",
    name: "Запад Корт",
    district: "Запад",
    sports: ["basketball", "running"],
    occupancyNow: 2,
    capacity: 10,
    trend: [1, 2, 1, 2, 2],
    qualityScore: 4.2,
    address: "ул. Лесная, 4",
  },
  {
    id: "north-track",
    name: "Север Трек",
    district: "Север",
    sports: ["running", "football"],
    occupancyNow: 6,
    capacity: 14,
    trend: [3, 4, 5, 6, 6],
    qualityScore: 4.5,
    address: "ул. Беговая, 22",
  },
];

export const slotOptions = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
];

export const playerRanking = [
  { name: "Артём", score: 1280 },
  { name: "Михаил", score: 1160 },
  { name: "Илья", score: 1030 },
  { name: "София", score: 980 },
];
