import Link from "next/link";
import { Check } from "lucide-react";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${light ? "brand-light" : ""}`}
      aria-label="Bookinfy, página inicial"
    >
      <span className="brand-symbol">
        <Check strokeWidth={4.5} size={21} />
      </span>
      <span>
        Bookin<span className="brand-accent">fy</span>
      </span>
    </Link>
  );
}

export function Credit({ light = false }: { light?: boolean }) {
  return (
    <p className={`credit ${light ? "credit-light" : ""}`}>
      Bookinfy © {new Date().getFullYear()} <span aria-hidden="true">·</span>{" "}
      Desenvolvido por{" "}
      <a href="https://iweti.com" target="_blank" rel="noreferrer">
        IWETI
      </a>
    </p>
  );
}
