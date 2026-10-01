import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page wrap">
      <div className="empty">
        <h1 className="empty__title">Dieses Fenster gibt es nicht</h1>
        <p>Die Seite wurde verschoben oder der Link ist unvollständig.</p>
        <div className="empty__actions">
          <Link href="/" className="btn btn--primary">
            Zur Startseite
          </Link>
          <Link href="/entdecken" className="btn btn--ghost">
            Looks entdecken
          </Link>
        </div>
      </div>
    </div>
  );
}
