import { Link } from 'react-router-dom'

const NotFoundPage = (): JSX.Element => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-9xl font-display font-bold text-primary mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-slate-800 mb-4">Page Not Found</h2>
        <p className="text-lg text-slate-600 mb-8">The page you are looking for doesn't exist or has been moved.</p>
        <Link to="/" className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors inline-block">
          Go Home
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage
