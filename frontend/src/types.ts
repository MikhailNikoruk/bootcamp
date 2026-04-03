export type Theme = "light" | "dark";

export type Sport = {
  id: string;
  name: string;
  icon: string;
  description: string;
};

export type Venue = {
  id: string;
  name: string;
  district: string;
  sports: string[];
  occupancyNow: number;
  capacity: number;
  trend: number[];
  qualityScore: number;
  address: string;
};

export type SelectionState = {
  sportId: string;
  district: string;
  venueId: string;
};
