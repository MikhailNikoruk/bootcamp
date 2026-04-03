export type Theme = "light" | "dark";

export type District = {
  slug: string;
  name: string;
};

export type Sport = {
  slug: string;
  name: string;
};

export type Venue = {
  id: string;
  name: string;
  address: string;
  districtSlug: string;
  sportSlugs: string[];
  description: string;
  capacity: number;
  pricePerHour: number;
};

export type Catalog = {
  settings: {
    startHour: number;
    endHour: number;
  };
  districts: District[];
  sports: Sport[];
  venues: Venue[];
};

export type Booking = {
  id: string;
  venueId: string;
  date: string;
  time: string;
  createdAt: string;
  status: "CONFIRMED" | "CANCELED";
};

export type VenueFilters = {
  district: string;
  sport: string;
  query: string;
};
