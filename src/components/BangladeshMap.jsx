/* ===================================
   IMPORTS
   =================================== */
import React, { useState, useEffect, useRef } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { AlertCircle, Download, Share2, Search, X, BarChart3, Table, Info, Calendar, Users, Eye, Maximize2, Minimize2 } from "lucide-react";
// Geographic boundaries are loaded on demand to keep the initial JS bundle smaller.
import uprisingConfig from "../data/uprising-data.json";
import historicalEvidence from "../data/historical-evidence.json";
import { translate, formatLocalizedNumber } from "../i18n/messages";
import { localizeEvent } from "../i18n/timeline-bn";
import "./BangladeshUprisingMap.css";


/* ===================================
   DATA EXTRACTION
   =================================== */
const uprisingData = uprisingConfig.divisions;
const divisionMapping = uprisingConfig.divisionMapping;
const divisionColors = uprisingConfig.divisionColors;
const labelPositions = uprisingConfig.labelPositions;
const statistics = uprisingConfig.statistics;
// Phase 1.4: show the independently cited editorial timeline, not unsupported daily counts.
const timeline = historicalEvidence.timeline;
const context = uprisingConfig.context || {};
const resources = uprisingConfig.resources || [];
const editorialSources = historicalEvidence.sources;
const editorialSourceById = Object.fromEntries(editorialSources.map(source => [source.id, source]));


/* ===================================
   CALCULATED DATA
   =================================== */
const totalDeaths = Object.values(uprisingData).reduce((sum, r) => sum + r.deaths, 0);
const totalInjured = Object.values(uprisingData).reduce((sum, r) => sum + r.injured, 0);


/* ===================================
   STATISTICS CONFIGURATION
   =================================== */
const statisticsConfig = [
  { label: "Regional deaths (unverified)", value: totalDeaths, color: "red", subtitle: "Uncited legacy data — not a national total", icon: AlertCircle },
  { label: "Regional injuries (unverified)", value: totalInjured, color: "orange", subtitle: "Uncited legacy data — not nationally verified", icon: Users },
  { label: "Lost vision in one eye", value: statistics.lostVisionOneEye, color: "pink", subtitle: "Unverified legacy site count", icon: Eye },
  { label: "Lost vision in both eyes", value: statistics.lostVisionBothEyes, color: "yellow", subtitle: "Unverified legacy site count", icon: Eye },
  { label: "Toddlers and children", value: statistics.toddlersAndChildren, color: "green", subtitle: "Unverified legacy site count (ages 0–10)", icon: Users },
  { label: "Teenagers", value: statistics.teenagers, color: "blue", subtitle: "Unverified legacy site count (ages 10–18)", icon: Users }
];


/* ===================================
   MAP CONFIGURATION
   =================================== */
const MAP_CONFIG = {
  projection: "geoMercator",
  scale: 4000,
  center: [90.4, 23.7],
  strokeColor: "#fff",
  strokeWidth: 0.5,
  defaultFill: "#7f1d1d"
};


/* ===================================
   MAIN COMPONENT
   =================================== */
