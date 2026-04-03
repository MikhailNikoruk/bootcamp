import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { districts, playerRanking, sports, venues } from "./data/mvpData";
import { filterVenuesForStep, formatPercent, getOccupancyLabel, getOccupancyLevel } from "./lib/mvp";
import type { SelectionState, Theme, Venue } from "./types";

const THEME_KEY = "spotfit_theme";

function initialTheme(): Theme {
  const fromStorage = localStorage.getItem(THEME_KEY);
  if (fromStorage === "light" || fromStorage === "dark") {
    return fromStorage;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function occupancyClass(venue: Venue): string {
  const level = getOccupancyLevel(venue.occupancyNow, venue.capacity);
  return `status-${level}`;
}

function AppShell({
  children,
  theme,
  toggleTheme,
}: {
  children: React.ReactNode;
  theme: Theme;
  toggleTheme: () => void;
}) {
  return (
    <div className="app-shell">
      <header className="top-nav">
        <Link to="/" className="brand">
          SpotFit
        </Link>
        <div className="nav-actions">
          <Link to="/sport" className="nav-link">
            Старт
          </Link>
          <button type="button" className="theme-switch" onClick={toggleTheme}>
            {theme === "dark" ? "Светлая тема" : "Тёмная тема"}
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}

function WelcomePage() {
  return (
    <main className="welcome-page">
      <section className="hero-card">
        <p className="badge">MVP для городского спорта</p>
        <h1>Находи живые площадки и оценивай загруженность заранее</h1>
        <p>
          SpotFit показывает статус площадок по цвету, помогает выбрать спорт и посмотреть
          актуальную активность без бронирования.
        </p>
        <div className="hero-cta">
          <Link to="/sport" className="btn-primary">
            Начать
          </Link>
          <a href="#features" className="btn-ghost">
            Что внутри
          </a>
        </div>
      </section>

      <section id="features" className="feature-grid">
        <article className="feature-card">
          <h3>Цветовой статус</h3>
          <p>Пусто / средняя активность / много людей на каждой площадке.</p>
        </article>
        <article className="feature-card">
          <h3>Пошаговый UX</h3>
          <p>Выбор спорта → выбор площадки → детальный экран активности.</p>
        </article>
        <article className="feature-card">
          <h3>Мобильный интерфейс</h3>
          <p>Минималистичный дизайн адаптирован для телефона и быстрых сценариев.</p>
        </article>
      </section>
    </main>
  );
}

function SportStep({
  selection,
  setSelection,
}: {
  selection: SelectionState;
  setSelection: React.Dispatch<React.SetStateAction<SelectionState>>;
}) {
  const navigate = useNavigate();

  return (
    <main className="step-page">
      <section className="step-head">
        <p className="step-kicker">Шаг 1 из 2</p>
        <h2>Выбери вид спорта</h2>
      </section>

      <section className="sport-grid">
        {sports.map((sport) => (
          <button
            key={sport.id}
            type="button"
            className={`sport-card ${selection.sportId === sport.id ? "active" : ""}`}
            onClick={() =>
              setSelection((prev) => ({
                ...prev,
                sportId: sport.id,
                venueId: "",
              }))
            }
          >
            <span className="sport-icon">{sport.icon}</span>
            <strong>{sport.name}</strong>
            <span>{sport.description}</span>
          </button>
        ))}
      </section>

      <div className="step-footer">
        <button
          type="button"
          className="btn-primary"
          disabled={!selection.sportId}
          onClick={() => navigate("/venues")}
        >
          Дальше: площадки
        </button>
      </div>
    </main>
  );
}

function VenueStep({
  selection,
  setSelection,
}: {
  selection: SelectionState;
  setSelection: React.Dispatch<React.SetStateAction<SelectionState>>;
}) {
  const navigate = useNavigate();

  const filteredVenues = useMemo(
    () => filterVenuesForStep(venues, selection.sportId, selection.district),
    [selection.district, selection.sportId],
  );

  if (!selection.sportId) {
    return <Navigate to="/sport" replace />;
  }

  return (
    <main className="step-page">
      <section className="step-head">
        <p className="step-kicker">Шаг 2 из 2</p>
        <h2>Выбери площадку</h2>
      </section>

      <section className="filters-row">
        <label>
          Район
          <select
            value={selection.district}
            onChange={(event) =>
              setSelection((prev) => ({
                ...prev,
                district: event.target.value,
                venueId: "",
              }))
            }
          >
            <option value="">Все районы</option>
            {districts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="venue-grid">
        {filteredVenues.map((venue) => {
          const level = getOccupancyLevel(venue.occupancyNow, venue.capacity);
          const percent = formatPercent(venue.occupancyNow, venue.capacity);

          return (
            <button
              key={venue.id}
              type="button"
              className={`venue-card ${selection.venueId === venue.id ? "active" : ""}`}
              onClick={() => setSelection((prev) => ({ ...prev, venueId: venue.id }))}
            >
              <div className="venue-top">
                <strong>{venue.name}</strong>
                <span className={`status-dot ${occupancyClass(venue)}`}>
                  {getOccupancyLabel(level)}
                </span>
              </div>
              <span className="venue-subtitle">{venue.address}</span>
              <div className="occupancy-line">
                <div style={{ width: `${percent}%` }} className={`occupancy-fill ${occupancyClass(venue)}`} />
              </div>
              <div className="mini-chart">
                {venue.trend.map((value, index) => (
                  <span
                    key={`${venue.id}-${index}`}
                    className={`mini-bar ${occupancyClass(venue)}`}
                    style={{ height: `${Math.max(12, value * 5)}px` }}
                  />
                ))}
              </div>
            </button>
          );
        })}

        {filteredVenues.length === 0 ? (
          <article className="empty-card">
            <p>По выбранному фильтру пока нет площадок.</p>
          </article>
        ) : null}
      </section>

      <div className="step-footer">
        <button type="button" className="btn-ghost" onClick={() => navigate("/sport")}>Назад</button>
        <button
          type="button"
          className="btn-primary"
          disabled={!selection.venueId}
          onClick={() => navigate("/details")}
        >
          Смотреть детали
        </button>
      </div>
    </main>
  );
}

function DetailsStep({ selection }: { selection: SelectionState }) {
  if (!selection.sportId || !selection.venueId) {
    return <Navigate to="/sport" replace />;
  }

  const selectedVenue = venues.find((venue) => venue.id === selection.venueId);
  const selectedSport = sports.find((sport) => sport.id === selection.sportId);

  if (!selectedVenue) {
    return <Navigate to="/venues" replace />;
  }

  const level = getOccupancyLevel(selectedVenue.occupancyNow, selectedVenue.capacity);
  const percent = formatPercent(selectedVenue.occupancyNow, selectedVenue.capacity);

  return (
    <main className="step-page">
      <section className="step-head">
        <p className="step-kicker">Детали площадки</p>
        <h2>{selectedVenue.name}</h2>
      </section>

      <section className="confirmation-card">
        <p>
          <strong>Спорт:</strong> {selectedSport?.name}
        </p>
        <p>
          <strong>Адрес:</strong> {selectedVenue.address}
        </p>
        <p>
          <strong>Текущая загрузка:</strong> {selectedVenue.occupancyNow}/{selectedVenue.capacity}
        </p>
        <p>
          <strong>Статус:</strong> {getOccupancyLabel(level)}
        </p>
      </section>

      <section className="summary-card">
        <h3>Диаграмма загруженности</h3>
        <div className="occupancy-line large">
          <div style={{ width: `${percent}%` }} className={`occupancy-fill ${occupancyClass(selectedVenue)}`} />
        </div>
        <div className="mini-chart wide">
          {selectedVenue.trend.map((value, index) => (
            <span
              key={`${selectedVenue.id}-detail-${index}`}
              className={`mini-bar ${occupancyClass(selectedVenue)}`}
              style={{ height: `${Math.max(16, value * 7)}px` }}
            />
          ))}
        </div>
      </section>

      <section className="ranking-grid">
        <article className="rank-card">
          <h3>Рейтинг игроков</h3>
          <ol>
            {playerRanking.map((player) => (
              <li key={player.name}>
                <span>{player.name}</span>
                <strong>{player.score}</strong>
              </li>
            ))}
          </ol>
        </article>

        <article className="rank-card">
          <h3>Рейтинг площадок</h3>
          <ol>
            {venues
              .slice()
              .sort((a, b) => b.qualityScore - a.qualityScore)
              .slice(0, 4)
              .map((venue) => (
                <li key={venue.id}>
                  <span>{venue.name}</span>
                  <strong>{venue.qualityScore.toFixed(1)}</strong>
                </li>
              ))}
          </ol>
        </article>
      </section>

      <div className="step-footer">
        <Link className="btn-ghost" to="/venues">
          Назад к площадкам
        </Link>
        <Link className="btn-primary" to="/sport">
          Выбрать другой спорт
        </Link>
      </div>
    </main>
  );
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => initialTheme());
  const [selection, setSelection] = useState<SelectionState>({
    sportId: "",
    district: "",
    venueId: "",
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return (
    <AppShell theme={theme} toggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/sport" element={<SportStep selection={selection} setSelection={setSelection} />} />
        <Route path="/venues" element={<VenueStep selection={selection} setSelection={setSelection} />} />
        <Route path="/details" element={<DetailsStep selection={selection} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
