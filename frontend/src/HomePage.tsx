interface Props {
  onLogin: () => void;
  onTryNow: () => void;
  // Set when a user is signed in: the nav and buttons then lead to the
  // products screen instead of Sign in / Register.
  username?: string;
  onOpenProducts?: () => void;
  onLogout?: () => void;
}

export default function HomePage({
  onLogin,
  onTryNow,
  username,
  onOpenProducts,
  onLogout,
}: Props) {
  const signedIn = username !== undefined;
  return (
    <div className="home">
      <header className="home-nav">
        <div className="home-nav-left">
          <span className="home-brand">
            Product<sup>API</sup>
          </span>
        </div>
        <div className="home-nav-right">
          {signedIn ? (
            <>
              <span className="home-login">Hi, {username}</span>
              <button type="button" className="home-login" onClick={onLogout}>
                Logout
              </button>
              <button type="button" className="home-pill" onClick={onOpenProducts}>
                Products
              </button>
            </>
          ) : (
            <>
              <button type="button" className="home-login" onClick={onLogin}>
                Login
              </button>
              <button type="button" className="home-pill" onClick={onTryNow}>
                Sign Up
              </button>
            </>
          )}
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
        <button
          type="button"
          className="home-pill"
          onClick={signedIn ? onOpenProducts : onTryNow}
        >
          {signedIn ? "View Products" : "Get Started"} <span aria-hidden="true">↗</span>
        </button>
      </main>

      <img
        className="home-hands"
        src="/home-hands.jpg"
        alt="A robotic hand reaching toward a human hand"
      />
    </div>
  );
}
