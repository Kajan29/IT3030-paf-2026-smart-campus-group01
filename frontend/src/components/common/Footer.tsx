import './Footer.css'

const Footer = (): JSX.Element => {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="footer">
      <div className="container">
        <p>&copy; {currentYear} Zentaritas. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer
