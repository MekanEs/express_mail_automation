import { Link } from 'react-router-dom';

export const NotFoundPage = () => {
  return (
    <div className="text-center p-10">
      <h1 className="text-3xl font-bold text-red-600 mb-4">404 - Страница не найдена</h1>
      <p className="text-lg mb-6">Ой! Страницы, которую вы ищете, не существует.</p>
      <Link to="/" className="text-blue-500 hover:underline">
        Вернуться на главную
      </Link>
    </div>
  );
};
