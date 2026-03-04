const HomePage = (): JSX.Element => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-display font-bold text-primary mb-6">
            Welcome to Zentaritas
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            A modern full-stack application built with React and Spring Boot
          </p>
          <div className="flex gap-4 justify-center">
            <button className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors">
              Get Started
            </button>
            <button className="px-8 py-3 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary hover:text-white transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
