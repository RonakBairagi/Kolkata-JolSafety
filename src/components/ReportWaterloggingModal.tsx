import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  AlertTriangle, 
  Camera, 
  Upload,
  CheckCircle, 
  ShieldCheck, 
  Layers, 
  Image as ImageIcon,
  Compass,
  Droplets,
  Trash2,
  RefreshCw,
  Building2,
  ExternalLink,
  Copy,
  Check,
  FileText,
  PhoneCall,
  MessageCircle,
  ArrowRight,
  ChevronLeft,
  AlertCircle
} from 'lucide-react';
import { SeverityLevel, WaterloggingIncident } from '../types';
import { Language, TRANSLATIONS } from '../data/translations';
import { storage } from '../firebase';

interface ReportWaterloggingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  initialCoords?: [number, number];
  userLocation?: { lat: number; lng: number; areaName: string; areaNameBn?: string };
  onSubmitReport: (incident: WaterloggingIncident) => void;
}

type ModalView = 'form' | 'kmc_confirm' | 'kmc_portal_opened' | 'success';

interface SavedKmcComplaint {
  complaintNumber: string;
  location: string;
  savedAt: string;
}

// Official Kolkata Municipal Corporation (KMC) Portal Endpoints
// Primary: KMC Grievance Redressal & Status Search (Verified live 200 OK)
export const KMC_GRIEVANCE_PORTAL_URL = 'https://www.kmcgov.in/KMCPortal/jsp/ComplaintSearch.jsp';
// Secondary: KMC 2.0 Citizen Grievance Portal (Government of West Bengal)
export const KMC_GRIEVANCE_2_URL = 'https://kmc.wb.gov.in/citizen/language-selection';
// Official KMC Main Portal
export const KMC_MAIN_PORTAL_URL = 'https://www.kmcgov.in/KMCPortal/jsp/KMCPortalHome1.jsp';
// Official KMC Grievance Status
export const KMC_GRIEVANCE_STATUS_URL = 'https://www.kmcgov.in/KMCPortal/jsp/ComplaintSearch.jsp';

const KMC_PHONE = '14420';
const KMC_WHATSAPP_NUMBER = '918335988888';

