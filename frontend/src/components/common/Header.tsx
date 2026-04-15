import { Link } from 'react-router-dom'

const Header = (): JSX.Element => {
  return (
    <header className="bg-primary text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <h1 className="text-2xl font-display font-bold">Smart Campus</h1>
          </Link>
          <nav className="flex items-center gap-8">
            <ul className="flex gap-6">
              <li>
                <Link to="/" className="hover:text-secondary transition-colors font-semibold">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-secondary transition-colors font-semibold">
                  About
                </Link>
              </li>
            </ul>
            <div className="flex gap-4">
              <Link 
                to="/auth/login" 
                className="hover:text-secondary transition-colors font-semibold"
              >
                Login
              </Link>
              <Link 
                to="/auth/register" 
                className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors font-semibold"
              >
                Register
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header
