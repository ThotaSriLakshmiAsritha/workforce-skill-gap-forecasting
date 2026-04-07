import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';

export function ErrorFallback() {
  const navigate = useNavigate();
  const error = useRouteError();

  let message = 'Something went wrong.';
  if (isRouteErrorResponse(error)) {
    message = `${error.status} ${error.statusText}`;
  } else if (error instanceof Error && error.message) {
    message = error.message;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
      <div className="bg-card p-8 rounded-lg shadow-md w-full max-w-md border text-center space-y-4">
        <h2 className="text-2xl font-bold text-primary">Oops!</h2>
        <p className="text-muted-foreground text-sm">{message}</p>
        <button
          type="button"
          className="text-sm font-semibold text-primary hover:underline"
          onClick={() => navigate('/login', { replace: true })}
        >
          Go to login
        </button>
      </div>
    </div>
  );
}

