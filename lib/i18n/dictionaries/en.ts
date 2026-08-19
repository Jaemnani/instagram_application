import type { Dictionary } from "./ko";

/** English. Facts mirror the Korean source — only verified information. */
export const en: Dictionary = {
  meta: {
    siteTagline: "Baby & Family Photo Studio in Seongsu, Seoul",
    description:
      '"No posed, Just Kidding!" A baby photo studio in Seongsu-dong, Seoul. First-birthday, family and baby portraits made while your child simply plays.',
    titleSuffix: "Seongsu Baby Photo Studio",
    keywords: [
      "Seoul baby photo studio",
      "Seongsu photo studio",
      "first birthday photoshoot Seoul",
      "family photoshoot Seoul",
      "newborn photography Seoul",
      "Seoul Forest photo studio",
      "baby portrait Korea",
      "studio rental Seongsu",
    ],
  },

  ui: {
    book: "Book a session",
    bookViaKakao: "Book via KakaoTalk",
    scroll: "Scroll",
    scrollHint: "Skip to content",
    homeAria: "Go to home",
    language: "Language",
    viewOnInstagram: "View original on Instagram →",
    naverMap: "Open in Naver Map →",
    googleMap: "Open in Google Maps →",
    photoCount: (n: number) => `${n} photos`,
    video: "Video",
    enlarge: (title: string, i: number) => `Enlarge photo ${i} of ${title}`,
    close: "Close",
    prevPhoto: "Previous photo",
    nextPhoto: "Next photo",
    lightboxLabel: (title: string) => `Photos of ${title}`,
  },

  hero: {
    tagline: "No posed, Just Kidding!",
  },

  statement: {
    label: "Our philosophy",
    lines: [
      "No posed, Just Kidding!",
      "We never stage a pose. While your child plays,",
      "the camera waits for the loveliest moment.",
    ],
  },

  story: {
    eyebrow: "Story",
    title: "How we photograph",
    intro: " is a baby photo studio in Seongsu-dong, Seongdong-gu, Seoul.",
    lead: 'Instead of the awkward "look here, smile now", we decided to simply play. We never insist on a perfect picture. While your child plays and gets up to mischief, the camera waits beside them for the moment that is genuinely theirs.',
    items: [
      {
        heading: "The name is the method",
        body: 'Kidding means playful mischief. That is why the studio is named this way, and it is our only philosophy. Rather than directing a child with "look here, smile now", we let them play — and the camera waits alongside.',
      },
      {
        heading: "We never insist on a perfect picture",
        body: "A neatly composed frame matters less to us than the mood that suits the child in front of us. We believe a child looks their best in the middle of laughing and enjoying themselves, so the results hold far more real expressions than rehearsed poses.",
      },
      {
        heading: "A room built like a playground",
        body: "We did not want a place where children put on nice clothes, take a picture and leave. We wanted somewhere they could laugh and mess about as freely as in their favourite toy room. The studio in Seongsu-dong, built largely by our own hands, started from that idea.",
      },
    ],
  },

  services: {
    eyebrow: "Services",
    title: "What we photograph",
    lead: "From first-birthday portraits to family sessions and growth records, matched to your child's age and the occasion. Schedules and what to bring are shared when you enquire.",
    items: [
      {
        name: "First birthday (Doljanchi)",
        description:
          "Marking a child's first birthday in Seongsu. No fixed poses are asked for — we photograph the expressions that appear while the child plays.",
      },
      {
        name: "100-day & growth sessions",
        description:
          "From 50-day and 100-day portraits through growth snapshots, recording each stage as your child grows.",
      },
      {
        name: "Family portraits",
        description:
          "Parents and children together. We put the family's own natural atmosphere ahead of a neatly arranged composition.",
      },
      {
        name: "Studio rental",
        description:
          "Rent the Seongsu studio space. A naturally lit room you can use for your own shoot.",
      },
    ],
  },

  gallery: {
    eyebrow: "Gallery",
    title: "Recent sessions",
    lead: "Work posted to our Instagram.",
    empty: "No posts have been synced yet.",
    related: "More sessions",
    scrollPrev: "Previous sessions",
    scrollNext: "Next sessions",
    comments: "Comments",
  },

  faq: {
    eyebrow: "FAQ",
    title: "Frequently asked questions",
    lead: "Booking, location and parking — the things people check most before a session.",
    items: [
      {
        q: "What kind of studio is kidding seongsu?",
        a: 'A baby photo studio in Seongsu-dong, Seongdong-gu, Seoul. True to the name "No posed, Just Kidding!", we skip the awkward "look here, smile now" and let children play freely, photographing the natural moments in between. We shoot first-birthday, family, 100-day and growth portraits, and also rent out the studio.',
      },
      {
        q: "How do I book or ask a question?",
        a: "Bookings and enquiries go through our KakaoTalk channel. You can also reach it from the link in the Instagram bio at @kidding.seongsu. Messages in English are welcome.",
      },
      {
        q: "How do I get there?",
        a: "3F, 21-1 Ttukseom-ro 4-gil, Seongdong-gu, Seoul. It is about a 10-minute walk from Exit 2 of Seoul Forest Station (Suin-Bundang Line) or Exit 4 of Seongsu Station (Line 2).",
      },
      {
        q: "Is there parking?",
        a: "There is a parking area inside the building, free for one car per booking. Additional cars can use the nearby public car parks.",
      },
      {
        q: "What are the opening hours?",
        a: "Monday to Friday 10:00–19:00, Saturday and Sunday 10:00–18:00. Sessions are by appointment only.",
      },
      {
        q: "Is it easy to visit with a baby?",
        a: "We have a high chair, and contactless payment is accepted.",
      },
      {
        q: "Can we bring a pet?",
        a: "Pets are welcome. Please bring a lead and a puppy pad or nappy.",
      },
    ],
  },

  location: {
    eyebrow: "Location",
    title: "Getting here",
    lead: "In Seongsu-dong, between Seoul Forest and Seongsu stations. Sessions are by appointment.",
    address: "Address",
    addressForMaps: "For map apps and taxi drivers",
    postalCode: (code: string) => `Postal code ${code}`,
    hours: "Opening hours",
    hoursWeekday: "Mon–Fri 10:00 – 19:00",
    hoursWeekend: "Sat & Sun 10:00 – 18:00",
    hoursShort: "Mon–Fri 10:00–19:00 · Sat–Sun 10:00–18:00 (by appointment)",
    phone: "Phone",
    directions: "Directions",
    directionsItems: [
      "About 10 min on foot from Seoul Forest Station (Suin-Bundang Line), Exit 2",
      "About 10 min on foot from Seongsu Station (Line 2), Exit 4",
      "Parking inside the building (one car free per booking; nearby car parks otherwise)",
    ],
    amenities: "Facilities",
    amenityItems: [
      "High chair",
      "Parking available",
      "Pet friendly",
      "Contactless payment",
      "By appointment",
    ],
    ctaTitle: "Planning a session?",
    ctaBody:
      "Tell us your preferred dates and your child's age in months, and we will share the available slots.",
  },

  footer: {
    studio: "Studio",
    links: "Links",
    about: "About the studio",
    privacy: "Privacy policy",
    kakao: "Book via KakaoTalk",
    syncNote: "Posts are synced automatically from our official Instagram.",
  },

  notFound: {
    title: "Page not found",
    body: "The address may be wrong, or the post may have been removed or changed.",
    home: "Back to home",
  },

  privacy: {
    title: "Privacy policy",
    metaDescription: "How this website handles personal information.",
    intro:
      " does not collect personal information through this website. Below is an explanation of what this site does handle.",
    clauses: [
      {
        title: "1. Personal information we collect",
        body: [
          "This website has no sign-up, login or contact form — nothing that takes personal input. We therefore do not collect or store names, phone numbers, email addresses or any other personal information.",
        ],
      },
      {
        title: "2. Published content",
        body: [
          "The photographs and text shown here are posts from the studio's official Instagram account, retrieved through Instagram's official API. Session photographs are published only within the scope consented to by the people photographed.",
          "If you would like a photograph removed, please contact us using the details below and we will take it down promptly after verification.",
        ],
      },
      {
        title: "3. Cookies and analytics",
        body: [
          "This site uses no advertising or tracking cookies. The hosting service may temporarily log access records (IP address, browser type) for operation and security; the studio does not read or retain these individually.",
        ],
      },
      {
        title: "4. External links",
        body: [
          "This site links to external services including Instagram, KakaoTalk Channel and map providers. Personal information handled on those sites follows each provider's own privacy policy.",
        ],
      },
      {
        title: "5. Contact",
        body: [
          "For questions about privacy or published content, please reach us through our KakaoTalk channel or by Instagram direct message.",
        ],
      },
      {
        title: "6. Changes to this policy",
        body: ["Any change to this privacy policy will be announced on this page."],
      },
    ],
  },
};
