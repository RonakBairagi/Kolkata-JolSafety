import { WaterloggingIncident, SafeLocation, WeatherData, EarlyWarning, OfflineMapZone, EmergencyContact, RouteOption } from '../types';

export const INITIAL_INCIDENTS: WaterloggingIncident[] = [
  {
    id: 'inc-sector5-1',
    title: 'Severe Waterlogging at College More, Sector V',
    titleBn: 'কলেজ মোড়, সেক্টর ফাইভ-এ তীব্র জলমগ্নতা',
    area: 'Sector V (Salt Lake IT Hub)',
    areaBn: 'সেক্টর ফাইভ (সল্টলেক আইটি হাব)',
    landmark: 'Near Webel Bhavan & RDB Cinema intersection',
    coordinates: [22.5735, 88.4331],
    severity: 'severe',
    waterDepthInches: 18,
    waterDepthDesc: 'Waist-to-knee deep water; sedans and two-wheelers stalling.',
    waterDepthDescBn: 'হাঁটু থেকে কোমর পর্যন্ত জল; ছোট গাড়ি ও বাইক বিকল হচ্ছে।',
    roadCondition: 'Potholes hidden under muddy water; open drain near footpath.',
    roadConditionBn: 'কাদার জলের নিচে গর্ত লুকানো; ফুটপাথের কাছে খোলা নালা।',
    trafficStatus: 'blocked',
    hazards: ['Deep hidden potholes', 'Stalled vehicles', 'Submerged road divider'],
    verified: true,
    verifiedByAuthority: true,
    confirmationsCount: 38,
    reportedAt: '12 mins ago',
    source: 'authority'
  },
  {
    id: 'inc-gariahata-1',
    title: 'Moderate Waterlogging near Gariahat Crossing & Pantaloons',
    titleBn: 'গড়িয়াহাট ক্রসিং ও প্যান্টালুন্স সংলগ্ন জল জমা',
    area: 'Gariahat (South Kolkata)',
    areaBn: 'গড়িয়াহাট (দক্ষিণ কলকাতা)',
    landmark: 'Rashbehari Avenue & Gariahat Tram Depot stretch',
    coordinates: [22.5195, 88.3664],
    severity: 'moderate',
    waterDepthInches: 10,
    waterDepthDesc: 'Calf-to-knee depth; slow moving buses and trams suspended.',
    waterDepthDescBn: 'গোড়ালি থেকে হাঁটু অবধি জল; বাস ধীরে চলছে, ট্রাম বন্ধ।',
    roadCondition: 'Water pumping in progress by KMC mobile pumps.',
    roadConditionBn: 'কেএমসি পোর্টেবল পাম্প দিয়ে জল নিষ্কাশন চলছে।',
    trafficStatus: 'slow',
    hazards: ['Slippery tram tracks', 'Pavement curbs submerged'],
    verified: true,
    verifiedByAuthority: false,
    confirmationsCount: 24,
    reportedAt: '25 mins ago',
    source: 'community'
  },
  {
    id: 'inc-jadavpur-1',
    title: 'Critical Waterlogging at Jadavpur 8B Bus Stand & Sulekha More',
    titleBn: 'যাদবপুর ৮বি বাস স্ট্যান্ড ও সুলেখা মোড়ে বিপজ্জনক জল জমা',
    area: 'Jadavpur (South Kolkata)',
    areaBn: 'যাদবপুর (দক্ষিণ কলকাতা)',
    landmark: 'Raja SC Mallick Road opposite Jadavpur University Gate 3',
    coordinates: [22.4988, 88.3718],
    severity: 'critical',
    waterDepthInches: 26,
    waterDepthDesc: 'Over 2 feet deep; severe flooding from canal backflow.',
    waterDepthDescBn: '২ ফুটের বেশি জল; খালের অতিরিক্ত জল উপচে প্লাবিত।',
    roadCondition: 'Water level rising rapidly; open manhole marked with tree branch.',
    roadConditionBn: 'জল দ্রুত বাড়ছে; খোলা ম্যানহোলে গাছের ডাল দিয়ে চিহ্নিত করা হয়েছে।',
    trafficStatus: 'blocked',
    hazards: ['Open manhole flagged with branch', 'Risk of electrocution near junction box', 'Canal overflow'],
    verified: true,
    verifiedByAuthority: true,
    confirmationsCount: 52,
    reportedAt: '8 mins ago',
    source: 'authority'
  },
  {
    id: 'inc-central-1',
    title: 'Severe Flooding at Thanthania Kalibari & MG Road',
    titleBn: 'ঠনঠনিয়া কালীবাড়ি ও এমজি রোডে মারাত্মক জল জমা',
    area: 'Central Kolkata',
    areaBn: 'মধ্য কলকাতা',
    landmark: 'Bidhan Sarani and MG Road crossing',
    coordinates: [22.5815, 88.3621],
    severity: 'severe',
    waterDepthInches: 20,
    waterDepthDesc: 'Water entered roadside shops; hand-pulled rickshaws only.',
    waterDepthDescBn: 'রাস্তার ধারের দোকানে জল ঢুকেছে; শুধু টানা রিকশা চলছে।',
    roadCondition: 'Ancient brick road uneven with submerged trenches.',
    roadConditionBn: 'পুরোনো বাঁধানো রাস্তায় জলের তলায় খানাখন্দ।',
    trafficStatus: 'congested',
    hazards: ['Heavy submerged rubbish', 'Exposed junction cables'],
    verified: true,
    verifiedByAuthority: false,
    confirmationsCount: 19,
    reportedAt: '40 mins ago',
    source: 'community'
  },
  {
    id: 'inc-behala-1',
    title: 'Moderate Waterlogging at Taratala & Diamond Harbour Road',
    titleBn: 'তারাতলা ও ডায়মন্ড হারবার রোডে জল জমা',
    area: 'Behala',
    areaBn: 'বেহালা',
    landmark: 'Under Taratala Flyover near Majerhat bridge connection',
    coordinates: [22.5112, 88.3182],
    severity: 'moderate',
    waterDepthInches: 11,
    waterDepthDesc: 'Around 10-12 inches; heavy traffic diversion via flyover.',
    waterDepthDescBn: '১০-১২ ইঞ্চি জল; ফ্লাইওভার দিয়ে গাড়ি ঘোরানো হচ্ছে।',
    roadCondition: 'Slushy mud from metro construction side.',
    roadConditionBn: 'মেট্রো কাজের জায়গা থেকে কাদা ও পিচ্ছিল রাস্তা।',
    trafficStatus: 'slow',
    hazards: ['Mud accumulation', 'Loose gravel under water'],
    verified: false,
    verifiedByAuthority: false,
    confirmationsCount: 11,
    reportedAt: '1 hr ago',
    source: 'community'
  },
  {
    id: 'inc-parkstreet-1',
    title: 'Low Water Accumulation on Park Street & Camac Street',
    titleBn: 'পার্ক স্ট্রিট ও ক্যামাক স্ট্রিটে সামান্য জল জমা',
    area: 'Park Street',
    areaBn: 'পার্ক স্ট্রিট',
    landmark: 'Near Allen Park & Russell Street turn',
    coordinates: [22.5532, 88.3524],
    severity: 'low',
    waterDepthInches: 4,
    waterDepthDesc: 'Water receding through functional storm drains; passable.',
    waterDepthDescBn: 'ড্রেনে জল নামছে; গাড়ি ও পথচারী চলাচল স্বাভাবিকের কাছাকাছি।',
    roadCondition: 'Normal asphalt surface; watch for slippery curbs.',
    roadConditionBn: 'রাস্তা ঠিক আছে; ফুটপাথের ধার পিচ্ছিল।',
    trafficStatus: 'normal',
    hazards: ['Minor surface skidding'],
    verified: true,
    verifiedByAuthority: true,
    confirmationsCount: 15,
    reportedAt: '5 mins ago',
    source: 'authority'
  }
];

