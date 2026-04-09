import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import AboutPreview from "../components/AboutPreview";
import FeaturesSection from "../components/CoursesPreview";
import StatsSection from "../components/BookingsPreview";
import CampusGallery from "../components/CampusGallery";
import TestimonialsSection from "../components/TestimonialsSection";
import CallToAction from "../components/CallToAction";
import Footer from "../components/Footer";

const HomePage = (): JSX.Element => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <AboutPreview />
      <FeaturesSection />
      <StatsSection />
      <CampusGallery />
      <TestimonialsSection />
      <CallToAction />
      <Footer />
    </div>
  );
};

export default HomePage;
