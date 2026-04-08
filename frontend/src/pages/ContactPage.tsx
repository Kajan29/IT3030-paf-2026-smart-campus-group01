import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Send, MapPin, Phone, Mail, TicketCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import heroCampus from "@/assets/hero-campus.jpg";
import { useAuth } from "@/context/AuthContext";
import ticketService, { type TicketAudience, type TicketCategory } from "@/services/ticketService";

const ticketCategories: Array<{ label: string; value: TicketCategory }> = [
  { label: "IT Support", value: "IT_SUPPORT" },
  { label: "Facilities", value: "FACILITIES" },
  { label: "Academic Issue", value: "ACADEMIC" },
  { label: "Room Booking", value: "ROOM_BOOKING" },
  { label: "General Inquiry", value: "GENERAL_INQUIRY" },
];

const ticketAudiences: Array<{ label: string; value: TicketAudience }> = [
  { label: "Student Support", value: "STUDENT" },
  { label: "Staff Support", value: "STAFF" },
];

const ContactPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    category: "IT_SUPPORT" as TicketCategory,
    audience: "STUDENT" as TicketAudience,
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const inferredAudience = useMemo<TicketAudience>(() => {
    if (!isAuthenticated || !user) {
      return form.audience;
    }
    return user.role === "STUDENT" ? "STUDENT" : "STAFF";
  }, [form.audience, isAuthenticated, user]);

  const roleLabel = useMemo(() => {
    if (!user) return "Guest";
    if (user.role === "STUDENT") return "Student";
    if (user.role === "ACADEMIC_STAFF") return "Academic Staff";
    if (user.role === "NON_ACADEMIC_STAFF") return "Non-Academic Staff";
    return "Admin";
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await ticketService.createPublicTicket({
        category: form.category,
        audience: inferredAudience,
        subject: form.subject,
        description: form.message,
        ...(isAuthenticated
          ? {}
          : {
              name: form.name,
              email: form.email,
            }),
      });

      toast.success("Ticket submitted successfully. Our support team will respond soon.");
      setForm((prev) => ({
        ...prev,
        name: "",
        email: "",
        subject: "",
        message: "",
      }));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not submit ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroCampus} alt="Contact & Support" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-primary/80" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center py-16">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-4"
          >
            Contact & Support
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-primary-foreground/80 text-lg max-w-2xl mx-auto"
          >
            Reach out to us or raise a support ticket for any issues.
          </motion.p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Ticket Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <TicketCheck className="h-6 w-6 text-accent" />
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Raise a Ticket
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isAuthenticated && user ? (
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-sm font-medium text-foreground">
                    Submitting as {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {user.email} | {roleLabel}
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    placeholder="Your Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              )}
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v as TicketCategory })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {ticketCategories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!isAuthenticated && (
                <Select
                  value={form.audience}
                  onValueChange={(v) => setForm({ ...form, audience: v as TicketAudience })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ticket For" />
                  </SelectTrigger>
                  <SelectContent>
                    {ticketAudiences.map((audience) => (
                      <SelectItem key={audience.value} value={audience.value}>
                        {audience.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Input
                placeholder="Subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
              />
              <Textarea
                placeholder="Describe your issue in detail..."
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
              />
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? "Submitting..." : "Submit Ticket"}
              </Button>
            </form>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-8"
          >
            <div>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-6">
                Get in Touch
              </h2>
              <div className="space-y-5">
                {[
                  { icon: MapPin, label: "Address", value: "Zentaritas University Campus, Malabe, Sri Lanka" },
                  { icon: Phone, label: "Phone", value: "+94 11 234 5678" },
                  { icon: Mail, label: "Email", value: "info@zentaritas.edu" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map placeholder */}
            <div className="rounded-xl overflow-hidden border border-border h-64 bg-muted flex items-center justify-center">
              <iframe
                title="Zentaritas University Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3961.1445440424754!2d79.97091937500577!3d6.914682!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwNTQnNTIuOSJOIDc5wrA1OCcxNS4zIkU!5e0!3m2!1sen!2slk!4v1234567890"
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactPage;