export const INITIAL_SAFE_LOCATIONS: SafeLocation[] = [
  {
    id: 'safe-amri-dhakuria',
    name: 'AMRI Hospitals (Dhakuria)',
    nameBn: 'আমরি হসপিটাল (ঢাকুরিয়া)',
    type: 'hospital',
    area: 'Gariahat / Dhakuria',
    areaBn: 'গড়িয়াহাট / ঢাকুরিয়া',
    address: 'P-4 & 5, CIT Scheme LXXII, Block A, Gariahat Rd, Dhakuria',
    coordinates: [22.5118, 88.3642],
    phone: '033-66800000',
    isElevatedGround: true,
    hasEmergencyPower: true,
    notes: 'Elevated campus entrance, 24/7 emergency trauma care and ambulance fleet.'
  },
  {
    id: 'safe-kpc-jadavpur',
    name: 'KPC Medical College & Hospital',
    nameBn: 'কেপিসি মেডিকেল কলেজ ও হাসপাতাল',
    type: 'hospital',
    area: 'Jadavpur',
    areaBn: 'যাদবপুর',
    address: '1F, Raja SC Mallick Rd, Jadavpur, Kolkata 700032',
    coordinates: [22.4927, 88.3702],
    phone: '033-66795000',
    isElevatedGround: true,
    hasEmergencyPower: true,
    notes: 'Access via elevated ramp. Emergency admission dry zone.'
  },
  {
    id: 'safe-apollo-saltlake',
    name: 'Apollo Multispeciality Hospitals',
    nameBn: 'অ্যাপোলো হাসপাতাল (সল্টলেক)',
    type: 'hospital',
    area: 'Salt Lake / EM Bypass',
    areaBn: 'সল্টলেক / ইএম বাইপাস',
    address: '58 Canal Circular Rd, Kadapara, Phool Bagan, Kolkata 700054',
    coordinates: [22.5694, 88.4022],
    phone: '033-23203040',
    isElevatedGround: true,
    hasEmergencyPower: true,
    notes: 'Easily accessible from EM Bypass flyovers without navigating flooded local alleys.'
  },
  {
    id: 'safe-jadavpur-ps',
    name: 'Jadavpur Police Station',
    nameBn: 'যাদবপুর থানা',
    type: 'police',
    area: 'Jadavpur',
    areaBn: 'যাদবপুর',
    address: '197, Raja SC Mullick Rd, Poddar Nagar, Jadavpur, Kolkata 700032',
    coordinates: [22.4975, 88.3688],
    phone: '033-24146000',
    isElevatedGround: true,
    hasEmergencyPower: true,
    notes: 'Rescue rubber boats & emergency evacuation squad deployed.'
  },
  {
    id: 'safe-bidhannagar-ps',
    name: 'Bidhannagar East Police Station',
    nameBn: 'বিধাননগর পূর্ব থানা',
    type: 'police',
    area: 'Sector V / Salt Lake',
    areaBn: 'সেক্টর ফাইভ / সল্টলেক',
    address: 'Salt Lake Stadium Complex, Sector III / V Border',
    coordinates: [22.5712, 88.4215],
    phone: '033-23351111',
    isElevatedGround: true,
    hasEmergencyPower: true,
    notes: 'Emergency police assistance for stranded IT workers.'
  },
  {
    id: 'safe-gariahata-ps',
    name: 'Gariahat Police Station',
    nameBn: 'গড়িয়াহাট থানা',
    type: 'police',
    area: 'Gariahat',
    areaBn: 'গড়িয়াহাট',
    address: '69, Gariahat Rd, Dover Terrace, Ballygunge, Kolkata 700019',
    coordinates: [22.5230, 88.3651],
    phone: '033-24606000',
    isElevatedGround: false,
    hasEmergencyPower: true,
    notes: 'Active police booth with rescue ropes and high-axle vehicle support.'
  },
  {
    id: 'safe-fire-saltlake',
    name: 'Salt Lake Fire & Emergency Services',
    nameBn: 'সল্টলেক ফায়ার অ্যান্ড ইমার্জেন্সি স্টেশন',
    type: 'fire_station',
    area: 'Sector V',
    areaBn: 'সেক্টর ফাইভ',
    address: 'Sector V, Salt Lake City, Kolkata 700091',
    coordinates: [22.5780, 88.4350],
    phone: '033-23577777',
    isElevatedGround: true,
    hasEmergencyPower: true,
    notes: 'Heavy flood pump engines and disaster water rescue units on standby.'
  },
  {
    id: 'safe-metro-kalighat',
    name: 'Kalighat Metro Station (High Ground Concourse)',
    nameBn: 'কালীঘাট মেট্রো স্টেশন (উঁচু কনকোর্স)',
    type: 'metro_station',
    area: 'Kalighat / Rashbehari',
    areaBn: 'কালীঘাট / রাসবিহারী',
    address: 'SP Mukherjee Rd, Kolkata 700026',
    coordinates: [22.5181, 88.3475],
    phone: '033-22264817',
    isElevatedGround: true,
    hasEmergencyPower: true,
    notes: 'Safe dry shelter, elevated exits, drinking water, operating power & ticketing hall.'
  },
  {
    id: 'safe-shelter-kmc-gariahata',
    name: 'KMC Relief & Night Shelter (Ballygunge)',
    nameBn: 'কেএমসি ত্রাণ ও আশ্রয়কেন্দ্র (বালিগঞ্জ)',
    type: 'shelter',
    area: 'Gariahat / Ballygunge',
    areaBn: 'গড়িয়াহাট / বালিগঞ্জ',
    address: 'Near Gariahat Flyover Landing, Dover Road, Kolkata 700019',
    coordinates: [22.5255, 88.3648],
    phone: '033-22861212',
    isElevatedGround: true,
    hasEmergencyPower: true,
    notes: 'Designated municipal monsoon flood shelter with dry food and medical first aid.'
  },
  {
    id: 'safe-shelter-saltlake-sec5',
    name: 'Bidhannagar Community Emergency Shelter',
    nameBn: 'বিধাননগর জরুরি সম্প্রদায় আশ্রয়কেন্দ্র',
    type: 'shelter',
    area: 'Sector V',
    areaBn: 'সেক্টর ফাইভ',
    address: 'Near Nicco Park crossing, Salt Lake Sector IV/V',
    coordinates: [22.5698, 88.4285],
    phone: '033-23371425',
    isElevatedGround: true,
    hasEmergencyPower: true,
    notes: 'High-plinth flood shelter capacity for 250 stranded commuters.'
  }
];

