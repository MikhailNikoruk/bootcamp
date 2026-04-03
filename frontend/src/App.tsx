import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { filterVenues, generateTimeSlots, isSlotBooked } from "./lib/booking";
import {
  loadBookings,
  loadTheme,
  loadUserVenues,
  saveBookings,
  saveTheme,
  saveUserVenues,
} from "./lib/storage";
import type { Booking, Catalog, Theme, Venue, VenueFilters } from "./types";

const DEFAULT_CATALOG: Catalog = {
  settings: { startHour: 8, endHour: 22 },
  districts: [],
  sports: [],
  venues: [],
};

function getInitialTheme(): Theme {
  const saved = loadTheme();
  if (saved) {
    return saved;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function todayValue() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatBookingDate(value: string, time: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T${time}`));
}

export default function App() {
  const [catalog, setCatalog] = useState<Catalog>(DEFAULT_CATALOG);
  const [userVenues, setUserVenues] = useState<Venue[]>(() => loadUserVenues());
  const [bookings, setBookings] = useState<Booking[]>(() => loadBookings());
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  const [filters, setFilters] = useState<VenueFilters>({ district: "", sport: "", query: "" });
  const [selectedVenueId, setSelectedVenueId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(todayValue());
  const [feedback, setFeedback] = useState<string>("");

  const [newVenue, setNewVenue] = useState({
    name: "",
    address: "",
    districtSlug: "",
    sportSlug: "",
    description: "",
    capacity: "30",
    pricePerHour: "1200",
  });

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/catalog.json`)
      .then((response) => response.json())
      .then((data: Catalog) => {
        setCatalog(data);
        setNewVenue((prev) => ({
          ...prev,
          districtSlug: data.districts[0]?.slug ?? "",
          sportSlug: data.sports[0]?.slug ?? "",
        }));
      })
      .catch(() => {
        setFeedback("Не удалось загрузить каталог. Проверьте файл данных.");
      });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    saveBookings(bookings);
  }, [bookings]);

  useEffect(() => {
    saveUserVenues(userVenues);
  }, [userVenues]);

  const allVenues = useMemo(() => [...catalog.venues, ...userVenues], [catalog.venues, userVenues]);
  const visibleVenues = useMemo(() => filterVenues(allVenues, filters), [allVenues, filters]);
  const selectedVenue = useMemo(
    () => visibleVenues.find((venue) => venue.id === selectedVenueId) ?? visibleVenues[0] ?? null,
    [visibleVenues, selectedVenueId],
  );

  const slots = useMemo(
    () => generateTimeSlots(catalog.settings.startHour, catalog.settings.endHour),
    [catalog.settings.endHour, catalog.settings.startHour],
  );

  useEffect(() => {
    if (selectedVenue && selectedVenue.id !== selectedVenueId) {
      setSelectedVenueId(selectedVenue.id);
    }
  }, [selectedVenue, selectedVenueId]);

  const confirmBooking = (time: string) => {
    if (!selectedVenue) {
      return;
    }

    if (isSlotBooked(bookings, selectedVenue.id, selectedDate, time)) {
      setFeedback("Этот слот уже занят.");
      return;
    }

    const booking: Booking = {
      id: `bk_${Date.now()}`,
      venueId: selectedVenue.id,
      date: selectedDate,
      time,
      createdAt: new Date().toISOString(),
      status: "CONFIRMED",
    };

    setBookings((prev) => [booking, ...prev]);
    setFeedback(`Бронь подтверждена: ${selectedVenue.name}, ${time}`);
  };

  const cancelBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === bookingId ? { ...booking, status: "CANCELED" } : booking,
      ),
    );
    setFeedback("Бронь отменена.");
  };

  const submitVenue = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newVenue.name || !newVenue.address || !newVenue.districtSlug || !newVenue.sportSlug) {
      setFeedback("Заполните обязательные поля новой площадки.");
      return;
    }

    const venue: Venue = {
      id: `user_${Date.now()}`,
      name: newVenue.name,
      address: newVenue.address,
      districtSlug: newVenue.districtSlug,
      sportSlugs: [newVenue.sportSlug],
      description: newVenue.description || "Пользовательская площадка",
      capacity: Number(newVenue.capacity) || 30,
      pricePerHour: Number(newVenue.pricePerHour) || 1200,
    };

    setUserVenues((prev) => [venue, ...prev]);
    setNewVenue((prev) => ({ ...prev, name: "", address: "", description: "" }));
    setFeedback("Площадка добавлена в каталог.");
  };

  const confirmedBookings = bookings.filter((booking) => booking.status === "CONFIRMED");

  return (
    <div className="app-shell">
      <header className="topbar panel">
        <div>
          <p className="eyebrow">City Sports Booking</p>
          <h1>Бронирование площадок</h1>
          <p className="muted">Данные загружаются из JSON и дополняются вашими площадками.</p>
        </div>

        <button
          type="button"
          className="theme-button"
          onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
        >
          Тема: {theme === "dark" ? "Темная" : "Светлая"}
        </button>
      </header>

      <section className="layout-grid">
        <div className="panel">
          <h2>Фильтры</h2>
          <div className="filters-grid">
            <label>
              Поиск
              <input
                value={filters.query}
                onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
                placeholder="Название или адрес"
              />
            </label>

            <label>
              Район
              <select
                value={filters.district}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, district: event.target.value }))
                }
              >
                <option value="">Все районы</option>
                {catalog.districts.map((district) => (
                  <option key={district.slug} value={district.slug}>
                    {district.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Вид спорта
              <select
                value={filters.sport}
                onChange={(event) => setFilters((prev) => ({ ...prev, sport: event.target.value }))}
              >
                <option value="">Все виды</option>
                {catalog.sports.map((sport) => (
                  <option key={sport.slug} value={sport.slug}>
                    {sport.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="venue-list">
            {visibleVenues.map((venue) => (
              <button
                key={venue.id}
                type="button"
                className={`venue-card ${venue.id === selectedVenue?.id ? "active" : ""}`}
                onClick={() => setSelectedVenueId(venue.id)}
              >
                <strong>{venue.name}</strong>
                <span>{venue.address}</span>
                <span className="chip">{formatMoney(venue.pricePerHour)} / час</span>
              </button>
            ))}
            {visibleVenues.length === 0 ? <p className="muted">Нет площадок по фильтрам.</p> : null}
          </div>
        </div>

        <div className="panel">
          <h2>Слоты</h2>
          {selectedVenue ? (
            <>
              <div className="venue-meta">
                <h3>{selectedVenue.name}</h3>
                <p>{selectedVenue.description}</p>
                <p className="muted">Вместимость: {selectedVenue.capacity} чел.</p>
              </div>

              <label>
                Дата
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                />
              </label>

              <div className="slots-grid">
                {slots.map((time) => {
                  const booked = isSlotBooked(bookings, selectedVenue.id, selectedDate, time);
                  return (
                    <button
                      key={time}
                      type="button"
                      className={`slot ${booked ? "disabled" : ""}`}
                      disabled={booked}
                      onClick={() => confirmBooking(time)}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="muted">Выберите площадку для просмотра слотов.</p>
          )}
        </div>

        <div className="panel">
          <h2>Мои брони</h2>
          <div className="bookings-list">
            {confirmedBookings.map((booking) => {
              const venue = allVenues.find((item) => item.id === booking.venueId);
              if (!venue) {
                return null;
              }

              return (
                <article key={booking.id} className="booking-item">
                  <div>
                    <strong>{venue.name}</strong>
                    <p>
                      {formatBookingDate(booking.date, booking.time)} в {booking.time}
                    </p>
                  </div>
                  <button type="button" className="danger" onClick={() => cancelBooking(booking.id)}>
                    Отменить
                  </button>
                </article>
              );
            })}
            {confirmedBookings.length === 0 ? <p className="muted">Активных броней пока нет.</p> : null}
          </div>
        </div>

        <div className="panel panel-full">
          <h2>Добавить площадку</h2>
          <form className="add-form" onSubmit={submitVenue}>
            <label>
              Название
              <input
                value={newVenue.name}
                onChange={(event) => setNewVenue((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </label>

            <label>
              Адрес
              <input
                value={newVenue.address}
                onChange={(event) => setNewVenue((prev) => ({ ...prev, address: event.target.value }))}
                required
              />
            </label>

            <label>
              Район
              <select
                value={newVenue.districtSlug}
                onChange={(event) =>
                  setNewVenue((prev) => ({ ...prev, districtSlug: event.target.value }))
                }
                required
              >
                {catalog.districts.map((district) => (
                  <option key={district.slug} value={district.slug}>
                    {district.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Спорт
              <select
                value={newVenue.sportSlug}
                onChange={(event) => setNewVenue((prev) => ({ ...prev, sportSlug: event.target.value }))}
                required
              >
                {catalog.sports.map((sport) => (
                  <option key={sport.slug} value={sport.slug}>
                    {sport.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Описание
              <input
                value={newVenue.description}
                onChange={(event) =>
                  setNewVenue((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </label>

            <label>
              Вместимость
              <input
                type="number"
                min={1}
                value={newVenue.capacity}
                onChange={(event) => setNewVenue((prev) => ({ ...prev, capacity: event.target.value }))}
              />
            </label>

            <label>
              Цена в час
              <input
                type="number"
                min={100}
                value={newVenue.pricePerHour}
                onChange={(event) =>
                  setNewVenue((prev) => ({ ...prev, pricePerHour: event.target.value }))
                }
              />
            </label>

            <button type="submit">Сохранить площадку</button>
          </form>
        </div>
      </section>

      {feedback ? <div className="feedback">{feedback}</div> : null}
    </div>
  );
}
