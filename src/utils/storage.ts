import { WaterloggingIncident, OfflineMapZone, EmergencyContact, SafeLocation } from '../types';
import { INITIAL_INCIDENTS, INITIAL_OFFLINE_ZONES, OFFICIAL_CONTACTS, INITIAL_SAFE_LOCATIONS } from '../data/kolkataData';

const INCIDENTS_KEY = 'kolkata_waterlogging_incidents_v1';
const OFFLINE_ZONES_KEY = 'kolkata_offline_zones_v1';
const CONTACTS_KEY = 'kolkata_emergency_contacts_v1';
const SIMULATED_OFFLINE_KEY = 'kolkata_simulated_offline_v1';

export function getStoredIncidents(): WaterloggingIncident[] {
  try {
    const raw = localStorage.getItem(INCIDENTS_KEY);
    if (!raw) {
      localStorage.setItem(INCIDENTS_KEY, JSON.stringify(INITIAL_INCIDENTS));
      return INITIAL_INCIDENTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_INCIDENTS;
  }
}

export function saveIncident(incident: WaterloggingIncident): WaterloggingIncident[] {
  const current = getStoredIncidents();
  const updated = [incident, ...current];
  try {
    localStorage.setItem(INCIDENTS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to persist incident in localStorage:', e);
  }
  return updated;
}

export function confirmIncident(id: string): { incidents: WaterloggingIncident[]; confirmed: boolean } {
  const current = getStoredIncidents();
  let confirmed = false;
  const updated = current.map((inc) => {
    if (inc.id === id) {
      if (inc.userUpvoted) {
        return {
          ...inc,
          userUpvoted: false,
          confirmationsCount: Math.max(0, inc.confirmationsCount - 1)
        };
      } else {
        confirmed = true;
        return {
          ...inc,
          userUpvoted: true,
          confirmationsCount: inc.confirmationsCount + 1
        };
      }
    }
    return inc;
  });
  try {
    localStorage.setItem(INCIDENTS_KEY, JSON.stringify(updated));
  } catch (e) {
    // ignore
  }
  return { incidents: updated, confirmed };
}

export function getStoredOfflineZones(): OfflineMapZone[] {
  try {
    const raw = localStorage.getItem(OFFLINE_ZONES_KEY);
    if (!raw) {
      localStorage.setItem(OFFLINE_ZONES_KEY, JSON.stringify(INITIAL_OFFLINE_ZONES));
      return INITIAL_OFFLINE_ZONES;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_OFFLINE_ZONES;
  }
}

export function toggleZoneDownload(zoneId: string): OfflineMapZone[] {
  const current = getStoredOfflineZones();
  const updated = current.map((zone) => {
    if (zone.id === zoneId) {
      const willDownload = !zone.downloaded;
      return {
        ...zone,
        downloaded: willDownload,
        downloadedAt: willDownload ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today' : undefined
      };
    }
    return zone;
  });
  try {
    localStorage.setItem(OFFLINE_ZONES_KEY, JSON.stringify(updated));
  } catch (e) {
    // ignore
  }
  return updated;
}

export function downloadAllZones(): OfflineMapZone[] {
  const current = getStoredOfflineZones();
  const updated = current.map((zone) => ({
    ...zone,
    downloaded: true,
    downloadedAt: 'Just now (' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ')'
  }));
  try {
    localStorage.setItem(OFFLINE_ZONES_KEY, JSON.stringify(updated));
  } catch (e) {
    // ignore
  }
  return updated;
}

export function getStoredContacts(): EmergencyContact[] {
  try {
    const raw = localStorage.getItem(CONTACTS_KEY);
    if (!raw) {
      return OFFICIAL_CONTACTS;
    }
    const custom = JSON.parse(raw);
    return [...OFFICIAL_CONTACTS, ...custom];
  } catch (e) {
    return OFFICIAL_CONTACTS;
  }
}

export function addCustomEmergencyContact(name: string, phone: string): EmergencyContact[] {
  const newContact: EmergencyContact = {
    id: 'contact-custom-' + Date.now(),
    name,
    nameBn: name,
    phone,
    category: 'custom',
    description: 'Personal Emergency Contact (Family / Neighbor / RWA)',
    descriptionBn: 'ব্যক্তিগত জরুরি পরিচিতি',
    isOfficial: false
  };

  try {
    const raw = localStorage.getItem(CONTACTS_KEY);
    const customList = raw ? JSON.parse(raw) : [];
    customList.push(newContact);
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(customList));
  } catch (e) {
    // ignore
  }
  return getStoredContacts();
}

export function deleteCustomEmergencyContact(id: string): EmergencyContact[] {
  try {
    const raw = localStorage.getItem(CONTACTS_KEY);
    if (raw) {
      const customList = JSON.parse(raw).filter((c: EmergencyContact) => c.id !== id);
      localStorage.setItem(CONTACTS_KEY, JSON.stringify(customList));
    }
  } catch (e) {
    // ignore
  }
  return getStoredContacts();
}

export function getSimulatedOffline(): boolean {
  try {
    return localStorage.getItem(SIMULATED_OFFLINE_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

export function setSimulatedOffline(val: boolean): void {
  try {
    localStorage.setItem(SIMULATED_OFFLINE_KEY, val ? 'true' : 'false');
  } catch (e) {
    // ignore
  }
}

export function getSafeLocations(): SafeLocation[] {
  return INITIAL_SAFE_LOCATIONS;
}