export const INITIAL_WEATHER: WeatherData = {
  city: 'Kolkata, West Bengal',
  temperature: 28,
  condition: 'Heavy Monsoon Rain & Thunderstorms',
  conditionBn: 'ভারী বর্ষণ ও বজ্রবিদ্যুৎ সহ বৃষ্টিপাত',
  rainfallIntensityMmHr: 48.5,
  rainfallLevel: 'heavy',
  precipitationProb: 95,
  humidity: 92,
  windSpeedKmH: 34,
  updatedAt: 'Just now (Alipore Met Centre Sync)',
  hooghlyHighTide: {
    time: '16:45 IST',
    levelMeters: 5.4,
    statusUnavailable: true,
    warning: 'High Tide peak at River Hooghly: 5.4m. Official live gate status is checked directly via West Bengal I&WD / CWC feeds.',
    warningBn: 'হুগলি নদীতে ৫.৪ মিটার জোয়ারের পূর্বাভাস। পশ্চিমবঙ্গ সেচ দপ্তর (I&WD) ও সিডব্লিউসি ফিড থেকে সরাসরি গেটের অবস্থা যাচাই করা হচ্ছে।'
  },
  forecastHourly: [
    { time: '12:00', rainfallMm: 45, prob: 95, desc: 'Torrential downpour' },
    { time: '13:00', rainfallMm: 52, prob: 95, desc: 'Intense cloudburst spells' },
    { time: '14:00', rainfallMm: 38, prob: 90, desc: 'Continuous heavy rain' },
    { time: '15:00', rainfallMm: 30, prob: 85, desc: 'Moderate to heavy spells' },
    { time: '16:00', rainfallMm: 42, prob: 90, desc: 'High tide peak & rain' },
    { time: '17:00', rainfallMm: 25, prob: 75, desc: 'Scattered squalls' },
    { time: '18:00', rainfallMm: 15, prob: 60, desc: 'Light to moderate shower' },
    { time: '19:00', rainfallMm: 8, prob: 40, desc: 'Intermittent drizzle' }
  ]
};

