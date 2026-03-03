import './HomePage.css'

const HomePage = (): JSX.Element => {
  return (
    <div className="home-page">
      <div className="container">
        <div className="hero">
          <h1>Welcome to Zentaritas</h1>
          <p>A modern full-stack application built with React and Spring Boot</p>
          <div className="hero-actions">
            <button className="btn btn-primary">Get Started</button>
            <button className="btn btn-outline">Learn More</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
