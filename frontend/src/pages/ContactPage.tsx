import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Send, CheckCircle, Ticket, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const ContactPage = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ticketId = `ZT-${Date.now().toString().slice(-6)}`;
    setSubmitted(true);
    toast.success(`Ticket ${ticketId} created! We'll respond within 24 hours.`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Support</span>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-3">Contact & Support</h1>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">Submit a support ticket and our team will get back to you promptly.</p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-2xl p-8 shadow-card border border-border"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Ticket className="w-6 h-6 text-primary" />
                  <h2 className="font-heading text-2xl font-bold text-foreground">Submit a Ticket</h2>
                </div>

                {submitted ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
                    <h3 className="font-heading text-2xl font-bold text-foreground mb-2">Ticket Submitted!</h3>
                    <p className="text-muted-foreground mb-6">We'll respond to your inquiry within 24 hours.</p>
                    <Button onClick={() => setSubmitted(false)} variant="outline">Submit Another</Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Full Name</Label>
                        <Input placeholder="Your full name" required className="mt-1.5" />
                      </div>
                      <div>
                        <Label>Email Address</Label>
                        <Input type="email" placeholder="you@zentaritas.edu" required className="mt-1.5" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Category</Label>
                        <Select required>
                          <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select category" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="academic">Academic Inquiry</SelectItem>
                            <SelectItem value="technical">Technical Support</SelectItem>
                            <SelectItem value="facilities">Facilities</SelectItem>
                            <SelectItem value="finance">Finance & Fees</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Priority</Label>
                        <Select required>
                          <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select priority" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Subject</Label>
                      <Input placeholder="Brief summary of your issue" required className="mt-1.5" />
                    </div>
                    <div>
                      <Label>Message</Label>
                      <Textarea placeholder="Describe your issue in detail..." required className="mt-1.5 min-h-[140px]" />
                    </div>
                    <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground border-0 gap-2">
                      <Send className="w-4 h-4" /> Submit Ticket
                    </Button>
                  </form>
                )}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {[
                { icon: Mail, title: "Email", info: "support@zentaritas.edu" },
                { icon: Phone, title: "Phone", info: "+94 11 754 4801" },
                { icon: MapPin, title: "Address", info: "ZENTARITAS University, Malabe, Sri Lanka" },
              ].map((item) => (
                <div key={item.title} className="bg-card rounded-xl p-6 shadow-card border border-border">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-heading font-semibold text-foreground">{item.title}</h4>
                  <p className="text-muted-foreground text-sm mt-1">{item.info}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ContactPage;
