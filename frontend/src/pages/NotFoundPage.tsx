import { Link } from 'react-router-dom';

export const NotFoundPage = () => {
  return (
    <div className="text-center p-10">
      <h1 className="text-3xl font-bold text-red-600 mb-4">404 - Page Not Found</h1>
      <p className="text-lg mb-6">Oops! The page you are looking for does not exist.</p>
      <Link to="/" className="text-blue-500 hover:underline">
        Go back to Dashboard
      </Link>
    </div>
  );
}; 