export const ReportWaterloggingModal: React.FC<ReportWaterloggingModalProps> = ({
  isOpen,
  onClose,
  lang,
  initialCoords,
  userLocation,
  onSubmitReport
}) => {
  const t = TRANSLATIONS[lang];

  // Active view state
  const [view, setView] = useState<ModalView>('form');

  // Form states
  const [title, setTitle] = useState<string>('');
  const [area, setArea] = useState<string>('Sector V (Salt Lake IT Hub)');
  const [landmark, setLandmark] = useState<string>('');
  const [severity, setSeverity] = useState<SeverityLevel>('severe');
  const [depthInches, setDepthInches] = useState<number>(14);
  const [roadCondition, setRoadCondition] = useState<string>('');
  const [trafficStatus, setTrafficStatus] = useState<'normal' | 'slow' | 'congested' | 'blocked'>('slow');
  const [hazards, setHazards] = useState<string[]>(['Open Manhole (Missing lid)']);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Live Camera & Photo options state
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // KMC Grievance state
  const [kmcReportDocket, setKmcReportDocket] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [kmcComplaintNumberInput, setKmcComplaintNumberInput] = useState<string>('');
  const [savedComplaint, setSavedComplaint] = useState<SavedKmcComplaint | null>(null);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<boolean>(false);

  // Photo link & storage states (Requirements #1, #2, #6, #7)
  const [rawPhotoFile, setRawPhotoFile] = useState<File | null>(null);
  const [photoLink, setPhotoLink] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const [photoLinkCopied, setPhotoLinkCopied] = useState<boolean>(false);
  const [reportDetailsCopied, setReportDetailsCopied] = useState<boolean>(false);
  const [whatsAppNotice, setWhatsAppNotice] = useState<string | null>(null);

  // Load existing complaints from localStorage if any
  useEffect(() => {
    try {
      const stored = localStorage.getItem('jol_last_kmc_complaint');
      if (stored) {
        setSavedComplaint(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Could not read saved KMC complaints:', e);
    }
  }, []);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      setCameraError(null);
      setValidationError(null);
      setIsCopied(false);
      setReportDetailsCopied(false);
      setPhotoLinkCopied(false);
      setSavedSuccessMsg(false);
      setView('form');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isCameraOpen && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((err) => console.warn('Camera video play error:', err));
    }
  }, [isCameraOpen]);

  // Requirement #2 & #7: Upload actual user-selected photo to configured storage and maintain synchronization
  useEffect(() => {
    if (!imagePreview) {
      setPhotoLink(null);
      setPhotoUploadError(null);
      setIsUploadingPhoto(false);
      return;
    }

    let isMounted = true;
    setIsUploadingPhoto(true);
    setPhotoUploadError(null);
    setPhotoLink(null);

    const uploadPhotoToStorage = async () => {
      try {
        const clientOrigin = typeof window !== 'undefined' ? window.location.origin : '';
        const res = await fetch('/api/upload-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            imageBase64: imagePreview,
            clientOrigin: clientOrigin
          })
        });

        if (!res.ok) {
          throw new Error(`Server storage returned HTTP ${res.status}`);
        }

        const data = await res.json();
        if (data.url && isMounted) {
          let resolvedUrl = data.url;
          // Ensure url uses browser's active origin rather than internal container host
          if (typeof window !== 'undefined' && window.location.origin && resolvedUrl.includes('localhost') && !window.location.origin.includes('localhost')) {
            resolvedUrl = `${window.location.origin}/uploads/${data.filename}`;
          }
          setPhotoLink(resolvedUrl);
          setIsUploadingPhoto(false);
          return;
        }

        throw new Error(data.error || 'Failed to obtain photo link from storage');
      } catch (err: any) {
        console.warn('Photo storage upload error:', err);
        if (isMounted) {
          setPhotoUploadError(
            lang === 'bn' 
              ? 'ফটো লিঙ্ক অনুপলব্ধ: স্টোরেজ সংযোগ ব্যর্থ হয়েছে।' 
              : 'Photo link unavailable: Storage upload failed.'
          );
          setPhotoLink(null);
          setIsUploadingPhoto(false);
        }
      }
    };

    uploadPhotoToStorage();

    return () => {
      isMounted = false;
    };
  }, [imagePreview, lang]);

  const handleStartCamera = async () => {
    setCameraError(null);
    stopCameraStream();

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera not supported by browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraOpen(true);
    } catch (err: any) {
      console.warn('Live camera stream error, falling back to camera file input:', err);
      setIsCameraOpen(false);
      setCameraError(
        lang === 'bn' 
          ? 'সরাসরি ক্যামেরা চালু করা সম্ভব হয়নি। ডিভাইস ক্যামেরা খুলুন।' 
          : 'Could not access live camera. Open device camera directly.'
      );
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      }
    }
  };

  // Requirement #1: Use the ACTUAL photo that user takes
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setImagePreview(dataUrl);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `waterlogging_${Date.now()}.jpg`, { type: 'image/jpeg' });
          setRawPhotoFile(file);
        }
      }, 'image/jpeg', 0.85);
      stopCameraStream();
    }
  };

  const toggleHazard = (hazard: string) => {
    if (hazards.includes(hazard)) {
      setHazards(hazards.filter((h) => h !== hazard));
    } else {
      setHazards([...hazards, hazard]);
    }
  };

  // Requirement #1: Use the ACTUAL photo that user uploads
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRawPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Requirement #7: Photo link + report details must stay synchronized
  const handleRemovePhoto = () => {
    setImagePreview(null);
    setRawPhotoFile(null);
    setPhotoLink(null);
    setPhotoUploadError(null);
    setPhotoLinkCopied(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // Requirements #3 & #5: Compile complete structured waterlogging report
  const generateCompleteReportText = (forWhatsApp = false) => {
    const coords: [number, number] = initialCoords || (userLocation ? [userLocation.lat, userLocation.lng] : [22.5735, 88.4331]);
    const areaName = userLocation ? (lang === 'bn' ? userLocation.areaNameBn || userLocation.areaName : userLocation.areaName) : area;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const locationValue = landmark.trim() 
      ? (area ? `${landmark.trim()}, ${areaName}` : landmark.trim())
      : areaName;

    const gpsValue = `${coords[0].toFixed(5)}° N, ${coords[1].toFixed(5)}° E (https://maps.google.com/?q=${coords[0].toFixed(5)},${coords[1].toFixed(5)})`;

    const depthValue = `${depthInches} inches (~${Math.round(depthInches * 2.54)} cm)`;

    const severityValue = 
      severity === 'critical' ? 'Critical (>2 ft / Submerged / Manholes open)' :
      severity === 'severe' ? 'Severe (1-2 ft / Vehicles stalling)' :
      severity === 'moderate' ? 'Moderate (6-12 inches / Knee level)' :
      'Low (2-6 inches / Ankle level)';

    const trafficValue = 
      trafficStatus === 'blocked' ? 'Completely Blocked / Diverted' :
      trafficStatus === 'congested' ? 'Heavy Congestion / Traffic Jam' :
      trafficStatus === 'slow' ? 'Slow Moving Traffic' :
      'Normal Traffic Flow';

    const hazardsValue = hazards.length > 0 ? hazards.join(', ') : 'None observed';

    const detailsValue = roadCondition.trim() || 'Water accumulation on road surface; sluggish runoff.';

    let photoSection = '';
    if (imagePreview) {
      if (forWhatsApp) {
        photoSection = `PHOTO:\n${photoLink || '(Uploading shareable link...)'}\n\n`;
      } else {
        photoSection = `PHOTO LINK:\n${photoLink || '(Uploading shareable link...)'}\n\n`;
      }
    }

    return `KOLKATA WATERLOGGING REPORT

Location / Landmark:
${locationValue}

GPS Coordinates:
${gpsValue}

Water Depth:
${depthValue}

Severity:
${severityValue}

Traffic Status:
${trafficValue}

Hazards Observed:
${hazardsValue}

Additional Details:
${detailsValue}

Date:
${dateStr}

Time:
${timeStr}

${photoSection}Generated by:
JolSafety`;
  };

  // Helper to safely open external links in browser, bypassing popup blocker constraints
  const openExternalUrlSafely = (url: string) => {
    try {
      const win = window.open(url, '_blank', 'noopener,noreferrer');
      if (!win || win.closed || typeof win.closed === 'undefined') {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Requirement #3: Copy Complete Report Details
  const handleCopyReportDetails = async () => {
    const text = generateCompleteReportText(false);
    try {
      await navigator.clipboard.writeText(text);
      setReportDetailsCopied(true);
      setIsCopied(true);
      setTimeout(() => {
        setReportDetailsCopied(false);
        setIsCopied(false);
      }, 2500);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setReportDetailsCopied(true);
      setIsCopied(true);
      setTimeout(() => {
        setReportDetailsCopied(false);
        setIsCopied(false);
      }, 2500);
    }
  };

  // Requirement #2: Copy Photo Link
  const handleCopyPhotoLink = async () => {
    if (!photoLink) return;
    try {
      await navigator.clipboard.writeText(photoLink);
      setPhotoLinkCopied(true);
      setTimeout(() => setPhotoLinkCopied(false), 2500);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = photoLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setPhotoLinkCopied(true);
      setTimeout(() => setPhotoLinkCopied(false), 2500);
    }
  };

  // Requirement #4: Open KMC Grievance Website
  const handleOpenKmcGrievance = () => {
    if (!landmark.trim()) {
      setValidationError(
        lang === 'bn' 
          ? 'অনুগ্রহ করে অবস্থান বা ল্যান্ডমার্কের নাম লিখুন।' 
          : 'Please enter a location or landmark before opening KMC grievance.'
      );
      return;
    }
    setValidationError(null);
    const text = generateCompleteReportText(false);
    setKmcReportDocket(text);
    openExternalUrlSafely(KMC_GRIEVANCE_PORTAL_URL);
    setView('kmc_portal_opened');
  };

  // Legacy flow button
  const handleInitiateKmcReport = () => {
    handleOpenKmcGrievance();
  };

  // Requirement #5 & #6: Send to KMC WhatsApp with complete report details + photo link
  const handleSendToKmcWhatsApp = async () => {
    // 1. Generate COMPLETE report text including photo link
    const completeReportText = generateCompleteReportText(true);

    // 2. Automatically copy complete report text to clipboard so citizen has it ready
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(completeReportText);
      }
    } catch {
      // ignore clipboard error
    }

    // 3. Show notification
    setWhatsAppNotice(
      lang === 'bn'
        ? 'কেএমসি কন্ট্রোল রুম হোয়াটসঅ্যাপ (+91 83359 88888) সম্পূর্ণ রিপোর্ট সহ খোলা হচ্ছে...'
        : 'Opening KMC WhatsApp (+91 83359 88888) with complete report pre-filled...'
    );
    setTimeout(() => setWhatsAppNotice(null), 4500);

    // 4. Open official KMC WhatsApp directly: +91 83359 88888 with complete pre-filled text
    const cleanNumber = '918335988888';
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(completeReportText)}`;
    openExternalUrlSafely(whatsappUrl);
  };

  const handleProceedToKmcPortal = () => {
    openExternalUrlSafely(KMC_GRIEVANCE_PORTAL_URL);
    setView('kmc_portal_opened');
  };

  // Step 9 & 10: Save KMC Complaint Number
  const handleSaveKmcComplaintNumber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kmcComplaintNumberInput.trim()) return;

    const newSaved: SavedKmcComplaint = {
      complaintNumber: kmcComplaintNumberInput.trim(),
      location: landmark || area,
      savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setSavedComplaint(newSaved);
    setSavedSuccessMsg(true);
    try {
      localStorage.setItem('jol_last_kmc_complaint', JSON.stringify(newSaved));
    } catch (err) {
      console.warn('Failed to persist KMC complaint number:', err);
    }
    setTimeout(() => setSavedSuccessMsg(false), 3500);
  };

  // Step 11: Open KMC Complaint Status
  const handleOpenKmcStatus = () => {
    openExternalUrlSafely(KMC_GRIEVANCE_STATUS_URL);
  };

  // Existing Community Report Submission handler
  const handleCommunitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const coords: [number, number] = initialCoords || (userLocation ? [userLocation.lat, userLocation.lng] : [22.5735, 88.4331]);

    const newIncident: WaterloggingIncident = {
      id: 'inc-report-' + Date.now(),
      title: title || (lang === 'bn' ? `${area} এলাকায় জল জমেছে` : `Waterlogging reported at ${area}`),
      titleBn: title || `${area} এলাকায় জল জমেছে`,
      area: area,
      areaBn: area,
      landmark: landmark || 'Kolkata corridor',
      coordinates: coords,
      severity: severity,
      waterDepthInches: depthInches,
      waterDepthDesc: `${depthInches} inches water reported; ${trafficStatus} traffic.`,
      waterDepthDescBn: `${depthInches} ইঞ্চি জল জমেছে; যানচলাচল ব্যাহত।`,
      roadCondition: roadCondition || 'Flooded road surface with low visibility',
      roadConditionBn: roadCondition || 'রাস্তার উপর জলমগ্ন পরিস্থিতি',
      trafficStatus: trafficStatus,
      hazards: hazards,
      verified: false,
      verifiedByAuthority: false,
      confirmationsCount: 1,
      userUpvoted: true,
      reportedAt: 'Just now',
      imageUrl: imagePreview || undefined,
      source: 'community'
    };

    setTimeout(() => {
      onSubmitReport(newIncident);
      setSubmitting(false);
      setView('success');
      setTimeout(() => {
        setView('form');
        onClose();
      }, 1500);
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#081226] border border-blue-900/40 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl text-slate-100 my-auto animate-in zoom-in-95 duration-150">
        
        {/* ======================================================== */}
        {/* VIEW 1: SUCCESS CONFIRMATION (COMMUNITY)                */}
        {/* ======================================================== */}
        {view === 'success' && (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 mx-auto flex items-center justify-center text-emerald-400 animate-bounce">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-white">
              {t.report.successMessage}
            </h4>
            <p className="text-xs text-slate-400">
              {lang === 'bn' ? 'কমিউনিটি নোটিফিকেশন আপডেট করা হয়েছে।' : 'Broadcasted to nearby drivers & pedestrians.'}
            </p>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: CONFIRMATION SCREEN BEFORE LEAVING JOLSAFETY     */}
        {/* ======================================================== */}
        {view === 'kmc_confirm' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wide bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded">
                      Official KMC Portal
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                    Confirm Report to Kolkata Municipal Corporation
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setView('form')}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer"
                title="Back to Form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanation / Verification Notice */}
            <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-2 text-xs text-slate-300">
              <p className="font-semibold text-sky-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Opening Official KMC Grievance Redressal (kmcgov.in)</span>
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                You will be redirected to the official Kolkata Municipal Corporation grievance portal. JolSafety respects government security standards:
              </p>
              <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-1 pl-1">
                <li>JolSafety does <strong>not</strong> bypass KMC security, CAPTCHA, OTP, or login.</li>
                <li>JolSafety does <strong>not</strong> pretend that the report is submitted until KMC gives you a complaint number.</li>
                <li>Copy the prepared report docket below to paste it into KMC's online form.</li>
              </ul>
            </div>

            {/* Prepared Docket Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  Prepared Waterlogging Report Docket:
                </span>
                <button
                  type="button"
                  onClick={handleCopyReportDetails}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-sky-300 hover:text-sky-200 border border-slate-700 text-[11px] font-bold cursor-pointer transition-colors"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-sky-400" />
                      <span>{t.report.copyReportDetailsBtn}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
                {kmcReportDocket}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setView('form')}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs border border-slate-700 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back / Edit Details</span>
              </button>

              <a
                href={KMC_GRIEVANCE_PORTAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  setView('kmc_portal_opened');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-[0.99] text-white font-bold text-xs shadow-lg shadow-sky-950/80 cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <span>Proceed to KMC Grievance Portal</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 3: KMC PORTAL OPENED STATE (WITH COMPLAINT NUMBER)  */}
        {/* ======================================================== */}
        {view === 'kmc_portal_opened' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    KMC Online Grievance Submission
                  </h3>
                  <p className="text-xs text-slate-400">
                    Official Kolkata Municipal Corporation Portal
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MANDATORY NOTICE (Exact requirement #7) */}
            <div className="p-3.5 bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-bold text-amber-200 leading-snug">
                    KMC's official complaint portal has been opened.
                  </p>
                  <p className="text-xs text-amber-300/90 leading-relaxed">
                    Please complete the final submission there. JolSafety has not marked this report as submitted until KMC provides a complaint/reference number.
                  </p>
                </div>
              </div>
            </div>

            {/* DIRECT PORTAL LINK FALLBACK: Ensures portal opens even if pop-up blocker intervened */}
            <div className="p-3 bg-slate-800/80 border border-sky-500/40 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white font-bold flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                  <span>KMC Official Grievance Portals</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/70 border border-emerald-700/60 px-2 py-0.5 rounded">
                  Live Portal
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href={KMC_GRIEVANCE_PORTAL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open KMC Grievance Portal</span>
                </a>
                <a
                  href={KMC_GRIEVANCE_2_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-750 hover:bg-slate-700 border border-slate-600 text-sky-300 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Grievance KMC 2.0 (WB Govt)</span>
                </a>
              </div>
              <p className="text-[10px] text-slate-400 italic">
                {lang === 'bn' 
                  ? '⚠️ যদি ব্রাউজার পপ-আপ নতুন ট্যাব খুলতে বাধা দেয়, ওপরের যেকোনো লিঙ্কে ট্যাপ করে সরাসরি কেএমসি পোর্টাল খুলুন।'
                  : '⚠️ If your browser blocked opening the new tab automatically, click the direct button above to launch KMC.'}
              </p>
            </div>

            {/* Copy Report Details Button & Quick Reopen Link */}
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">Need to paste report details into KMC?</p>
                  <p className="text-[10px] text-slate-400">Includes GPS, water depth, landmark, hazards & photo link.</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyReportDetails}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs cursor-pointer shadow-md transition-colors"
                  >
                    {reportDetailsCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Report details copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-white" />
                        <span>{t.report.copyReportDetailsBtn}</span>
                      </>
                    )}
                  </button>

                  {photoLink && (
                    <button
                      type="button"
                      onClick={handleCopyPhotoLink}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-650 text-slate-200 hover:text-white font-bold text-xs cursor-pointer shadow transition-colors"
                    >
                      {photoLinkCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span className="text-emerald-200">Photo link copied</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                          <span>Copy Photo Link</span>
                        </>
                      )}
                    </button>
                  )}

                  <a
                    href={KMC_GRIEVANCE_PORTAL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white cursor-pointer inline-flex items-center justify-center"
                    title="Reopen KMC Portal"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {photoLink && (
                <div className="pt-1.5 border-t border-slate-700/60 flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-semibold shrink-0">Photo Link:</span>
                  <input
                    type="text"
                    readOnly
                    value={photoLink}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="flex-1 px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-[11px] font-mono text-slate-300 select-all truncate"
                  />
                </div>
              )}
            </div>

            {/* Step 9 & 10: Enter KMC Complaint Number */}
            <div className="p-3.5 bg-slate-800/60 border border-slate-700 rounded-2xl space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  {t.report.kmcComplaintNumberLabel} (Optional)
                </label>
                <p className="text-[11px] text-slate-400 mb-2">
                  Once KMC provides your grievance reference/docket number, enter it here to link your complaint.
                </p>
                <form onSubmit={handleSaveKmcComplaintNumber} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. KMC/2026/GR-98432 or Docket ID"
                    value={kmcComplaintNumberInput}
                    onChange={(e) => setKmcComplaintNumberInput(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={!kmcComplaintNumberInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs cursor-pointer transition-colors shrink-0 shadow-md"
                  >
                    Save
                  </button>
                </form>
              </div>

              {/* Saved Confirmation Banner (Exact requirement #10) */}
              {savedComplaint && (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-emerald-300">
                        {t.report.kmcComplaintSavedMsg}
                      </p>
                      <p className="text-[11px] font-mono text-emerald-400 truncate">
                        Docket: {savedComplaint.complaintNumber}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {savedComplaint.savedAt}
                  </span>
                </div>
              )}
            </div>

            {/* Step 11: Open KMC Complaint Status Button */}
            <div className="p-3 bg-slate-800/40 border border-slate-700/80 rounded-2xl flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-white">Track Grievance Redressal</h4>
                <p className="text-[11px] text-slate-400">
                  Check drainage pump dispatch and ward resolution.
                </p>
              </div>
              <a
                href={KMC_GRIEVANCE_STATUS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-colors cursor-pointer shrink-0"
              >
                <span>{t.report.openKmcStatusBtn}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Step 12: Keep existing phone and WhatsApp buttons unchanged */}
            <div className="p-3 bg-slate-800/40 border border-slate-700/80 rounded-2xl space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Direct KMC Urgent Helplines:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {/* Official KMC Phone Call Button */}
                <a
                  href={`tel:${KMC_PHONE}`}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Call KMC: {KMC_PHONE}</span>
                </a>

                {/* Official KMC WhatsApp Button */}
                <button
                  type="button"
                  onClick={handleSendToKmcWhatsApp}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>KMC WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setView('form')}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs border border-slate-700 cursor-pointer"
              >
                Back to Report Form
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-950 cursor-pointer transition-colors"
              >
                Done / Close
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 4: MAIN WATERLOGGING REPORT FORM                    */}
        {/* ======================================================== */}
        {view === 'form' && (
          <div>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center shrink-0">
                  <Droplets className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {t.report.modalTitle}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {t.report.modalSubtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Validation Error if any */}
            {validationError && (
              <div className="p-2.5 mb-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{validationError}</span>
              </div>
            )}

            <form onSubmit={handleCommunitySubmit} className="space-y-3.5">
              {/* Area and Landmark */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {t.report.locationLabel} *
                </label>
                <input
                  type="text"
                  placeholder={t.report.locationPlaceholder}
                  value={landmark}
                  onChange={(e) => {
                    setLandmark(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />

                {/* Quick Area Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 text-[11px]">
                  <span className="text-slate-500 shrink-0 font-medium">Quick:</span>
                  {['Sector V (College More)', 'Gariahat (Pantaloons)', 'Jadavpur (8B More)', 'Central Ave (MG Rd)', 'Behala (Taratala)'].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setLandmark(chip);
                        setArea(chip.split(' ')[0]);
                        if (validationError) setValidationError(null);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 whitespace-nowrap cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {t.report.severityLabel} *
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'low', label: t.report.ankleLevel, border: 'border-emerald-500/40', activeBg: 'bg-emerald-600' },
                    { id: 'moderate', label: t.report.kneeLevel, border: 'border-amber-500/40', activeBg: 'bg-amber-600' },
                    { id: 'severe', label: t.report.waistLevel, border: 'border-orange-500/40', activeBg: 'bg-orange-600' },
                    { id: 'critical', label: t.report.criticalLevel, border: 'border-rose-500/40', activeBg: 'bg-rose-600' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSeverity(item.id as SeverityLevel);
                        if (item.id === 'low') setDepthInches(4);
                        if (item.id === 'moderate') setDepthInches(9);
                        if (item.id === 'severe') setDepthInches(16);
                        if (item.id === 'critical') setDepthInches(28);
                      }}
                      className={`p-2 rounded-xl text-left font-medium border transition-all cursor-pointer ${
                        severity === item.id
                          ? `${item.activeBg} text-white shadow-md`
                          : `bg-slate-800 text-slate-300 ${item.border} hover:bg-slate-750`
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Approximate depth slider */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-300">{lang === 'bn' ? 'আনুমানিক জলের গভীরতা:' : 'Approximate Depth:'}</span>
                  <span className="font-bold text-amber-400 font-mono text-sm">{depthInches} inches ({Math.round(depthInches * 2.54)} cm)</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={40}
                  step={1}
                  value={depthInches}
                  onChange={(e) => setDepthInches(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* Traffic status */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {t.report.trafficLabel}
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'slow', label: t.report.trafficNormal },
                    { id: 'congested', label: t.report.trafficCongested },
                    { id: 'blocked', label: t.report.trafficBlocked }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTrafficStatus(item.id as any)}
                      className={`py-1.5 px-2 rounded-xl text-center font-medium border transition-all cursor-pointer ${
                        trafficStatus === item.id
                          ? 'bg-sky-600 text-white border-sky-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Road Hazards Checkbox */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {t.report.hazardsLabel}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                  {[
                    t.report.hazardOpenManhole,
                    t.report.hazardElectricWire,
                    t.report.hazardDeepPothole,
                    t.report.hazardStalledCar,
                    t.report.hazardCanalOverflow
                  ].map((hz) => (
                    <label key={hz} className="flex items-center gap-2 p-1.5 bg-slate-800/80 rounded-lg cursor-pointer text-slate-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={hazards.includes(hz)}
                        onChange={() => toggleHazard(hz)}
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span className="text-[11px] truncate">{hz}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Photo Attachment Section: Take Photo vs Upload Photo */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {t.report.photoLabel}
                </label>

                {/* Hidden file inputs: one with capture for device camera, one for file/gallery picker */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    handleImageUpload(e);
                    stopCameraStream();
                  }}
                  className="hidden"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    handleImageUpload(e);
                    stopCameraStream();
                  }}
                  className="hidden"
                />

                {/* Live Camera Viewfinder */}
                {isCameraOpen ? (
                  <div className="relative rounded-2xl overflow-hidden bg-black border border-sky-500/60 shadow-2xl mb-2.5">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-52 sm:h-60 object-cover bg-black"
                    />
                    {/* Top Bar with Camera Status and Close button */}
                    <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-auto">
                      <span className="px-2.5 py-1 rounded-full bg-red-600/90 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow backdrop-blur-sm">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        {lang === 'bn' ? 'লাইভ ক্যামেরা' : 'Live Camera'}
                      </span>
                      <button
                        type="button"
                        onClick={stopCameraStream}
                        className="p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-slate-200 hover:text-white transition-colors cursor-pointer"
                        title={lang === 'bn' ? 'ক্যামেরা বন্ধ করুন' : 'Close Camera'}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Bottom Bar with Capture Shutter button */}
                    <div className="absolute bottom-3 inset-x-0 flex items-center justify-center pointer-events-auto">
                      <button
                        type="button"
                        onClick={handleCapturePhoto}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xl shadow-black/60 cursor-pointer active:scale-95 transition-all"
                      >
                        <Camera className="w-4 h-4" />
                        <span>{lang === 'bn' ? 'ছবি তুলুন' : 'Capture Photo'}</span>
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Camera Error Message with fallback direct device camera button */}
                {cameraError && !isCameraOpen && (
                  <div className="p-2.5 mb-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-2">
                    <span className="text-[11px]">{cameraError}</span>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] whitespace-nowrap cursor-pointer hover:bg-amber-400"
                    >
                      {lang === 'bn' ? 'ডিভাইস ক্যামেরা' : 'Device Camera'}
                    </button>
                  </div>
                )}

                {/* Photo Preview if photo exists */}
                {imagePreview ? (
                  <div className="flex items-center gap-3 p-2.5 bg-slate-800/90 border border-slate-700 rounded-2xl">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-600 shrink-0 bg-slate-900">
                      <img src={imagePreview} alt="Report Preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{lang === 'bn' ? 'ছবি যুক্ত হয়েছে' : 'Photo Attached'}</span>
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {lang === 'bn' ? 'রিপোর্টের সাথে এই ছবি প্রদর্শিত হবে' : 'Will be shown with incident report'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleStartCamera}
                        className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white cursor-pointer transition-colors"
                        title={lang === 'bn' ? 'আবার ছবি তুলুন' : 'Retake photo'}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 cursor-pointer transition-colors"
                        title={lang === 'bn' ? 'ছবি মুছে ফেলুন' : 'Remove photo'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Two distinct options to choose from: Take Photo vs Upload Photo */
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleStartCamera}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-sky-500/60 rounded-xl text-xs text-slate-200 font-semibold cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <Camera className="w-4 h-4 text-sky-400 shrink-0" />
                      <span className="truncate">{lang === 'bn' ? 'ছবি তুলুন' : 'Take Photo'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-amber-500/60 rounded-xl text-xs text-slate-200 font-semibold cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <Upload className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="truncate">{lang === 'bn' ? 'ছবি আপলোড' : 'Upload Photo'}</span>
                    </button>
                  </div>
                )}

                {/* Requirement #2: Shareable Photo Link Section */}
                {imagePreview && (
                  <div className="mt-2.5 p-3 bg-slate-800/90 border border-slate-700 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                        <span>Photo Link</span>
                      </span>
                      {isUploadingPhoto && (
                        <span className="text-[10px] text-amber-400 flex items-center gap-1 font-medium">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Generating link...</span>
                        </span>
                      )}
                      {photoLink && !isUploadingPhoto && (
                        <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          <span>Shareable URL active</span>
                        </span>
                      )}
                    </div>

                    {photoUploadError ? (
                      <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                        {photoUploadError}
                      </div>
                    ) : isUploadingPhoto ? (
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-400 flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400 shrink-0" />
                        <span>Uploading actual photo to storage system...</span>
                      </div>
                    ) : photoLink ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            readOnly
                            value={photoLink}
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                            className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 font-mono select-all focus:outline-none focus:border-sky-500 truncate"
                          />
                          <button
                            type="button"
                            onClick={handleCopyPhotoLink}
                            className="px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 shrink-0 shadow transition-colors"
                          >
                            {photoLinkCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-300" />
                                <span className="text-emerald-200">Photo link copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Photo Link</span>
                              </>
                            )}
                          </button>
                          <a
                            href={photoLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-650 text-sky-300 hover:text-white text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
                            title="Open direct image link in new tab"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          Real URL in JPEG/PNG format. Opens directly in browser outside JolSafety & WhatsApp.
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Anti-spam notice */}
              <p className="text-[10px] text-slate-500 italic">
                ℹ️ {t.report.spamNotice}
              </p>

              {/* ======================================================== */}
              {/* REPORTING ACTION AREA (Requirements #2, #3, #4, #5, #6, #8, #9) */}
              {/* ======================================================== */}
              <div className="pt-2 space-y-2.5 border-t border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Reporting Actions:
                </span>

                {whatsAppNotice && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{whatsAppNotice}</span>
                  </div>
                )}

                {/* Primary Buttons: Copy Report Details & Copy Photo Link */}
                <div className={`grid ${photoLink ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-2`}>
                  <button
                    type="button"
                    onClick={handleCopyReportDetails}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-sky-300 hover:text-sky-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                  >
                    {reportDetailsCopied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Report details copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-sky-400" />
                        <span>Copy Report Details</span>
                      </>
                    )}
                  </button>

                  {photoLink && (
                    <button
                      type="button"
                      onClick={handleCopyPhotoLink}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                    >
                      {photoLinkCopied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Photo link copied</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-4 h-4 text-amber-400" />
                          <span>Copy Photo Link</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Open KMC Grievance Button (Requirement #4) */}
                <button
                  type="button"
                  id="open-kmc-grievance-btn"
                  onClick={handleOpenKmcGrievance}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-700 to-indigo-700 hover:from-sky-600 hover:to-indigo-600 text-white font-black text-xs sm:text-sm shadow-xl shadow-sky-950/60 border border-sky-400/50 flex items-center justify-center gap-2.5 transition-all cursor-pointer group active:scale-[0.99]"
                >
                  <Building2 className="w-4 h-4 text-sky-200 group-hover:scale-110 transition-transform" />
                  <span className="tracking-wide">Open KMC Grievance</span>
                  <ExternalLink className="w-4 h-4 text-sky-200" />
                </button>

                {/* Send to KMC WhatsApp (Requirements #5 & #6) + Call KMC: 14420 (Requirement #8) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleSendToKmcWhatsApp}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition-colors cursor-pointer active:scale-[0.99]"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Send to KMC WhatsApp</span>
                  </button>

                  <a
                    href={`tel:${KMC_PHONE}`}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-emerald-400 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Call KMC: {KMC_PHONE}</span>
                  </a>
                </div>

                {/* Close / Cancel Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 cursor-pointer transition-colors"
                  >
                    {t.report.cancelBtn}
                  </button>
                </div>

                {/* Status tracking link (Requirement #11) */}
                <div className="pt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Track submitted complaint:</span>
                  <a
                    href={KMC_GRIEVANCE_STATUS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:text-sky-300 underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>{t.report.openKmcStatusBtn}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
