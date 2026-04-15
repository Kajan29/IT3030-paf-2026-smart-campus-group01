const Footer = (): JSX.Element => {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-primary text-white py-6 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm">&copy; {currentYear} Smart Campus. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer
