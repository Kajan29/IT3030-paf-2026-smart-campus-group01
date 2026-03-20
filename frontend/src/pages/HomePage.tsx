import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import CoursesPreview from "../components/CoursesPreview";
import BookingsPreview from "../components/BookingsPreview";
import Footer from "../components/Footer";

const HomePage = (): JSX.Element => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <CoursesPreview />
      <BookingsPreview />
      <Footer />
    </div>
  )
}

export default HomePage
