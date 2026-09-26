import { WaterloggingIncident, WeatherData, RiverGateSystemData, EmergencyContact } from '../types';

export interface AssistantResponse {
  spokenText: string;
  displayText: string;
  lang: 'en' | 'bn' | 'hi';
  suggestedAction?: 'open_map' | 'open_safe_route' | 'open_sos' | 'open_helplines' | 'open_weather' | 'open_report' | 'none';
  actionLabel?: string;
}

export interface AssistantContext {
  lang: 'en' | 'bn' | 'hi';
  incidents: WaterloggingIncident[];
  weather: WeatherData;
  riverGates: RiverGateSystemData | null;
  emergencyContacts: EmergencyContact[];
  userLocation?: {
    lat: number;
    lng: number;
    areaName?: string;
    areaNameBn?: string;
    areaNameHi?: string;
  };
}

/**
 * Detects whether the query text is in Bengali script, Devanagari (Hindi) script, or English
 */
export function detectQueryLanguage(query: string, defaultLang: 'en' | 'bn' | 'hi'): 'en' | 'bn' | 'hi' {
  const bengaliCharRegex = /[\u0980-\u09FF]/;
  const devanagariRegex = /[\u0900-\u097F]/;

  if (bengaliCharRegex.test(query)) {
    return 'bn';
  }
  if (devanagariRegex.test(query)) {
    return 'hi';
  }

  const lower = query.toLowerCase();

  // Common Hindi transliterated keywords
  const hindiTransliterated = ['paani', 'pani', 'barish', 'barsaat', 'rasta', 'madad', 'bachao', 'kahan', 'kaha', 'kya', 'bandh', 'khula', 'sadak'];
  if (hindiTransliterated.some(w => lower.includes(w))) {
    return 'hi';
  }

  // Common Bengali transliterated keywords
  const bengaliTransliterated = ['jol', 'jolmagno', 'banya', 'kothay', 'banchao', 'sahajjo', 'ghotona'];
  if (bengaliTransliterated.some(w => lower.includes(w))) {
    return 'bn';
  }

  const englishWords = ['gate', 'water', 'flood', 'rain', 'weather', 'help', 'sos', 'route', 'lock', 'kmc', 'road'];
  if (englishWords.some(w => lower.includes(w))) {
    return 'en';
  }

  return defaultLang;
}

/**
 * Analyzes voice or text input and generates an authoritative, context-aware response
 * in Bengali, Hindi, and English.
 */