export const INITIAL_WARNINGS: EarlyWarning[] = [
  {
    id: 'warn-1',
    title: 'RED ALERT: Extreme Waterlogging Expected in Jadavpur & EM Bypass',
    titleBn: 'রেড অ্যালার্ট: যাদবপুর ও ইএম বাইপাসে চরম জলমগ্নতার সতর্কতা',
    message: 'Combined torrential rain and closed Hooghly lock gates will prevent drainage along Raja SC Mallick Rd and Sukanta Setu area until 18:30.',
    messageBn: 'প্রবল বৃষ্টি ও হুগলি নদীর লক গেট বন্ধ থাকার ফলে রাজা এসসি মল্লিক রোড ও সুকান্ত সেতু সংলগ্ন এলাকায় জলস্তর নামবে না সন্ধ্যা ৬:৩০ পর্যন্ত।',
    severity: 'critical',
    affectedAreas: ['Jadavpur 8B', 'Sulekha More', 'Sukanta Setu', 'Santoshpur Connector'],
    affectedAreasBn: ['যাদবপুর ৮বি', 'সুলেখা মোড়', 'সুকান্ত সেতু', 'সন্তোষপুর কানেক্টর'],
    source: 'KMC Disaster Control',
    issuedAt: '20 mins ago',
    validUntil: '19:00 IST',
    actionAdvice: 'Do not attempt to drive two-wheelers or low-chassis cars through 8B junction. Seek shelter in KPC or higher buildings.',
    actionAdviceBn: '৮বি মোড় দিয়ে বাইক বা ছোট গাড়ি নিয়ে যাবেন না। কেপিসি হাসপাতাল বা নিকটস্থ উঁচু ভবনে আশ্রয় নিন।'
  },
  {
    id: 'warn-2',
    title: 'Severe Traffic Disruption: Sector V College More Under 1.5ft Water',
    titleBn: 'যানচলাচল বিঘ্নিত: সেক্টর ফাইভ কলেজ মোড় দেড় ফুট জলের নিচে',
    message: 'IT employees departing Salt Lake Sector V are strongly advised to use the Ring Road / Major Arterial Road rather than the internal College More - Webel corridor.',
    messageBn: 'সেক্টর ফাইভ থেকে বেরোনো আইটি কর্মীদের ভেতরের কলেজ মোড়-ওয়েবেল রাস্তা এড়িয়ে রিং রোড বা মেজর আর্টেরিয়াল রোড ব্যবহারের পরামর্শ।',
    severity: 'severe',
    affectedAreas: ['Sector V College More', 'RDB Cinema Road', 'Godrej Waterside stretch'],
    affectedAreasBn: ['সেক্টর ফাইভ কলেজ মোড়', 'আরডিবি সিনেমা রোড', 'গোদরেজ ওয়াটারসাইড'],
    source: 'Kolkata Traffic Police',
    issuedAt: '45 mins ago',
    validUntil: '20:30 IST',
    actionAdvice: 'Use Salt Lake Sector V Metro station to travel safely without wading in water.',
    actionAdviceBn: 'জল না মাড়িয়ে সুরক্ষিত যাতায়াতের জন্য সেক্টর ফাইভ মেট্রো ব্যবহার করুন।'
  },
  {
    id: 'warn-3',
    title: 'IMD Orange Warning: Squally Winds & Cloudburst in South Kolkata',
    titleBn: 'আইএমডি অরেঞ্জ সতর্কতা: দক্ষিণ কলকাতায় ঝড়ো হাওয়া ও মেঘভাঙা বৃষ্টি',
    message: 'Thundercloud cell hovering over South 24 Parganas & Kolkata bringing gusty winds up to 45 km/h and localized lightning.',
    messageBn: 'দক্ষিণ ২৪ পরগনা ও কলকাতার উপর সক্রিয় মেঘের কারণে ৪৫ কিমি বেগে দমকা হাওয়া ও বজ্রপাতের আশঙ্কা।',
    severity: 'warning',
    affectedAreas: ['Gariahat', 'Ballygunge', 'Kasba', 'Dhakuria', 'Kalighat'],
    affectedAreasBn: ['গড়িয়াহাট', 'বালিগঞ্জ', 'কসবা', 'ঢাকুরিয়া', 'কালীঘাট'],
    source: 'IMD Kolkata',
    issuedAt: '1 hr ago',
    validUntil: '22:00 IST',
    actionAdvice: 'Stay clear of old dilapidated lampposts, dangling power cables, and open drains.',
    actionAdviceBn: 'পুরোনো বিদ্যুতের খুঁটি, ঝুলন্ত তার এবং খোলা নালা থেকে দূরে থাকুন।'
  }
];

