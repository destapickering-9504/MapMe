import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { PRIVACY_PATH, ROUTE_HISTORY_PATH, ROUTE_OPTIMIZER_PATH } from "../routes/paths";
import "./help-page.css";

function IconBulb({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6A4.997 4.997 0 017 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z" />
    </svg>
  );
}

function IconChat({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
    </svg>
  );
}

function IconMail({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
    </svg>
  );
}

const SUPPORT_MAIL = "support@mapme.app";
const SUPPORT_HREF = `mailto:${SUPPORT_MAIL}?subject=MapMe%20help`;

const FAQ_ITEMS: { q: string; a: ReactNode }[] = [
  {
    q: "What's the difference between Round Trip and One Way?",
    a: (
      <>
        <strong>Round trip</strong> plans a route that returns to your starting point after your stops.{" "}
        <strong>One way</strong> ends at your last stop—you are not routed back to the start.
      </>
    )
  },
  {
    q: "How many stops can I add?",
    a: "You can add between 2 and 10 stops. Empty rows are ignored when you optimize, but you need at least two filled stops to run an optimization."
  },
  {
    q: "How do I reorder stops?",
    a: "Use the grip handle on the left of each stop row and drag it to a new position in the list before you click Optimize Route."
  },
  {
    q: "Can I save routes?",
    a: (
      <>
        Yes. When you’re signed in, optimized routes can be saved and viewed in{" "}
        <Link to={ROUTE_HISTORY_PATH}>route history</Link>. Open new plans from{" "}
        <Link to={ROUTE_OPTIMIZER_PATH}>the planner</Link>.
      </>
    )
  },
  {
    q: "Do you track my location?",
    a: (
      <>
        We do not track your real-time location. For more detail, see our{" "}
        <Link to={PRIVACY_PATH}>Privacy</Link> page.
      </>
    )
  }
];

export default function HelpPage() {
  return (
    <main className="help-page app-page">
      <div className="help-page__inner">
        <div className="help-page__card">
          <h1 className="help-page__title">Help</h1>

          <hr className="help-page__rule" />

          <section className="help-page__section" aria-labelledby="help-quick-heading">
            <div className="help-page__icon help-page__icon--bulb" aria-hidden>
              <IconBulb />
            </div>
            <div className="help-page__section-body">
              <h2 id="help-quick-heading" className="help-page__section-title">
                Quick start
              </h2>
              <ol className="help-page__ol">
                <li>Add a start location</li>
                <li>Add your stops</li>
                <li>
                  Click <strong>Optimize Route</strong>
                </li>
              </ol>
            </div>
          </section>

          <hr className="help-page__rule" />

          <section className="help-page__section" aria-labelledby="help-faq-heading">
            <div className="help-page__icon help-page__icon--chat" aria-hidden>
              <IconChat />
            </div>
            <div className="help-page__section-body">
              <h2 id="help-faq-heading" className="help-page__section-title">
                Common questions
              </h2>
              <div className="help-page__faq-list">
                {FAQ_ITEMS.map((item) => (
                  <details key={item.q} className="help-page__details">
                    <summary className="help-page__summary">
                      <span className="help-page__summary-text">{item.q}</span>
                      <span className="help-page__chevron">
                        <IconChevronRight />
                      </span>
                    </summary>
                    <p className="help-page__answer">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          <hr className="help-page__rule" />

          <section className="help-page__section" aria-labelledby="help-contact-heading">
            <div className="help-page__icon help-page__icon--mail" aria-hidden>
              <IconMail />
            </div>
            <div className="help-page__section-body">
              <h2 id="help-contact-heading" className="help-page__section-title">
                Still need help?
              </h2>
              <p className="help-page__contact">
                Email us at <a href={SUPPORT_HREF}>{SUPPORT_MAIL}</a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
