import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Sparkles,
  TicketCheck,
  Wand2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import heroCampus from "@/assets/hero-campus.jpg";
import { useAuth } from "@/context/AuthContext";
import aiTicketService, { type TicketDraftResult } from "@/services/aiTicketService";
import facilityService from "@/services/facilityService";
import ticketService, {
  MAX_TICKET_ATTACHMENTS,
  validateTicketAttachments,
  type TicketAudience,
  type TicketCategory,
} from "@/services/ticketService";

type ResourceLocationOption = {
  value: string;
  label: string;
  kind: "building" | "room";
};

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

type AiChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const getInitialAiMessages = (): AiChatMessage[] => [
  {
    id: "ai-welcome",
    role: "assistant",
    content:
      "Tell me your issue in any language (or mixed English). I will prepare a clean ticket subject and message for you.",
  },
];

const ContactPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    category: "IT_SUPPORT" as TicketCategory,
    audience: "STUDENT" as TicketAudience,
    resourceLocation: "",
    preferredContactDetails: "",
    subject: "",
    message: "",
    attachments: [] as File[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<{ ticketNumber?: string; message: string } | null>(null);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState<TicketDraftResult | null>(null);
  const [aiMessages, setAiMessages] = useState<AiChatMessage[]>(getInitialAiMessages);
  const [resourceLocationOptions, setResourceLocationOptions] = useState<ResourceLocationOption[]>([]);
  const [resourceLocationLoading, setResourceLocationLoading] = useState(false);

  const aiConfigured = Boolean(import.meta.env.VITE_OPENAI_API_KEY);

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

  const trackingLink = isAuthenticated
    ? user?.role === "ADMIN"
      ? "/admin/dashboard"
      : "/profile?section=tickets"
    : "/auth/login";

  const trackingLabel = isAuthenticated
    ? user?.role === "ADMIN"
      ? "Open Admin Ticket Queue"
      : "Track My Tickets"
    : "Login to Track Tickets";

  const showResourceLocationField = form.category === "FACILITIES" || form.category === "ROOM_BOOKING";
  const useResourceDropdown = showResourceLocationField;

  const filteredResourceLocationOptions = useMemo(() => {
    if (form.category === "ROOM_BOOKING") {
      return resourceLocationOptions.filter((option) => option.kind === "room");
    }

    if (form.category === "FACILITIES") {
      return resourceLocationOptions;
    }

    return [];
  }, [form.category, resourceLocationOptions]);

  useEffect(() => {
    let active = true;

    const loadResourceLocations = async () => {
      setResourceLocationLoading(true);
      try {
        const snapshot = await facilityService.getFacilitySnapshot();
        if (!active) {
          return;
        }

        const buildingById = new Map(snapshot.buildings.map((building) => [building.id, building]));
        const floorById = new Map(snapshot.floors.map((floor) => [floor.id, floor]));

        const buildingOptions: ResourceLocationOption[] = snapshot.buildings.map((building) => ({
          value: `${building.code} - ${building.name} (${building.campus})`,
          label: `${building.code} - ${building.name} (${building.location})`,
          kind: "building",
        }));

        const roomOptions: ResourceLocationOption[] = snapshot.rooms.map((room) => {
          const building = buildingById.get(room.buildingId);
          const floor = floorById.get(room.floorId);
          const floorLabel = floor?.floorName || (floor ? `Floor ${floor.floorNumber}` : "Floor");
          const buildingLabel = building ? `${building.code}` : "Building";

          return {
            value: `${room.code} - ${room.name} (${buildingLabel}, ${floorLabel})`,
            label: `${room.code} - ${room.name} (${buildingLabel}, ${floorLabel})`,
            kind: "room",
          };
        });

        setResourceLocationOptions([...buildingOptions, ...roomOptions]);
      } catch {
        if (!active) {
          return;
        }
        setResourceLocationOptions([]);
      } finally {
        if (active) {
          setResourceLocationLoading(false);
        }
      }
    };

    void loadResourceLocations();

    return () => {
      active = false;
    };
  }, []);

  const resetAiDialogState = () => {
    setAiInput("");
    setAiLoading(false);
    setAiDraft(null);
    setAiMessages(getInitialAiMessages());
  };

  const applyDraftToForm = (draft: TicketDraftResult) => {
    setForm((prev) => ({
      ...prev,
      subject: draft.subject,
      message: draft.message,
      category: draft.category || prev.category,
      audience: !isAuthenticated && draft.audience ? draft.audience : prev.audience,
    }));
  };

  const handleAiSend = async () => {
    const message = aiInput.trim();
    if (!message || aiLoading) {
      return;
    }

    const userMessage: AiChatMessage = {
      id: `ai-user-${Date.now()}`,
      role: "user",
      content: message,
    };

    const nextMessages = [...aiMessages, userMessage];
    setAiMessages(nextMessages);
    setAiInput("");
    setAiLoading(true);

    try {
      const draft = await aiTicketService.draftTicket({
        userInput: message,
        conversation: nextMessages.map((item) => ({
          role: item.role,
          content: item.content,
        })),
        currentForm: {
          category: form.category,
          audience: inferredAudience,
          subject: form.subject,
          message: form.message,
        },
      });

      setAiDraft(draft);
      applyDraftToForm(draft);

      setAiMessages((prev) => [
        ...prev,
        {
          id: `ai-assistant-${Date.now()}`,
          role: "assistant",
          content: draft.assistantReply,
        },
      ]);

      if (draft.source === "fallback") {
        toast.message("Draft prepared from your text. Please review before submit.");
      } else {
        toast.success("AI draft added to your ticket form.");
      }
    } catch {
      setAiMessages((prev) => [
        ...prev,
        {
          id: `ai-error-${Date.now()}`,
          role: "assistant",
          content:
            "I had a temporary issue creating the draft. Please send your issue again, and include location and time for best results.",
        },
      ]);
      toast.error("Failed to generate the draft right now. Please try once more.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (showResourceLocationField && !form.resourceLocation.trim()) {
      toast.error("Resource / Location is required for Facilities and Room Booking tickets.");
      return;
    }

    const attachmentError = validateTicketAttachments(form.attachments);
    if (attachmentError) {
      toast.error(attachmentError);
      return;
    }

    setSubmitting(true);
    setSubmitSuccess(null);

    const fallbackName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
    const requesterName = isAuthenticated ? fallbackName || user?.email || "Signed-in User" : form.name;
    const requesterEmail = isAuthenticated ? user?.email || form.email : form.email;

    try {
      const response = await ticketService.createPublicTicket({
        category: form.category,
        audience: inferredAudience,
        subject: form.subject,
        description: form.message,
        resourceLocation: showResourceLocationField ? form.resourceLocation : "",
        preferredContactDetails: form.preferredContactDetails,
        name: requesterName,
        email: requesterEmail,
        attachments: form.attachments,
      });

      toast.success("Ticket submitted successfully. Our support team will respond soon.");
      setSubmitSuccess({
        ticketNumber: response.data?.data?.ticketNumber,
        message: response.data?.message || "Ticket submitted successfully.",
      });
      setForm((prev) => ({
        ...prev,
        name: "",
        email: "",
        resourceLocation: "",
        preferredContactDetails: isAuthenticated ? user?.email || "" : "",
        subject: "",
        message: "",
        attachments: [],
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
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="mt-7 flex flex-wrap items-center justify-center gap-3"
          >
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
              <a href="#support-form">Submit Ticket</a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-primary-foreground/35 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link to={trackingLink}>
                {trackingLabel}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </motion.div>
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
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <TicketCheck className="h-6 w-6 text-accent" />
                <h2 className="font-display text-2xl font-semibold text-foreground">Raise a Ticket</h2>
              </div>
              <Button
                type="button"
                variant="outline"
                className="border-accent/50 text-accent hover:bg-accent/10"
                onClick={() => {
                  resetAiDialogState();
                  setAiDialogOpen(true);
                }}
              >
                <Sparkles className="h-4 w-4" />
                AI Help
              </Button>
            </div>

            {submitSuccess && (
              <div className="mb-5 rounded-xl border border-success/30 bg-success/10 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  {submitSuccess.message}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {submitSuccess.ticketNumber
                    ? `Ticket ID: ${submitSuccess.ticketNumber}`
                    : "Your ticket is now in the support queue."}
                </p>
              </div>
            )}

            <form id="support-form" onSubmit={handleSubmit} className="space-y-4">
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
                onValueChange={(v) => {
                  const nextCategory = v as TicketCategory;
                  const shouldShowLocation = nextCategory === "FACILITIES" || nextCategory === "ROOM_BOOKING";
                  setForm((prev) => ({
                    ...prev,
                    category: nextCategory,
                    resourceLocation: shouldShowLocation ? prev.resourceLocation : "",
                  }));
                }}
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
              {showResourceLocationField && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Resource / Location</label>
                  <Input
                    list={useResourceDropdown ? "resource-location-options" : undefined}
                    placeholder={
                      form.category === "ROOM_BOOKING"
                        ? "Search room by code, name, or building"
                        : "Search building or room location"
                    }
                    value={form.resourceLocation}
                    onChange={(e) => setForm({ ...form, resourceLocation: e.target.value })}
                    required
                  />

                  {useResourceDropdown && (
                    <datalist id="resource-location-options">
                      {filteredResourceLocationOptions.map((option) => (
                        <option key={option.value} value={option.value} label={option.label} />
                      ))}
                    </datalist>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {resourceLocationLoading
                      ? "Loading available buildings and rooms..."
                      : filteredResourceLocationOptions.length > 0
                      ? `Search from ${filteredResourceLocationOptions.length} available locations.`
                      : "No campus locations loaded. You can still type the location manually."}
                  </p>
                </div>
              )}
              <Input
                placeholder="Preferred Contact Details (phone/email/time window)"
                value={form.preferredContactDetails}
                onChange={(e) => setForm({ ...form, preferredContactDetails: e.target.value })}
                required
              />
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
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Evidence Images (max {MAX_TICKET_ATTACHMENTS}, up to 5MB each)
                </label>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={(event) => {
                    const files = Array.from(event.target.files || []);
                    const validationError = validateTicketAttachments(files);
                    if (validationError) {
                      toast.error(validationError);
                      event.currentTarget.value = "";
                      return;
                    }

                    setForm((prev) => ({ ...prev, attachments: files.slice(0, MAX_TICKET_ATTACHMENTS) }));
                  }}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {form.attachments.length > 0
                    ? `${form.attachments.length} image${form.attachments.length > 1 ? "s" : ""} selected`
                    : "Attach clear photos/screenshots of the issue if available."}
                </p>
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? "Submitting..." : "Submit Ticket"}
              </Button>
            </form>

            <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              {isAuthenticated ? (
                <p>
                  Track status updates and resolution notes in{" "}
                  <Link to={trackingLink} className="font-semibold text-primary hover:underline">
                    {user?.role === "ADMIN" ? "Admin Dashboard" : "Profile Tickets"}
                  </Link>
                  .
                </p>
              ) : (
                <p>
                  Want full ticket history after submission?{" "}
                  <Link to="/auth/login" className="font-semibold text-primary hover:underline">
                    Sign in
                  </Link>{" "}
                  and use My Tickets tracking.
                </p>
              )}
            </div>

            <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
              <DialogContent className="max-w-2xl p-0">
                <DialogHeader className="border-b px-6 pb-4 pt-6">
                  <DialogTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-accent" />
                    AI Ticket Assistant
                  </DialogTitle>
                  <DialogDescription>
                    Describe your problem in your own language or mixed English. I will draft a clear ticket subject and message.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 px-6 pb-6 pt-4">
                  {!aiConfigured && (
                    <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-foreground">
                      OpenAI key is not configured. A basic local draft will still be generated from your text.
                    </div>
                  )}

                  <div className="h-72 overflow-y-auto rounded-lg border border-border bg-muted/20 p-3">
                    <div className="space-y-3">
                      {aiMessages.map((item) => (
                        <div key={item.id} className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-6 ${
                              item.role === "user"
                                ? "bg-accent text-accent-foreground"
                                : "bg-background border border-border text-foreground"
                            }`}
                          >
                            {item.content}
                          </div>
                        </div>
                      ))}

                      {aiLoading && (
                        <div className="flex justify-start">
                          <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Thinking...
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Textarea
                      rows={3}
                      placeholder="Example: lab computer no internet since morning. exam practice affected."
                      value={aiInput}
                      onChange={(event) => setAiInput(event.target.value)}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        Tip: include location, date/time, and impact for better ticket quality.
                      </p>
                      <Button
                        type="button"
                        onClick={() => void handleAiSend()}
                        disabled={aiLoading || !aiInput.trim()}
                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                      >
                        {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                        Generate Draft
                      </Button>
                    </div>
                  </div>

                  {aiDraft && (
                    <div className="rounded-lg border border-border bg-background p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">Generated Ticket Draft</p>
                        <Button type="button" variant="secondary" size="sm" onClick={() => applyDraftToForm(aiDraft)}>
                          Apply to Form
                        </Button>
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject</p>
                      <p className="mb-3 text-sm text-foreground">{aiDraft.subject}</p>

                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Message</p>
                      <p className="whitespace-pre-line text-sm leading-6 text-foreground">{aiDraft.message}</p>

                      <p className="mt-3 text-xs text-muted-foreground">
                        Detected language: {aiDraft.detectedLanguage || "Unknown"}
                      </p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
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
                  { icon: MapPin, label: "Address", value: "Smart Campus, Malabe, Sri Lanka" },
                  { icon: Phone, label: "Phone", value: "+94 11 234 5678" },
                  { icon: Mail, label: "Email", value: "info@smartcampus.edu" },
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
                title="Smart Campus Location"
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