export const INITIAL_OFFLINE_ZONES: OfflineMapZone[] = [
  {
    id: 'zone-sec5',
    name: 'Sector V & Salt Lake IT Hub',
    nameBn: 'সেক্টর ফাইভ ও সল্টলেক আইটি হাব',
    sizeMb: 1.4,
    downloaded: true,
    downloadedAt: 'Today, 04:30 AM',
    version: '2026.9.1',
    landmarksCount: 42,
    sheltersCount: 6,
    incidentsCached: 4,
    bounds: {
      minLat: 22.560,
      maxLat: 22.590,
      minLng: 88.410,
      maxLng: 88.450
    }
  },
  {
    id: 'zone-south-kolkata',
    name: 'South Kolkata (Gariahat, Jadavpur, Ballygunge)',
    nameBn: 'দক্ষিণ কলকাতা (গড়িয়াহাট, যাদবপুর, বালিগঞ্জ)',
    sizeMb: 1.8,
    downloaded: true,
    downloadedAt: 'Today, 04:30 AM',
    version: '2026.9.1',
    landmarksCount: 65,
    sheltersCount: 9,
    incidentsCached: 6,
    bounds: {
      minLat: 22.480,
      maxLat: 22.535,
      minLng: 88.340,
      maxLng: 88.385
    }
  },
  {
    id: 'zone-central',
    name: 'Central Kolkata (Park Street, Esplanade, MG Road)',
    nameBn: 'মধ্য কলকাতা (পার্ক স্ট্রিট, এসপ্ল্যানেড, এমজি রোড)',
    sizeMb: 1.6,
    downloaded: false,
    version: '2026.9.1',
    landmarksCount: 58,
    sheltersCount: 8,
    incidentsCached: 3,
    bounds: {
      minLat: 22.540,
      maxLat: 22.585,
      minLng: 88.340,
      maxLng: 88.375
    }
  },
  {
    id: 'zone-behala',
    name: 'South-West (Behala, Taratala, Majerhat)',
    nameBn: 'দক্ষিণ-পশ্চিম (বেহালা, তারাতলা, মাঝেরহাট)',
    sizeMb: 1.5,
    downloaded: false,
    version: '2026.9.1',
    landmarksCount: 38,
    sheltersCount: 5,
    incidentsCached: 2,
    bounds: {
      minLat: 22.485,
      maxLat: 22.525,
      minLng: 88.300,
      maxLng: 88.335
    }
  },
  {
    id: 'zone-north',
    name: 'North Kolkata (Shyambazar, Dum Dum, Ultadanga)',
    nameBn: 'উত্তর কলকাতা (শ্যামবাজার, দমদম, উল্টোডাঙা)',
    sizeMb: 1.7,
    downloaded: false,
    version: '2026.9.1',
    landmarksCount: 50,
    sheltersCount: 7,
    incidentsCached: 2,
    bounds: {
      minLat: 22.590,
      maxLat: 22.640,
      minLng: 88.360,
      maxLng: 88.400
    }
  }
];

