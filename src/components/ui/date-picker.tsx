"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { dateLabel, todayISO } from "@/lib/format";

export function DatePicker({
  value,
  onChange,
  weekdays = [0, 1, 2, 3, 4, 5, 6],
  min = todayISO(),
}: {
  value: string;
  onChange: (date: string) => void;
  weekdays?: number[];
  min?: string;
}) {
  const [month, setMonth] = useState((value || min).slice(0, 7));
  const first = new Date(`${month}-01T12:00:00Z`);
  const count = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const offset = first.getUTCDay();
  function move(delta: number) {
    const next = new Date(first);
    next.setUTCMonth(next.getUTCMonth() + delta);
    setMonth(next.toISOString().slice(0, 7));
  }
  return (
    <div className="date-picker">
      <div className="calendar-heading">
        <button
          type="button"
          className="icon-button"
          aria-label="Mês anterior"
          onClick={() => move(-1)}
          disabled={month <= min.slice(0, 7)}
        >
          <ChevronLeft size={18} />
        </button>
        <strong>
          {dateLabel(`${month}-01`, { month: "long", year: "numeric" })}
        </strong>
        <button
          type="button"
          className="icon-button"
          aria-label="Próximo mês"
          onClick={() => move(1)}
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="calendar-grid">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((day, i) => (
          <span className="calendar-day-name" key={`day-${i}`}>
            {day}
          </span>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span key={`empty-${i}`} />
        ))}
        {Array.from({ length: count }, (_, i) => {
          const date = `${month}-${(i + 1).toString().padStart(2, "0")}`;
          const disabled =
            date < min ||
            !weekdays.includes(new Date(`${date}T12:00:00Z`).getUTCDay());
          return (
            <button
              type="button"
              key={date}
              onClick={() => onChange(date)}
              disabled={disabled}
              className={`calendar-day ${value === date ? "selected" : ""} ${date === todayISO() ? "today" : ""}`}
              aria-label={dateLabel(date, {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              aria-pressed={value === date}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
