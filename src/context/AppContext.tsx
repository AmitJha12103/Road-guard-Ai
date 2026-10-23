import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AppContextType {
  currentRole: UserRole;
  currentUser: User | null;
  switchRole: (role: UserRole) => void;
  language: 'en' | 'hi';
  toggleLanguage: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedIssueId: string | null;
  setSelectedIssueId: (id: string | null) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  t: (key: string) => string;

  // Map Provider & API Key
  mapApiKey: string;
  setMapApiKey: (key: string) => void;
  mapTileProvider: string;
  setMapTileProvider: (provider: string) => void;
  isMapKeyModalOpen: boolean;
  setIsMapKeyModalOpen: (open: boolean) => void;

  // Opening 3D Animation & Login Role Popup
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  hasSeenIntro: boolean;
  setHasSeenIntro: (seen: boolean) => void;
}

const translations: Record<'en' | 'hi', Record<string, string>> = {
  en: {
    brand_name: 'RoadGuard AI',
    tagline_hero: 'Every Pothole Has a Story. Fix It with Precision AI.',
    tagline_sub: 'Turning road damage into actionable municipal intelligence. Detect, prioritize, and track repairs seamlessly.',
    report_action: 'Report Road Defect',
    explore_map: 'Explore Live Map',
    tab_landing: 'Overview',
    tab_citizen: 'Citizen Portal',
    tab_report: 'Report Defect',
    tab_map: 'Live Intelligence Map',
    tab_command: 'Authority Center',
    tab_maintenance: 'Field Crew',
    tab_analytics: 'Transparency & Health',
    tab_issue_detail: 'Issue Inspector',
    critical_severity: 'Critical Hazard',
    high_severity: 'High Severity',
    moderate_severity: 'Moderate Deterioration',
    low_severity: 'Low / Minor Surface Defect',
    demo_badge: 'Demonstration & Simulation Environment',
    demo_disclaimer: 'Demonstration Mode active. Synthetic datasets and calibrated computer vision simulation are visibly labeled for auditability.',
  },
  hi: {
    brand_name: 'रोडगार्ड एआई',
    tagline_hero: 'हर गड्ढे का समाधान संभव है। एआई से सड़कों की सुरक्षा।',
    tagline_sub: 'सड़क क्षति को समय पर सुधारने हेतु स्मार्ट एआई रिपोर्टिंग और नगर पालिका ट्रैकिंग प्रणाली।',
    report_action: 'गड्ढे की शिकायत दर्ज करें',
    explore_map: 'सड़क मानचित्र देखें',
    tab_landing: 'मुख्य पृष्ठ',
    tab_citizen: 'नागरिक पोर्टल',
    tab_report: 'गड्ढा रिपोर्ट करें',
    tab_map: 'लाइव सड़क मानचित्र',
    tab_command: 'नगर पालिका नियंत्रण कक्ष',
    tab_maintenance: 'मरम्मत दल कार्यक्षेत्र',
    tab_analytics: 'पारदर्शिता और आंकड़े',
    tab_issue_detail: 'मुद्दा विवरण',
    critical_severity: 'गंभीर खतरा',
    high_severity: 'उच्च क्षति',
    moderate_severity: 'मध्यम क्षति',
    low_severity: 'हल्की खरोंच/सतह क्षति',
    demo_badge: 'प्रदर्शन और सिमुलेशन मोड',
    demo_disclaimer: 'डेमो मोड सक्रिय है। सभी नमूना रिकॉर्ड्स पारदर्शी रूप से चिन्हित हैं।',
  },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>('citizen');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Map Tile & API Key state
  const [mapApiKey, setMapApiKeyState] = useState<string>(() => {
    return localStorage.getItem('roadguard_map_key') || '';
  });
  const [mapTileProvider, setMapTileProviderState] = useState<string>(() => {
    return localStorage.getItem('roadguard_tile_provider') || 'carto_voyager';
  });
  const [isMapKeyModalOpen, setIsMapKeyModalOpen] = useState(false);

  // Intro & Role Login Modal
  const [hasSeenIntro, setHasSeenIntro] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  const setMapApiKey = (key: string) => {
    setMapApiKeyState(key);
    localStorage.setItem('roadguard_map_key', key);
  };

  const setMapTileProvider = (provider: string) => {
    setMapTileProviderState(provider);
    localStorage.setItem('roadguard_tile_provider', provider);
  };

  useEffect(() => {
    api.getCurrentUser(currentRole).then((res) => {
      if (res.user) {
        setCurrentUser(res.user);
      }
    });
  }, [currentRole]);

  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
    api.getCurrentUser(role).then((res) => {
      if (res.user) setCurrentUser(res.user);
    });
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 4000);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        currentUser,
        switchRole,
        language,
        toggleLanguage,
        activeTab,
        setActiveTab,
        selectedIssueId,
        setSelectedIssueId,
        toastMessage,
        showToast,
        t,
        mapApiKey,
        setMapApiKey,
        mapTileProvider,
        setMapTileProvider,
        isMapKeyModalOpen,
        setIsMapKeyModalOpen,
        isLoginModalOpen,
        setIsLoginModalOpen,
        hasSeenIntro,
        setHasSeenIntro,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
