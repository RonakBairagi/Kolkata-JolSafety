export type SeverityLevel = 'low' | 'moderate' | 'severe' | 'critical';

export interface WaterloggingIncident {
  id: string;
  title: string;
  titleBn: string;
  area: string;
  areaBn: string;
  landmark: string;
  coordinates: [number, number]; // [lat, lng]
  severity: SeverityLevel;
  waterDepthInches: number;
  waterDepthDesc: string;
  waterDepthDescBn: string;
  roadCondition: string;
  roadConditionBn: string;
  trafficStatus: 'normal' | 'slow' | 'congested' | 'blocked';
  hazards: string[]; // e.g. ['Open Manhole', 'Submerged potholes', 'Live electric wire risk']
  verified: boolean;
  verifiedByAuthority: boolean;
  confirmationsCount: number;
  userUpvoted?: boolean;
  reportedAt: string; // ISO string or relative
  imageUrl?: string;
  source: 'authority' | 'community' | 'sensor';
}

export type SafeLocationType = 'hospital' | 'police' | 'fire_station' | 'shelter' | 'metro_station';

export interface SafeLocation {
  id: string;
  name: string;
  nameBn: string;
  type: SafeLocationType;
  area: string;
  areaBn: string;
  address: string;
  coordinates: [number, number];
  phone: string;
  isElevatedGround: boolean;
  hasEmergencyPower: boolean;
  distanceKm?: number;
  notes?: string;
}

export interface WeatherData {
  city: string;
  temperature: number;
  condition: string;
  conditionBn: string;
  rainfallIntensityMmHr: number;
  rainfallLevel: 'light' | 'moderate' | 'heavy' | 'very_heavy';
  precipitationProb: number;
  humidity: number;
  windSpeedKmH: number;
  updatedAt: string;
  hooghlyHighTide: {
    time: string;
    levelMeters: number;
    lockGatesClosed?: boolean;
    statusUnavailable?: boolean;
    warning: string;
    warningBn: string;
  };
  forecastHourly: {
    time: string;
    rainfallMm: number;
    prob: number;
    desc: string;
  }[];
}

export type RiverGateStatusCode = 'OPEN' | 'CLOSED' | 'PARTIALLY_OPEN' | 'STATUS_UNAVAILABLE';

export interface RiverGateTelemetry {
  id: string;
  name: string;
  nameBn: string;
  location: string;
  locationBn: string;
  riverSystem: string;
  jurisdiction: string;
  dataSource: string;
  officialAgency: string;
  status: RiverGateStatusCode;
  statusText: string;
  statusTextBn: string;
  lastUpdated: string;
  riverLevelMeters?: number | null;
  warningLevelMeters?: number | null;
  dangerLevelMeters?: number | null;
  extremeDangerLevelMeters?: number | null;
  gaugeStation?: string;
  operationProtocol: string;
  operationProtocolBn: string;
}

export interface RiverGateSystemData {
  lastChecked: string;
  isLiveApiAvailable: boolean;
  officialAgencies: string[];
  generalStatusNotice: string;
  generalStatusNoticeBn: string;
  tideLevelMeters?: number | null;
  tideStation?: string;
  gates: RiverGateTelemetry[];
}

export interface EarlyWarning {
  id: string;
  title: string;
  titleBn: string;
  message: string;
  messageBn: string;
  severity: 'advisory' | 'warning' | 'severe' | 'critical';
  affectedAreas: string[];
  affectedAreasBn: string[];
  source: 'IMD Kolkata' | 'KMC Disaster Control' | 'Kolkata Traffic Police' | 'Community Consensus';
  issuedAt: string;
  validUntil: string;
  actionAdvice: string;
  actionAdviceBn: string;
}

export interface OfflineMapZone {
  id: string;
  name: string;
  nameBn: string;
  sizeMb: number;
  downloaded: boolean;
  downloadedAt?: string;
  version: string;
  landmarksCount: number;
  sheltersCount: number;
  incidentsCached: number;
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
}

export interface EmergencyContact {
  id: string;
  name: string;
  nameBn: string;
  phone: string;
  category: 'police' | 'civic' | 'electricity' | 'ambulance' | 'fire' | 'custom';
  description: string;
  descriptionBn: string;
  isOfficial: boolean;
}

export interface RouteOption {
  id: string;
  title: string;
  titleBn: string;
  isRecommended: boolean;
  isSafe: boolean;
  distanceKm: number;
  estimatedTimeMins: number;
  viaFlyover: boolean;
  waterloggedSections: string[];
  safePassages: string[];
  coordinates: [number, number][];
  warningMessage?: string;
}
