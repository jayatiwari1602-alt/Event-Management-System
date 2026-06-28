const bcrypt = require("bcryptjs");
const db = require("../store/db");

function seedIfEmpty() {
  if (db.users.count() > 0) {
    console.log("  [seed] Data already present, skipping seed.");
    return;
  }

  console.log("  [seed] Seeding demo data...");
  const passwordHash = bcrypt.hashSync("password123", 10);

  // --- Users ---
  const organizer = db.users.insert({
    email: "alex.morgan@eventpro.com",
    password: passwordHash,
    firstName: "Alex",
    lastName: "Morgan",
    role: "organizer",
    organization: "Global Summits Inc.",
    phone: "+1 (555) 012-3456",
    timezone: "Pacific Standard Time (PST)",
    bio: "Dedicated event strategist with over 12 years of experience managing international conferences and enterprise summits.",
    avatarUrl: "",
    plan: "pro",
    verified: true,
    notificationPrefs: { eventReminders: true, teamUpdates: true, weeklyAnalytics: false },
  });

  const attendee1 = db.users.insert({
    email: "sarah.jenkins@techglobal.com",
    password: passwordHash,
    firstName: "Sarah",
    lastName: "Jenkins",
    role: "attendee",
    organization: "TechGlobal",
    phone: "",
    timezone: "UTC",
    bio: "",
    avatarUrl: "",
    plan: "free",
    verified: true,
    notificationPrefs: { eventReminders: true, teamUpdates: false, weeklyAnalytics: false },
  });

  const attendee2 = db.users.insert({
    email: "alex.rivera@googlecloud.com",
    password: passwordHash,
    firstName: "Alex",
    lastName: "Rivera",
    role: "attendee",
    organization: "Google Cloud",
    plan: "free",
    verified: true,
    notificationPrefs: { eventReminders: true, teamUpdates: false, weeklyAnalytics: false },
  });

  const attendee3 = db.users.insert({
    email: "marcus.knight@vibeevents.com",
    password: passwordHash,
    firstName: "Marcus",
    lastName: "Knight",
    role: "attendee",
    organization: "VibeEvents",
    plan: "free",
    verified: true,
  });

  // --- Events ---
  const aiSummit = db.events.insert({
    title: "Global AI Summit 2024",
    bannerUrl: "",
    venueName: "Innovation Hub, San Francisco",
    category: "Technology & Innovation",
    description:
      "The Global Tech Summit 2024 brings together the world's most innovative minds to explore the shifting landscape of artificial intelligence, sustainable computing, and decentralized networks.",
    latitude: 37.7749,
    longitude: -122.4194,
    startDate: "2024-10-24",
    endDate: "2024-10-26",
    startTime: "09:00",
    endTime: "16:00",
    capacity: 2500,
    price: 849,
    isVirtual: false,
    status: "active",
    organizerId: organizer.id,
    requiresApproval: true,
    agenda: [
      { time: "09:00 AM - 10:30 AM", title: "Opening Keynote: The AI Singularity", description: "A deep dive into the next five years of generative models and their impact on global labor markets." },
      { time: "11:00 AM - 12:30 PM", title: "Technical Workshop: Vector Databases", description: "Hands-on session for optimizing retrieval-augmented generation architectures at scale." },
      { time: "02:00 PM - 04:00 PM", title: "Panel Discussion: Digital Ethics", description: "Navigating the complex waters of automated decision making and algorithmic bias in 2024." },
    ],
    speakers: [
      { name: "Dr. Elena Vance", title: "Director of AI, NeuralPath" },
      { name: "Marcus Thorne", title: "Lead Architect, BlockScale" },
      { name: "Aria Chen", title: "Head of UX, FutureFlow" },
    ],
  });

  const designExpo = db.events.insert({
    title: "Design Systems Expo",
    venueName: "V&A Museum, London",
    category: "Design",
    description: "A premium gathering for design systems practitioners and product teams.",
    startDate: "2024-11-12",
    endDate: "2024-11-14",
    capacity: 500,
    price: 150,
    isVirtual: false,
    status: "scheduled",
    organizerId: organizer.id,
    requiresApproval: true,
  });

  const bioTech = db.events.insert({
    title: "BioTech Innovation Forum",
    venueName: "Digital Hub, Berlin",
    category: "Science",
    description: "Exploring decentralized compute power for real-time industrial applications.",
    startDate: "2025-01-15",
    endDate: "2025-01-18",
    capacity: 2500,
    price: 0,
    isVirtual: true,
    status: "draft",
    organizerId: organizer.id,
  });

  // --- Ticket types ---
  const vipTicket = db.tickets.insert({ eventId: aiSummit.id, name: "VIP Pass", price: 1200, quantity: 200, sold: 0, description: "Full access plus backstage networking." });
  const generalTicket = db.tickets.insert({ eventId: aiSummit.id, name: "General", price: 849, quantity: 2000, sold: 0, description: "Full access to all keynote sessions and panels." });
  db.tickets.insert({ eventId: aiSummit.id, name: "Early Bird", price: 599, quantity: 300, sold: 0, description: "Limited-time discounted entry." });

  // --- Registrations (with check-ins) ---
  const reg1 = db.registrations.insert({
    eventId: aiSummit.id,
    userId: attendee1.id,
    ticketTypeId: vipTicket.id,
    ticketLabel: "VIP Pass",
    amountPaid: 1200,
    status: "confirmed",
    checkedIn: true,
    qrCode: `EP:${aiSummit.id}:${attendee1.id}:demo01`,
    orderId: "EP-902341",
  });
  db.tickets.update(vipTicket.id, { sold: 1 });

  db.registrations.insert({
    eventId: aiSummit.id,
    userId: attendee3.id,
    ticketTypeId: generalTicket.id,
    ticketLabel: "General",
    amountPaid: 849,
    status: "confirmed",
    checkedIn: false,
    qrCode: `EP:${aiSummit.id}:${attendee3.id}:demo02`,
    orderId: "EP-902342",
  });
  db.tickets.update(generalTicket.id, { sold: 1 });

  const pendingReg = db.registrations.insert({
    eventId: aiSummit.id,
    userId: attendee2.id,
    ticketTypeId: vipTicket.id,
    ticketLabel: "VIP Pass",
    amountPaid: 1200,
    status: "pending",
    checkedIn: false,
    qrCode: `EP:${aiSummit.id}:${attendee2.id}:demo03`,
    orderId: "EP-902343",
  });

  db.checkins.insert({ registrationId: reg1.id, eventId: aiSummit.id, method: "qr" });

  // --- Certificates ---
  db.certificates.insert({
    eventId: aiSummit.id,
    registrationId: reg1.id,
    userId: attendee1.id,
    templateId: "tpl_elite_platinum",
    recipientName: "Sarah Jenkins",
    deliveryModes: { emailAttendee: true },
    status: "issued",
  });

  // --- Activity feed ---
  db.activity.insert({ type: "registration", message: "Alex Rivera joined the Global Tech Summit.", userId: attendee2.id, eventId: aiSummit.id });
  db.activity.insert({ type: "ticket_sold", message: "VIP Ticket sold for Art Basel Premiere.", userId: attendee1.id });
  db.activity.insert({ type: "campaign", message: 'New marketing campaign "Spring Fever" launched.' });
  db.activity.insert({ type: "refund_request", message: "Refund request from Jordan Smith.", eventId: aiSummit.id });

  // --- Venues ---
  db.venues.insert({ name: "Innovation Hub Center", address: "101 Innovation Way", city: "San Francisco, CA 94103", capacity: 2500, latitude: 37.7749, longitude: -122.4194, ownerId: organizer.id });
  db.venues.insert({ name: "V&A Museum", address: "Cromwell Rd", city: "London, UK", capacity: 500, ownerId: organizer.id });

  // --- Notifications ---
  db.notifications.insert({ userId: organizer.id, title: "New registration", message: "Alex Rivera registered for Global AI Summit 2024", type: "info", read: false });
  db.notifications.insert({ userId: organizer.id, title: "Near capacity", message: "Design Systems Expo is at 84% capacity", type: "warning", read: false });

  console.log("  [seed] Done.");
  console.log("  [seed] Login → organizer: alex.morgan@eventpro.com / password123");
  console.log("  [seed] Login → attendee:  sarah.jenkins@techglobal.com / password123");
}

module.exports = { seedIfEmpty };
