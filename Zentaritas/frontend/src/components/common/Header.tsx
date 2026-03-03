import { Link } from 'react-router-dom'
import './Header.css'

const Header = (): JSX.Element => {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <h1>Zentaritas</h1>
          </Link>
          <nav className="nav">
            <ul className="nav-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About</Link></li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header
