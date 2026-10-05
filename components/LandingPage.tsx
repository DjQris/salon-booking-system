import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  Droplets,
  Scissors,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-header">
        <Link className="wordmark" href="/" aria-label="Aura and Edge home">
          <Scissors size={23} strokeWidth={1.5} />
          <span>Aura & Edge</span>
        </Link>
        <div className="header-trail">
          <span className="header-slash">/</span>
          <span>The salon</span>
        </div>
        <nav aria-label="Main navigation">
          <Link href="/admin/login">
            Admin sign in <ArrowRight size={14} />
          </Link>
        </nav>
      </header>

      <main id="main-content">
        <div className="salon-cover">
          <img
            src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=2000&q=85"
            alt="Light-filled salon with styling chairs, tall mirrors and plants"
            fetchPriority="high"
          />
          <span className="cover-caption">A LITTLE TIME, JUST FOR YOU.</span>
        </div>
        <div className="landing-document">
          <div className="document-mark" aria-hidden="true">
            <Scissors size={38} strokeWidth={1.25} />
          </div>
          <section className="welcome-section" aria-labelledby="welcome-title">
            <p className="document-eyebrow">
              <span /> YOUR EVERYDAY, ELEVATED
            </p>
            <h1 id="welcome-title">Aura & Edge Salon</h1>
            <p className="welcome-description">
              Good hair. A little self-care. Time well spent.
              <br className="desktop-break" /> Your next salon visit starts
              here.
            </p>
            <div className="welcome-actions">
              <Link className="primary-button" href="/signin">
                Sign in to book <ArrowRight size={17} />
              </Link>
              <span className="signin-note">
                <ShieldCheck size={15} /> Secure sign-in with Google
              </span>
            </div>
          </section>

          <section
            className="service-overview"
            aria-labelledby="services-title"
          >
            <div className="overview-heading">
              <h2 id="services-title">A little care for everyone.</h2>
              <span>Our services</span>
            </div>
            <div className="service-columns">
              <div>
                <Scissors size={22} strokeWidth={1.5} />
                <h3>Cut & shape</h3>
                <p>
                  Fresh cuts, clean shaves and
                  <br className="desktop-break" /> little ones&apos; first
                  trims.
                </p>
                <span>Adults & children</span>
              </div>
              <div>
                <Sparkles size={22} strokeWidth={1.5} />
                <h3>Braid & style</h3>
                <p>
                  Plaiting, protective styles and
                  <br className="desktop-break" /> a finish that feels like you.
                </p>
                <span>Made for your look</span>
              </div>
              <div>
                <Droplets size={22} strokeWidth={1.5} />
                <h3>Wash & care</h3>
                <p>
                  A fresh wash, deep conditioning
                  <br className="desktop-break" /> and care from root to tip.
                </p>
                <span>A moment to reset</span>
              </div>
            </div>
          </section>
          <div className="visit-details">
            <span>
              <CalendarDays size={16} /> Your day. Your time.
            </span>
            <span>
              <Clock3 size={16} /> Book a time that works for you.
            </span>
            <Link href="/signin">
              Plan your visit <ChevronRight size={15} />
            </Link>
          </div>
          <footer className="landing-footer">
            <span>
              Aura & Edge <span className="footer-dot">·</span> Unisex salon
            </span>
            <Link href="/admin/login">
              Salon team <ArrowRight size={14} />
            </Link>
          </footer>
        </div>
      </main>
    </div>
  );
}
