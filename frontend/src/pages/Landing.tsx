import { Link } from 'react-router-dom'

export default function Landing(): JSX.Element {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow-lg border-0">
              <div className="card-body p-5">
                <div className="text-center mb-5">
                  <div className="d-flex align-items-center justify-content-center mb-4">
                    <h1 className="display-3 fw-bold text-primary mb-0 me-3">MapMe</h1>
                    <img
                      src="/MapMeLogo.png"
                      alt="MapMe Logo"
                      style={{ width: '80px', height: 'auto' }}
                    />
                  </div>
                  <p className="lead text-secondary mb-2">Your Location-Based Discovery Platform</p>
                  <p className="text-muted">
                    Find places, experiences, and services near you with personalized
                    recommendations
                  </p>
                </div>

                <div className="d-grid gap-3 mt-5">
                  <Link to="/signin" className="btn btn-primary btn-lg py-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="currentColor"
                      className="bi bi-box-arrow-in-right me-2"
                      viewBox="0 0 16 16"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 3.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 0-1 0v2A1.5 1.5 0 0 0 6.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-8A1.5 1.5 0 0 0 5 3.5v2a.5.5 0 0 0 1 0z"
                      />
                      <path
                        fillRule="evenodd"
                        d="M11.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H1.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"
                      />
                    </svg>
                    <span className="fs-5 fw-semibold">Sign In</span>
                  </Link>

                  <Link to="/signup" className="btn btn-outline-secondary btn-lg py-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="currentColor"
                      className="bi bi-person-plus me-2"
                      viewBox="0 0 16 16"
                    >
                      <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H1s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C9.516 10.68 8.289 10 6 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z" />
                      <path
                        fillRule="evenodd"
                        d="M13.5 5a.5.5 0 0 1 .5.5V7h1.5a.5.5 0 0 1 0 1H14v1.5a.5.5 0 0 1-1 0V8h-1.5a.5.5 0 0 1 0-1H13V5.5a.5.5 0 0 1 .5-.5"
                      />
                    </svg>
                    <span className="fs-5 fw-semibold">Create Account</span>
                  </Link>
                </div>

                <div className="mt-5 text-center">
                  <small className="text-muted">
                    Discover what&apos;s around you with smart, personalized recommendations
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
