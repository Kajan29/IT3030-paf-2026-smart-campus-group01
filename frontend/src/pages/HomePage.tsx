import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import FeaturesSection from "../components/CoursesPreview";
import StatsSection from "../components/BookingsPreview";
import Footer from "../components/Footer";

const HomePage = (): JSX.Element => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <Footer />
    </div>
  )
}

export default HomePage
