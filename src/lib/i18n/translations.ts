export type Language = "en" | "ta" | "hi";

export interface Translations {
  nav: {
    dashboard: string;
    leads: string;
    properties: string;
    bookings: string;
    login: string;
    logout: string;
    staffLogin: string;
    users: string;
  };
  actions: {
    search: string;
    filter: string;
    bookUnit: string;
    inquire: string;
    contactSales: string;
    addNote: string;
    save: string;
    cancel: string;
    createLead: string;
    viewDetails: string;
    all: string;
    loading: string;
    confirm: string;
    close: string;
    submit: string;
    previous: string;
    next: string;
    loadMore: string;
    newProject: string;
    newBuilding: string;
    newUnit: string;
  };
  stages: {
    NEW: string;
    CONTACTED: string;
    SITE_VISIT: string;
    INTERESTED: string;
    NEGOTIATION: string;
    BOOKED: string;
    LOST: string;
  };
  unitStatuses: {
    AVAILABLE: string;
    BOOKED: string;
    BLOCKED: string;
    SOLD: string;
  };
  roles: {
    admin: string;
    salesRep: string;
    switchRole: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    totalLeads: string;
    activePipeline: string;
    occupancyRate: string;
    bookedRevenue: string;
    followUpsToday: string;
    noFollowUps: string;
    pipelineFunnel: string;
    inventoryBreakdown: string;
  };
  common: {
    phone: string;
    email: string;
    budget: string;
    assignedTo: string;
    interestedUnit: string;
    created: string;
    status: string;
    unit: string;
    price: string;
    amount: string;
    notes: string;
    date: string;
    role: string;
    page: string;
    of: string;
    total: string;
  };
  landing: {
    badge: string;
    headline: string;
    subhead: string;
    browseCta: string;
    staffCta: string;
    stats: {
      trackingTitle: string;
      trackingDesc: string;
      guaranteeTitle: string;
      guaranteeDesc: string;
      advisoryTitle: string;
      advisoryDesc: string;
    };
    featured: {
      title: string;
      subtitle: string;
      startingFrom: string;
      viewDetails: string;
      noUnits: string;
      availableUnits: string;
      sqft: string;
    };
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    nav: {
      dashboard: "Dashboard",
      leads: "Leads",
      properties: "Properties",
      bookings: "Bookings",
      login: "Sign In",
      logout: "Sign Out",
      staffLogin: "Staff Login",
      users: "Team & Users",
    },
    actions: {
      search: "Search...",
      filter: "Filter",
      bookUnit: "Book Unit",
      inquire: "Contact Sales / Inquire",
      contactSales: "Contact Sales",
      addNote: "Add Note",
      save: "Save Changes",
      cancel: "Cancel",
      createLead: "New Lead",
      viewDetails: "View Details",
      all: "All",
      loading: "Loading...",
      confirm: "Confirm Booking",
      close: "Close",
      submit: "Submit",
      previous: "Previous",
      next: "Next",
      loadMore: "Load More Records",
      newProject: "New Project",
      newBuilding: "New Building",
      newUnit: "New Unit",
    },
    stages: {
      NEW: "New",
      CONTACTED: "Contacted",
      SITE_VISIT: "Site Visit",
      INTERESTED: "Interested",
      NEGOTIATION: "Negotiation",
      BOOKED: "Booked",
      LOST: "Lost",
    },
    unitStatuses: {
      AVAILABLE: "Available",
      BOOKED: "Booked",
      BLOCKED: "Blocked",
      SOLD: "Sold",
    },
    roles: {
      admin: "Administrator",
      salesRep: "Sales Rep",
      switchRole: "Simulate Role",
    },
    dashboard: {
      title: "Executive Dashboard",
      subtitle: "Real-time sales pipeline & property inventory telemetry",
      totalLeads: "Total Leads",
      activePipeline: "Active Pipeline",
      occupancyRate: "Occupancy Rate",
      bookedRevenue: "Booked Revenue",
      followUpsToday: "Follow-ups Due Today",
      noFollowUps: "No urgent follow-ups scheduled for today.",
      pipelineFunnel: "Lead Pipeline Funnel",
      inventoryBreakdown: "Inventory Status Breakdown",
    },
    common: {
      phone: "Phone",
      email: "Email",
      budget: "Budget",
      assignedTo: "Assigned To",
      interestedUnit: "Interested Unit",
      created: "Created",
      status: "Status",
      unit: "Unit",
      price: "Price",
      amount: "Amount",
      notes: "Notes",
      date: "Date",
      role: "Role",
      page: "Page",
      of: "of",
      total: "Total",
    },
    landing: {
      badge: "Next-Gen Real Estate CRM & Property Showcase",
      headline: "Find Your Ideal Living Space With Unmatched Clarity.",
      subhead:
        "Browse premier residential towers, verify real-time unit availability, or connect directly with our advisory team.",
      browseCta: "Browse Available Properties",
      staffCta: "Staff Portal Access",
      stats: {
        trackingTitle: "Real-Time Inventory Tracking",
        trackingDesc:
          "Direct live status and specs on every unit across all developments.",
        guaranteeTitle: "Zero Double-Booking Guarantee",
        guaranteeDesc:
          "ACID-compliant reservation locks ensure absolute concurrency integrity.",
        advisoryTitle: "Dedicated Sales Advisory",
        advisoryDesc:
          "1-click client inquiries, immediate rep notifications, and CRM follow-ups.",
      },
      featured: {
        title: "Featured Premier Developments",
        subtitle:
          "Handpicked residential projects with immediate unit availability.",
        startingFrom: "Starting from",
        viewDetails: "View Details & Inquire",
        noUnits:
          "No properties currently available in inventory. Check back soon!",
        availableUnits: "Units Available",
        sqft: "sq ft",
      },
    },
  },
  ta: {
    nav: {
      dashboard: "முதன்மை பலகை",
      leads: "வாடிக்கையாளர்கள்",
      properties: "சொத்துக்கள்",
      bookings: "முன்பதிவுகள்",
      login: "உள்நுழைவு",
      logout: "வெளியேறு",
      staffLogin: "ஊழியர் உள்நுழைவு",
      users: "பயனர்கள்",
    },
    actions: {
      search: "தேடுக...",
      filter: "வடிகட்டு",
      bookUnit: "முன்பதிவு செய்",
      inquire: "விற்பனை விசாரிக்கவும்",
      contactSales: "விற்பனை தொடர்பு",
      addNote: "குறிப்பு சேர்",
      save: "மாற்றங்களை சேமிக்க",
      cancel: "ரத்து செய்",
      createLead: "புதிய வாடிக்கையாளர்",
      viewDetails: "விவரங்களை காண்க",
      all: "அனைத்தும்",
      loading: "ஏற்றுகிறது...",
      confirm: "முன்பதிவை உறுதி செய்",
      close: "மூடு",
      submit: "சமர்ப்பி",
      previous: "முந்தைய",
      next: "அடுத்தது",
      loadMore: "மேலும் பார்க்க",
      newProject: "புதிய திட்டம்",
      newBuilding: "புதிய கட்டிடம்",
      newUnit: "புதிய குடியிருப்பு",
    },
    stages: {
      NEW: "புதியது",
      CONTACTED: "தொடர்பு கொள்ளப்பட்டது",
      SITE_VISIT: "தளப் பார்வை",
      INTERESTED: "ஆர்வமுடையவர்",
      NEGOTIATION: "பேச்சுவார்த்தை",
      BOOKED: "முன்பதிவு செய்யப்பட்டது",
      LOST: "கைவிடப்பட்டது",
    },
    unitStatuses: {
      AVAILABLE: "கிடைக்கும்",
      BOOKED: "முன்பதிவு செய்யப்பட்டது",
      BLOCKED: "நிறுத்தி வைக்கப்பட்டது",
      SOLD: "விற்கப்பட்டது",
    },
    roles: {
      admin: "நிர்வாகி",
      salesRep: "விற்பனை பிரதிநிதி",
      switchRole: "பாத்திரத்தை மாற்று",
    },
    dashboard: {
      title: "நிர்வாக முதன்மை பலகை",
      subtitle: "நிகழ்நேர விற்பனை மற்றும் சொத்து விவரங்கள்",
      totalLeads: "மொத்த வாடிக்கையாளர்கள்",
      activePipeline: "செயலில் உள்ள வணிகம்",
      occupancyRate: "குடியேற்ற விகிதம்",
      bookedRevenue: "முன்பதிவு வருவாய்",
      followUpsToday: "இன்றைய பின்தொடர்தல்கள்",
      noFollowUps: "இன்று அவசர பின்தொடர்தல்கள் எதுவும் இல்லை.",
      pipelineFunnel: "விற்பனை நிலை வரைபடம்",
      inventoryBreakdown: "சொத்து இருப்பு நிலை விவரம்",
    },
    common: {
      phone: "தொலைபேசி",
      email: "மின்னஞ்சல்",
      budget: "பட்ஜெட்",
      assignedTo: "ஒதுக்கப்பட்டவர்",
      interestedUnit: "ஆர்வமுள்ள பிரிவு",
      created: "உருவாக்கப்பட்டது",
      status: "நிலை",
      unit: "குடியிருப்பு",
      price: "விலை",
      amount: "தொகை",
      notes: "குறிப்புகள்",
      date: "தேதி",
      role: "பொறுப்பு",
      page: "பக்கம்",
      of: "இல்",
      total: "மொத்தம்",
    },
    landing: {
      badge: "அடுத்த தலைமுறை ரியல் எஸ்டேட் சிஆர்எம் மற்றும் சொத்து காட்சி",
      headline: "தெளிவான தகவல்களுடன் உங்கள் கனவு இல்லத்தைக் கண்டறியுங்கள்.",
      subhead:
        "முன்னணி அடுக்குமாடி குடியிருப்புகளைப் பாருங்கள், நேரலை இருப்பை சரிபாருங்கள், அல்லது எங்கள் விற்பனை ஆலோசகரைத் தொடர்பு கொள்ளுங்கள்.",
      browseCta: "கிடைக்கக்கூடிய சொத்துக்களைப் பார்க்கவும்",
      staffCta: "பணியாளர் உள்நுழைவு",
      stats: {
        trackingTitle: "நேரலை இருப்பு கண்காணிப்பு",
        trackingDesc:
          "ஒவ்வொரு வீட்டின் நேரலை நிலை மற்றும் முழுமையான விவரங்கள்.",
        guaranteeTitle: "இரட்டை முன்பதிவு இல்லா உத்தரவாதம்",
        guaranteeDesc:
          "நம்பகமான ACID தொழில்நுட்பம் மூலம் துல்லியமான முன்பதிவு பூட்டுகள்.",
        advisoryTitle: "விற்பனை வழிகாட்டுதல்",
        advisoryDesc:
          "1-கிளிக் விசாரணைகள் மற்றும் உடனடி வாடிக்கையாளர் பின்தொடர்தல்.",
      },
      featured: {
        title: "சிறப்பு குடியிருப்பு திட்டங்கள்",
        subtitle:
          "உடனடி முன்பதிவுக்கு கிடைக்கக்கூடிய தேர்ந்தெடுக்கப்பட்ட திட்டங்கள்.",
        startingFrom: "தொடக்க விலை",
        viewDetails: "விவரங்களைப் பார்த்து விசாரிக்கவும்",
        noUnits: "தற்போது சொத்துக்கள் எதுவும் கிடைக்கவில்லை.",
        availableUnits: "கிடைக்கக்கூடிய வீடுகள்",
        sqft: "ச.அடி",
      },
    },
  },
  hi: {
    nav: {
      dashboard: "डैशबोर्ड",
      leads: "लीड्स / ग्राहक",
      properties: "संपत्तियां",
      bookings: "बुकिंग्स",
      login: "साइन इन",
      logout: "लॉग आउट",
      staffLogin: "कर्मचारी लॉगिन",
      users: "उपयोगकर्ता एवं टीम",
    },
    actions: {
      search: "खोजें...",
      filter: "फ़िल्टर",
      bookUnit: "यूनिट बुक करें",
      inquire: "बिक्री से संपर्क करें / पूछताछ",
      contactSales: "बिक्री से संपर्क करें",
      addNote: "नोट जोड़ें",
      save: "परिवर्तन सहेजें",
      cancel: "रद्द करें",
      createLead: "नई लीड जोड़ें",
      viewDetails: "विवरण देखें",
      all: "सभी",
      loading: "लोड हो रहा है...",
      confirm: "बुकिंग की पुष्टि करें",
      close: "बंद करें",
      submit: "जमा करें",
      previous: "पिछला",
      next: "अगला",
      loadMore: "और लोड करें",
      newProject: "नई परियोजना",
      newBuilding: "नई इमारत",
      newUnit: "नई यूनिट",
    },
    stages: {
      NEW: "नया",
      CONTACTED: "संपर्क किया",
      SITE_VISIT: "साइट विजिट",
      INTERESTED: "इच्छुक",
      NEGOTIATION: "बातचीत जारी",
      BOOKED: "बुक किया गया",
      LOST: "खो दिया",
    },
    unitStatuses: {
      AVAILABLE: "उपलब्ध",
      BOOKED: "बुक किया गया",
      BLOCKED: "ब्लॉक किया गया",
      SOLD: "बेचा गया",
    },
    roles: {
      admin: "व्यवस्थापक",
      salesRep: "बिक्री प्रतिनिधि",
      switchRole: "भूमिका बदलें",
    },
    dashboard: {
      title: "कार्यकारी डैशबोर्ड",
      subtitle: "वास्तविक समय बिक्री पाइपलाइन और संपत्ति सूची टेलीमेट्री",
      totalLeads: "कुल लीड्स",
      activePipeline: "सक्रिय पाइपलाइन",
      occupancyRate: "अधिभोग दर",
      bookedRevenue: "बुक किया गया राजस्व",
      followUpsToday: "आज के फ़ॉलो-अप",
      noFollowUps: "आज के लिए कोई तत्काल फ़ॉलो-अप निर्धारित नहीं है।",
      pipelineFunnel: "लीड पाइपलाइन फ़नल",
      inventoryBreakdown: "संपत्ति स्थिति विवरण",
    },
    common: {
      phone: "फ़ोन",
      email: "ईमेल",
      budget: "बजट",
      assignedTo: "सौंपा गया",
      interestedUnit: "इच्छुक यूनिट",
      created: "बनाया गया",
      status: "स्थिति",
      unit: "यूनिट",
      price: "कीमत",
      amount: "राशि",
      notes: "टिप्पणियाँ",
      date: "तारीख",
      role: "भूमिका",
      page: "पृष्ठ",
      of: "का",
      total: "कुल",
    },
    landing: {
      badge: "नेक्स्ट-जेन रियल एस्टेट सीआरएम और प्रॉपर्टी शोकेस",
      headline: "अद्वितीय स्पष्टता के साथ अपना आदर्श आशियाना खोजें।",
      subhead:
        "प्रीमियर आवासीय टावरों को ब्राउज़ करें, रीयल-टाइम उपलब्धता सत्यापित करें, या हमारी सलाहकार टीम से सीधे संपर्क करें।",
      browseCta: "उपलब्ध संपत्तियां देखें",
      staffCta: "स्टाफ पोर्टल लॉगिन",
      stats: {
        trackingTitle: "रीयल-टाइम इन्वेंटरी ट्रैकिंग",
        trackingDesc: "प्रत्येक यूनिट की प्रत्यक्ष लाइव स्थिति और विवरण।",
        guaranteeTitle: "शून्य डबल-बुकिंग गारंटी",
        guaranteeDesc:
          "ACID-अनुरूप आरक्षण लॉक पूर्ण सटीकता सुनिश्चित करते हैं।",
        advisoryTitle: "समर्पित बिक्री परामर्श",
        advisoryDesc: "1-क्लिक पूछताछ और तत्काल ग्राहक फॉलो-अप।",
      },
      featured: {
        title: "प्रमुख विशेष परियोजनाएं",
        subtitle: "तत्काल यूनिट उपलब्धता के साथ चुनिंदा आवासीय परियोजनाएं।",
        startingFrom: "शुरुआती कीमत",
        viewDetails: "विवरण देखें और पूछताछ करें",
        noUnits: "वर्तमान में कोई संपत्ति उपलब्ध नहीं है।",
        availableUnits: "उपलब्ध यूनिट्स",
        sqft: "वर्ग फुट",
      },
    },
  },
};