export const OFFICIAL_CONTACTS: EmergencyContact[] = [
  {
    id: 'c-kmc-drainage',
    name: 'KMC Drainage & Waterlogging Control Room',
    nameBn: 'কেএমসি নিকাশি ও জলমগ্নতা কন্ট্রোল রুম',
    phone: '14420',
    category: 'civic',
    description: 'Toll-free 24/7 municipal emergency helpline for water logging & pumping',
    descriptionBn: '২৪/৭ জল নিষ্কাশন ও পাম্প পরিচালনার জন্য কলকাতা পুরসভার টোল-ফ্রি নম্বর',
    isOfficial: true
  },
  {
    id: 'c-kmc-landline',
    name: 'KMC Central Emergency Control',
    nameBn: 'কলকাতা পুরসভা কেন্দ্রীয় জরুরি কন্ট্রোল',
    phone: '033-22861212',
    category: 'civic',
    description: 'Direct municipal disaster coordination headquarters',
    descriptionBn: 'পুরসভার মূল দুর্যোগ মোকাবিলা সেল',
    isOfficial: true
  },
  {
    id: 'c-kolkata-police',
    name: 'Kolkata Police Emergency Helpline',
    nameBn: 'কলকাতা পুলিশ জরুরি হেল্পলাইন',
    phone: '100',
    category: 'police',
    description: 'Lalbazar central police control for rescues and traffic stranded calls',
    descriptionBn: 'লালবাজার পুলিশ সেন্ট্রাল কন্ট্রোল রুম',
    isOfficial: true
  },
  {
    id: 'c-police-traffic',
    name: 'Kolkata Traffic Police Control Room',
    nameBn: 'কলকাতা ট্রাফিক পুলিশ কন্ট্রোল রুম',
    phone: '033-22143644',
    category: 'police',
    description: 'Real-time road diversion, stranded car towing and traffic guidance',
    descriptionBn: 'রাস্তার ট্রাফিক ও জলমগ্ন গাড়ি উদ্ধারের তথ্য',
    isOfficial: true
  },
  {
    id: 'c-cesc',
    name: 'CESC Power & Electrocution Emergency',
    nameBn: 'সিইএসসি বিদ্যুৎ ও দুর্ঘটনা জরুরি হেল্পলাইন',
    phone: '1912',
    category: 'electricity',
    description: 'Immediate alert for fallen electric cables or sparking junction boxes in water',
    descriptionBn: 'জলে ছেঁড়া বিদ্যুতের তার বা স্পার্ক হলে অবিলম্বে জানানোর নম্বর',
    isOfficial: true
  },
  {
    id: 'c-wb-disaster',
    name: 'West Bengal Disaster Management Department',
    nameBn: 'পশ্চিমবঙ্গ বিপর্যয় মোকাবিলা দপ্তর',
    phone: '1070',
    category: 'civic',
    description: 'State disaster emergency operation centre (Nabanna)',
    descriptionBn: 'নবান্ন রাজ্য বিপর্যয় জরুরি পরিচালন কেন্দ্র',
    isOfficial: true
  },
  {
    id: 'c-fire-rescue',
    name: 'West Bengal Fire & Emergency Services',
    nameBn: 'দমকল ও উদ্ধারকারী পরিষেবা',
    phone: '101',
    category: 'fire',
    description: 'Emergency water rescue, tree clearing & stuck passenger evacuation',
    descriptionBn: 'জলবন্দী মানুষ উদ্ধার ও উপড়ে পড়া গাছ সরানোর কাজ',
    isOfficial: true
  },
  {
    id: 'c-ambulance',
    name: 'West Bengal Government Ambulance',
    nameBn: 'জরুরি সরকারি অ্যাম্বুলেন্স',
    phone: '102',
    category: 'ambulance',
    description: 'Toll-free medical transport to nearest government & referral hospitals',
    descriptionBn: 'হাসপাতালে রোগী নিয়ে যাওয়ার জন্য জরুরি অ্যাম্বুলেন্স',
    isOfficial: true
  }
];

