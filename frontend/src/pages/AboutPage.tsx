const AboutPage = (): JSX.Element => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-16">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-primary mb-6">About Zentaritas</h1>
        <p className="text-lg text-slate-600 mb-12">
          Zentaritas is a modern web application designed to provide 
          a seamless user experience with cutting-edge technology.
        </p>
        <div className="">
          <h2 className="text-3xl font-display font-bold text-primary mb-6">Tech Stack</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-primary mb-4">Frontend</h3>
              <ul className="space-y-2 text-slate-600">
                <li>React 18</li>
                <li>Vite</li>
                <li>React Router</li>
                <li>Axios</li>
                <li>Tailwind CSS</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-primary mb-4">Backend</h3>
              <ul className="space-y-2 text-slate-600">
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