export function processVoiceQuery(query: string, ctx: AssistantContext): AssistantResponse {
  const clean = query.trim().toLowerCase();
  const queryLang = detectQueryLanguage(query, ctx.lang);
  const isBn = queryLang === 'bn';
  const isHi = queryLang === 'hi';

  // 1. River Gate / Hooghly Lock Gates Queries
  const isGateQuery = 
    clean.includes('gate') || 
    clean.includes('lock') || 
    clean.includes('hooghly') || 
    clean.includes('bhagirathi') || 
    clean.includes('tide') || 
    clean.includes('sluice') ||
    clean.includes('গেট') || 
    clean.includes('লক') || 
    clean.includes('হুগলি') || 
    clean.includes('নদী') || 
    clean.includes('জোয়ার') || 
    clean.includes('জলস্তর') ||
    clean.includes('गेट') || 
    clean.includes('लॉक') || 
    clean.includes('हुगली') || 
    clean.includes('ज्वार') || 
    clean.includes('स्लुइस');

  if (isGateQuery) {
    const level = ctx.riverGates?.tideLevelMeters ?? 2.70;
    const isLive = ctx.riverGates?.isLiveApiAvailable ?? false;
    const closedGates = ctx.riverGates?.gates.filter(g => g.status === 'CLOSED') || [];

    if (isBn) {
      if (closedGates.length > 0) {
        return {
          spokenText: `হুগলি নদীর গার্ডেনরিচ জলস্তর এখন ${level.toFixed(2)} মিটার। জোয়ারের কারণে লক গেট সাময়িক বন্ধ আছে। জোয়ার নামলে গ্র্যাভিটি স্লুইস দিয়ে শহরের জল নামবে।`,
          displayText: `হুগলি নদীর গার্ডেনরিচ জলস্তর: ${level.toFixed(2)} মি (সতর্কতা: ৫.৪৮ মি, বিপদসীমা: ৫.৯৪ মি)। জোয়ারের কারণে লক গেট বন্ধ। জোয়ার কমলে জল নিষ্কাশন শুরু হবে।`,
          lang: 'bn',
          suggestedAction: 'open_weather',
          actionLabel: 'গেট টেলিমেট্রি দেখুন'
        };
      } else if (!isLive) {
        return {
          spokenText: `গার্ডেনরিচে হুগলি নদীর জলস্তর ${level.toFixed(2)} মিটার, যা স্বাভাবিক স্তরে আছে। সরকারি দপ্তর থেকে লাইভ গেট সেন্সর স্ট্যাটাস এই মুহূর্তে অনুপলব্ধ।`,
          displayText: `গার্ডেনরিচে হুগলি নদীর বর্তমান জলস্তর ${level.toFixed(2)} মিটার (স্বাভাবিক স্তর)। পশ্চিমবঙ্গ সেচ দপ্তর (I&WD) ও সিডব্লিউসি-র ইলেক্ট্রো-মেকানিক্যাল গেট স্ট্যাটাস: "লাইভ গেট স্ট্যাটাস অনুপলব্ধ"।`,
          lang: 'bn',
          suggestedAction: 'open_weather',
          actionLabel: 'গেট টেলিমেট্রি দেখুন'
        };
      } else {
        return {
          spokenText: `হুগলি নদীর জলস্তর ${level.toFixed(2)} মিটার। নদী গেট খোলা আছে এবং শহরের খালের জল নদীতে নামছে।`,
          displayText: `হুগলি নদীর বর্তমান স্তর: ${level.toFixed(2)} মি। নদী লক গেট খোলা আছে, স্বাভাবিক গতিতে জল নিষ্কাশন চলছে।`,
          lang: 'bn',
          suggestedAction: 'open_weather',
          actionLabel: 'গেট টেলিমেট্রি দেখুন'
        };
      }
    } else if (isHi) {
      if (closedGates.length > 0) {
        return {
          spokenText: `हुगली नदी का गार्डेनरीच जल स्तर अभी ${level.toFixed(2)} मीटर है। उच्च ज्वार की वजह से लॉक गेट अस्थायी रूप से बंद हैं। ज्वार कम होने पर ग्रेविटी स्लुइस से जल निकासी फिर शुरू होगी।`,
          displayText: `हुगली नदी गार्डेनरीच जल स्तर: ${level.toFixed(2)} मी (चेतावनी स्तर: 5.48 मी, खतरे का निशान: 5.94 मी)। उच्च ज्वार के कारण लॉक गेट बंद हैं। ज्वार उतरने पर पानी की निकासी होगी।`,
          lang: 'hi',
          suggestedAction: 'open_weather',
          actionLabel: 'गेट टेलीमेट्री देखें'
        };
      } else if (!isLive) {
        return {
          spokenText: `गार्डेनरीच में हुगली नदी का जल स्तर ${level.toFixed(2)} मीटर सामान्य सीमा में है। सरकारी विभाग से लाइव गेट टेलीमेट्री स्थिति वर्तमान में अनुपलब्ध है।`,
          displayText: `गार्डेनरीच में हुगली नदी का जल स्तर ${level.toFixed(2)} मीटर (सामान्य स्तर)। पश्चिम बंगाल सिंचाई विभाग (I&WD) एवं CWC इलेक्ट्रो-मैकेनिकल गेट स्थिति: 'लाइव गेट स्थिति अनुपलब्ध'।`,
          lang: 'hi',
          suggestedAction: 'open_weather',
          actionLabel: 'गेट टेलीमेट्री देखें'
        };
      } else {
        return {
          spokenText: `हुगली नदी का जल स्तर ${level.toFixed(2)} मीटर है। नदी के लॉक गेट खुले हैं और नालों का पानी नदी में निकल रहा है।`,
          displayText: `हुगली नदी का स्तर: ${level.toFixed(2)} मी। स्लुइस लॉक गेट खुले हैं और जल निकासी सामान्य रूप से जारी है।`,
          lang: 'hi',
          suggestedAction: 'open_weather',
          actionLabel: 'गेट टेलीमेट्री देखें'
        };
      }
    } else {
      if (closedGates.length > 0) {
        return {
          spokenText: `Hooghly River level at Garden Reach is ${level.toFixed(2)} meters. Lock gates are currently closed due to high tide. Drainage will resume as the tide recedes.`,
          displayText: `Hooghly River level at Garden Reach: ${level.toFixed(2)}m (Warning: 5.48m, Danger: 5.94m). Lock gates are closed to prevent reverse flooding. Drainage will resume when the tide ebbs.`,
          lang: 'en',
          suggestedAction: 'open_weather',
          actionLabel: 'View Gate Telemetry'
        };
      } else if (!isLive) {
        return {
          spokenText: `Hooghly River level at Garden Reach is ${level.toFixed(2)} meters, within normal tidal range. Official real-time gate actuator telemetry is currently listed as status unavailable.`,
          displayText: `Hooghly River Garden Reach Gauge: ${level.toFixed(2)}m (Normal tidal range). Official West Bengal I&WD / CWC electro-mechanical gate status: "Live gate status unavailable".`,
          lang: 'en',
          suggestedAction: 'open_weather',
          actionLabel: 'View Gate Telemetry'
        };
      } else {
        return {
          spokenText: `Hooghly River level is ${level.toFixed(2)} meters. Lock gates are open and urban canal outfalls are discharging normally.`,
          displayText: `Hooghly River level is ${level.toFixed(2)}m. Sluice lock gates are open and storm water is discharging into the river.`,
          lang: 'en',
          suggestedAction: 'open_weather',
          actionLabel: 'View Gate Telemetry'
        };
      }
    }
  }

  // 2. Waterlogging & Flooded Roads Queries
  const isFloodQuery = 
    clean.includes('waterlog') || 
    clean.includes('flood') || 
    clean.includes('water') || 
    clean.includes('road') || 
    clean.includes('street') || 
    clean.includes('traffic') ||
    clean.includes('area') ||
    clean.includes('জল') || 
    clean.includes('জলমগ্ন') || 
    clean.includes('বন্যা') || 
    clean.includes('রাস্তা') || 
    clean.includes('কোথায়') ||
    clean.includes('जलभराव') ||
    clean.includes('बाढ़') ||
    clean.includes('सड़क') ||
    clean.includes('डूबी') ||
    clean.includes('पानी') ||
    clean.includes('कहाँ') ||
    clean.includes('कहा');

  if (isFloodQuery) {
    const severe = ctx.incidents.filter(i => i.severity === 'severe' || i.severity === 'critical' || i.waterDepthInches >= 12);
    const topAreaNamesBn = severe.slice(0, 3).map(i => i.areaBn || i.titleBn).join(', ');
    const topAreaNamesEn = severe.slice(0, 3).map(i => i.area || i.title).join(', ');

    if (isBn) {
      if (severe.length > 0) {
        return {
          spokenText: `কলকাতায় বর্তমানে ${topAreaNamesBn} সহ প্রধান এলাকায় ১ থেকে ২ ফুট জল জমেছে। ছোট গাড়ি ও বাইক চলাচল এড়িয়ে চলুন।`,
          displayText: `সতর্কতা: কলকাতায় ${severe.length}টি প্রধান স্থানে জল জমার খবর রয়েছে: ${topAreaNamesBn}। গড় গভীরতা ১.৫ থেকে ২.২ ফুট। সেন্ট্রাল অ্যাভিনিউ ও আন্ডারপাস এড়িয়ে চলুন।`,
          lang: 'bn',
          suggestedAction: 'open_map',
          actionLabel: 'লাইভ ম্যাপে দেখুন'
        };
      } else {
        return {
          spokenText: 'বর্তমানে শহরে বড় কোনো জলমগ্নতার রিপোর্ট নেই। তবে বৃষ্টির সম্ভাবনায় সতর্ক থাকুন।',
          displayText: 'বর্তমানে কলকাতায় কোনো বড় এলাকা জলমগ্ন নয়। রাস্তায় স্বাভাবিক যান চলাচল বজায় আছে।',
          lang: 'bn',
          suggestedAction: 'open_map',
          actionLabel: 'লাইভ ম্যাপে দেখুন'
        };
      }
    } else if (isHi) {
      if (severe.length > 0) {
        return {
          spokenText: `कोलकाता में वर्तमान में ${topAreaNamesEn} सहित मुख्य क्षेत्रों में 1 से 2 फीट तक जलभराव है। छोटी गाड़ियों और दोपहिया वाहनों से आवाजाही से बचें।`,
          displayText: `जलभराव अलर्ट: कोलकाता में ${severe.length} मुख्य हॉटस्पॉट्स सक्रिय हैं: ${topAreaNamesEn}। पानी की गहराई 1.5 से 2.2 फीट तक है। रेलवे अंडरपास और डूबी सड़कों से बचें।`,
          lang: 'hi',
          suggestedAction: 'open_map',
          actionLabel: 'लाइव मैप पर देखें'
        };
      } else {
        return {
          spokenText: 'वर्तमान में शहर के मुख्य मार्गों पर किसी बड़े जलभराव की सूचना नहीं है। सड़कें सामान्य रूप से चालू हैं।',
          displayText: 'वर्तमान में कोलकाता के प्रमुख मार्गों पर कोई गंभीर जलभराव सक्रिय नहीं है। यातायात सुचारू है।',
          lang: 'hi',
          suggestedAction: 'open_map',
          actionLabel: 'लाइव मैप पर देखें'
        };
      }
    } else {
      if (severe.length > 0) {
        return {
          spokenText: `Waterlogging reported in Kolkata at ${topAreaNamesEn}. Water depth is between 1.5 and 2.2 feet. Avoid small cars and two-wheelers in these stretches.`,
          displayText: `Waterlogging Alert: ${severe.length} major hotspots active: ${topAreaNamesEn}. Water depths reach up to 2.2 ft. Avoid railway underpasses and submerged tram tracks.`,
          lang: 'en',
          suggestedAction: 'open_map',
          actionLabel: 'Explore Live Map'
        };
      } else {
        return {
          spokenText: 'No severe waterlogging reported right now across Kolkata thoroughfares. Roads are passable.',
          displayText: 'No severe waterlogging incidents currently active in Kolkata. Traffic is moving smoothly.',
          lang: 'en',
          suggestedAction: 'open_map',
          actionLabel: 'Explore Live Map'
        };
      }
    }
  }

  // 3. Emergency SOS & Rescue Queries
  const isSOSQuery = 
    clean.includes('sos') || 
    clean.includes('emergency') || 
    clean.includes('rescue') || 
    clean.includes('trapped') || 
    clean.includes('save me') ||
    clean.includes('বিপদ') || 
    clean.includes('উদ্ধার') || 
    clean.includes('আটকে') || 
    clean.includes('বাঁচাও') || 
    clean.includes('সাহায্য') ||
    clean.includes('मदद') ||
    clean.includes('बचाओ') ||
    clean.includes('आपातकाल') ||
    clean.includes('खतरा') ||
    clean.includes('फंसे') ||
    clean.includes('संकट');

  if (isSOSQuery) {
    if (isBn) {
      return {
        spokenText: 'জরুরি বিপদে থাকলে অবিলম্বে স্ক্রিনের লাল এসওএস বাটনে ট্যাপ করুন। বিদ্যুতের খুঁটি ও খোলা ম্যানহোল থেকে দূরে উঁচু জায়গায় থাকুন।',
        displayText: 'জরুরি উদ্ধার নির্দেশিকা: অবিলম্বে লাল SOS বাটনে চাপুন। কেএমসি হেল্পলাইন ১৪৪২০ অথবা পুলিশ ১০০ নম্বরে যোগাযোগ করুন। ছেঁড়া বৈদ্যুতিক তার ও খোলা ড্রেন থেকে দূরে থাকুন।',
        lang: 'bn',
        suggestedAction: 'open_sos',
        actionLabel: 'জরুরি SOS খুলুন'
      };
    } else if (isHi) {
      return {
        spokenText: 'यदि आप खतरे में हैं, तो तुरंत स्क्रीन पर लाल एसओएस बटन दबाएं। डूबे हुए ट्रांसफॉर्मर और खुले मैनहोल से दूर किसी ऊंचे स्थान पर जाएं।',
        displayText: 'आपातकालीन बचाव मार्गदर्शन: अपना जीपीएस स्थान प्रसारित करने के लिए तत्काल लाल SOS बटन दबाएं। केएमसी हेल्पलाइन 14420 या पुलिस 100 पर संपर्क करें। डूबे बिजली के खंभों से दूर रहें।',
        lang: 'hi',
        suggestedAction: 'open_sos',
        actionLabel: 'आपातकालीन SOS खोलें'
      };
    } else {
      return {
        spokenText: 'If you are in danger, tap the Emergency SOS button immediately. Move to higher ground and stay away from submerged transformers and open manholes.',
        displayText: 'Emergency Rescue Guidance: Tap the Emergency SOS button to broadcast your GPS coordinates. Dial KMC Helpline at 14420 or Police at 100. Avoid flooded electrical poles.',
        lang: 'en',
        suggestedAction: 'open_sos',
        actionLabel: 'Open Emergency SOS'
      };
    }
  }

  // 4. Emergency Helpline Numbers
  const isHelplineQuery = 
    clean.includes('helpline') || 
    clean.includes('number') || 
    clean.includes('phone') || 
    clean.includes('contact') || 
    clean.includes('call') || 
    clean.includes('police') || 
    clean.includes('kmc') || 
    clean.includes('cesc') ||
    clean.includes('নম্বর') || 
    clean.includes('ফোন') || 
    clean.includes('হেল্পলাইন') || 
    clean.includes('যোগাযোগ') || 
    clean.includes('সিইএসসি') || 
    clean.includes('পুলিশ') ||
    clean.includes('हेल्पलाइन') ||
    clean.includes('नंबर') ||
    clean.includes('फ़ोन') ||
    clean.includes('फोन') ||
    clean.includes('संपर्क') ||
    clean.includes('सीईएससी');

  if (isHelplineQuery) {
    if (isBn) {
      return {
        spokenText: 'কেএমসি কন্ট্রোল রুম ১৪৪২০, বিদ্যুৎ বিভ্রাটে সিইএসসি ১৯১২, পুলিশ ১০০ এবং দমকল ১০১।',
        displayText: 'কলকাতার জরুরি হেল্পলাইন: কেএমসি নিকাশি কন্ট্রোল রুম: 14420 / 033-2286-1212, পুলিশ: 100, বিদ্যুৎ (CESC): 1912, দমকল: 101, বিপর্যয় মোকাবিলা: 1070।',
        lang: 'bn',
        suggestedAction: 'open_helplines',
        actionLabel: 'হেল্পলাইন তালিকা দেখুন'
      };
    } else if (isHi) {
      return {
        spokenText: 'केएमसी जल निकासी कंट्रोल रूम 14420, बिजली खराबी पर सीईएससी 1912, पुलिस 100 और दमकल 101 है।',
        displayText: 'कोलकाता आपातकालीन नंबर: केएमसी बाढ़ नियंत्रण: 14420 / 033-2286-1212, कोलकाता पुलिस: 100, सीईएससी बिजली: 1912, दमकल: 101, आपदा प्रबंधन: 1070।',
        lang: 'hi',
        suggestedAction: 'open_helplines',
        actionLabel: 'हेल्पलाइन डायरेक्टरी देखें'
      };
    } else {
      return {
        spokenText: 'KMC Drainage Helpline is 14420, CESC Power Helpline is 1912, Police is 100, and Fire is 101.',
        displayText: 'Kolkata Emergency Numbers: KMC Drainage & Flood Control: 14420 / 033-2286-1212, Kolkata Police: 100, CESC Electricity: 1912, Fire: 101, State Disaster Management: 1070.',
        lang: 'en',
        suggestedAction: 'open_helplines',
        actionLabel: 'View Helpline Directory'
      };
    }
  }

  // 5. Weather & Rainfall Forecast
  const isWeatherQuery = 
    clean.includes('weather') || 
    clean.includes('rain') || 
    clean.includes('forecast') || 
    clean.includes('storm') || 
    clean.includes('temperature') ||
    clean.includes('বৃষ্টি') || 
    clean.includes('আবহাওয়া') || 
    clean.includes('ঝড়') || 
    clean.includes('মেঘ') || 
    clean.includes('তাপমাত্রা') ||
    clean.includes('मौसम') ||
    clean.includes('बारिश') ||
    clean.includes('तूफान') ||
    clean.includes('बादल') ||
    clean.includes('तापमान');

  if (isWeatherQuery) {
    const temp = ctx.weather.temperature;
    const precipProb = ctx.weather.precipitationProb;
    const desc = ctx.weather.condition;

    if (isBn) {
      return {
        spokenText: `কলকাতায় বর্তমান তাপমাত্রা ${temp} ডিগ্রি সেলসিয়াস। আজ বৃষ্টির সম্ভাবনা ${precipProb} শতাংশ। ভারী বৃষ্টির ক্ষেত্রে নিচু রাস্তায় জল জমতে পারে।`,
        displayText: `আবহাওয়া রিপোর্ট: তাপমাত্রা ${temp}°C, আর্দ্রতা ${ctx.weather.humidity}%, বৃষ্টির সম্ভাবনা ${precipProb}%, বর্তমান অবস্থা: ${desc}। নিচু এলাকায় জল জমার সম্ভাবনা রয়েছে।`,
        lang: 'bn',
        suggestedAction: 'open_weather',
        actionLabel: 'সম্পূর্ণ আবহাওয়া ড্যাশবোর্ড'
      };
    } else if (isHi) {
      return {
        spokenText: `कोलकाता में वर्तमान तापमान ${temp} डिग्री सेल्सियस है। आज बारिश की संभावना ${precipProb} प्रतिशत है। भारी बारिश में निचली सड़कों पर जलभराव हो सकता है।`,
        displayText: `मौसम रिपोर्ट: तापमान ${temp}°C, आर्द्रता ${ctx.weather.humidity}%, बारिश की संभावना ${precipProb}%, वर्तमान स्थिति: ${desc}। निचले इलाकों में जलभराव के प्रति सावधान रहें।`,
        lang: 'hi',
        suggestedAction: 'open_weather',
        actionLabel: 'मौसम डैशबोर्ड देखें'
      };
    } else {
      return {
        spokenText: `Current temperature in Kolkata is ${temp} degrees Celsius with ${precipProb} percent probability of rain. Condition is ${desc}.`,
        displayText: `Kolkata Weather: Temperature: ${temp}°C, Humidity: ${ctx.weather.humidity}%, Rain Probability: ${precipProb}%, Status: ${desc}. Prepare for sudden monsoon showers.`,
        lang: 'en',
        suggestedAction: 'open_weather',
        actionLabel: 'View Weather Dashboard'
      };
    }
  }

  // 6. Safe Route & Navigation
  const isRouteQuery = 
    clean.includes('route') || 
    clean.includes('navigate') || 
    clean.includes('safe path') || 
    clean.includes('direction') || 
    clean.includes('drive') ||
    clean.includes('পথ') || 
    clean.includes('রাস্তা খুঁজুন') || 
    clean.includes('রুট') || 
    clean.includes('নিরাপদ') ||
    clean.includes('मार्ग') ||
    clean.includes('रास्ता') ||
    clean.includes('रूट') ||
    clean.includes('दिशा') ||
    clean.includes('सुरक्षित');

  if (isRouteQuery) {
    if (isBn) {
      return {
        spokenText: 'জলমগ্ন এলাকা এড়িয়ে নিরাপদ পথ পেতে নিরাপদ রুট ট্যাবে যান। সেখানে আপনার শুরুর স্থান ও গন্তব্য লিখুন।',
        displayText: 'নিরাপদ রুট ফাইন্ডার: এআই এলগরিদম দিয়ে জলমগ্ন ক্রসিং ও আন্ডারপাস বাদ দিয়ে নিরাপদ বিকল্প পথ তৈরি করা হয়। সেফ রুট ট্যাবে আপনার গন্তব্য বেছে নিন।',
        lang: 'bn',
        suggestedAction: 'open_safe_route',
        actionLabel: 'নিরাপদ পথ খুঁজুন'
      };
    } else if (isHi) {
      return {
        spokenText: 'जलभराव वाले इलाकों से बचते हुए सुरक्षित रास्ता पाने के लिए सेफ रूट टैब पर जाएं और अपना प्रारंभिक व गंतव्य स्थान दर्ज करें।',
        displayText: 'सुरक्षित मार्ग खोजक: हमारा मानसून रूट इंजन जलमग्न क्रॉसिंग, अंडरपास और जोखिम भरी नहरों से बचते हुए वैकल्पिक रास्ता तैयार करता है। सेफ रूट टैब में जाएं।',
        lang: 'hi',
        suggestedAction: 'open_safe_route',
        actionLabel: 'सुरक्षित मार्ग खोजें'
      };
    } else {
      return {
        spokenText: 'To navigate avoiding flooded roads, tap the Safe Route tab and enter your start and destination points.',
        displayText: 'Safe Route Finder: Our monsoon routing engine avoids submerged crossings, underpasses, and high-risk canal zones. Open Safe Route tab to calculate directions.',
        lang: 'en',
        suggestedAction: 'open_safe_route',
        actionLabel: 'Find Safe Route'
      };
    }
  }

  // 7. General Assistant Greeting / Help
  if (isBn) {
    return {
      spokenText: 'নমস্কার! আমি কলকাতা জলসেফটি ভয়েস অ্যাসিস্ট্যান্ট। আমি হুগলি নদীর লক গেট, জলমগ্ন রাস্তা, আবহাওয়া ও জরুরি হেল্পলাইন সম্পর্কে বাংলায় সাহায্য করতে পারি।',
      displayText: 'নমস্কার! আমি কলকাতা জলসেফটি ভয়েস অ্যাসিস্ট্যান্ট। আপনি আমাকে হুগলি নদীর লক গেট, জলমগ্ন এলাকা, আজকের আবহাওয়া অথবা জরুরি হেল্পলাইন সম্পর্কে জিজ্ঞাসা করতে পারেন।',
      lang: 'bn',
      suggestedAction: 'none'
    };
  } else if (isHi) {
    return {
      spokenText: 'नमस्ते! मैं कोलकाता जलसेफ्टी आवाज़ सहायक हूँ। मैं हुगली नदी लॉक गेट, जलभराव वाली सड़कों, आज के मौसम और आपातकालीन हेल्पलाइन के बारे में हिंदी में जानकारी दे सकता हूँ।',
      displayText: 'नमस्ते! मैं आपका कोलकाता जलसेफ्टी आवाज़ सहायक हूँ। आप मुझसे हुगली नदी लॉक गेट, शहर में जलभराव वाली सड़कें, बारिश का पूर्वानुमान अथवा आपातकालीन हेल्पलाइन नंबर पूछ सकते हैं।',
      lang: 'hi',
      suggestedAction: 'none'
    };
  } else {
    return {
      spokenText: 'Hello! I am your Kolkata JolSafety Voice Assistant. You can ask me about Hooghly river lock gates, waterlogged streets, today\'s rain forecast, or emergency helplines.',
      displayText: 'Hello! I am your Kolkata JolSafety Voice Assistant. Ask me about Hooghly sluice gates, flooded roads in Kolkata, weather forecasts, or emergency numbers.',
      lang: 'en',
      suggestedAction: 'none'
    };
  }
}
