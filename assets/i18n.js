// Language switcher: English | বাংলা | नेपाली
// Translates the page text in place from the dictionary below. Text added later by
// scripts (form messages, chat box, worker cards) is translated as it appears.
// To change a translation, edit the line for that English text: [Bangla, Nepali].
(function () {
  var LANGS = [
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'bn', label: 'বাংলা', short: 'বাংলা' },
    { code: 'ne', label: 'नेपाली', short: 'नेपाली' }
  ];
  var IDX = { bn: 0, ne: 1 };

  var D = {
    // Page titles
    "MVEC | Maldives Employment Consultant": ["MVEC | মালদ্বীপ এমপ্লয়মেন্ট কনসালট্যান্ট", "MVEC | माल्दिभ्स इम्प्लोयमेन्ट कन्सल्टेन्ट"],
    "About MVEC | Maldives Employment Consultancy": ["MVEC সম্পর্কে | মালদ্বীপ এমপ্লয়মেন্ট কনসালটেন্সি", "MVEC बारे | माल्दिभ्स इम्प्लोयमेन्ट कन्सल्टेन्सी"],
    "Contact MVEC | Maldives Employment Consultant": ["MVEC-এর সাথে যোগাযোগ | মালদ্বীপ এমপ্লয়মেন্ট কনসালট্যান্ট", "MVEC लाई सम्पर्क | माल्दिभ्स इम्प्लोयमेन्ट कन्सल्टेन्ट"],
    "Find a job in the Maldives | MVEC": ["মালদ্বীপে চাকরি খুঁজুন | MVEC", "माल्दिभ्समा जागिर खोज्नुहोस् | MVEC"],
    "Apply for expat quota | MVEC": ["বিদেশি কর্মী কোটার জন্য আবেদন | MVEC", "विदेशी कामदार कोटाका लागि आवेदन | MVEC"],
    "Safety and vetting | MVEC": ["নিরাপত্তা ও যাচাই | MVEC", "सुरक्षा र जाँच | MVEC"],
    "Browse available workers | MVEC": ["উপলব্ধ কর্মী দেখুন | MVEC", "उपलब्ध कामदारहरू हेर्नुहोस् | MVEC"],

    // Header & menu
    "Maldives Employment": ["মালদ্বীপ এমপ্লয়মেন্ট", "माल्दिभ्स इम्प्लोयमेन्ट"],
    "Consultancy": ["কনসালটেন্সি", "कन्सल्टेन्सी"],
    "Services": ["সেবাসমূহ", "सेवाहरू"],
    "Browse workers": ["কর্মী দেখুন", "कामदार हेर्नुहोस्"],
    "Safety & vetting": ["নিরাপত্তা ও যাচাই", "सुरक्षा र जाँच"],
    "About": ["আমাদের সম্পর্কে", "हाम्रो बारेमा"],
    "Contact": ["যোগাযোগ", "सम्पर्क"],
    "Find a job": ["চাকরি খুঁজুন", "जागिर खोज्नुहोस्"],
    "Apply for quota": ["কোটার আবেদন", "कोटा आवेदन"],
    "Hire help": ["কর্মী নিয়োগ", "कामदार राख्नुहोस्"],
    "MVEC home": ["MVEC হোম", "MVEC गृहपृष्ठ"],
    "Open menu": ["মেনু খুলুন", "मेनु खोल्नुहोस्"],
    "Home": ["হোম", "गृहपृष्ठ"],
    "Breadcrumb": ["পথনির্দেশ", "मार्गदर्शन"],
    "Language": ["ভাষা", "भाषा"],

    // Home page
    "Employment consultancy in Malé": ["মালেতে এমপ্লয়মেন্ট কনসালটেন্সি", "मालेमा रोजगार परामर्श सेवा"],
    "Hire foreign staff in the Maldives,": ["মালদ্বীপে বিদেশি কর্মী নিয়োগ করুন,", "माल्दिभ्समा विदेशी कर्मचारी राख्नुहोस्,"],
    "without the paperwork": ["কাগজপত্রের ঝামেলা", "कागजपत्रको झन्झट"],
    "headache.": ["ছাড়াই।", "बिना।"],
    "We handle expat quota, work permits, work visas and renewals on the Xpat portal for you, so your new team arrives on time and stays compliant.": ["আমরা আপনার হয়ে Xpat পোর্টালে বিদেশি কর্মী কোটা, ওয়ার্ক পারমিট, ওয়ার্ক ভিসা ও নবায়নের কাজ করি, যাতে আপনার নতুন কর্মীরা সময়মতো আসে এবং সব নিয়ম মেনে চলে।", "हामी तपाईंको तर्फबाट Xpat पोर्टलमा विदेशी कामदार कोटा, वर्क परमिट, वर्क भिसा र नवीकरणको काम गर्छौं, ताकि तपाईंका नयाँ कर्मचारी समयमै आइपुगून् र सबै नियम पालना होस्।"],
    "Get a free consultation": ["বিনামূল্যে পরামর্শ নিন", "निःशुल्क परामर्श लिनुहोस्"],
    "WhatsApp us": ["WhatsApp-এ লিখুন", "WhatsApp गर्नुहोस्"],
    "Quota and work permit applications": ["কোটা ও ওয়ার্ক পারমিটের আবেদন", "कोटा र वर्क परमिट आवेदन"],
    "Resorts, construction, retail and more": ["রিসোর্ট, নির্মাণ, দোকান ও আরও অনেক কিছু", "रिसोर्ट, निर्माण, पसल र अन्य धेरै"],
    "Clear fees, regular status updates": ["স্পষ্ট ফি, নিয়মিত অগ্রগতির খবর", "स्पष्ट शुल्क, नियमित प्रगति जानकारी"],
    "Quota approved": ["কোটা অনুমোদিত", "कोटा स्वीकृत"],
    "Done": ["সম্পন্ন", "सम्पन्न"],
    "Work permit issued": ["ওয়ার্ক পারমিট জারি হয়েছে", "वर्क परमिट जारी भयो"],
    "Work visa & medical": ["ওয়ার্ক ভিসা ও মেডিকেল", "वर्क भिसा र मेडिकल"],
    "In progress": ["চলছে", "प्रक्रियामा"],
    "Arrival & insurance": ["আগমন ও বীমা", "आगमन र बीमा"],
    "Next": ["পরবর্তী", "अर्को"],
    "We keep you posted at every step.": ["প্রতিটি ধাপে আমরা আপনাকে জানাই।", "हरेक चरणमा हामी तपाईंलाई जानकारी दिन्छौं।"],
    "Our services": ["আমাদের সেবা", "हाम्रा सेवाहरू"],
    "Everything an employer needs to bring in and keep expatriate staff, under one roof.": ["বিদেশি কর্মী আনা ও রাখার জন্য নিয়োগকর্তার যা যা দরকার, সব এক জায়গায়।", "विदेशी कर्मचारी ल्याउन र राख्न रोजगारदातालाई चाहिने सबै कुरा, एकै ठाउँमा।"],
    "Expat quota": ["বিদেশি কর্মী কোটা", "विदेशी कामदार कोटा"],
    "We prepare and submit quota applications and quota pool requests for your business site.": ["আপনার ব্যবসার সাইটের জন্য আমরা কোটার আবেদন ও কোটা পুল অনুরোধ তৈরি করে জমা দিই।", "तपाईंको व्यवसाय साइटका लागि हामी कोटा आवेदन र कोटा पूल अनुरोध तयार गरी पेश गर्छौं।"],
    "Apply online →": ["অনলাইনে আবেদন করুন →", "अनलाइन आवेदन दिनुहोस् →"],
    "Work permits": ["ওয়ার্ক পারমিট", "वर्क परमिट"],
    "New work permit applications, document checks and follow up until the permit is issued.": ["নতুন ওয়ার্ক পারমিটের আবেদন, কাগজপত্র যাচাই, এবং পারমিট জারি না হওয়া পর্যন্ত খোঁজখবর।", "नयाँ वर्क परमिट आवेदन, कागजात जाँच, र परमिट जारी नभएसम्म निरन्तर फलोअप।"],
    "Work visa & entry": ["ওয়ার্ক ভিসা ও প্রবেশ", "वर्क भिसा र प्रवेश"],
    "Work visa processing, medical checkups and insurance so staff can start work legally.": ["ওয়ার্ক ভিসা প্রক্রিয়া, মেডিকেল পরীক্ষা ও বীমা, যাতে কর্মীরা বৈধভাবে কাজ শুরু করতে পারে।", "वर्क भिसा प्रक्रिया, मेडिकल जाँच र बीमा, ताकि कर्मचारीले कानुनी रूपमा काम सुरु गर्न सकून्।"],
    "Renewals & transfers": ["নবায়ন ও বদলি", "नवीकरण र स्थानान्तरण"],
    "Permit renewals, employer transfers and cancellations before deadlines hit.": ["সময়সীমা শেষ হওয়ার আগেই পারমিট নবায়ন, নিয়োগকর্তা বদল ও বাতিলকরণ।", "म्याद सकिनुअघि नै परमिट नवीकरण, रोजगारदाता परिवर्तन र रद्द।"],
    "Recruitment": ["কর্মী সংগ্রহ", "भर्ती"],
    "Help finding and screening qualified candidates from abroad for your open roles.": ["আপনার খালি পদের জন্য বিদেশ থেকে যোগ্য প্রার্থী খুঁজে বাছাই করতে সাহায্য।", "तपाईंका खाली पदका लागि विदेशबाट योग्य उम्मेदवार खोज्न र छान्न सहयोग।"],
    "Compliance support": ["নিয়মকানুন বিষয়ে সহায়তা", "नियम पालना सहयोग"],
    "Advice on Maldivian employment rules, site registration and keeping records up to date.": ["মালদ্বীপের কর্মসংস্থান আইন, সাইট নিবন্ধন ও রেকর্ড হালনাগাদ রাখার বিষয়ে পরামর্শ।", "माल्दिभ्सको रोजगार नियम, साइट दर्ता र रेकर्ड अद्यावधिक राख्ने बारे सल्लाह।"],
    "How it works": ["কীভাবে কাজ করে", "कसरी काम गर्छ"],
    "Tell us what you need": ["আপনার কী দরকার আমাদের বলুন", "तपाईंलाई के चाहिन्छ भन्नुहोस्"],
    "Share the roles, number of staff and your business details.": ["পদ, কর্মীর সংখ্যা ও আপনার ব্যবসার তথ্য জানান।", "पद, कर्मचारी संख्या र तपाईंको व्यवसायको विवरण दिनुहोस्।"],
    "We prepare the documents": ["আমরা কাগজপত্র তৈরি করি", "हामी कागजात तयार गर्छौं"],
    "We collect and check everything required before anything is submitted.": ["জমা দেওয়ার আগে প্রয়োজনীয় সবকিছু আমরা সংগ্রহ ও যাচাই করি।", "केही पेश गर्नुअघि आवश्यक सबै कुरा हामी सङ्कलन र जाँच गर्छौं।"],
    "We file on Xpat": ["আমরা Xpat-এ জমা দিই", "हामी Xpat मा पेश गर्छौं"],
    "Quota, permit and visa applications are submitted and tracked for you.": ["আপনার হয়ে কোটা, পারমিট ও ভিসার আবেদন জমা দেওয়া ও অনুসরণ করা হয়।", "तपाईंको तर्फबाट कोटा, परमिट र भिसा आवेदन पेश गरी ट्र्याक गरिन्छ।"],
    "Your staff arrive": ["আপনার কর্মীরা পৌঁছে যায়", "तपाईंका कर्मचारी आइपुग्छन्"],
    "We finish visa, medical and insurance so they can start working.": ["ভিসা, মেডিকেল ও বীমা আমরা শেষ করি, যাতে তারা কাজ শুরু করতে পারে।", "भिसा, मेडिकल र बीमा हामी पूरा गर्छौं, ताकि उनीहरूले काम सुरु गर्न सकून्।"],
    "About MVEC": ["MVEC সম্পর্কে", "MVEC बारे"],
    "MVEC is a Maldives based employment consultancy helping local businesses hire and manage foreign workers. We know the Xpat system inside out and take care of the process from quota to arrival.": ["MVEC মালদ্বীপভিত্তিক একটি এমপ্লয়মেন্ট কনসালটেন্সি, যা স্থানীয় ব্যবসাগুলোকে বিদেশি কর্মী নিয়োগ ও পরিচালনায় সাহায্য করে। Xpat সিস্টেম আমরা খুব ভালো জানি এবং কোটা থেকে কর্মীর আগমন পর্যন্ত পুরো কাজটি আমরাই করি।", "MVEC माल्दिभ्समा रहेको रोजगार परामर्श संस्था हो, जसले स्थानीय व्यवसायलाई विदेशी कामदार राख्न र व्यवस्थापन गर्न सहयोग गर्छ। हामी Xpat प्रणाली राम्ररी जान्दछौं र कोटादेखि आगमनसम्मको सम्पूर्ण प्रक्रिया हेर्छौं।"],
    "Since 2014 we have placed more than 500 workers from 8 source countries with families and businesses across the Maldives.": ["২০১৪ সাল থেকে আমরা ৮টি দেশের ৫০০-র বেশি কর্মীকে মালদ্বীপজুড়ে পরিবার ও ব্যবসায় কাজে লাগিয়েছি।", "सन् २०१४ देखि हामीले ८ देशका ५०० भन्दा बढी कामदारलाई माल्दिभ्सभरका परिवार र व्यवसायमा काममा लगाएका छौं।"],
    "More about us →": ["আমাদের সম্পর্কে আরও →", "हाम्रो बारेमा थप →"],
    "Year we started": ["যে বছর শুরু করেছি", "हामीले सुरु गरेको वर्ष"],
    "Successful placements": ["সফল নিয়োগ", "सफल नियुक्ति"],
    "Source countries": ["উৎস দেশ", "स्रोत देशहरू"],
    "Frequently asked questions": ["সচরাচর জিজ্ঞাসিত প্রশ্ন", "धेरै सोधिने प्रश्नहरू"],
    "How long does a work permit take?": ["ওয়ার্ক পারমিট পেতে কত সময় লাগে?", "वर्क परमिट बन्न कति समय लाग्छ?"],
    "It depends on quota availability and how complete the documents are. We give you a realistic estimate once we see your case.": ["এটি কোটা পাওয়া যায় কিনা এবং কাগজপত্র কতটা সম্পূর্ণ তার ওপর নির্ভর করে। আপনার বিষয়টি দেখার পর আমরা বাস্তবসম্মত সময় জানাব।", "यो कोटा उपलब्धता र कागजात कति पूरा छन् भन्नेमा भर पर्छ। तपाईंको केस हेरेपछि हामी यथार्थ अनुमान दिन्छौं।"],
    "Which documents do you need from us?": ["আমাদের কাছ থেকে কোন কোন কাগজপত্র লাগবে?", "हामीबाट कुन कुन कागजात चाहिन्छ?"],
    "Usually your business registration, site details, the job roles, and the candidate's passport and certificates. We send a full checklist at the start.": ["সাধারণত আপনার ব্যবসার নিবন্ধন, সাইটের তথ্য, পদের বিবরণ এবং প্রার্থীর পাসপোর্ট ও সার্টিফিকেট। শুরুতেই আমরা পূর্ণ তালিকা পাঠাই।", "सामान्यतया तपाईंको व्यवसाय दर्ता, साइट विवरण, पदहरू, र उम्मेदवारको राहदानी तथा प्रमाणपत्र। सुरुमै हामी पूरा सूची पठाउँछौं।"],
    "Do you work with businesses outside Malé?": ["আপনারা কি মালের বাইরের ব্যবসার সাথেও কাজ করেন?", "के तपाईंहरू माले बाहिरका व्यवसायसँग पनि काम गर्नुहुन्छ?"],
    "Yes. We work with employers across the Maldives, including resorts and islands.": ["হ্যাঁ। রিসোর্ট ও দ্বীপসহ পুরো মালদ্বীপের নিয়োগকর্তাদের সাথে আমরা কাজ করি।", "हो। रिसोर्ट र टापुहरू सहित माल्दिभ्सभरका रोजगारदातासँग हामी काम गर्छौं।"],
    "How much do your services cost?": ["আপনাদের সেবার খরচ কত?", "तपाईंहरूको सेवाको शुल्क कति हो?"],
    "Fees depend on the service and number of employees. Contact us for a clear quote with no hidden charges.": ["ফি নির্ভর করে সেবা ও কর্মীর সংখ্যার ওপর। কোনো লুকানো খরচ ছাড়া স্পষ্ট মূল্য জানতে যোগাযোগ করুন।", "शुल्क सेवा र कर्मचारी संख्यामा भर पर्छ। कुनै लुकेको शुल्क बिनाको स्पष्ट दरका लागि सम्पर्क गर्नुहोस्।"],

    // Contact form
    "Contact us": ["যোগাযোগ করুন", "सम्पर्क गर्नुहोस्"],
    "Fill in the form and we'll get back to you within 24 hours.": ["ফর্মটি পূরণ করুন, আমরা ২৪ ঘণ্টার মধ্যে আপনার সাথে যোগাযোগ করব।", "फारम भर्नुहोस्, हामी २४ घण्टाभित्र सम्पर्क गर्नेछौं।"],
    "Full name *": ["পুরো নাম *", "पूरा नाम *"],
    "Email address *": ["ইমেইল ঠিকানা *", "इमेल ठेगाना *"],
    "Phone number *": ["ফোন নম্বর *", "फोन नम्बर *"],
    "Service type *": ["সেবার ধরন *", "सेवाको प्रकार *"],
    "Select a service": ["একটি সেবা বেছে নিন", "सेवा छान्नुहोस्"],
    "Work permit": ["ওয়ার্ক পারমিট", "वर्क परमिट"],
    "Renewal or transfer": ["নবায়ন বা বদলি", "नवीकरण वा स्थानान्तरण"],
    "Other": ["অন্যান্য", "अन्य"],
    "How did you hear about us?": ["আমাদের কথা কীভাবে জানলেন?", "हाम्रो बारेमा कसरी थाहा पाउनुभयो?"],
    "Select an option": ["একটি বেছে নিন", "एउटा छान्नुहोस्"],
    "Google search": ["গুগল সার্চ", "गुगल सर्च"],
    "Friend or referral": ["বন্ধু বা পরিচিতজন", "साथी वा चिनजान"],
    "Your message *": ["আপনার বার্তা *", "तपाईंको सन्देश *"],
    "Fields marked * are required.": ["* চিহ্নিত ঘর পূরণ করা বাধ্যতামূলক।", "* चिन्ह भएका ठाउँ भर्न अनिवार्य छ।"],
    "Send inquiry": ["জিজ্ঞাসা পাঠান", "सोधपुछ पठाउनुहोस्"],
    "Prefer to talk?": ["কথা বলতে চান?", "कुरा गर्न चाहनुहुन्छ?"],
    "Message us on WhatsApp or call the office.": ["WhatsApp-এ মেসেজ দিন অথবা অফিসে ফোন করুন।", "WhatsApp मा सन्देश पठाउनुहोस् वा अफिसमा फोन गर्नुहोस्।"],
    "Chat on WhatsApp": ["WhatsApp-এ চ্যাট করুন", "WhatsApp मा च्याट गर्नुहोस्"],
    "Chat with us on WhatsApp": ["WhatsApp-এ আমাদের সাথে চ্যাট করুন", "WhatsApp मा हामीसँग च्याट गर्नुहोस्"],
    "Phone": ["ফোন", "फोन"],
    "Email": ["ইমেইল", "इमेल"],
    "Office": ["অফিস", "अफिस"],
    "Majeedhee Magu, Male": ["মাজিদি মাগু, মালে", "मजिदी मागु, माले"],
    "Republic of Maldives": ["মালদ্বীপ প্রজাতন্ত্র", "माल्दिभ्स गणतन्त्र"],
    "Hours": ["সময়", "समय"],
    "Sunday – Thursday": ["রবিবার – বৃহস্পতিবার", "आइतबार – बिहीबार"],
    "9:00 AM – 5:00 PM": ["সকাল ৯টা – বিকেল ৫টা", "बिहान ९ बजे – साँझ ५ बजे"],
    "MVEC, Maldives Employment Consultant. All rights reserved.": ["MVEC, মালদ্বীপ এমপ্লয়মেন্ট কনসালট্যান্ট। সর্বস্বত্ব সংরক্ষিত।", "MVEC, माल्दिभ्स इम्प्लोयमेन्ट कन्सल्टेन्ट। सर्वाधिकार सुरक्षित।"],
    "Your full name": ["আপনার পুরো নাম", "तपाईंको पूरा नाम"],
    "Who you need, which island, when they should start": ["কাকে দরকার, কোন দ্বীপে, কবে থেকে কাজ শুরু", "कसलाई चाहिन्छ, कुन टापुमा, कहिलेदेखि काम सुरु"],
    "MVEC office on Majeedhee Magu, Male": ["মালের মাজিদি মাগুতে MVEC অফিস", "मालेको मजिदी मागुमा रहेको MVEC अफिस"],
    "Tell us who you're": ["আমাদের বলুন আপনি", "हामीलाई भन्नुहोस्, तपाईं"],
    "looking for": ["কাকে খুঁজছেন", "कसलाई खोज्दै हुनुहुन्छ"],
    "A consultant will call you back to talk it through. No cost, no commitment.": ["একজন পরামর্শক আপনাকে ফোন করে বিস্তারিত কথা বলবেন। কোনো খরচ নেই, কোনো বাধ্যবাধকতা নেই।", "एक जना परामर्शदाताले तपाईंलाई फोन गरेर कुरा गर्नुहुनेछ। कुनै शुल्क छैन, कुनै बाध्यता छैन।"],
    "Your details": ["আপনার তথ্য", "तपाईंको विवरण"],

    // About page
    "About us": ["আমাদের সম্পর্কে", "हाम्रो बारेमा"],
    "Your trusted partner in household": ["গৃহকর্মী নিয়োগে", "घरेलु कामदार"],
    "staffing": ["আপনার বিশ্বস্ত সঙ্গী", "राख्न तपाईंको भरपर्दो साथी"],
    "Maldives Employment Consultancy connects families with skilled domestic workers from abroad: housemaids, nannies, cooks and caregivers for households across the Maldives.": ["মালদ্বীপ এমপ্লয়মেন্ট কনসালটেন্সি পরিবারগুলোকে বিদেশের দক্ষ গৃহকর্মীদের সাথে যুক্ত করে: পুরো মালদ্বীপের পরিবারের জন্য গৃহপরিচারিকা, শিশু দেখাশোনাকারী, রাঁধুনি ও সেবাকর্মী।", "माल्दिभ्स इम्प्लोयमेन्ट कन्सल्टेन्सीले परिवारहरूलाई विदेशका दक्ष घरेलु कामदारसँग जोड्छ: माल्दिभ्सभरका घरका लागि घरेलु कामदार, बच्चा हेर्ने, भान्से र हेरचाहकर्ता।"],
    "How we vet workers": ["আমরা কীভাবে কর্মী যাচাই করি", "हामी कामदार कसरी जाँच्छौं"],
    "year we started": ["যে বছর শুরু করেছি", "हामीले सुरु गरेको वर्ष"],
    "years in household staffing": ["বছর গৃহকর্মী নিয়োগে", "वर्ष घरेलु कामदार सेवामा"],
    "successful placements": ["সফল নিয়োগ", "सफल नियुक्ति"],
    "source countries": ["উৎস দেশ", "स्रोत देशहरू"],
    "Who we are": ["আমরা কারা", "हामी को हौं"],
    "MVEC is a Malé based employment consultancy. We connect families and businesses in the Maldives with skilled workers from abroad, and we handle the paperwork on Xpat from quota to arrival.": ["MVEC মালেভিত্তিক একটি এমপ্লয়মেন্ট কনসালটেন্সি। আমরা মালদ্বীপের পরিবার ও ব্যবসাকে বিদেশের দক্ষ কর্মীদের সাথে যুক্ত করি, এবং কোটা থেকে আগমন পর্যন্ত Xpat-এর সব কাগজপত্রের কাজ করি।", "MVEC माले स्थित रोजगार परामर्श संस्था हो। हामी माल्दिभ्सका परिवार र व्यवसायलाई विदेशका दक्ष कामदारसँग जोड्छौं, र कोटादेखि आगमनसम्म Xpat को सबै कागजी काम गर्छौं।"],
    "For households, that means housemaids, nannies, cooks and caregivers you can trust. For businesses, it means expat quota, work permits, visas and renewals handled on time.": ["পরিবারের জন্য এর মানে বিশ্বস্ত গৃহপরিচারিকা, শিশু দেখাশোনাকারী, রাঁধুনি ও সেবাকর্মী। ব্যবসার জন্য এর মানে সময়মতো কোটা, ওয়ার্ক পারমিট, ভিসা ও নবায়ন।", "परिवारका लागि यसको अर्थ भरपर्दो घरेलु कामदार, बच्चा हेर्ने, भान्से र हेरचाहकर्ता। व्यवसायका लागि यसको अर्थ समयमै कोटा, वर्क परमिट, भिसा र नवीकरण।"],
    "Households": ["পরিবার", "परिवार"],
    "Housemaids, nannies, cooks, caregivers": ["গৃহপরিচারিকা, শিশু দেখাশোনাকারী, রাঁধুনি, সেবাকর্মী", "घरेलु कामदार, बच्चा हेर्ने, भान्से, हेरचाहकर्ता"],
    "Businesses": ["ব্যবসা", "व्यवसाय"],
    "Quota, work permits, visas, renewals": ["কোটা, ওয়ার্ক পারমিট, ভিসা, নবায়ন", "कोटा, वर्क परमिट, भिसा, नवीकरण"],
    "Ready to hire?": ["নিয়োগ দিতে প্রস্তুত?", "कामदार राख्न तयार हुनुहुन्छ?"],
    "Tell us who you are looking for and a consultant will call you back.": ["আপনি কাকে খুঁজছেন বলুন, একজন পরামর্শক আপনাকে ফোন করবেন।", "तपाईं कसलाई खोज्दै हुनुहुन्छ भन्नुहोस्, परामर्शदाताले फोन गर्नुहुनेछ।"],

    // Jobs page
    "For job seekers": ["চাকরিপ্রার্থীদের জন্য", "रोजगार खोज्नेहरूका लागि"],
    "Find a job in the": ["চাকরি খুঁজুন", "जागिर खोज्नुहोस्"],
    "Maldives": ["মালদ্বীপে", "माल्दिभ्समा"],
    "We place staff with resorts, construction companies, shops and offices across the Maldives. Send us your details and CV, and we'll contact you when a suitable job opens.": ["আমরা মালদ্বীপজুড়ে রিসোর্ট, নির্মাণ কোম্পানি, দোকান ও অফিসে কর্মী নিয়োগ দিই। আপনার তথ্য ও সিভি পাঠান, উপযুক্ত চাকরি পেলে আমরা যোগাযোগ করব।", "हामी माल्दिभ्सभरका रिसोर्ट, निर्माण कम्पनी, पसल र अफिसमा कामदार राख्छौं। आफ्नो विवरण र सिभी पठाउनुहोस्, उपयुक्त जागिर आएपछि हामी सम्पर्क गर्नेछौं।"],
    "Apply now": ["এখনই আবেদন করুন", "अहिले आवेदन दिनुहोस्"],
    "Phone / WhatsApp *": ["ফোন / WhatsApp *", "फोन / WhatsApp *"],
    "Nationality *": ["জাতীয়তা *", "राष्ट्रियता *"],
    "Job you're looking for *": ["যে চাকরি খুঁজছেন *", "तपाईंले खोजेको काम *"],
    "Years of experience": ["অভিজ্ঞতা (বছর)", "अनुभव (वर्ष)"],
    "Select": ["বেছে নিন", "छान्नुहोस्"],
    "Less than 1 year": ["১ বছরের কম", "१ वर्षभन्दा कम"],
    "1 to 3 years": ["১ থেকে ৩ বছর", "१ देखि ३ वर्ष"],
    "3 to 5 years": ["৩ থেকে ৫ বছর", "३ देखि ५ वर्ष"],
    "5 to 10 years": ["৫ থেকে ১০ বছর", "५ देखि १० वर्ष"],
    "More than 10 years": ["১০ বছরের বেশি", "१० वर्षभन्दा बढी"],
    "Where are you now?": ["আপনি এখন কোথায় আছেন?", "तपाईं अहिले कहाँ हुनुहुन्छ?"],
    "In the Maldives": ["মালদ্বীপে", "माल्दिभ्समा"],
    "In my home country": ["নিজের দেশে", "आफ्नै देशमा"],
    "Somewhere else": ["অন্য কোথাও", "अन्य कतै"],
    "CV (PDF, Word or photo, max 3 MB)": ["সিভি (PDF, Word বা ছবি, সর্বোচ্চ ৩ MB)", "सिभी (PDF, Word वा फोटो, बढीमा ३ MB)"],
    "Anything else we should know?": ["আর কিছু জানানোর আছে?", "हामीले थाहा पाउनुपर्ने अरू केही छ?"],
    "Fields marked * are required. We only use your details to find you a job.": ["* চিহ্নিত ঘর পূরণ করা বাধ্যতামূলক। আপনার তথ্য শুধু আপনার জন্য চাকরি খুঁজতে ব্যবহার করা হয়।", "* चिन्ह भएका ठाउँ भर्न अनिवार्य छ। तपाईंको विवरण जागिर खोज्न मात्र प्रयोग गरिन्छ।"],
    "Send application": ["আবেদন পাঠান", "आवेदन पठाउनुहोस्"],
    "Good to know": ["জেনে রাখুন", "थाहा पाउनुहोस्"],
    "We never ask job seekers for money to apply.": ["আবেদনের জন্য আমরা কখনো চাকরিপ্রার্থীর কাছে টাকা চাই না।", "आवेदन दिन हामी कहिल्यै रोजगार खोज्नेसँग पैसा माग्दैनौं।"],
    "If anyone asks you to pay in MVEC's name, tell us.": ["কেউ MVEC-এর নামে টাকা চাইলে আমাদের জানান।", "कसैले MVEC को नाममा पैसा मागेमा हामीलाई खबर गर्नुहोस्।"],
    "Keep your passport valid for at least 6 months.": ["আপনার পাসপোর্টের মেয়াদ অন্তত ৬ মাস রাখুন।", "राहदानीको म्याद कम्तीमा ६ महिना बाँकी राख्नुहोस्।"],
    "Have copies of your certificates and experience letters ready.": ["সার্টিফিকেট ও অভিজ্ঞতার চিঠির কপি প্রস্তুত রাখুন।", "प्रमाणपत्र र अनुभव पत्रका प्रतिलिपि तयार राख्नुहोस्।"],
    "We'll contact you on WhatsApp or phone, so double check your number.": ["আমরা WhatsApp বা ফোনে যোগাযোগ করব, তাই নম্বরটি ভালো করে মিলিয়ে নিন।", "हामी WhatsApp वा फोनमा सम्पर्क गर्छौं, त्यसैले आफ्नो नम्बर राम्ररी जाँच्नुहोस्।"],
    "Ask us on WhatsApp": ["WhatsApp-এ জিজ্ঞাসা করুন", "WhatsApp मा सोध्नुहोस्"],
    "As shown on your passport": ["পাসপোর্টে যেভাবে লেখা আছে", "राहदानीमा लेखिए अनुसार"],
    "Include country code": ["দেশের কোডসহ লিখুন", "देश कोड सहित लेख्नुहोस्"],
    "e.g. Bangladeshi, Indian": ["যেমন: বাংলাদেশি, ভারতীয়", "जस्तै: नेपाली, भारतीय"],
    "e.g. Chef, Mason, Housekeeping": ["যেমন: শেফ, রাজমিস্ত্রি, হাউসকিপিং", "जस्तै: सेफ, डकर्मी, हाउसकिपिङ"],
    "Languages, certificates, when you can start": ["ভাষা, সার্টিফিকেট, কবে থেকে কাজ শুরু করতে পারবেন", "भाषा, प्रमाणपत्र, कहिलेदेखि काम सुरु गर्न सक्नुहुन्छ"],

    // Quota page
    "For employers": ["নিয়োগকর্তাদের জন্য", "रोजगारदाताहरूका लागि"],
    "Apply for expat": ["বিদেশি কর্মী", "विदेशी कामदार"],
    "quota": ["কোটার জন্য আবেদন করুন", "कोटाका लागि आवेदन दिनुहोस्"],
    "Send us your company details and documents here. We check everything, submit your quota application on Xpat, and keep you updated until it's approved.": ["আপনার কোম্পানির তথ্য ও কাগজপত্র এখানে পাঠান। আমরা সব যাচাই করে Xpat-এ কোটার আবেদন জমা দিই এবং অনুমোদন না হওয়া পর্যন্ত আপনাকে জানাতে থাকি।", "आफ्नो कम्पनीको विवरण र कागजात यहाँ पठाउनुहोस्। हामी सबै जाँचेर Xpat मा कोटा आवेदन पेश गर्छौं, र स्वीकृत नभएसम्म जानकारी दिइरहन्छौं।"],
    "Fill in your company details": ["কোম্পানির তথ্য পূরণ করুন", "कम्पनीको विवरण भर्नुहोस्"],
    "Upload the documents you have": ["আপনার কাছে থাকা কাগজপত্র আপলোড করুন", "तपाईंसँग भएका कागजात अपलोड गर्नुहोस्"],
    "We review and call you within 1 working day": ["আমরা দেখে ১ কর্মদিবসের মধ্যে ফোন করব", "हामी हेरेर १ कार्यदिनभित्र फोन गर्छौं"],
    "Company details": ["কোম্পানির তথ্য", "कम्पनीको विवरण"],
    "Company name *": ["কোম্পানির নাম *", "कम्पनीको नाम *"],
    "Business registration no.": ["ব্যবসা নিবন্ধন নম্বর", "व्यवसाय दर्ता नं."],
    "Where do you need the quota? *": ["কোথায় কোটা দরকার? *", "कोटा कहाँका लागि चाहिन्छ? *"],
    "Select shop, vessel, godown…": ["দোকান, নৌযান, গুদাম… বেছে নিন", "पसल, डुङ्गा, गोदाम… छान्नुहोस्"],
    "Vessel": ["নৌযান", "डुङ्गा / जहाज"],
    "Construction site / project": ["নির্মাণ সাইট / প্রকল্প", "निर्माण स्थल / परियोजना"],
    "Resort / hotel / guesthouse": ["রিসোর্ট / হোটেল / গেস্টহাউস", "रिसोर्ट / होटल / गेस्टहाउस"],
    "Shop / retail": ["দোকান / খুচরা বিক্রয়", "पसल / खुद्रा"],
    "Godown / warehouse": ["গুদাম / ওয়্যারহাউস", "गोदाम / भण्डार"],
    "Restaurant / cafe": ["রেস্টুরেন্ট / ক্যাফে", "रेस्टुरेन्ट / क्याफे"],
    "Office / services": ["অফিস / সেবা", "अफिस / सेवा"],
    "Agriculture / fisheries": ["কৃষি / মৎস্য", "कृषि / माछापालन"],
    "Household / domestic worker": ["গৃহস্থালি / গৃহকর্মী", "घरायसी / घरेलु कामदार"],
    "Not sure – I need a consultation": ["নিশ্চিত নই – পরামর্শ দরকার", "निश्चित छैन – परामर्श चाहिन्छ"],
    "Other (please specify)": ["অন্যান্য (উল্লেখ করুন)", "अन्य (खुलाउनुहोस्)"],
    "Island / work site": ["দ্বীপ / কর্মস্থল", "टापु / कार्यस्थल"],
    "Please describe where *": ["কোথায় তা লিখুন *", "कहाँ हो लेख्नुहोस् *"],
    "Contact person *": ["যোগাযোগের ব্যক্তি *", "सम्पर्क व्यक्ति *"],
    "Position": ["পদবি", "पद"],
    "Phone *": ["ফোন *", "फोन *"],
    "Send code": ["কোড পাঠান", "कोड पठाउनुहोस्"],
    "Email *": ["ইমেইল *", "इमेल *"],
    "Send my code by:": ["কোড পাঠান যেভাবে:", "कोड यसरी पठाउनुहोस्:"],
    "Enter the code we sent you *": ["আমাদের পাঠানো কোডটি লিখুন *", "हामीले पठाएको कोड लेख्नुहोस् *"],
    "Quota needed": ["প্রয়োজনীয় কোটা", "चाहिने कोटा"],
    "Number of workers *": ["কর্মীর সংখ্যা *", "कामदार संख्या *"],
    "What do you need?": ["আপনার কী দরকার?", "तपाईंलाई के चाहिन्छ?"],
    "New quota": ["নতুন কোটা", "नयाँ कोटा"],
    "Additional quota": ["অতিরিক্ত কোটা", "थप कोटा"],
    "Quota and work permits": ["কোটা ও ওয়ার্ক পারমিট", "कोटा र वर्क परमिट"],
    "Not sure, please advise": ["নিশ্চিত নই, পরামর্শ দিন", "निश्चित छैन, सल्लाह दिनुहोस्"],
    "Job roles *": ["পদসমূহ *", "पदहरू *"],
    "Preferred nationality": ["পছন্দের জাতীয়তা", "रोजेको राष्ट्रियता"],
    "Documents": ["কাগজপত্র", "कागजातहरू"],
    "(optional)": ["(ঐচ্ছিক)", "(ऐच्छिक)"],
    "If you already have documents ready (PDF, photo or Word, up to 3 MB each), you can upload them here. Otherwise we'll tell you exactly what we need after we review your request.": ["কাগজপত্র তৈরি থাকলে (PDF, ছবি বা Word, প্রতিটি সর্বোচ্চ ৩ MB) এখানে আপলোড করতে পারেন। না থাকলে আপনার অনুরোধ দেখার পর আমরা ঠিক কী লাগবে জানাব।", "कागजात तयार छन् भने (PDF, फोटो वा Word, प्रत्येक बढीमा ३ MB) यहाँ अपलोड गर्न सक्नुहुन्छ। नभए तपाईंको अनुरोध हेरेपछि ठ्याक्कै के चाहिन्छ हामी भन्नेछौं।"],
    "Upload documents (optional)": ["কাগজপত্র আপলোড করুন (ঐচ্ছিক)", "कागजात अपलोड गर्नुहोस् (ऐच्छिक)"],
    "(you can choose several)": ["(একাধিক বেছে নিতে পারেন)", "(धेरै छान्न सक्नुहुन्छ)"],
    "Notes": ["নোট", "टिप्पणी"],
    "I confirm these documents are correct and agree that MVEC may use them to process my quota application. *": ["আমি নিশ্চিত করছি যে এই কাগজপত্র সঠিক এবং আমার কোটার আবেদন প্রক্রিয়ার জন্য MVEC এগুলো ব্যবহার করতে পারবে। *", "म यी कागजात सही छन् भनी पुष्टि गर्छु र मेरो कोटा आवेदन प्रक्रियाका लागि MVEC ले यिनलाई प्रयोग गर्न सक्ने कुरामा सहमत छु। *"],
    "Submit quota application": ["কোটার আবেদন জমা দিন", "कोटा आवेदन पेश गर्नुहोस्"],
    "Need help?": ["সাহায্য দরকার?", "सहयोग चाहिन्छ?"],
    "Not sure which documents you need, or have them on paper? Message us and we'll guide you.": ["কোন কাগজপত্র লাগবে জানেন না, বা কাগজে আছে? আমাদের মেসেজ দিন, আমরা দেখিয়ে দেব।", "कुन कागजात चाहिन्छ थाहा छैन, वा कागजमा मात्र छ? सन्देश पठाउनुहोस्, हामी सहयोग गर्छौं।"],
    "Your documents go straight to our team. They are not shown on the website.": ["আপনার কাগজপত্র সরাসরি আমাদের টিমের কাছে যায়। ওয়েবসাইটে দেখানো হয় না।", "तपाईंका कागजात सिधै हाम्रो टिमकहाँ जान्छन्। वेबसाइटमा देखाइँदैन।"],
    "You'll get a reference number to quote when you contact us.": ["আপনি একটি রেফারেন্স নম্বর পাবেন, যোগাযোগের সময় সেটি বলবেন।", "तपाईंले एउटा सन्दर्भ नम्बर पाउनुहुनेछ, सम्पर्क गर्दा त्यो बताउनुहोस्।"],
    "We'll confirm the full document list for your case before submitting on Xpat.": ["Xpat-এ জমা দেওয়ার আগে আপনার জন্য পূর্ণ কাগজপত্রের তালিকা আমরা নিশ্চিত করব।", "Xpat मा पेश गर्नुअघि तपाईंको केसका लागि पूरा कागजात सूची हामी पुष्टि गर्छौं।"],
    "e.g. Male, Hulhumale, K. Maafushi": ["যেমন: মালে, হুলহুমালে, K. মাফুশি", "जस्तै: माले, हुलहुमाले, K. माफुशी"],
    "e.g. Boat yard, workshop, school": ["যেমন: বোট ইয়ার্ড, ওয়ার্কশপ, স্কুল", "जस्तै: डुङ्गा यार्ड, वर्कशप, विद्यालय"],
    "e.g. Owner, HR Manager": ["যেমন: মালিক, এইচআর ম্যানেজার", "जस्तै: मालिक, HR प्रबन्धक"],
    "e.g. 2 x Cook, 3 x Room attendant": ["যেমন: ২ x রাঁধুনি, ৩ x রুম অ্যাটেনডেন্ট", "जस्तै: २ x भान्से, ३ x रुम अटेन्डेन्ट"],
    "Optional": ["ঐচ্ছিক", "ऐच्छिक"],
    "Anything else we should know": ["আর কিছু জানানোর থাকলে", "हामीले थाहा पाउनुपर्ने अरू केही"],

    // Safety page
    "Peace of mind": ["নিশ্চিন্ত থাকুন", "ढुक्क हुनुहोस्"],
    "Safety and": ["নিরাপত্তা ও", "सुरक्षा र"],
    "vetting": ["যাচাই", "जाँच"],
    "Bringing someone into your home is a big decision. Here is exactly how we screen every worker before presenting them to your family, so you know who you're hiring.": ["কাউকে ঘরে আনা একটি বড় সিদ্ধান্ত। আপনার পরিবারের সামনে উপস্থাপনের আগে আমরা প্রত্যেক কর্মীকে কীভাবে যাচাই করি তা এখানে দেওয়া হলো, যাতে আপনি জানেন কাকে নিয়োগ দিচ্ছেন।", "कसैलाई घरमा ल्याउनु ठूलो निर्णय हो। तपाईंको परिवारलाई देखाउनुअघि हामी हरेक कामदारलाई कसरी जाँच्छौं भन्ने यहाँ छ, ताकि तपाईंलाई थाहा होस् तपाईं कसलाई राख्दै हुनुहुन्छ।"],
    "How we screen every worker": ["আমরা কীভাবে প্রত্যেক কর্মী যাচাই করি", "हामी हरेक कामदारलाई कसरी जाँच्छौं"],
    "These are the checks a candidate goes through before we present them to you.": ["আপনার কাছে উপস্থাপনের আগে প্রার্থীকে এই যাচাইগুলো পার হতে হয়।", "तपाईंलाई देखाउनुअघि उम्मेदवारले पार गर्नुपर्ने जाँचहरू यी हुन्।"],
    "Identity and passport": ["পরিচয় ও পাসপোর্ট", "पहिचान र राहदानी"],
    "We check the passport and identity documents of every candidate, and that they match the CV.": ["আমরা প্রত্যেক প্রার্থীর পাসপোর্ট ও পরিচয়পত্র যাচাই করি এবং সেগুলো সিভির সাথে মিলিয়ে দেখি।", "हामी हरेक उम्मेदवारको राहदानी र परिचयपत्र जाँच्छौं, र ती सिभीसँग मेल खान्छन् कि हेर्छौं।"],
    "Police clearance": ["পুলিশ ক্লিয়ারেন্স", "प्रहरी प्रतिवेदन"],
    "Each candidate provides a police clearance certificate from their home country.": ["প্রত্যেক প্রার্থী নিজ দেশের পুলিশ ক্লিয়ারেন্স সার্টিফিকেট দেন।", "हरेक उम्मेदवारले आफ्नो देशको प्रहरी प्रमाणपत्र दिन्छन्।"],
    "Medical fitness": ["শারীরিক সুস্থতা", "स्वास्थ्य परीक्षण"],
    "A medical check in the home country before travel, and the required medical again on arrival in the Maldives.": ["যাত্রার আগে নিজ দেশে মেডিকেল পরীক্ষা, এবং মালদ্বীপে পৌঁছানোর পর প্রয়োজনীয় মেডিকেল আবার।", "यात्राअघि आफ्नै देशमा मेडिकल जाँच, र माल्दिभ्स आइपुगेपछि आवश्यक मेडिकल फेरि।"],
    "References and work history": ["রেফারেন্স ও কাজের অভিজ্ঞতা", "सन्दर्भ र कामको इतिहास"],
    "We contact previous employers where possible and confirm the experience on the CV.": ["সম্ভব হলে আগের নিয়োগকর্তাদের সাথে যোগাযোগ করে সিভির অভিজ্ঞতা নিশ্চিত করি।", "सम्भव भएसम्म पहिलेका रोजगारदातालाई सम्पर्क गरी सिभीको अनुभव पुष्टि गर्छौं।"],
    "Interview": ["সাক্ষাৎকার", "अन्तर्वार्ता"],
    "We interview every candidate, and you can do a video interview yourself before you decide.": ["আমরা প্রত্যেক প্রার্থীর সাক্ষাৎকার নিই, এবং সিদ্ধান্তের আগে আপনি নিজেও ভিডিও সাক্ষাৎকার নিতে পারেন।", "हामी हरेक उम्मेदवारको अन्तर्वार्ता लिन्छौं, र निर्णय गर्नुअघि तपाईं आफैं पनि भिडियो अन्तर्वार्ता लिन सक्नुहुन्छ।"],
    "After arrival": ["আগমনের পর", "आगमनपछि"],
    "Work permit, insurance and visa are done properly, and we stay in touch with you and the worker after they start.": ["ওয়ার্ক পারমিট, বীমা ও ভিসা সঠিকভাবে করা হয়, এবং কাজ শুরুর পরও আমরা আপনার ও কর্মীর সাথে যোগাযোগ রাখি।", "वर्क परमिट, बीमा र भिसा राम्ररी गरिन्छ, र काम सुरु भएपछि पनि हामी तपाईं र कामदारसँग सम्पर्कमा रहन्छौं।"],
    "Questions about a candidate?": ["কোনো প্রার্থী নিয়ে প্রশ্ন আছে?", "कुनै उम्मेदवारबारे प्रश्न छ?"],
    "Ask us anything before you decide. We'll share what we know.": ["সিদ্ধান্তের আগে যেকোনো কিছু জিজ্ঞাসা করুন। আমরা যা জানি জানাব।", "निर्णय गर्नुअघि जे पनि सोध्नुहोस्। हामीलाई थाहा भएको सबै बताउँछौं।"],
    "Meet available workers": ["উপলব্ধ কর্মীদের দেখুন", "उपलब्ध कामदारहरू हेर्नुहोस्"],

    // Workers page
    "Available now": ["এখন উপলব্ধ", "अहिले उपलब्ध"],
    "Meet available": ["উপলব্ধ কর্মীদের", "उपलब्ध कामदारहरू"],
    "workers": ["দেখুন", "हेर्नुहोस्"],
    "See the kinds of workers we place. Pick one, or tell us the role you need, and we'll send you matching candidates with their CVs. Every candidate is vetted before we present them to you.": ["আমরা কেমন কর্মী নিয়োগ দিই দেখুন। একজন বেছে নিন, অথবা কোন পদের দরকার বলুন, আমরা সিভিসহ উপযুক্ত প্রার্থী পাঠাব। আপনার কাছে উপস্থাপনের আগে প্রত্যেক প্রার্থী যাচাই করা হয়।", "हामीले राख्ने कामदारहरू हेर्नुहोस्। एक जना छान्नुहोस्, वा चाहिने पद भन्नुहोस्, हामी सिभी सहित उपयुक्त उम्मेदवार पठाउँछौं। तपाईंलाई देखाउनुअघि हरेक उम्मेदवार जाँचिन्छ।"],
    "All": ["সব", "सबै"],
    "Hospitality": ["আতিথেয়তা", "आतिथ्य"],
    "Construction": ["নির্মাণ", "निर्माण"],
    "Retail & office": ["দোকান ও অফিস", "पसल र अफिस"],
    "Domestic": ["গৃহস্থালি", "घरेलु"],
    "Filter by sector": ["খাত অনুযায়ী বাছুন", "क्षेत्र अनुसार छान्नुहोस्"],
    "Example profiles for now. MVEC will add the real list of available workers here.": ["আপাতত উদাহরণ প্রোফাইল। MVEC এখানে উপলব্ধ কর্মীদের আসল তালিকা যোগ করবে।", "अहिलेका लागि नमुना प्रोफाइल। MVEC ले उपलब्ध कामदारको वास्तविक सूची यहाँ थप्नेछ।"],
    "Nationality": ["জাতীয়তা", "राष्ट्रियता"],
    "Experience": ["অভিজ্ঞতা", "अनुभव"],
    "Available": ["কবে পাওয়া যাবে", "उपलब्धता"],
    "Languages": ["ভাষা", "भाषाहरू"],
    "Request this worker": ["এই কর্মীকে চাই", "यो कामदार माग्नुहोस्"],
    "Commis chef": ["সহকারী শেফ", "सहायक सेफ"],
    "Housekeeping attendant": ["হাউসকিপিং অ্যাটেনডেন্ট", "हाउसकिपिङ अटेन्डेन्ट"],
    "Waiter / waitress": ["ওয়েটার / ওয়েট্রেস", "वेटर / वेट्रेस"],
    "Mason": ["রাজমিস্ত্রি", "डकर्मी"],
    "Electrician": ["ইলেকট্রিশিয়ান", "इलेक्ट्रिसियन"],
    "Carpenter": ["কাঠমিস্ত্রি", "सिकर्मी"],
    "Sales assistant": ["বিক্রয় সহকারী", "बिक्री सहायक"],
    "Accountant": ["হিসাবরক্ষক", "लेखापाल"],
    "Housemaid": ["গৃহপরিচারিকা", "घरेलु कामदार"],
    "Indian": ["ভারতীয়", "भारतीय"],
    "Sri Lankan": ["শ্রীলঙ্কান", "श्रीलंकाली"],
    "Nepali": ["নেপালি", "नेपाली"],
    "Bangladeshi": ["বাংলাদেশি", "बंगलादेशी"],
    "Filipino": ["ফিলিপিনো", "फिलिपिनो"],
    "Immediately": ["এখনই", "तुरुन्तै"],
    "Within 1 month": ["১ মাসের মধ্যে", "१ महिनाभित्र"],
    "Within 2 weeks": ["২ সপ্তাহের মধ্যে", "२ हप्ताभित्र"],
    "Request workers": ["কর্মী চান", "कामदार माग्नुहोस्"],
    "Tell us who you need and we'll reply with candidates, costs and timelines.": ["কাকে দরকার বলুন, আমরা প্রার্থী, খরচ ও সময়সীমা জানিয়ে উত্তর দেব।", "कसलाई चाहिन्छ भन्नुहोस्, हामी उम्मेदवार, खर्च र समयसीमा सहित जवाफ दिन्छौं।"],
    "Your name *": ["আপনার নাম *", "तपाईंको नाम *"],
    "Company": ["কোম্পানি", "कम्पनी"],
    "Worker or role needed *": ["প্রয়োজনীয় কর্মী বা পদ *", "चाहिने कामदार वा पद *"],
    "How many": ["কতজন", "कति जना"],
    "Details": ["বিস্তারিত", "विवरण"],
    "Send request": ["অনুরোধ পাঠান", "अनुरोध पठाउनुहोस्"],
    "e.g. 3 x Commis chef": ["যেমন: ৩ x সহকারী শেফ", "जस्तै: ३ x सहायक सेफ"],
    "Island, start date, salary range, accommodation": ["দ্বীপ, শুরুর তারিখ, বেতনের পরিসর, থাকার ব্যবস্থা", "टापु, सुरु मिति, तलब दायरा, बस्ने व्यवस्था"],
    "Could not load the list. Please use the form below.": ["তালিকা লোড করা যায়নি। নিচের ফর্মটি ব্যবহার করুন।", "सूची खुल्न सकेन। कृपया तलको फारम प्रयोग गर्नुहोस्।"],

    // Form messages
    "Sending…": ["পাঠানো হচ্ছে…", "पठाउँदै…"],
    "Preparing…": ["প্রস্তুত হচ্ছে…", "तयार गर्दै…"],
    "Sending details…": ["তথ্য পাঠানো হচ্ছে…", "विवरण पठाउँदै…"],
    "Resend code": ["আবার কোড পাঠান", "फेरि कोड पठाउनुहोस्"],
    "Code sent. It is valid for 10 minutes.": ["কোড পাঠানো হয়েছে। এটি ১০ মিনিট বৈধ থাকবে।", "कोड पठाइयो। यो १० मिनेटसम्म मान्य हुन्छ।"],
    "Could not send the code.": ["কোড পাঠানো যায়নি।", "कोड पठाउन सकिएन।"],
    "Please tap \"Send code\" and enter the code we send you.": ["\"কোড পাঠান\" চাপুন এবং আমাদের পাঠানো কোডটি লিখুন।", "\"कोड पठाउनुहोस्\" थिच्नुहोस् र हामीले पठाएको कोड लेख्नुहोस्।"],
    "Something went wrong.": ["কিছু একটা সমস্যা হয়েছে।", "केही गडबड भयो।"],
    "Sorry, something went wrong.": ["দুঃখিত, কিছু একটা সমস্যা হয়েছে।", "माफ गर्नुहोस्, केही गडबड भयो।"],
    "Thank you! We'll get back to you within 24 hours.": ["ধন্যবাদ! আমরা ২৪ ঘণ্টার মধ্যে যোগাযোগ করব।", "धन्यवाद! हामी २४ घण्टाभित्र सम्पर्क गर्नेछौं।"],
    "Thank you! We've received your application and will contact you if a suitable job comes up.": ["ধন্যবাদ! আপনার আবেদন পেয়েছি, উপযুক্ত চাকরি পেলে যোগাযোগ করব।", "धन्यवाद! तपाईंको आवेदन प्राप्त भयो, उपयुक्त जागिर आएमा सम्पर्क गर्नेछौं।"],
    "Thank you! We've received your request and will send you candidates soon.": ["ধন্যবাদ! আপনার অনুরোধ পেয়েছি, শিগগিরই প্রার্থী পাঠাব।", "धन्यवाद! तपाईंको अनुरोध प्राप्त भयो, चाँडै उम्मेदवार पठाउनेछौं।"],
    "Your CV is larger than 3 MB. Please send a smaller file, or WhatsApp it to us.": ["আপনার সিভি ৩ MB-এর বেশি। ছোট ফাইল পাঠান, অথবা WhatsApp-এ পাঠান।", "तपाईंको सिभी ३ MB भन्दा ठूलो छ। सानो फाइल पठाउनुहोस्, वा WhatsApp मा पठाउनुहोस्।"],
    "Thank you! Your quota application has been sent. Your reference is": ["ধন্যবাদ! আপনার কোটার আবেদন পাঠানো হয়েছে। আপনার রেফারেন্স নম্বর", "धन्यवाद! तपाईंको कोटा आवेदन पठाइयो। तपाईंको सन्दर्भ नम्बर"],
    ". We'll call you within 1 working day.": ["। আমরা ১ কর্মদিবসের মধ্যে ফোন করব।", " हो। हामी १ कार्यदिनभित्र फोन गर्नेछौं।"],
    "Your application was received (reference": ["আপনার আবেদন পাওয়া গেছে (রেফারেন্স", "तपाईंको आवेदन प्राप्त भयो (सन्दर्भ"],

    // Chat box
    "Ask MVEC a question": ["MVEC-কে প্রশ্ন করুন", "MVEC लाई प्रश्न सोध्नुहोस्"],
    "Ask MVEC": ["MVEC-কে জিজ্ঞাসা করুন", "MVEC लाई सोध्नुहोस्"],
    "Close": ["বন্ধ করুন", "बन्द गर्नुहोस्"],
    "Sign in with your phone number to chat. We will send you a code on WhatsApp.": ["চ্যাট করতে ফোন নম্বর দিয়ে সাইন ইন করুন। আমরা WhatsApp-এ একটি কোড পাঠাব।", "च्याट गर्न फोन नम्बरबाट साइन इन गर्नुहोस्। हामी WhatsApp मा कोड पठाउँछौं।"],
    "Sign in with your phone number to chat. We will send you a code.": ["চ্যাট করতে ফোন নম্বর দিয়ে সাইন ইন করুন। আমরা একটি কোড পাঠাব।", "च्याट गर्न फोन नम्बरबाट साइन इन गर्नुहोस्। हामी कोड पठाउँछौं।"],
    "Enter the code": ["কোডটি লিখুন", "कोड लेख्नुहोस्"],
    "Sign in": ["সাইন ইন", "साइन इन"],
    "Sign out": ["সাইন আউট", "साइन आउट"],
    "Send": ["পাঠান", "पठाउनुहोस्"],
    "Type your question…": ["আপনার প্রশ্ন লিখুন…", "आफ्नो प्रश्न लेख्नुहोस्…"],
    "Hello! Ask me anything about hiring staff, quota, work permits, visas or jobs in the Maldives.": ["হ্যালো! মালদ্বীপে কর্মী নিয়োগ, কোটা, ওয়ার্ক পারমিট, ভিসা বা চাকরি নিয়ে যেকোনো প্রশ্ন করুন। বাংলায় লিখলে বাংলায় উত্তর পাবেন।", "नमस्ते! माल्दिभ्समा कामदार राख्ने, कोटा, वर्क परमिट, भिसा वा जागिरबारे जे पनि सोध्नुहोस्। नेपालीमा लेखे नेपालीमै जवाफ पाउनुहुन्छ।"],
    "Need a person? WhatsApp +960 763 7762": ["মানুষের সাথে কথা বলতে চান? WhatsApp +960 763 7762", "मान्छेसँग कुरा गर्न चाहनुहुन्छ? WhatsApp +960 763 7762"],
    // Open jobs + worker registration (2026-11-13)
    "Register as a worker | MVEC": ["কর্মী হিসেবে নিবন্ধন | MVEC", "कामदारका रूपमा दर्ता | MVEC"],
    "See open jobs": ["খালি চাকরি দেখুন", "खुला जागिर हेर्नुहोस्"],
    "Register as a worker": ["কর্মী হিসেবে নিবন্ধন করুন", "कामदारका रूपमा दर्ता गर्नुहोस्"],
    "Looking for work?": ["কাজ খুঁজছেন?", "काम खोज्दै हुनुहुन्छ?"],
    "Open jobs": ["খালি চাকরি", "खुला जागिरहरू"],
    "Jobs we are hiring for right now. Pick one and apply, or register so we can match you with the next one.": ["এখন যেসব চাকরিতে লোক নেওয়া হচ্ছে। একটি বেছে আবেদন করুন, অথবা নিবন্ধন করুন যাতে পরের চাকরিতে আমরা আপনাকে মিলিয়ে দিতে পারি।", "अहिले भर्ना भइरहेका जागिरहरू। एउटा छानेर आवेदन दिनुहोस्, वा दर्ता गर्नुहोस् ताकि अर्को जागिरमा हामी तपाईंलाई मिलाउन सकौं।"],
    "Example jobs for now. MVEC will add the real openings here.": ["এগুলো এখন উদাহরণ। MVEC এখানে আসল খালি চাকরি যোগ করবে।", "अहिलेका लागि उदाहरण जागिर। MVEC ले यहाँ वास्तविक जागिर थप्नेछ।"],
    "Loading jobs…": ["চাকরির তালিকা আসছে…", "जागिरहरू लोड हुँदै…"],
    "Place": ["স্থান", "ठाउँ"],
    "Type": ["ধরন", "प्रकार"],
    "Pay": ["বেতন", "तलब"],
    "Requirements": ["যোগ্যতা", "आवश्यकता"],
    "Apply for this job": ["এই চাকরিতে আবেদন করুন", "यो जागिरमा आवेदन दिनुहोस्"],
    "No open jobs right now. Register below and we'll contact you when one opens.": ["এখন কোনো খালি চাকরি নেই। নিবন্ধন করুন, চাকরি এলে আমরা যোগাযোগ করব।", "अहिले कुनै खुला जागिर छैन। दर्ता गर्नुहोस्, जागिर आएपछि हामी सम्पर्क गर्नेछौं।"],
    "Could not load the jobs. You can still apply below.": ["চাকরির তালিকা আনা যায়নি। তবুও নিচে আবেদন করতে পারেন।", "जागिरहरू लोड हुन सकेनन्। तपाईं तल आवेदन दिन सक्नुहुन्छ।"],
    "Register": ["নিবন্ধন", "दर्ता"],
    "Register as a": ["কর্মী হিসেবে", "कामदारका रूपमा"],
    "worker": ["নিবন্ধন করুন", "दर्ता गर्नुहोस्"],
    "Create your free profile in a few minutes. When a family or company in the Maldives needs someone like you, we'll contact you on WhatsApp or phone.": ["কয়েক মিনিটে বিনামূল্যে আপনার প্রোফাইল তৈরি করুন। মালদ্বীপের কোনো পরিবার বা কোম্পানির আপনার মতো কাউকে দরকার হলে আমরা WhatsApp বা ফোনে যোগাযোগ করব।", "केही मिनेटमै निःशुल्क प्रोफाइल बनाउनुहोस्। माल्दिभ्सको कुनै परिवार वा कम्पनीलाई तपाईं जस्तो मान्छे चाहिएमा हामी WhatsApp वा फोनबाट सम्पर्क गर्नेछौं।"],
    "Start my profile": ["প্রোফাইল শুরু করুন", "प्रोफाइल सुरु गर्नुहोस्"],
    "Your profile": ["আপনার প্রোফাইল", "तपाईंको प्रोफाइल"],
    "1. About you": ["১. আপনার পরিচয়", "१. तपाईंको बारेमा"],
    "2. How to reach you": ["২. যোগাযোগের উপায়", "२. सम्पर्क गर्ने तरिका"],
    "3. Your work": ["৩. আপনার কাজ", "३. तपाईंको काम"],
    "Date of birth *": ["জন্ম তারিখ *", "जन्म मिति *"],
    "Gender": ["লিঙ্গ", "लिङ्ग"],
    "Female": ["নারী", "महिला"],
    "Male": ["পুরুষ", "पुरुष"],
    "Home country *": ["নিজের দেশ *", "आफ्नो देश *"],
    "Bangladesh": ["বাংলাদেশ", "बंगलादेश"],
    "India": ["ভারত", "भारत"],
    "Nepal": ["নেপাল", "नेपाल"],
    "Sri Lanka": ["শ্রীলঙ্কা", "श्रीलंका"],
    "Philippines": ["ফিলিপাইন", "फिलिपिन्स"],
    "Indonesia": ["ইন্দোনেশিয়া", "इन्डोनेसिया"],
    "Vietnam": ["ভিয়েতনাম", "भियतनाम"],
    "Ethiopia": ["ইথিওপিয়া", "इथियोपिया"],
    "Field": ["কাজের ক্ষেত্র", "कामको क्षेत्र"],
    "Domestic (housemaid, nanny, cook, driver, caregiver)": ["গৃহকর্ম (গৃহপরিচারিকা, শিশু দেখাশোনা, রাঁধুনি, চালক, সেবাকর্মী)", "घरेलु (घरेलु कामदार, बच्चा हेर्ने, भान्से, चालक, हेरचाहकर्ता)"],
    "Hospitality (resort, hotel, restaurant)": ["আতিথেয়তা (রিসোর্ট, হোটেল, রেস্টুরেন্ট)", "होटल व्यवसाय (रिसोर्ट, होटल, रेस्टुरेन्ट)"],
    "Fishing & marine": ["মাছ ধরা ও সমুদ্র", "माछा मार्ने र समुद्री"],
    "Job you want *": ["যে কাজ চান *", "तपाईंले चाहेको काम *"],
    "e.g. Housemaid, Chef, Mason": ["যেমন: গৃহপরিচারিকা, রাঁধুনি, রাজমিস্ত্রি", "जस्तै: घरेलु कामदार, भान्से, डकर्मी"],
    "Languages you speak": ["যে ভাষায় কথা বলেন", "तपाईंले बोल्ने भाषा"],
    "e.g. English, Bangla, Hindi": ["যেমন: ইংরেজি, বাংলা, হিন্দি", "जस्तै: अंग्रेजी, नेपाली, हिन्दी"],
    "Passport": ["পাসপোর্ট", "राहदानी"],
    "Valid for 6+ months": ["৬ মাসের বেশি মেয়াদ আছে", "६ महिनाभन्दा बढी म्याद छ"],
    "Valid for less than 6 months": ["৬ মাসের কম মেয়াদ আছে", "६ महिनाभन्दा कम म्याद छ"],
    "I don't have one yet": ["এখনো নেই", "अझै छैन"],
    "When can you start?": ["কবে থেকে কাজ শুরু করতে পারবেন?", "कहिलेदेखि काम सुरु गर्न सक्नुहुन्छ?"],
    "Within 3 months": ["৩ মাসের মধ্যে", "३ महिनाभित्र"],
    "Later": ["পরে", "पछि"],
    "Skills and past jobs": ["দক্ষতা ও আগের কাজ", "सीप र पहिलेका काम"],
    "Where you worked before, what you can do, certificates": ["আগে কোথায় কাজ করেছেন, কী কী পারেন, সনদপত্র", "पहिले कहाँ काम गर्नुभयो, के गर्न सक्नुहुन्छ, प्रमाणपत्र"],
    "CV or photo (PDF, Word or photo, max 3 MB)": ["সিভি বা ছবি (PDF, Word বা ছবি, সর্বোচ্চ ৩ MB)", "सिभी वा फोटो (PDF, Word वा फोटो, बढीमा ३ MB)"],
    "I agree that MVEC may keep my details and share them with employers in the Maldives for job offers. *": ["আমি রাজি যে MVEC আমার তথ্য রাখবে এবং চাকরির জন্য মালদ্বীপের নিয়োগকর্তাদের সাথে শেয়ার করতে পারবে। *", "म सहमत छु कि MVEC ले मेरो विवरण राख्न र जागिरका लागि माल्दिभ्सका रोजगारदातासँग साझा गर्न सक्छ। *"],
    "What happens next": ["এরপর কী হবে", "अब के हुन्छ"],
    "We check your profile": ["আমরা আপনার প্রোফাইল দেখি", "हामी तपाईंको प्रोफाइल हेर्छौं"],
    "Our team reads every registration and may call you to ask a few questions.": ["আমাদের দল প্রতিটি নিবন্ধন পড়ে এবং কিছু প্রশ্ন করতে আপনাকে ফোন করতে পারে।", "हाम्रो टोलीले हरेक दर्ता पढ्छ र केही प्रश्न सोध्न फोन गर्न सक्छ।"],
    "We match you with a job": ["আমরা আপনাকে চাকরির সাথে মেলাই", "हामी तपाईंलाई जागिरसँग मिलाउँछौं"],
    "When an employer needs your skills, we send you the job, the pay and the conditions.": ["কোনো নিয়োগকর্তার আপনার দক্ষতা দরকার হলে আমরা চাকরি, বেতন ও শর্তগুলো পাঠাই।", "कुनै रोजगारदातालाई तपाईंको सीप चाहिएमा हामी जागिर, तलब र सर्तहरू पठाउँछौं।"],
    "We handle the paperwork": ["কাগজপত্রের কাজ আমরা করি", "कागजी काम हामी गर्छौं"],
    "If you accept, we arrange the quota, work permit and visa with the employer.": ["আপনি রাজি হলে নিয়োগকর্তার সাথে কোটা, ওয়ার্ক পারমিট ও ভিসার ব্যবস্থা আমরা করি।", "तपाईं सहमत भएमा रोजगारदातासँग कोटा, वर्क परमिट र भिसाको व्यवस्था हामी गर्छौं।"],
    "No upfront fees.": ["কোনো অগ্রিম ফি নেই।", "कुनै अग्रिम शुल्क छैन।"],
    "Registering is free and we never ask job seekers for money to apply. If anyone asks you to pay in MVEC's name, tell us.": ["নিবন্ধন বিনামূল্যে, আর আবেদনের জন্য আমরা কখনো টাকা চাই না। কেউ MVEC-এর নামে টাকা চাইলে আমাদের জানান।", "दर्ता निःशुल्क छ र आवेदनका लागि हामी कहिल्यै पैसा माग्दैनौं। कसैले MVEC को नाममा पैसा मागेमा हामीलाई भन्नुहोस्।"],
    "Thank you! You're registered. We'll contact you on WhatsApp or phone when a matching job opens.": ["ধন্যবাদ! আপনার নিবন্ধন হয়েছে। মিলে যায় এমন চাকরি এলে আমরা WhatsApp বা ফোনে যোগাযোগ করব।", "धन्यवाद! तपाईंको दर्ता भयो। मिल्ने जागिर आएपछि हामी WhatsApp वा फोनबाट सम्पर्क गर्नेछौं।"],
    "Please tick the box to agree.": ["রাজি হতে বক্সে টিক দিন।", "सहमति जनाउन बाकसमा टिक लगाउनुहोस्।"],
    "Could not send your registration.": ["আপনার নিবন্ধন পাঠানো যায়নি।", "तपाईंको दर्ता पठाउन सकिएन।"],
    "The file must be a PDF, Word document or photo.": ["ফাইলটি PDF, Word বা ছবি হতে হবে।", "फाइल PDF, Word वा फोटो हुनुपर्छ।"],
    "The file is too large (max 3 MB).": ["ফাইলটি অনেক বড় (সর্বোচ্চ ৩ MB)।", "फाइल धेरै ठूलो छ (बढीमा ३ MB)।"]

  };

  // Text with numbers or names inside.
  var RULES = [
    [/^Resend \((\d+)\)$/, ["আবার পাঠান ($1)", "फेरि पठाउनुहोस् ($1)"]],
    [/^Uploading (\d+) of (\d+)…$/, ["আপলোড হচ্ছে $2টির মধ্যে $1টি…", "अपलोड हुँदै $2 मध्ये $1…"]],
    [/^(\d+) years?$/, ["$1 বছর", "$1 वर्ष"]],
    [/^\), but these files did not upload: (.*)\. Please send them on WhatsApp with your reference\.$/, ["), কিন্তু এই ফাইলগুলো আপলোড হয়নি: $1। রেফারেন্স নম্বরসহ WhatsApp-এ পাঠান।", "), तर यी फाइल अपलोड भएनन्: $1। सन्दर्भ नम्बर सहित WhatsApp मा पठाउनुहोस्।"]],
    [/^"(.*)" is larger than 3 MB\. Please choose a smaller file, or send it on WhatsApp\.$/, ["\"$1\" ৩ MB-এর বেশি। ছোট ফাইল বেছে নিন, অথবা WhatsApp-এ পাঠান।", "\"$1\" ३ MB भन्दा ठूलो छ। सानो फाइल छान्नुहोस्, वा WhatsApp मा पठाउनुहोस्।"]],
    [/^(.*?) ?You can also WhatsApp us on \+960 763 7762\.$/, ["$1 আপনি WhatsApp-এও লিখতে পারেন: +960 763 7762।", "$1 तपाईं WhatsApp मा पनि सम्पर्क गर्न सक्नुहुन्छ: +960 763 7762।"], true]
  ];

  var norm = function (s) { return s.replace(/\s+/g, ' ').trim(); };
  var REV = {}; // any translation -> English, so text set by scripts is recognised
  Object.keys(D).forEach(function (k) { D[k].forEach(function (t) { REV[t] = k; }); });

  function tr(en, lang) {
    if (lang === 'en') return en;
    var i = IDX[lang], hit = D[en];
    if (hit) return hit[i];
    for (var r = 0; r < RULES.length; r++) {
      var m = en.match(RULES[r][0]);
      if (m) {
        var out = RULES[r][1][i], parts = m.slice(1);
        if (RULES[r][2]) parts = parts.map(function (p) { return D[p] ? D[p][i] : p; });
        return out.replace(/\$(\d)/g, function (_, n) { return parts[n - 1]; });
      }
    }
    return null;
  }

  // Is `key` the English text `en` or one of its translations?
  function known(en, key) {
    if (norm(en) === key) return true;
    return ['bn', 'ne'].some(function (l) { var t = tr(en, l); return t != null && norm(t) === key; });
  }

  var lang = 'en';
  var orig = new WeakMap(); // text node -> original English
  var busy = false;

  function doText(n) {
    var cur = n.nodeValue, key = norm(cur);
    if (!key || !/[A-Za-zঀ-৿ऀ-ॿ]/.test(key)) return;
    var p = n.parentNode;
    if (p && (p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE' || p.nodeName === 'TEXTAREA')) return;
    if (p && p.closest && p.closest('[data-no-i18n], .lang-switch')) return;
    var en = orig.get(n);
    if (en === undefined || !known(en, key)) en = REV[key] || key;
    orig.set(n, en);
    // Keep English option values so forms still submit in English.
    if (p && p.nodeName === 'OPTION' && !p.hasAttribute('value')) p.setAttribute('value', en);
    var t = tr(en, lang);
    if (t == null) t = en;
    var lead = cur.match(/^\s*/)[0], trail = cur.match(/\s*$/)[0];
    var next = lead + t + trail;
    if (next !== cur) n.nodeValue = next;
  }

  var ATTRS = ['placeholder', 'aria-label', 'title'];
  function doAttrs(e) {
    ATTRS.forEach(function (a) {
      var v = e.getAttribute(a);
      if (!v) return;
      var k = 'data-i18n-' + a, en = e.getAttribute(k);
      if (en === null || !known(en, norm(v))) { en = REV[norm(v)] || norm(v); e.setAttribute(k, en); }
      var t = tr(en, lang);
      e.setAttribute(a, t == null ? en : t);
    });
  }

  function walk(root) {
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1) return;
    if (root.matches && root.matches('script,style')) return;
    doAttrs(root);
    root.querySelectorAll('[placeholder],[aria-label],[title]').forEach(doAttrs);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n, list = [];
    while ((n = w.nextNode())) list.push(n);
    list.forEach(doText);
  }

  function apply() {
    busy = true;
    document.documentElement.lang = lang;
    document.documentElement.classList.remove('lang-en', 'lang-bn', 'lang-ne');
    document.documentElement.classList.add('lang-' + lang);
    if (!document.documentElement.hasAttribute('data-i18n-title')) document.documentElement.setAttribute('data-i18n-title', document.title);
    var et = document.documentElement.getAttribute('data-i18n-title');
    document.title = tr(et, lang) || et;
    walk(document.body);
    document.querySelectorAll('.lang-switch button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.lang === lang); });
    obs.takeRecords();
    busy = false;
  }

  var obs = new MutationObserver(function (muts) {
    if (busy || lang === 'en') return;
    busy = true;
    muts.forEach(function (m) {
      if (m.type === 'characterData') doText(m.target);
      else if (m.type === 'attributes') doAttrs(m.target);
      else m.addedNodes.forEach(walk);
    });
    obs.takeRecords();
    busy = false;
  });

  function setLang(l) {
    lang = l;
    try { localStorage.setItem('mvec-lang', l); } catch (e) {}
    apply();
  }

  function buildSwitch() {
    var nav = document.querySelector('.nav-side') || document.querySelector('.nav');
    if (!nav) return;
    var box = document.createElement('div');
    box.className = 'lang-switch';
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', 'Language');
    LANGS.forEach(function (L) {
      var b = document.createElement('button');
      b.type = 'button'; b.dataset.lang = L.code; b.lang = L.code; b.textContent = L.short;
      b.setAttribute('aria-pressed', L.code === lang);
      b.addEventListener('click', function () { setLang(L.code); });
      box.appendChild(b);
    });
    nav.insertBefore(box, nav.firstChild);
    // On phones the menu is folded away, so keep the switch in the top bar.
    var bar = document.querySelector('.nav'), toggle = document.querySelector('.nav-toggle');
    if (bar && toggle && window.matchMedia) {
      var mq = window.matchMedia('(max-width: 1080px)');
      var place = function () {
        if (mq.matches) { box.classList.add('lang-top'); bar.insertBefore(box, toggle); }
        else { box.classList.remove('lang-top'); nav.insertBefore(box, nav.firstChild); }
      };
      place();
      if (mq.addEventListener) mq.addEventListener('change', place); else if (mq.addListener) mq.addListener(place);
    }
  }

  function start() {
    var saved = null;
    try { saved = localStorage.getItem('mvec-lang'); } catch (e) {}
    if (!saved) {
      var nl = (navigator.language || '').toLowerCase();
      saved = nl.indexOf('bn') === 0 ? 'bn' : nl.indexOf('ne') === 0 ? 'ne' : 'en';
    }
    lang = IDX[saved] !== undefined ? saved : 'en';
    buildSwitch();
    if (lang !== 'en') apply();
    obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.mvecLang = { get: function () { return lang; }, set: setLang };
})();
