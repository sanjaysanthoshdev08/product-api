interface Props {
  onLogin: () => void;
  onTryNow: () => void;
}

// Placeholder names for the "Trusted by" row. Replace them with your real
// customers before publishing.
const TRUSTED = [
  "MERCURY",
  "ramp",
  "HEX",
  "Vercel",
  "descript",
  "Cash App",
  "SUPERCELL",
  "runway",
];

export default function HomePage({ onLogin, onTryNow }: Props) {
  // The Insights / Solutions / Pricing links have no backend page yet, so
  // they are visual placeholders for now.
  const placeholder = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className="home">
      <header className="home-nav">
        <div className="home-nav-left">
          <span className="home-brand">
            NEXORA<sup>®</sup>
          </span>
          <nav aria-label="Main">
            <a href="#insights" onClick={placeholder}>
              Insights
            </a>
            <a href="#solutions" onClick={placeholder}>
              Solutions
            </a>
            <a href="#pricing" onClick={placeholder}>
              Pricing
            </a>
          </nav>
        </div>
        <div className="home-nav-right">
          <button type="button" className="home-login" onClick={onLogin}>
            Login
          </button>
          <button type="button" className="home-pill" onClick={onTryNow}>
            Try Now
          </button>
        </div>
      </header>

      <main className="home-hero">
        <h1>
          Bold Ideas That
          <br />
          Start With Vision.
        </h1>
        <p>
          We help modern brands craft digital stories that
          <br />
          inspire action and drive results.
        </p>
        <button type="button" className="home-pill" onClick={onTryNow}>
          Get In Touch <span aria-hidden="true">↗</span>
        </button>
      </main>

      <img
        className="home-hands"
        src="/home-hands.jpg"
        alt="A robotic hand reaching toward a human hand"
      />

      <footer className="home-trusted">
        <p>Trusted by teams of every scale</p>
        <ul>
          {TRUSTED.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </footer>
    </div>
  );
}
