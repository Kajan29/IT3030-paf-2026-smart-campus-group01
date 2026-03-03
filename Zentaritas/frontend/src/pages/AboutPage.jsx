import './AboutPage.css'

const AboutPage = () => {
  return (
    <div className="about-page">
      <div className="container">
        <h1>About Zentaritas</h1>
        <p>
          Zentaritas is a modern web application designed to provide 
          a seamless user experience with cutting-edge technology.
        </p>
        <div className="tech-stack">
          <h2>Tech Stack</h2>
          <div className="tech-cards">
            <div className="tech-card">
              <h3>Frontend</h3>
              <ul>
                <li>React 18</li>
                <li>Vite</li>
                <li>React Router</li>
                <li>Axios</li>
              </ul>
            </div>
            <div className="tech-card">
              <h3>Backend</h3>
              <ul>
                <li>Spring Boot 3</li>
                <li>Spring Security</li>
                <li>Spring Data JPA</li>
                <li>MySQL</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutPage
