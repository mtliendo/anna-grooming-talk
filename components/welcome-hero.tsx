import Link from "next/link";
import { GROOMING_SERVICES, formatDuration, formatPrice } from "@/lib/services";

const SERVICES = [
  { ...GROOMING_SERVICES[0], photo: "/photos/service-bath.jpg", alt: "A spaniel in a warm bath" },
  { ...GROOMING_SERVICES[1], photo: "/photos/service-cut.jpg", alt: "A doodle on the grooming table" },
  { ...GROOMING_SERVICES[2], photo: "/photos/service-nails.jpg", alt: "Nail trim and paw balm" },
] as const;

export function WelcomeHero() {
  return (
    <>
      <section className="home-hero">
        <figure className="hero-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/dogs/mabel.jpg"
            alt="Mabel, a mini Bernedoodle standing on a wooden deck with muddy legs, paws, and face"
            width={1980}
            height={3520}
          />
          <figcaption className="hero-caption">Mabel · she needs a groom</figcaption>
        </figure>
        <div className="hero-copy">
          <div className="hero-card">
            <p className="eyebrow">Neighborhood salon</p>
            <h1 className="display display-xl">
              Come in muddy.
              <br />
              Leave looking
              <br />
              like yourself.
            </h1>
            <p className="lede">
              Baths, trims, and full grooms — one dog at a time, by appointment.
            </p>
            <div className="cta-row">
              <Link className="btn btn-primary" href="/book">
                Book an appointment
              </Link>
              <Link className="btn btn-ghost" href="/chat">
                Message the salon
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="section-head">
            <p className="eyebrow">The book</p>
            <h2>What we do</h2>
            <p className="muted" style={{ margin: 0 }}>
              Three visits. No upsells hiding in the back room.
            </p>
          </div>
          <div className="menu-grid">
            {SERVICES.map((service) => (
              <article key={service.id} className="menu-item">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={service.photo} alt={service.alt} />
                <div className="menu-body">
                  <h3>{service.name}</h3>
                  <p>{service.blurb}</p>
                  <div className="menu-meta">
                    <span>{formatPrice(service.price)}</span>
                    <span>{formatDuration(service.durationMin)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="regular">
        <figure className="regular-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/dogs/drake.jpg"
            alt="Drake, a merle dog lying on sunlit hardwood, looking at the camera"
            width={4284}
            height={5712}
          />
          <figcaption className="hero-caption">Drake</figcaption>
        </figure>
        <div className="regular-copy">
          <p className="eyebrow">A regular</p>
          <h2 className="display display-lg">Drake, after.</h2>
          <p className="lede">
            Handsome, unhurried, just been loved. This is the feeling we send
            out the door — not a costume cut, just the dog you already know.
          </p>
        </div>
      </section>

      <section className="visit-band">
        <div className="shell">
          <p className="eyebrow">By appointment</p>
          <h2 className="display display-lg">Tuesday through Saturday, 9 to 5.</h2>
          <p className="lede">
            Register your dog, pick a service, and we&apos;ll hold the table.
            Cancellations wait on an email from you — we never drop a visit
            on a chat &ldquo;yes.&rdquo;
          </p>
          <Link className="btn btn-primary" href="/book">
            Book an appointment
          </Link>
        </div>
      </section>
    </>
  );
}