export const PRESET_ROUTES: { [key: string]: RouteOption[] } = {
  'sec5-to-gariahata': [
    {
      id: 'route-safe-flyover',
      title: 'Via Maa Flyover & Park Circus (Elevated Safe Route)',
      titleBn: 'মা ফ্লাইওভার ও পার্ক সার্কাস হয়ে (উঁচু সুরক্ষিত পথ)',
      isRecommended: true,
      isSafe: true,
      distanceKm: 12.4,
      estimatedTimeMins: 38,
      viaFlyover: true,
      waterloggedSections: [],
      safePassages: ['Salt Lake Bypass elevated corridor', 'Maa Flyover (Dry)', 'Syed Amir Ali Ave'],
      coordinates: [
        [22.5735, 88.4331],
        [22.5650, 88.4150],
        [22.5480, 88.3900],
        [22.5420, 88.3720],
        [22.5310, 88.3680],
        [22.5195, 88.3664]
      ]
    },
    {
      id: 'route-unsafe-bypass',
      title: 'Via EM Bypass & Ruby Connector (FLOODED at Gariahat approach)',
      titleBn: 'ইএম বাইপাস ও রুবি হয়ে (গড়িয়াহাট মোড়ে জল জমে ব্যাহত)',
      isRecommended: false,
      isSafe: false,
      distanceKm: 14.1,
      estimatedTimeMins: 75,
      viaFlyover: false,
      waterloggedSections: ['Ruby to Gariahat connector (14" water)', 'Ballygunge Phari lower road'],
      safePassages: ['EM Bypass mainline'],
      coordinates: [
        [22.5735, 88.4331],
        [22.5520, 88.4010],
        [22.5150, 88.3980],
        [22.5195, 88.3664]
      ],
      warningMessage: 'Severe traffic gridlock reported at Kasba-Gariahat approach due to submerged potholes.'
    }
  ],
  'jadavpur-to-sec5': [
    {
      id: 'route-jadavpur-safe',
      title: 'Via Prince Anwar Shah Rd elevated stretch to EM Bypass',
      titleBn: 'প্রিন্স আনোয়ার শাহ রোড হয়ে ইএম বাইপাস দিয়ে সুরক্ষিত পথ',
      isRecommended: true,
      isSafe: true,
      distanceKm: 13.8,
      estimatedTimeMins: 42,
      viaFlyover: true,
      waterloggedSections: ['Avoid 8B junction - detour through Jodhpur Park'],
      safePassages: ['Jodhpur Park high ground', 'EM Bypass', 'Salt Lake Gate 1'],
      coordinates: [
        [22.4988, 88.3718],
        [22.5060, 88.3650],
        [22.5080, 88.3950],
        [22.5450, 88.4020],
        [22.5735, 88.4331]
      ]
    },
    {
      id: 'route-jadavpur-direct-flooded',
      title: 'Direct via Raja SC Mallick Rd (HAZARDOUS - CANAL OVERFLOW)',
      titleBn: 'সরাসরি রাজা এসসি মল্লিক রোড (বিপজ্জনক - খালের জল উপচে পড়েছে)',
      isRecommended: false,
      isSafe: false,
      distanceKm: 11.2,
      estimatedTimeMins: 90,
      viaFlyover: false,
      waterloggedSections: ['Jadavpur 8B bus stand (26" deep)', 'Sulekha Crossing', 'Gariahat underpass'],
      safePassages: [],
      coordinates: [
        [22.4988, 88.3718],
        [22.5195, 88.3664],
        [22.5735, 88.4331]
      ],
      warningMessage: 'KMC Red Alert: 2+ feet deep water with open manholes. Multiple cars already abandoned.'
    }
  ]
};