export default function BangladeshUprisingMap() {
  /* ===================================
     STATE MANAGEMENT
     =================================== */
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [pinnedRegion, setPinnedRegion] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("map");
  const [showTimeline, setShowTimeline] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [animatedStats, setAnimatedStats] = useState({});
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState("en");
  const t = (key) => translate(language, key);
  const number = (value) => formatLocalizedNumber(value, language);
  const localizedTimeline = timeline.map(event => localizeEvent(event, language));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedDivisions, setSelectedDivisions] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const [showProfiles, setShowProfiles] = useState(false);
  const [timelineDate, setTimelineDate] = useState(null);
  const [heatmapIntensity, setHeatmapIntensity] = useState(1);
  const [showCondolences, setShowCondolences] = useState(false);
  const [condolences, setCondolences] = useState([]);
  const [newCondolence, setNewCondolence] = useState({ name: '', message: '' });
  const mapRef = useRef(null);
  const [divisionGeography, setDivisionGeography] = useState(null);
  const [geographyError, setGeographyError] = useState(false);

  // Request the build-generated, simplified geographic boundaries only in map view.
  // The original source remains in src/data for reproducible regeneration.
  useEffect(() => {
    if (viewMode !== "map" || divisionGeography) return undefined;
    const controller = new AbortController();
    setGeographyError(false);

    fetch(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/data/bangladesh-divisions.simplified.json`, {
      signal: controller.signal
    })
      .then(response => {
        if (!response.ok) throw new Error(`Map geography HTTP ${response.status}`);
        return response.json();
      })
      .then(geojson => {
        if (!controller.signal.aborted) {
          if (geojson.type !== "FeatureCollection" || !geojson.features?.length) {
            throw new Error("Invalid map geography format");
          }
          setDivisionGeography(geojson);
        }
      })
      .catch(error => {
        if (!controller.signal.aborted) {
          console.error("Unable to load map boundaries", error);
          setGeographyError(true);
        }
      });

    return () => controller.abort();
  }, [viewMode, divisionGeography]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = language === "bn" ? "বাংলাদেশের জুলাই ২০২৪-এর গণঅভ্যুত্থান | স্মারক মানচিত্র" : "Bangladesh July 2024 Uprising | Memorial Map";
  }, [language]);

  const activeRegion = pinnedRegion || hoveredRegion;


  /* ===================================
     ANIMATED COUNTER EFFECT
     =================================== */
  useEffect(() => {
    const animateValue = (start, end, duration, key) => {
      const startTime = performance.now();
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        setAnimatedStats(prev => ({ ...prev, [key]: value }));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    };

    statisticsConfig.forEach((stat, index) => {
      setTimeout(() => animateValue(0, stat.value, 2000, stat.label), index * 100);
    });
  }, []);


  /* ===================================
     EVENT HANDLERS
     =================================== */
  const handleMouseMove = (e) => setTooltipPos({ x: e.pageX, y: e.pageY });

  const handleRegionMouseEnter = (regionKey, e) => {
    if (!pinnedRegion) {
      setHoveredRegion(regionKey);
      handleMouseMove(e);
    }
  };

  const handleRegionMouseMove = (e) => {
    if (!pinnedRegion) handleMouseMove(e);
  };

  const handleRegionMouseLeave = () => {
    if (!pinnedRegion) setHoveredRegion(null);
  };

  const handleRegionClick = (regionKey) => {
    if (compareMode) {
      setSelectedDivisions(prev => 
        prev.includes(regionKey) 
          ? prev.filter(d => d !== regionKey)
          : [...prev, regionKey]
      );
    } else {
      setPinnedRegion(pinnedRegion === regionKey ? null : regionKey);
      setHoveredRegion(regionKey);
    }
  };

  const handleTooltipClose = () => {
    setPinnedRegion(null);
    setHoveredRegion(null);
  };

  const handleExport = () => {
    const csvContent = [
      ["Division (UNVERIFIED LEGACY DATA)", "Deaths (unverified)", "Injured (unverified)", "Total (unverified)"],
      ...Object.entries(uprisingData).map(([key, data]) => [
        data.name,
        data.deaths,
        data.injured,
        data.deaths + data.injured
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bangladesh-uprising-unverified-regional-data.csv";
    a.click();
  };

  const handleShare = async () => {
    const shareData = {
      title: "The Monsoon Uprising",
      text: "Remembering those affected by the July–August 2024 uprising. Review sourced national estimates and the limitations of regional figures.",
      url: window.location.href
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else alert("Share URL: " + window.location.href);
    } catch (err) {
      console.log("Share failed:", err);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'bn' : 'en');
  };

  const handleCondolenceSubmit = (e) => {
    e.preventDefault();
    if (newCondolence.name.trim() && newCondolence.message.trim()) {
      setCondolences(prev => [{
        ...newCondolence,
        date: new Date().toLocaleDateString(),
        id: Date.now()
      }, ...prev]);
      setNewCondolence({ name: '', message: '' });
    }
  };


  /* ===================================
     HELPER FUNCTIONS
     =================================== */
  const calculateTooltipPosition = () => {
    const leftPosition = tooltipPos.x - 320 < 0 ? tooltipPos.x + 20 : tooltipPos.x - 320;
    const topPosition = tooltipPos.y - 180 < 0 ? tooltipPos.y + 20 : tooltipPos.y - 380;
    return { left: leftPosition, top: topPosition };
  };

  const filteredDivisions = Object.entries(uprisingData).filter(([key, data]) =>
    data.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPercentage = (value) => ((value / totalDeaths) * 100).toFixed(1);


  /* ===================================
     RENDER: HEADER COMPONENT
     =================================== */
  const renderHeader = () => (
    <header className="flex items-center justify-between gap-3 mb-6 flex-wrap">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-red-400 text-sm">
            {t('tagline')}
          </p>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button 
          onClick={() => setDarkMode(!darkMode)} 
          className="btn-icon" 
          title={darkMode ? t("light") : t("dark")} aria-label={darkMode ? t("light") : t("dark")}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
        <button 
          onClick={toggleLanguage} 
          className="btn-icon" 
          title={t("language")} aria-label={language === "en" ? "Switch to Bengali" : "Switch to English"} aria-pressed={language === "bn"}
        >
          {language === "en" ? "বাংলা" : "English"}
        </button>
        <button onClick={() => setShowGallery(true)} className="btn-icon" title={language === "en" ? "Gallery" : t("gallery")} aria-label={t("gallery")}>
          🖼️
        </button>
        <button onClick={() => setShowProfiles(true)} className="btn-icon" title={language === "en" ? "Victim Profiles" : t("profiles")} aria-label={t("profiles")}>
          👥
        </button>
        <button onClick={() => setShowCondolences(true)} className="btn-icon" title={language === "en" ? "Condolences" : t("condolences")} aria-label={t("condolences")}>
          💐
        </button>
        <button onClick={() => setShowContext(!showContext)} className="btn-icon" title={language === "en" ? "Context" : t("context")} aria-label={t("context")}>
          <Info size={20} />
        </button>
        <button onClick={() => setShowTimeline(!showTimeline)} className="btn-icon" title={language === "en" ? "Timeline" : t("timeline")} aria-label={t("timeline")}>
          <Calendar size={20} />
        </button>
        <button onClick={handleExport} className="btn-icon" title={language === "en" ? "Export CSV" : t("export")} aria-label={t("export")}>
          <Download size={20} />
        </button>
        <button onClick={handleShare} className="btn-icon" title={language === "en" ? "Share" : t("share")} aria-label={t("share")}>
          <Share2 size={20} />
        </button>
        <button onClick={toggleFullscreen} className="btn-icon" title={language === "en" ? "Fullscreen" : t("fullscreen")} aria-label={t("fullscreen")}>
          {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
      </div>
    </header>
  );


  /* ===================================
     RENDER: CONTEXT PANEL
     =================================== */
  const renderContext = () => {
    if (!showContext) return null;
    return (
      <div className="context-panel mb-6 bg-gray-900 bg-opacity-50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-red-400">{context.title}</h2>
          <button onClick={() => setShowContext(false)} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <p className="text-gray-300 mb-4">{context.background}</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-bold text-orange-400 mb-2">{t("duration")}</h3>
            <p className="text-sm text-gray-400">{context.duration}</p>
          </div>
          <div>
            <h3 className="font-bold text-orange-400 mb-2">{t("outcomes")}</h3>
            <p className="text-sm text-gray-400">{context.outcome}</p>
          </div>
        </div>
        {context.keyDemands && (
          <div className="mt-4">
            <h3 className="font-bold text-orange-400 mb-2">{t("keyDemands")}</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              {context.keyDemands.map((demand, i) => (
                <li key={i}>• {demand}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };


  /* ===================================
     RENDER: TIMELINE
     =================================== */
  const renderTimeline = () => {
    if (!showTimeline) return null;
    return (
      <div className="timeline-panel mb-6 bg-gray-900 bg-opacity-50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 max-h-[600px] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-red-400">{t("chronology")}</h2>
            <p className="text-sm text-gray-400 mt-1">{t("chronologyNote")}</p>
          </div>
          <button onClick={() => setShowTimeline(false)} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          {localizedTimeline.map((event, i) => (
            <div key={i} className="border-l-4 pl-4 pb-4" style={{ borderColor: 
              event.type === 'violence' ? '#ef4444' :
              event.type === 'protest' ? '#3b82f6' :
              event.type === 'arrest' ? '#f97316' :
              event.type === 'political' ? '#8b5cf6' :
              event.type === 'media' ? '#eab308' :
              event.type === 'memorial' ? '#ec4899' :
              '#6b7280'
            }}>
              <div className="flex flex-wrap gap-2 items-center mb-2">
                <div className="text-orange-400 font-mono text-sm font-bold">{event.date}</div>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  event.type === 'violence' ? 'bg-red-900 text-red-200' :
                  event.type === 'protest' ? 'bg-blue-900 text-blue-200' :
                  event.type === 'arrest' ? 'bg-orange-900 text-orange-200' :
                  event.type === 'political' ? 'bg-purple-900 text-purple-200' :
                  event.type === 'media' ? 'bg-yellow-900 text-yellow-200' :
                  event.type === 'memorial' ? 'bg-pink-900 text-pink-200' :
                  'bg-gray-700 text-gray-200'
                }`}>{event.type}</span>
                {event.casualties > 0 && (
                  <span className="text-red-400 text-xs font-bold">
                    ⚠ {event.casualties} casualties
                  </span>
                )}
              </div>
              <h3 className="text-white font-bold mb-2">{event.event}</h3>
              <div className="flex flex-wrap gap-3 mb-2 text-xs">
                {(event.sourceIds || []).map(sourceId => {
                  const source = editorialSourceById[sourceId];
                  return source ? <a key={sourceId} href={source.url} target="_blank" rel="noopener noreferrer" className="underline text-amber-200 hover:text-white">{t("source")}: {source.publisher}</a> : null;
                })}
              </div>
              {event.description && (
                <p className="text-gray-300 text-sm mb-2">{event.description}</p>
              )}
              {event.locations && (
                <div className="flex gap-2 flex-wrap mt-2">
                  <span className="text-xs text-gray-400">{t("locations")}</span>
                  {event.locations.map((loc, idx) => (
                    <span key={idx} className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300">
                      {loc}
                    </span>
                  ))}
                </div>
              )}
              {event.arrests > 0 && (
                <div className="text-xs text-orange-300 mt-2">
                  📋 {event.arrests} arrests reported
                </div>
              )}
              {event.eyeInjuries > 0 && (
                <div className="text-xs text-pink-300 mt-2">
                  👁 {event.eyeInjuries} eye injuries documented
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Violence</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Protest</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Arrest</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span>Political</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Media</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-pink-500 rounded"></div>
              <span>Memorial</span>
            </div>
          </div>
        </div>
      </div>
    );
  };


  /* ===================================
     RENDER: PHOTO GALLERY
     =================================== */
  const renderGallery = () => {
    if (!showGallery) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-red-400">Photo Gallery</h2>
            <button onClick={() => setShowGallery(false)} className="text-gray-400 hover:text-white">
              <X size={24} />
            </button>
          </div>
          <div className="p-6">
            <p className="text-gray-400 text-center mb-6">
              Visual documentation of the July 2024 uprising (Sample placeholders - add actual images)
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">📷</div>
                    <div className="text-sm">Photo {i}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };


  /* ===================================
     RENDER: VICTIM PROFILES
     =================================== */
  const renderProfiles = () => {
    if (!showProfiles) return null;
    
    const sampleProfiles = [
      { name: "In Memory", age: "Various Ages", description: "Dedicated to all victims of state violence" },
      { name: "Student Activists", age: "18-25", description: "Young protesters demanding justice and reform" },
      { name: "Innocent Bystanders", age: "All Ages", description: "Civilians caught in the violence" }
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-red-400">Victim Profiles</h2>
            <button onClick={() => setShowProfiles(false)} className="text-gray-400 hover:text-white">
              <X size={24} />
            </button>
          </div>
          <div className="p-6">
            <p className="text-gray-400 text-center mb-6">
              Remembering those who lost their lives fighting for justice
            </p>
            <div className="space-y-4">
              {sampleProfiles.map((profile, i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center text-3xl">
                      👤
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">{profile.name}</h3>
                      <p className="text-orange-400 text-sm mb-2">Age: {profile.age}</p>
                      <p className="text-gray-300 text-sm">{profile.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-500 text-sm mt-6 italic">
              This is a memorial space. Detailed profiles can be added with family consent.
            </p>
          </div>
        </div>
      </div>
    );
  };


  /* ===================================
     RENDER: CONDOLENCES SECTION
     =================================== */
  const renderCondolences = () => {
    if (!showCondolences) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-red-400">Condolences & Messages</h2>
            <button onClick={() => setShowCondolences(false)} className="text-gray-400 hover:text-white">
              <X size={24} />
            </button>
          </div>
          <div className="p-6">
            <form onSubmit={handleCondolenceSubmit} className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
              <h3 className="font-bold mb-3 text-orange-400">Leave a Message</h3>
              <input
                type="text"
                placeholder="Your name"
                value={newCondolence.name}
                onChange={(e) => setNewCondolence(prev => ({ ...prev, name: e.target.value }))}
                className="w-full mb-3 p-2 bg-gray-900 border border-gray-700 rounded text-white"
                required
              />
              <textarea
                placeholder="Your message of condolence or support..."
                value={newCondolence.message}
                onChange={(e) => setNewCondolence(prev => ({ ...prev, message: e.target.value }))}
                className="w-full mb-3 p-2 bg-gray-900 border border-gray-700 rounded text-white h-24"
                required
              />
              <button type="submit" className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white font-medium">
                Submit Message
              </button>
            </form>

            <div className="space-y-4">
              {condolences.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No messages yet. Be the first to leave a condolence.</p>
              ) : (
                condolences.map((condolence) => (
                  <div key={condolence.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-orange-400">{condolence.name}</span>
                      <span className="text-xs text-gray-500">{condolence.date}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{condolence.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };


  /* ===================================
     RENDER: TIMELINE SLIDER
     =================================== */
  const renderTimelineSlider = () => {
    if (timeline.length === 0) return null;
    
    return (
      <div className="bg-gray-900 bg-opacity-50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 max-w-5xl mx-auto mb-6">
        <h3 className="font-bold text-orange-400 mb-4">{t("timelineSlider")}</h3>
        <input
          type="range"
          aria-label={t("sliderLabel")}
          min="0"
          max={localizedTimeline.length - 1}
          value={timelineDate || 0}
          onChange={(e) => setTimelineDate(parseInt(e.target.value))}
          className="w-full mb-4"
        />
        {timelineDate !== null && localizedTimeline[timelineDate] && (
          <div className="bg-gray-800 rounded-lg p-4 border border-red-700">
            <div className="text-orange-400 font-bold mb-2">{localizedTimeline[timelineDate].date}</div>
            <div className="text-white font-bold mb-1">{localizedTimeline[timelineDate].event}</div>
            <div className="text-gray-400 text-sm">{localizedTimeline[timelineDate].description}</div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs">
              {(localizedTimeline[timelineDate].sourceIds || []).map(sourceId => {
                const source = editorialSourceById[sourceId];
                return source ? <a key={sourceId} href={source.url} target="_blank" rel="noopener noreferrer" className="underline text-amber-200 hover:text-white">{t("source")}: {source.publisher}</a> : null;
              })}
            </div>
            {localizedTimeline[timelineDate].casualties > 0 && (
              <div className="text-red-400 text-sm mt-2">⚠ {localizedTimeline[timelineDate].casualties} casualties</div>
            )}
          </div>
        )}
      </div>
    );
  };


  /* ===================================
     RENDER: SEARCH BAR
     =================================== */
  const renderSearchBar = () => (
    <div className="flex gap-2 mb-6 flex-wrap items-center">
      <div className="relative flex-1 min-w-64">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder={t("search")} aria-label={t("search")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
        />
      </div>
      <div className="flex gap-2">
        <button onClick={() => setViewMode("map")} className={`btn-view ${viewMode === "map" ? "active" : ""}`}>
          <Maximize2 size={16} /> {t("map")}
        </button>
        <button onClick={() => setViewMode("table")} className={`btn-view ${viewMode === "table" ? "active" : ""}`}>
          <Table size={16} /> {t("table")}
        </button>
        <button onClick={() => setViewMode("chart")} className={`btn-view ${viewMode === "chart" ? "active" : ""}`}>
          <BarChart3 size={16} /> {t("chart")}
        </button>
      </div>
      <button 
        onClick={() => setCompareMode(!compareMode)} 
        className={`btn-view ${compareMode ? "active" : ""}`}
      >
        {t("compare")} {compareMode && `(${selectedDivisions.length})`}
      </button>
    </div>
  );


  /* ===================================
     RENDER: STATISTICS COMPONENT
     =================================== */
  const renderStatistics = () => (
    <div className="flex justify-center items-center w-full">
      <div className="flex flex-wrap gap-6 mb-12 overflow-x-auto justify-center">
        {statisticsConfig.map(({ label, value, color, subtitle, icon: Icon }) => (
          <div
            key={label}
            className={`flex-shrink-0 w-64 bg-${color}-900 bg-opacity-30 backdrop-blur-sm border border-${color}-700 rounded-lg p-6 stats-card`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`text-4xl font-bold text-${color}-400`}>
                {animatedStats[label] || 0}
              </div>
              <Icon className={`text-${color}-400`} size={32} />
            </div>
            <div className="text-xl text-gray-300">{translate(language, ({
              "Regional deaths (unverified)": "regionalDeaths", "Regional injuries (unverified)": "regionalInjuries",
              "Lost vision in one eye": "oneEye", "Lost vision in both eyes": "bothEyes",
              "Toddlers and children": "children", "Teenagers": "teenagers"
            })[label] || label)}</div>
            <div className="text-sm text-gray-400 mt-2">{language === "bn" ? (subtitle.includes("not a national") ? t("unverifiedDeaths") : subtitle.includes("nationally verified") ? t("unverifiedInjuries") : t("legacySubtitle")) : subtitle}</div>
          </div>
        ))}
      </div>
    </div>
  );


  /* ===================================
     RENDER: LEGEND
     =================================== */
  const renderLegend = () => {
    if (!showLegend) return null;
    return (
      <div className="absolute top-12 right-4 bg-black bg-opacity-90 border border-gray-700 rounded-lg p-8 z-10">
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-bold text-sm">Division Colors</h3>
          <button onClick={() => setShowLegend(false)} className="text-gray-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-2">
          {Object.entries(divisionColors).map(([key, color]) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: color }}></div>
              <span className="text-gray-300">{uprisingData[key].name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };


  /* ===================================
     RENDER: TABLE VIEW
     =================================== */
  const renderTableView = () => (
    <div className="bg-gray-900 bg-opacity-50 backdrop-blur-sm border border-gray-700 rounded-lg p-8 max-w-5xl mx-auto overflow-x-auto">
      <h2 className="text-2xl font-bold mb-4">{t("divisionTable")}</h2>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="p-3">{t("division")}</th>
            <th className="p-3 text-right">{t("deaths")}</th>
            <th className="p-3 text-right">{t("injured")}</th>
            <th className="p-3 text-right">{t("total")}</th>
            <th className="p-3 text-right">{t("percentage")}</th>
          </tr>
        </thead>
        <tbody>
          {filteredDivisions
            .sort(([, a], [, b]) => b.deaths - a.deaths)
            .map(([key, data]) => (
              <tr key={key} className="border-b border-gray-800 hover:bg-gray-800">
                <td className="p-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: divisionColors[key] }}></div>
                  {data.name}
                </td>
                <td className="p-3 text-right text-red-400 font-bold">{data.deaths}</td>
                <td className="p-3 text-right text-orange-400 font-bold">{data.injured}</td>
                <td className="p-3 text-right font-bold">{data.deaths + data.injured}</td>
                <td className="p-3 text-right text-gray-400">{getPercentage(data.deaths)}%</td>
              </tr>
            ))}
          <tr className="font-bold text-lg border-t-2 border-gray-600">
            <td className="p-3">TOTAL</td>
            <td className="p-3 text-right text-red-400">{totalDeaths}</td>
            <td className="p-3 text-right text-orange-400">{totalInjured}</td>
            <td className="p-3 text-right">{totalDeaths + totalInjured}</td>
            <td className="p-3 text-right">100%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );


  /* ===================================
     RENDER: CHART VIEW
     =================================== */
  const renderChartView = () => (
    <div className="bg-gray-900 bg-opacity-50 backdrop-blur-sm border border-gray-700 rounded-lg p-8 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-8 text-center">{t("regionChart")}</h2>
      <div className="space-y-4">
        {Object.entries(uprisingData)
          .sort(([, a], [, b]) => b.deaths - a.deaths)
          .map(([key, data]) => (
            <div key={key}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">{data.name}</span>
                <span className="text-sm text-gray-400">{data.deaths} deaths, {data.injured} injured</span>
              </div>
              <div className="flex gap-1 h-8">
                <div 
                  className="bg-red-500 rounded-l flex items-center justify-center text-xs font-bold"
                  style={{ width: `${(data.deaths / totalDeaths) * 100}%`, minWidth: '30px' }}
                >
                  {data.deaths}
                </div>
                <div 
                  className="bg-orange-500 rounded-r flex items-center justify-center text-xs font-bold"
                  style={{ width: `${(data.injured / totalInjured) * 100}%`, minWidth: '30px' }}
                >
                  {data.injured}
                </div>
              </div>
            </div>
          ))}
      </div>
      <div className="flex gap-6 justify-center mt-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Deaths</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <span>Injured</span>
        </div>
      </div>
    </div>
  );


  /* ===================================
     RENDER: COMPARISON VIEW
     =================================== */
  const renderComparisonView = () => {
    if (!compareMode || selectedDivisions.length === 0) return null;
    return (
      <div className="bg-gray-900 bg-opacity-50 backdrop-blur-sm border border-gray-700 rounded-lg p-8 max-w-5xl mx-auto mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Comparing {selectedDivisions.length} Division(s)</h2>
          <button onClick={() => setSelectedDivisions([])} className="text-red-400 hover:text-red-300 text-sm">
            Clear Selection
          </button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedDivisions.map(key => {
            const data = uprisingData[key];
            return (
              <div key={key} className="border border-gray-700 rounded-lg p-4" style={{ borderLeftColor: divisionColors[key], borderLeftWidth: '4px' }}>
                <h3 className="font-bold text-lg mb-3">{data.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Deaths:</span>
                    <span className="text-red-400 font-bold">{data.deaths}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Injured:</span>
                    <span className="text-orange-400 font-bold">{data.injured}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total:</span>
                    <span className="font-bold">{data.deaths + data.injured}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">% of Deaths:</span>
                    <span className="text-gray-300">{getPercentage(data.deaths)}%</span>
                  </div>
                  {data.majorIncidents && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className="text-gray-400 text-xs mb-2">Major Incidents: {data.majorIncidents.length}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };


  /* ===================================
     RENDER: MAP GEOGRAPHIES COMPONENT
     =================================== */
  const renderGeographies = ({ geographies }) => (
    geographies.map((geo) => {
      const divisionName = geo.properties.name;
      const regionKey = divisionMapping[divisionName];
      const isSelected = selectedDivisions.includes(regionKey);

      const baseColor = divisionColors[regionKey] || MAP_CONFIG.defaultFill;
      const adjustedColor = isSelected ? "#ffffff" : baseColor;

      return (
        <Geography
          key={geo.rsmKey}
          geography={geo}
          fill={adjustedColor}
          fillOpacity={heatmapIntensity}
          stroke={isSelected ? "#ffd700" : MAP_CONFIG.strokeColor}
          strokeWidth={isSelected ? 2 : MAP_CONFIG.strokeWidth}
          onMouseEnter={(e) => handleRegionMouseEnter(regionKey, e)}
          onMouseMove={handleRegionMouseMove}
          onMouseLeave={handleRegionMouseLeave}
          onClick={() => handleRegionClick(regionKey)}
          role="button"
          tabIndex={0}
          aria-label={`${divisionName}: ${t("overview")}`}
          aria-pressed={isSelected || pinnedRegion === regionKey}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleRegionClick(regionKey);
            }
            if (event.key === "Escape") {
              setPinnedRegion(null);
              setHoveredRegion(null);
            }
          }}
          style={{ cursor: 'pointer', transition: 'fill 0.2s' }}
        />
      );
    })
  );


  /* ===================================
     RENDER: MAP MARKERS COMPONENT
     =================================== */
  const renderMarkers = () => (
    Object.entries(labelPositions).map(([key, coords]) => (
      <Marker key={key} coordinates={coords}>
        <circle
          r={6}
          fill={divisionColors[key]}
          stroke="#fff"
          strokeWidth={1.5}
          style={{ pointerEvents: "none", transition: "all 0.3s" }}
          className="marker-pulse"
        />
        <text
          textAnchor="middle"
          y={-12}
          fill="white"
          fontSize={14}
          fontWeight="bold"
          style={{ pointerEvents: "none" }}
        >
          {uprisingData[key].name}
        </text>
      </Marker>
    ))
  );


  /* ===================================
     RENDER: MAP COMPONENT
     =================================== */
  const renderMap = () => (
    <div ref={mapRef} className="bg-gray-900 bg-opacity-50 backdrop-blur-sm border border-gray-700 rounded-lg p-8 max-w-5xl mx-auto relative">
      <div className="flex justify-between items-center mb-2 flex-wrap gap-4 relative">
  <h2 className="text-2xl font-bold absolute left-1/2 transform -translate-x-1/2">
    {language === "bn" ? "বিভাগভিত্তিক প্রভাবের মানচিত্র" : "Division-Wise Impact Map"}
  </h2>
  <div className="flex items-center gap-4 ml-auto">
    <div className="flex items-center gap-2">
      <label htmlFor="map-intensity" className="text-sm text-gray-400">{language === "bn" ? "রঙের ঘনত্ব:" : "Heat Intensity:"}</label>
      <input 
        type="range" 
        id="map-intensity"
        min="0.3" 
        max="1.5" 
        step="0.1" 
        value={heatmapIntensity}
        onChange={(e) => setHeatmapIntensity(parseFloat(e.target.value))}
        className="w-24"
      />
      <span className="text-xs text-gray-400">{(heatmapIntensity * 100).toFixed(0)}%</span>
    </div>
    {!showLegend && (
      <button onClick={() => setShowLegend(true)} className="text-sm text-gray-400 hover:text-white">
        Show Legend
      </button>
    )}
  </div>
</div>

      <p className="text-gray-400 text-center mb-8">
        {language === "bn"
          ? (compareMode ? "তুলনা করতে বিভাগ নির্বাচন করুন" : "বিস্তারিত জানতে বিভাগের ওপর কার্সর রাখুন, স্পর্শ করুন অথবা Tab ও Enter ব্যবহার করুন")
          : (compareMode ? "Click or press Enter on divisions to compare" : "Hover, tap, or use Tab and Enter to explore regions")}
      </p>

      {geographyError ? (
        <div role="alert" className="rounded-lg border border-red-500 p-6 text-center">
          <p>{t("mapError")} {t("tableFallback")}</p>
          <button className="btn-view mx-auto mt-4" onClick={() => setViewMode("table")}>
            {t("divisionTable")}
          </button>
        </div>
      ) : !divisionGeography ? (
        <div role="status" aria-live="polite" className="rounded-lg border border-gray-700 p-8 text-center">
          {t("unknownRegions")}
        </div>
      ) : (
      <ComposableMap
        projection={MAP_CONFIG.projection}
        projectionConfig={{ 
          scale: MAP_CONFIG.scale, 
          center: MAP_CONFIG.center 
        }}
        style={{ width: "100%", height: "auto", maxHeight: "min(75vh, 720px)" }}
      >
        <Geographies geography={divisionGeography}>
          {renderGeographies}
        </Geographies>
        {renderMarkers()}
      </ComposableMap>
      )}

      <p className="sr-only" role="status" aria-live="polite">{pinnedRegion ? `${t("regionSelected")} ${uprisingData[pinnedRegion]?.name || ""}` : ""}</p>
      {renderLegend()}
      {renderTooltip()}
    </div>
  );


  /* ===================================
     RENDER: TOOLTIP COMPONENT
     =================================== */
  const renderTooltip = () => {
    if (!activeRegion || compareMode) return null;

    const tooltipPosition = calculateTooltipPosition();
    const data = uprisingData[activeRegion];

    return (
      <div
        className="absolute bg-black bg-opacity-95 border-2 border-red-600 rounded-lg p-4 pointer-events-none z-20 min-w-64 shadow-2xl transition-all duration-100 ease-out transform opacity-100 scale-100 tooltip-container"
        style={tooltipPosition}
      >
        {pinnedRegion && (
          <button
            className="absolute top-1 right-2 text-gray-400 hover:text-white text-xs pointer-events-auto"
            onClick={handleTooltipClose}
          >
            ✕
          </button>
        )}
        <h3 className="text-xl font-bold text-red-400 mb-2">
          {data.name} Division
        </h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-8">
            <span className="text-gray-400">Deaths:</span>
            <span className="text-red-400 font-bold text-lg">{data.deaths}</span>
          </div>
          <div className="flex justify-between gap-8">
            <span className="text-gray-400">Injured:</span>
            <span className="text-orange-400 font-bold text-lg">{data.injured}</span>
          </div>
          <div className="flex justify-between gap-8">
            <span className="text-gray-400">% of Total Deaths:</span>
            <span className="text-gray-300 font-bold">{getPercentage(data.deaths)}%</span>
          </div>
          <p className="text-gray-300 text-xs mt-2 pt-2 border-t border-gray-700">
            {data.details}
          </p>
          {data.majorIncidents && data.majorIncidents.length > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-700">
              <div className="text-gray-400 text-xs font-bold mb-1">Major Incidents:</div>
              {data.majorIncidents.slice(0, 2).map((incident, i) => (
                <div key={i} className="text-xs text-gray-400 mb-1">
                  • {incident.date}: {incident.description}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ===================================
     RENDER: EDITORIAL EVIDENCE AND LIMITATIONS
     =================================== */
  const renderEvidenceNotice = () => (
    <section className="max-w-5xl mx-auto mb-8 rounded-xl border border-amber-500/50 bg-gray-900/85 p-5 md:p-6" aria-labelledby="evidence-heading">
      <h2 id="evidence-heading" className="text-xl font-bold text-amber-200 mb-3">{t("evidenceTitle")}</h2>
      <p className="text-sm text-gray-200 mb-3">
        <strong>{t("upTo")} {number(historicalEvidence.nationalAssessment.value)}</strong> {t("peopleMayHaveDied")} {historicalEvidence.nationalAssessment.period}. {t("reportAttribution")} {t("estimateCaution")}
        {" "}<a href={editorialSourceById["ohchr-2025"].url} target="_blank" rel="noopener noreferrer" className="underline text-amber-200 hover:text-white">{t("readOhchr")}</a>.
      </p>
      <p className="text-sm text-amber-100">
        <strong>{t("unverified")}</strong> {language === "bn"
          ? "এই সাইটের পুরোনো বিভাগভিত্তিক নিহত, আহত ও চোখে আঘাতের পরিসংখ্যানের উৎস বা পদ্ধতি যাচাই করা যায়নি। এগুলো নির্ভরযোগ্য জাতীয় হিসাব নয়।"
          : historicalEvidence.regionalAssessment.note}
        {" "}{t("legacyWarning")}
      </p>
      <p className="text-xs text-gray-400 mt-3">{t("sourceReview")} {historicalEvidence.reviewedOn}. {t("olderExcluded")}</p>
    </section>
  );

  /* ===================================
     RENDER: RESOURCES SECTION
     =================================== */
const renderResources = () => (
  <div className="bg-gray-900 bg-opacity-50 backdrop-blur-sm border border-gray-700 rounded-lg p-8 max-w-5xl mx-auto mt-12">
    <h2 className="text-2xl font-bold mb-4 text-red-400">{t("resources")}</h2>
    <p className="text-sm text-gray-300 mb-4">{t("resourcesNote")}</p>
    <div className="grid md:grid-cols-2 gap-4 mb-6">
      {editorialSources.map(source => (
        <a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer" className="block p-4 border border-amber-700/60 rounded-lg hover:border-amber-400 transition-colors">
          <div className="text-xs text-amber-300 mb-1">{source.publisher} · {source.published}</div>
          <div className="text-gray-100 font-medium">{source.title}</div>
          <div className="text-xs text-gray-400 mt-2">{source.scope}</div>
        </a>
      ))}
    </div>
    <h3 className="font-semibold text-gray-200 mb-3">{t("additionalReading")}</h3>
    <div className="grid md:grid-cols-3 gap-4">
      {resources.map((resource, i) => (
        <a
          key={i}
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4 border border-gray-700 rounded-lg hover:border-red-500 transition-colors"
        >
          <div className="text-sm text-orange-400 mb-1">{resource.type}</div>
          <div className="text-gray-300">{resource.title}</div>
        </a>
      ))}
    </div>
  </div>
);



  /* ===================================
     RENDER: MEMORIAL SECTION
     =================================== */
  const renderMemorial = () => (
    <div className="bg-gradient-to-r from-red-900 to-gray-900 bg-opacity-50 backdrop-blur-sm border border-red-700 rounded-lg p-8 max-w-5xl mx-auto mt-6 text-center">
      <div className="flex justify-center mb-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="candle-flame mx-2"></div>
        ))}
      </div>
      <h2 className="text-3xl font-bold mb-2">{t("memorial")}</h2>
      <p className="text-gray-300 text-lg mb-4">
        {t("memorialText")}
      </p>
      <p className="text-gray-400 text-sm italic">
        "The arc of the moral universe is long, but it bends toward justice."
      </p>
    </div>
  );


  /* ===================================
     MAIN RENDER
     =================================== */
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-red-900 via-gray-900 to-black' : 'bg-gradient-to-br from-gray-100 via-white to-gray-200'} ${darkMode ? 'text-white' : 'text-gray-900'} p-8 relative`}>
      <a href="#main-content" className="skip-link">{t("skip")}</a>
      {renderHeader()}
      <main id="main-content" tabIndex={-1}>
      {renderEvidenceNotice()}
      {renderContext()}
      {renderTimeline()}
      {renderTimelineSlider()}
      {renderSearchBar()}
      {renderStatistics()}
      {renderComparisonView()}
      
      {viewMode === "map" && renderMap()}
      {viewMode === "table" && renderTableView()}
      {viewMode === "chart" && renderChartView()}
      
      {renderResources()}
      {renderMemorial()}
      
      {renderGallery()}
      {renderProfiles()}
      {renderCondolences()}
      </main>

      <footer className={`text-center ${darkMode ? 'text-gray-500' : 'text-gray-600'} text-sm mt-12`}>
        <p>{t("sourceFooter")} {historicalEvidence.reviewedOn}. {t("footerWarning")}</p>
        <p className="mt-2">{t("footerMethod")}</p>
        <p className="mt-4 text-xs">
          <button onClick={() => window.print()} className="hover:underline">{t("print")}</button> | 
          <button onClick={() => window.print()} className="hover:underline ml-2">{t("savePdf")}</button>
        </p>
      </footer>
    </div>
  );
}