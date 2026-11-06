interface Props {
  onLogin: () => void;
  onTryNow: () => void;
}

// The stack this project is built with (shown in the footer row).
const BUILT_WITH = [
  "Spring Boot",
  "MySQL",
  "JWT Security",
  "React",
  "TypeScript",
  "Vite",
];

export default function HomePage({ onLogin, onTryNow }: Props) {
  return (
    <div className="home">
      <header className="home-nav">
        <div className="home-nav-left">
          <span className="home-brand">
            Product<sup>API</sup>
          </span>
        </div>
        <div className="home-nav-right">
          <button type="button" className="home-login" onClick={onLogin}>
            Login
          </button>
          <button type="button" className="home-pill" onClick={onTryNow}>
            Sign Up
          </button>
        </div>
      </header>

      <main className="home-hero">
        <h1>
          Manage Your Products
          <br />
          With Confidence.
        </h1>
        <p>
          Browse, add, edit and track your product catalog,
          <br />
          secured with sign-in and admin controls.
        </p>
        <button type="button" className="home-pill" onClick={onTryNow}>
          Get Started <span aria-hidden="true">↗</span>
        </button>
      </main>

      <img
        className="home-hands"
        src="/home-hands.jpg"
        alt="A robotic hand reaching toward a human hand"
      />

      <footer className="home-trusted">
        <p>Built with</p>
        <ul>
          {BUILT_WITH.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </footer>
    </div>
  );
}
