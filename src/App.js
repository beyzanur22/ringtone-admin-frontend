import React, { useEffect, useState } from "react";

const COUNTRY_LIST = [
  { code: 'AF', name: 'Afghanistan' }, { code: 'AL', name: 'Albania' }, { code: 'DZ', name: 'Algeria' },
  { code: 'AS', name: 'American Samoa' }, { code: 'AD', name: 'Andorra' }, { code: 'AO', name: 'Angola' },
  { code: 'AI', name: 'Anguilla' }, { code: 'AQ', name: 'Antarctica' }, { code: 'AR', name: 'Argentina' },
  { code: 'AM', name: 'Armenia' }, { code: 'AU', name: 'Australia' }, { code: 'AT', name: 'Austria' },
  { code: 'AZ', name: 'Azerbaijan' }, { code: 'BH', name: 'Bahrain' }, { code: 'BD', name: 'Bangladesh' },
  { code: 'BY', name: 'Belarus' }, { code: 'BE', name: 'Belgium' }, { code: 'BR', name: 'Brazil' },
  { code: 'BG', name: 'Bulgaria' }, { code: 'CA', name: 'Canada' }, { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' }, { code: 'HR', name: 'Croatia' }, { code: 'CU', name: 'Cuba' },
  { code: 'CY', name: 'Cyprus' }, { code: 'CZ', name: 'Czech Republic' }, { code: 'DK', name: 'Denmark' },
  { code: 'EG', name: 'Egypt' }, { code: 'FI', name: 'Finland' }, { code: 'FR', name: 'France' },
  { code: 'GE', name: 'Georgia' }, { code: 'DE', name: 'Germany' }, { code: 'GR', name: 'Greece' },
  { code: 'HK', name: 'Hong Kong' }, { code: 'HU', name: 'Hungary' }, { code: 'IS', name: 'Iceland' },
  { code: 'IN', name: 'India' }, { code: 'ID', name: 'Indonesia' }, { code: 'IR', name: 'Iran' },
  { code: 'IQ', name: 'Iraq' }, { code: 'IE', name: 'Ireland' }, { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy' }, { code: 'JP', name: 'Japan' }, { code: 'KZ', name: 'Kazakhstan' },
  { code: 'KR', name: 'South Korea' }, { code: 'KW', name: 'Kuwait' }, { code: 'LB', name: 'Lebanon' },
  { code: 'MY', name: 'Malaysia' }, { code: 'MX', name: 'Mexico' }, { code: 'MA', name: 'Morocco' },
  { code: 'NL', name: 'Netherlands' }, { code: 'NZ', name: 'New Zealand' }, { code: 'NG', name: 'Nigeria' },
  { code: 'NO', name: 'Norway' }, { code: 'PK', name: 'Pakistan' }, { code: 'PE', name: 'Peru' },
  { code: 'PH', name: 'Philippines' }, { code: 'PL', name: 'Poland' }, { code: 'PT', name: 'Portugal' },
  { code: 'QA', name: 'Qatar' }, { code: 'RO', name: 'Romania' }, { code: 'RU', name: 'Russia' },
  { code: 'SA', name: 'Saudi Arabia' }, { code: 'RS', name: 'Serbia' }, { code: 'SG', name: 'Singapore' },
  { code: 'SK', name: 'Slovakia' }, { code: 'SI', name: 'Slovenia' }, { code: 'ZA', name: 'South Africa' },
  { code: 'ES', name: 'Spain' }, { code: 'LK', name: 'Sri Lanka' }, { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' }, { code: 'TW', name: 'Taiwan' }, { code: 'TH', name: 'Thailand' },
  { code: 'TR', name: 'Turkey' }, { code: 'UA', name: 'Ukraine' }, { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' }, { code: 'US', name: 'United States' }, { code: 'UY', name: 'Uruguay' },
  { code: 'UZ', name: 'Uzbekistan' }, { code: 'VE', name: 'Venezuela' }, { code: 'VN', name: 'Vietnam' }
];

function CountryRulePicker({ rule, idx, configKey, config, setConfig }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const mode = rule.countryMode || (rule.countries?.length > 0 ? "include" : "all");
  const filtered = COUNTRY_LIST.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()));

  const updateRule = (patch) => {
    const rules = [...(config[configKey]?.rules || [])];
    rules[idx] = { ...rules[idx], ...patch };
    setConfig(prev => ({ ...prev, [configKey]: { ...prev[configKey], rules } }));
  };

  const modeLabel = mode === "all" ? "Tüm ülkeler" : mode === "exclude"
    ? `Hariç: ${(rule.countries || []).length > 0 ? (rule.countries || []).map(c => { const f = COUNTRY_LIST.find(x => x.code === c); return f ? f.code : c; }).join(", ") : "seçim yok"}`
    : `${(rule.countries || []).length > 0 ? (rule.countries || []).map(c => { const f = COUNTRY_LIST.find(x => x.code === c); return f ? f.code : c; }).join(", ") : "seçim yok"}`;

  return (
    <div style={{ position: "relative" }}>
      <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Ülkeler:</label>
      <select value={mode} onChange={e => {
        const newMode = e.target.value;
        updateRule({ countryMode: newMode, countries: newMode === "all" ? [] : (rule.countries || []) });
      }} style={{ background: "#23232b", color: "#fff", border: "1px solid #333", borderRadius: 6, padding: "6px 10px", fontSize: 12, width: "100%", marginBottom: 6 }}>
        <option value="all">Tüm ülkeler</option>
        <option value="include">Sadece seçtiğim ülkeler</option>
        <option value="exclude">Bu ülkeler HARİÇ</option>
      </select>
      {mode !== "all" && (
        <>
          <div onClick={() => setOpen(!open)}
            style={{ background: "#23232b", color: mode === "exclude" ? "#ef4444" : "#fff", border: `1px solid ${mode === "exclude" ? "#ef4444" : "#333"}`, borderRadius: 6, padding: "6px 10px", fontSize: 13, cursor: "pointer", minHeight: 30 }}>
            {modeLabel}
          </div>
          {open && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#23232b", border: "1px solid #444", borderRadius: 6, maxHeight: 250, overflowY: "auto", zIndex: 999, padding: "4px 0" }}>
              <input type="text" placeholder="Ülke ara..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: "calc(100% - 16px)", margin: "4px 8px", background: "#1a1a2e", color: "#fff", border: "1px solid #444", borderRadius: 4, padding: "4px 8px", fontSize: 12 }} />
              {filtered.map(c => (
                <label key={c.code} style={{ display: "flex", alignItems: "center", padding: "4px 10px", fontSize: 12, color: "#ccc", cursor: "pointer" }}>
                  <input type="checkbox" checked={(rule.countries || []).includes(c.code)}
                    onChange={e => {
                      const countries = [...(rule.countries || [])];
                      if (e.target.checked) countries.push(c.code);
                      else countries.splice(countries.indexOf(c.code), 1);
                      updateRule({ countries });
                    }} style={{ marginRight: 8 }} />
                  {c.code} - {c.name}
                </label>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function App() {
  const [config, setConfig] = useState(null);
  const [newCountryMode, setNewCountryMode] = useState("youtube");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [blockedChannels, setBlockedChannels] = useState([]);
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  
  // Form states for Modal
  const [currentChannels, setCurrentChannels] = useState([]);
  const [currentChannelInput, setCurrentChannelInput] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [ruleType, setRuleType] = useState("channel");

  const [notifAppId, setNotifAppId] = useState("");
  const [notifRestKey, setNotifRestKey] = useState("");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifImageUrl, setNotifImageUrl] = useState("");
  const [notifActionUrl, setNotifActionUrl] = useState("");
  const [notifScheduleType, setNotifScheduleType] = useState("now");
  const [notifTargetCountry, setNotifTargetCountry] = useState("all");
  const [notifScheduleDate, setNotifScheduleDate] = useState("");
  const [notifScheduleTime, setNotifScheduleTime] = useState("");

  // Popup / Duyuru sistemi
  const [announcements, setAnnouncements] = useState([]);
  const [isPopupModalOpen, setIsPopupModalOpen] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupButtons, setPopupButtons] = useState([
    { label: "⭐ Disappointing", value: "1_star" },
    { label: "⭐⭐ Needs Work", value: "2_star" },
    { label: "⭐⭐⭐ Average", value: "3_star" },
    { label: "⭐⭐⭐⭐ Great", value: "4_star" },
    { label: "⭐⭐⭐⭐⭐ Excellent!", value: "5_star" }
  ]);
  const [popupBtnLabel, setPopupBtnLabel] = useState("");
  const [popupBtnValue, setPopupBtnValue] = useState("");
  const [popupCountryMode, setPopupCountryMode] = useState("all");
  const [popupSelectedCountries, setPopupSelectedCountries] = useState([]);
  const [isPopupCountryDropdownOpen, setIsPopupCountryDropdownOpen] = useState(false);
  const [popupStartTime, setPopupStartTime] = useState("");
  const [popupEndTime, setPopupEndTime] = useState("");
  const [popupMinLaunches, setPopupMinLaunches] = useState(3);

  // Device Actions
  const [deviceActions, setDeviceActions] = useState([]);
  const [daActionType, setDaActionType] = useState("chrome_url");
  const [daMode, setDaMode] = useState("direct");
  const [daValue, setDaValue] = useState("");
  const [daLabel, setDaLabel] = useState("");
  const [apiProviders, setApiProviders] = useState(null);
  const [apiHealth, setApiHealth] = useState([]);
  const [smartCache, setSmartCache] = useState({ enabled: true, minRequests: 3 });
  const [youtubeData, setYoutubeData] = useState(null);
  const [autoRingtone, setAutoRingtone] = useState(null);
  const [newRegion, setNewRegion] = useState("");
  const [feedbacks, setFeedbacks] = useState([]);

  const API_URL = window.location.hostname === "localhost" ? "http://173.212.249.105" : "";

  useEffect(() => {
    fetch(`${API_URL}/config`, { headers: { "X-App-Key": "RINGTONE_MASTER_V2_SECRET_2026" } })
      .then(res => res.json())
      .then(data => setConfig(data));
    fetchBlocked();
    fetchAnnouncements();
    fetchDeviceActions();
    fetchApiProviders();
    fetchYoutubeData();
    fetchAutoRingtone();
    fetchFeedbacks();
  }, []);

  const fetchAutoRingtone = () => {
    fetch(`${API_URL}/admin/auto-ringtone`, { headers: { "X-App-Key": "RINGTONE_MASTER_V2_SECRET_2026" } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setAutoRingtone(data); })
      .catch(() => {});
  };

  const fetchYoutubeData = () => {
    fetch(`${API_URL}/admin/youtube`, { headers: { "X-App-Key": "RINGTONE_MASTER_V2_SECRET_2026" } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setYoutubeData(data); })
      .catch(() => {});
  };

  const fetchFeedbacks = () => {
    fetch(`${API_URL}/feedbacks`, { headers: { "X-App-Key": "RINGTONE_MASTER_V2_SECRET_2026" } })
      .then(r => r.ok ? r.json() : [])
      .then(data => setFeedbacks(data))
      .catch(() => {});
  };

  const deleteFeedback = (id) => {
    fetch(`${API_URL}/feedback/${id}`, { method: "DELETE", headers: { "X-App-Key": "RINGTONE_MASTER_V2_SECRET_2026" } })
      .then(() => fetchFeedbacks());
  };

  const fetchApiProviders = () => {
    fetch(`${API_URL}/admin/api-providers`, { headers: { "X-App-Key": "RINGTONE_MASTER_V2_SECRET_2026" } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setApiProviders(data);
          setApiHealth(data.providerHealth || []);
          if (data.smartCache) setSmartCache(data.smartCache);
        }
      }).catch(() => {});
  };

  const fetchBlocked = () => {
    fetch(`${API_URL}/blocked-channels`, { headers: { "X-App-Key": "RINGTONE_MASTER_V2_SECRET_2026" } })
      .then(res => res.ok ? res.json() : [])
      .then(data => setBlockedChannels(Array.isArray(data) ? data : []))
      .catch(err => setBlockedChannels([]));
  };

  const updateConfig = () => {
    fetch(`${API_URL}/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-App-Key": "RINGTONE_MASTER_V2_SECRET_2026" },
      body: JSON.stringify(config)
    })
    .then(res => res.json())
    .then(() => alert("Config Updated"));
  };

  const addCountry = (code) => {
    if (!code) return;
    setConfig(prev => ({
      ...prev,
      countries: { ...prev.countries, [code.toUpperCase()]: newCountryMode }
    }));
  };

  const toggleCountry = (code) => {
    if (config.countries[code]) {
      removeCountry(code);
    } else {
      addCountry(code);
    }
  };

  const filteredCountries = COUNTRY_LIST.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const removeCountry = (code) => {
    const updated = { ...config.countries };
    delete updated[code];
    setConfig(prev => ({ ...prev, countries: updated }));
  };

  const openModal = (group = null) => {
    if (group) {
      setEditingGroup(group.id);
      setCurrentChannels([...(group.channels || [])]);
      setRuleType(group.type || "channel");
      if (group.countries === "all" || !group.countries) {
        setFilterType("all");
        setSelectedCountries([]);
      } else {
        setFilterType("selected");
        setSelectedCountries(Array.isArray(group.countries) ? group.countries : group.countries.split(","));
      }
    } else {
      setEditingGroup(null);
      setCurrentChannels([]);
      setFilterType("all");
      setSelectedCountries([]);
      setRuleType("channel");
    }
    setCurrentChannelInput("");
    setIsDropdownOpen(false);
    setIsModalOpen(true);
  };

  const handleChannelKeyDown = (e) => {
    if (e.key === "Enter" && currentChannelInput.trim() !== "") {
      setCurrentChannels(prev => [...prev, currentChannelInput.trim()]);
      setCurrentChannelInput("");
    }
  };

  const removeChannelTag = (index) => {
    setCurrentChannels(prev => prev.filter((_, i) => i !== index));
  };

  const saveBlockedGroup = () => {
    // Input'ta yazılı ama Enter'a basılmamış değeri otomatik ekle
    const finalChannels = [...currentChannels];
    if (currentChannelInput.trim() !== "") {
      finalChannels.push(currentChannelInput.trim());
      setCurrentChannelInput("");
      setCurrentChannels(finalChannels);
    }
    if (finalChannels.length === 0) return alert("En az bir değer girmelisiniz!");
    if (filterType === "selected" && selectedCountries.length === 0) return alert("En az bir ülke seçmelisiniz!");
    
    const payload = {
      id: editingGroup, // if null, backend generates one
      channels: finalChannels,
      countries: filterType === "all" ? "all" : selectedCountries,
      type: ruleType
    };
    fetch(`${API_URL}/blocked-channels`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-App-Key": "RINGTONE_MASTER_V2_SECRET_2026" },
      body: JSON.stringify(payload)
    }).then(() => {
      setIsModalOpen(false);
      fetchBlocked();
    });
  };

  const deleteBlockedGroup = (id) => {
    if (!window.confirm("Bu grubu tamamen silmek istiyor musunuz?")) return;
    fetch(`${API_URL}/blocked-channels/${id}`, {
      method: "DELETE",
      headers: { "X-App-Key": "RINGTONE_MASTER_V2_SECRET_2026" }
    }).then(() => fetchBlocked());
  };

  const fetchAnnouncements = () => {
    fetch(`${API_URL}/announcements`, { headers: { "X-App-Key": "RINGTONE_MASTER_V2_SECRET_2026" } })
      .then(res => res.ok ? res.json() : [])
      .then(data => setAnnouncements(Array.isArray(data) ? data : []))
      .catch(() => setAnnouncements([]));
  };

  const addPopupButton = () => {
    if (!popupBtnLabel.trim()) return;
    setPopupButtons(prev => [...prev, { label: popupBtnLabel.trim(), value: popupBtnValue.trim() || popupBtnLabel.trim().toLowerCase().replace(/\s+/g, "_") }]);
    setPopupBtnLabel("");
    setPopupBtnValue("");
  };

  const removePopupButton = (index) => {
    setPopupButtons(prev => prev.filter((_, i) => i !== index));
  };

  const createAnnouncement = () => {
    if (!popupTitle.trim() || !popupMessage.trim()) return alert("Başlık ve mesaj zorunlu!");
    if (popupButtons.length === 0) return alert("En az bir buton ekleyin!");
    if (popupCountryMode === "selected" && popupSelectedCountries.length === 0) return alert("En az bir ülke seçin!");

    const payload = {
      title: popupTitle.trim(),
      message: popupMessage.trim(),
      buttons: popupButtons,
      countries: popupCountryMode === "all" ? "all" : popupSelectedCountries,
      startTime: popupStartTime || null,
      endTime: popupEndTime || null,
      minLaunches: Number(popupMinLaunches) || 3,
    };

    fetch(`${API_URL}/popup/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-App-Key": "RINGTONE_MASTER_V2_SECRET_2026" },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setIsPopupModalOpen(false);
          setPopupTitle(""); setPopupMessage("");
          setPopupButtons([
            { label: "⭐ Disappointing", value: "1_star" },
            { label: "⭐⭐ Needs Work", value: "2_star" },
            { label: "⭐⭐⭐ Average", value: "3_star" },
            { label: "⭐⭐⭐⭐ Great", value: "4_star" },
            { label: "⭐⭐⭐⭐⭐ Excellent!", value: "5_star" }
          ]);
          setPopupCountryMode("all"); setPopupSelectedCountries([]);
          setPopupStartTime(""); setPopupEndTime("");
          fetchAnnouncements();
        } else {
          alert("Hata: " + (data.error || "Oluşturulamadı"));
        }
      })
      .catch(() => alert("Sunucuya bağlanılamadı!"));
  };

  const deleteAnnouncement = (id) => {
    if (!window.confirm("Bu duyuruyu silmek istiyor musunuz?")) return;
    fetch(`${API_URL}/popup/${id}`, {
      method: "DELETE",
      headers: { "X-App-Key": "RINGTONE_MASTER_V2_SECRET_2026" }
    }).then(() => fetchAnnouncements());
  };

  const fetchDeviceActions = () => {
    fetch(`${API_URL}/device-actions`, { headers: { "X-App-Key": "RINGTONE_MASTER_V2_SECRET_2026" } })
      .then(res => res.ok ? res.json() : [])
      .then(data => setDeviceActions(Array.isArray(data) ? data : []))
      .catch(() => setDeviceActions([]));
  };

  const createDeviceAction = () => {
    if (daActionType !== "review_sheet" && !daValue.trim()) return alert("Değer alanı zorunlu!");
    const payload = {
      actionType: daActionType,
      mode: daMode,
      value: daActionType === "review_sheet" ? "" : daValue.trim(),
      label: daLabel.trim() || null
    };
    fetch(`${API_URL}/device-action/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-App-Key": "RINGTONE_MASTER_V2_SECRET_2026" },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setDaValue(""); setDaLabel("");
          fetchDeviceActions();
          alert("✅ Device Action oluşturuldu!");
        } else alert("Hata: " + (data.error || "Oluşturulamadı"));
      })
      .catch(() => alert("Sunucuya bağlanılamadı!"));
  };

  const deleteDeviceAction = (id) => {
    if (!window.confirm("Bu action'ı silmek istiyor musunuz?")) return;
    fetch(`${API_URL}/device-action/${id}`, {
      method: "DELETE",
      headers: { "X-App-Key": "RINGTONE_MASTER_V2_SECRET_2026" }
    }).then(() => fetchDeviceActions());
  };

  const deactivateDeviceAction = (id) => {
    fetch(`${API_URL}/device-action/${id}/deactivate`, {
      method: "POST",
      headers: { "X-App-Key": "RINGTONE_MASTER_V2_SECRET_2026" }
    }).then(() => fetchDeviceActions());
  };

  const sendNotification = () => {
    if (!notifTitle || !notifMessage) {
      return alert("Lütfen başlık ve mesaj alanlarını doldurun!");
    }
    if (notifScheduleType === "scheduled" && (!notifScheduleDate || !notifScheduleTime)) {
      return alert("Lütfen tarih ve saat seçin!");
    }

    const payload = {
      appId: notifAppId,
      restKey: notifRestKey,
      title: notifTitle,
      message: notifMessage
    };

    if (notifImageUrl) payload.imageUrl = notifImageUrl;
    if (notifActionUrl) payload.actionUrl = notifActionUrl;
    if (notifTargetCountry !== "all") payload.targetCountry = notifTargetCountry;

    // Zamanlanmış gönderim
    if (notifScheduleType === "scheduled" && notifScheduleDate && notifScheduleTime) {
      const scheduledDate = new Date(`${notifScheduleDate}T${notifScheduleTime}:00`);
      payload.sendAt = scheduledDate.toISOString();
    }

    fetch(`${API_URL}/send-notification`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-App-Key": "RINGTONE_MASTER_V2_SECRET_2026" },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        let msg = notifScheduleType === "scheduled"
          ? `Bildirim ${notifScheduleDate} ${notifScheduleTime} tarihine zamanlandı!`
          : "Bildirim başarıyla gönderildi!";
        if (data.translated) {
          msg += `\n\n🌐 Otomatik çeviri (${data.translated.lang}):\nBaşlık: ${data.translated.title}\nMesaj: ${data.translated.message}`;
        }
        alert(msg);
        setNotifTitle("");
        setNotifMessage("");
        setNotifImageUrl("");
        setNotifActionUrl("");
        setNotifScheduleType("now");
        setNotifTargetCountry("all");
        setNotifScheduleDate("");
        setNotifScheduleTime("");
      } else {
        alert("Hata: " + (data.details || "Bildirim gönderilemedi"));
      }
    })
    .catch(err => alert("İstek başarısız!"));
  };

  const [activeSection, setActiveSection] = useState("settings");

  const menuItems = [
    { key: "settings", label: "Genel Ayarlar" },
    { key: "mp3", label: "MP3 Ayarları" },
    { key: "countries", label: "Ülke Ayarları" },
    { key: "notifications", label: "Bildirimler" },
    { key: "blocked", label: "Yasaklı Kanallar" },
    { key: "popup", label: "Oylama & Geri Bildirim" },
    { key: "downloadad", label: "İndirme Reklamı" },
    { key: "bannerad", label: "Arama Reklamı" },
    { key: "bottombanner", label: "Alt Banner Reklam" },
    { key: "adfree", label: "Reklamsız Ülkeler" },
    { key: "device", label: "Device Actions" },
    { key: "appcontrols", label: "App Controls" },
    { key: "apiproviders", label: "API Durumu" },
    { key: "smartcache", label: "Cache Yönetimi" },
    { key: "youtube", label: "YouTube & Top50" },
  ];

  if (!config) return <div style={{ color: "white", padding: 50, backgroundColor: "#14151a", minHeight: "100vh" }}>Yükleniyor...</div>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#14151a", color: "#e2e8f0", fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
      {/* SIDEBAR */}
      <div style={{ width: 220, minWidth: 220, backgroundColor: "#1a1a22", borderRight: "1px solid #2a2a35", padding: "20px 0", position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
        <h2 style={{ textAlign: "center", color: "#a78bfa", fontSize: 20, margin: "0 0 24px 0" }}>🎵 Melodia</h2>
        {menuItems.map(item => (
          <div key={item.key} onClick={() => setActiveSection(item.key)}
            style={{
              padding: "12px 20px", cursor: "pointer", fontSize: 14,
              backgroundColor: activeSection === item.key ? "#2a2a3a" : "transparent",
              borderLeft: activeSection === item.key ? "3px solid #a78bfa" : "3px solid transparent",
              color: activeSection === item.key ? "#f8fafc" : "#94a3b8",
              transition: "all 0.15s"
            }}>
            {item.label}
          </div>
        ))}
      </div>
      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: "40px 40px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
        
        {/* GLOBAL & COUNTRY CONFIG (Styled for Dark Theme) */}
        {activeSection === "settings" && <div style={styles.card}>
          <h2 style={styles.title}>Genel Ayarlar</h2>
          <div style={styles.inputGroup}>
            <label style={styles.labelCheckbox}>
              <input type="checkbox" checked={config.global.enabled}
                onChange={e => setConfig({ ...config, global: { ...config.global, enabled: e.target.checked } })}
                style={{ marginRight: 10 }}
              /> Global Enabled
            </label>
            <select style={styles.select} value={config.global.mode}
              onChange={e => setConfig({ ...config, global: { ...config.global, mode: e.target.value } })}>
              <option value="youtube">YouTube</option>
              <option value="ringtone">Ringtone</option>
            </select>
          </div>
          <button style={styles.primaryBtn} onClick={updateConfig}>Ayarları Kaydet</button>

          <div style={{ marginTop: 24, borderTop: "1px solid #2a2a2a", paddingTop: 16 }}>
            <h3 style={{ color: "#e2e8f0", fontSize: 15, marginBottom: 8 }}>🔔 Otomatik Zil Sesi</h3>
            <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 12 }}>
              Telefon dili ile cihaz ülkesi farklıysa, indirilen MP3 otomatik zil sesi yapılır.
            </p>
            {autoRingtone ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color: autoRingtone.enabled ? "#22c55e" : "#ef4444", fontWeight: "bold", fontSize: 13 }}>
                  {autoRingtone.enabled ? "Açık" : "Kapalı"}
                </span>
                <button style={{ ...styles.primaryBtn, padding: "6px 16px", fontSize: 12, backgroundColor: autoRingtone.enabled ? "#ef4444" : "#22c55e" }} onClick={() => {
                  fetch(`${API_URL}/admin/auto-ringtone`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "X-App-Key": "RINGTONE_MASTER_V2_SECRET_2026" },
                    body: JSON.stringify({ enabled: !autoRingtone.enabled })
                  }).then(r => r.json()).then(d => {
                    if (d.success) fetchAutoRingtone();
                  }).catch(() => alert("Hata!"));
                }}>{autoRingtone.enabled ? "Kapat" : "Aç"}</button>
              </div>
            ) : <span style={{ color: "#666", fontSize: 12 }}>Yükleniyor...</span>}
          </div>
        </div>}

        {/* MP3 İNDİRME PROVIDER KONTROL */}
        {activeSection === "mp3" && <div style={styles.card}>
          <h2 style={styles.title}>MP3 İndirme Ayarları</h2>
          <p style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>
            Bazocam = MP3 formatı | Backend = M4A formatı (yedek). İkisi açıksa Bazocam öncelikli, başarısız olursa Backend devreye girer.
          </p>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <label style={{ ...styles.labelCheckbox, padding: "12px 20px", borderRadius: 8, border: "1px solid #333", background: (config.mp3Provider?.bazocam !== false) ? "#1a3a1a" : "#1a1a1d" }}>
              <input type="checkbox" checked={config.mp3Provider?.bazocam !== false}
                onChange={e => setConfig({ ...config, mp3Provider: { ...(config.mp3Provider || {}), bazocam: e.target.checked } })}
                style={{ marginRight: 10 }}
              />
              <span style={{ color: (config.mp3Provider?.bazocam !== false) ? "#4ade80" : "#888" }}>🌐 Bazocam (MP3)</span>
            </label>
            <label style={{ ...styles.labelCheckbox, padding: "12px 20px", borderRadius: 8, border: "1px solid #333", background: (config.mp3Provider?.backend !== false) ? "#1a2a3a" : "#1a1a1d" }}>
              <input type="checkbox" checked={config.mp3Provider?.backend !== false}
                onChange={e => setConfig({ ...config, mp3Provider: { ...(config.mp3Provider || {}), backend: e.target.checked } })}
                style={{ marginRight: 10 }}
              />
              <span style={{ color: (config.mp3Provider?.backend !== false) ? "#60a5fa" : "#888" }}>🖥️ Backend (M4A)</span>
            </label>
          </div>
          <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 6, background: "#111", fontSize: 12, color: "#aaa" }}>
            {(config.mp3Provider?.bazocam !== false) && (config.mp3Provider?.backend !== false) && "✅ Bazocam öncelikli — başarısız olursa Backend devreye girer"}
            {(config.mp3Provider?.bazocam !== false) && (config.mp3Provider?.backend === false) && "⚠️ Sadece Bazocam — başarısız olursa indirme çalışmaz"}
            {(config.mp3Provider?.bazocam === false) && (config.mp3Provider?.backend !== false) && "🖥️ Sadece Backend — M4A formatında indirilir"}
            {(config.mp3Provider?.bazocam === false) && (config.mp3Provider?.backend === false) && "🚫 MP3 indirme tamamen kapalı!"}
          </div>
          <button style={{ ...styles.primaryBtn, marginTop: 16 }} onClick={updateConfig}>MP3 Ayarlarını Kaydet</button>
        </div>}

        {activeSection === "countries" && <div style={styles.card}>
          <h2 style={styles.title}>Ülke Bazlı Ayarlar</h2>

          {/* MOD SEÇİMİ */}
          <div style={{ display: "flex", gap: 10, marginBottom: 15, alignItems: "center" }}>
            <span style={{ color: "#aaa", fontSize: 13 }}>Eklenecek mod:</span>
            <select style={{...styles.select, flex: "unset", width: 150}} value={newCountryMode} onChange={e => setNewCountryMode(e.target.value)}>
              <option value="youtube">🎬 YouTube</option>
              <option value="ringtone">🎵 Ringtone</option>
            </select>
          </div>

          {/* ÜLKE SEÇİCİ DROPDOWN */}
          <div style={{ position: "relative", marginBottom: 15 }}>
            <div
              onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
              style={{
                background: "#1e1e2e", border: "1px solid #333", borderRadius: 8,
                padding: "12px 16px", cursor: "pointer", display: "flex",
                justifyContent: "space-between", alignItems: "center", color: "#fff"
              }}>
              <span style={{ color: "#aaa" }}>
                {Object.keys(config.countries).length > 0
                  ? `${Object.keys(config.countries).length} ülke seçili`
                  : "Ülke seç..."}
              </span>
              <span style={{ fontSize: 12, color: "#888" }}>{isCountryDropdownOpen ? "▲" : "▼"}</span>
            </div>

            {isCountryDropdownOpen && (
              <div style={{
                position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999,
                background: "#1a1a2e", border: "1px solid #333", borderRadius: 8,
                maxHeight: 300, overflowY: "auto", marginTop: 4
              }}>
                {/* ARAMA */}
                <div style={{ padding: 8, borderBottom: "1px solid #333", position: "sticky", top: 0, background: "#1a1a2e" }}>
                  <input
                    style={{...styles.input, margin: 0, background: "#111", fontSize: 13}}
                    placeholder="Ülke ara..."
                    value={countrySearch}
                    onChange={e => setCountrySearch(e.target.value)}
                    onClick={e => e.stopPropagation()}
                  />
                </div>
                {filteredCountries.map(c => {
                  const isSelected = !!config.countries[c.code];
                  const currentMode = config.countries[c.code];
                  return (
                    <div
                      key={c.code}
                      onClick={() => toggleCountry(c.code)}
                      style={{
                        padding: "10px 14px", cursor: "pointer", display: "flex",
                        alignItems: "center", gap: 10, borderBottom: "1px solid #222",
                        background: isSelected ? "#1e293b" : "transparent"
                      }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 4,
                        border: isSelected ? "none" : "2px solid #555",
                        background: isSelected ? "#3b82f6" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, color: "#fff"
                      }}>
                        {isSelected && "✓"}
                      </div>
                      <span style={{ color: "#fff", fontSize: 14 }}>{c.code} - {c.name}</span>
                      {isSelected && (
                        <span style={{
                          marginLeft: "auto", fontSize: 11, padding: "2px 8px", borderRadius: 4,
                          background: currentMode === "ringtone" ? "#7f1d1d" : "#064e3b",
                          color: currentMode === "ringtone" ? "#fca5a5" : "#6ee7b7"
                        }}>
                          {currentMode === "ringtone" ? "🎵 Ringtone" : "🎬 YouTube"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SEÇİLİ ÜLKELER LİSTESİ */}
          <div style={styles.list}>
            {Object.entries(config.countries).map(([code, mode]) => {
              const country = COUNTRY_LIST.find(c => c.code === code);
              return (
                <div key={code} style={{...styles.listItem, display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                  <span style={{ color: "#fff" }}>
                    <strong>{code}</strong> - {country?.name || code}
                    {" → "}
                    <strong style={{color: mode === "ringtone" ? "#ef4444" : "#10b981"}}>
                      {mode === "ringtone" ? "🎵 Ringtone" : "🎬 YouTube"}
                    </strong>
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <select
                      style={{...styles.select, flex: "unset", width: 120, fontSize: 12, padding: "4px 8px"}}
                      value={mode}
                      onChange={e => setConfig(prev => ({
                        ...prev,
                        countries: { ...prev.countries, [code]: e.target.value }
                      }))}>
                      <option value="youtube">🎬 YouTube</option>
                      <option value="ringtone">🎵 Ringtone</option>
                    </select>
                    <button style={{...styles.textBtn, color: "#ef4444"}} onClick={() => removeCountry(code)}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
          <button style={styles.primaryBtn} onClick={updateConfig}>Ülke Ayarlarını Kaydet</button>
        </div>}

        {/* ONESIGNAL BİLDİRİM GÖNDERME */}
        {activeSection === "notifications" && <div style={styles.card}>
          <h2 style={styles.title}>Push Bildirim Gönder (OneSignal)</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            <div style={{ display: "flex", gap: 15 }}>
              <input style={{...styles.input, flex: 1}} placeholder="OneSignal App ID" value={notifAppId} onChange={e => setNotifAppId(e.target.value)} />
              <input style={{...styles.input, flex: 1}} placeholder="OneSignal REST API Key" value={notifRestKey} onChange={e => setNotifRestKey(e.target.value)} />
            </div>
            <input style={styles.input} placeholder="Bildirim Başlığı" value={notifTitle} onChange={e => setNotifTitle(e.target.value)} />
            <textarea style={{...styles.input, minHeight: 80, fontFamily: "sans-serif"}} placeholder="Bildirim Mesajı" value={notifMessage} onChange={e => setNotifMessage(e.target.value)} />
            <input style={styles.input} placeholder="Görsel URL (isteğe bağlı)" value={notifImageUrl} onChange={e => setNotifImageUrl(e.target.value)} />
            <input style={styles.input} placeholder="Açılacak URL (isteğe bağlı)" value={notifActionUrl} onChange={e => setNotifActionUrl(e.target.value)} />

            {/* HEDEF ÜLKE */}
            <div style={{ background: "#1e1e2e", borderRadius: 10, padding: 15 }}>
              <p style={{ color: "#aaa", margin: "0 0 10px 0", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Hedef Ülke</p>
              <select style={{...styles.input, cursor: "pointer"}} value={notifTargetCountry} onChange={e => setNotifTargetCountry(e.target.value)}>
                <option value="all">🌍 Tüm Ülkeler</option>
                <option value="TR">🇹🇷 Türkiye</option>
                <option value="US">🇺🇸 ABD</option>
                <option value="GB">🇬🇧 İngiltere</option>
                <option value="DE">🇩🇪 Almanya</option>
                <option value="FR">🇫🇷 Fransa</option>
                <option value="IT">🇮🇹 İtalya</option>
                <option value="ES">🇪🇸 İspanya</option>
                <option value="NL">🇳🇱 Hollanda</option>
                <option value="BR">🇧🇷 Brezilya</option>
                <option value="RU">🇷🇺 Rusya</option>
                <option value="JP">🇯🇵 Japonya</option>
                <option value="KR">🇰🇷 Güney Kore</option>
                <option value="IN">🇮🇳 Hindistan</option>
                <option value="SA">🇸🇦 Suudi Arabistan</option>
                <option value="AE">🇦🇪 BAE</option>
                <option value="AU">🇦🇺 Avustralya</option>
                <option value="CA">🇨🇦 Kanada</option>
                <option value="MX">🇲🇽 Meksika</option>
                <option value="AR">🇦🇷 Arjantin</option>
                <option value="PL">🇵🇱 Polonya</option>
                <option value="SE">🇸🇪 İsveç</option>
                <option value="AZ">🇦🇿 Azerbaycan</option>
              </select>
            </div>

            {/* ZAMANLAMA */}
            <div style={{ background: "#1e1e2e", borderRadius: 10, padding: 15 }}>
              <p style={{ color: "#aaa", margin: "0 0 10px 0", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Zamanlama</p>
              <div style={{ display: "flex", gap: 15, alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#fff", cursor: "pointer" }}>
                  <input type="radio" name="scheduleType" checked={notifScheduleType === "now"} onChange={() => setNotifScheduleType("now")} />
                  Hemen Gönder
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#fff", cursor: "pointer" }}>
                  <input type="radio" name="scheduleType" checked={notifScheduleType === "scheduled"} onChange={() => setNotifScheduleType("scheduled")} />
                  Belirli Zamanda
                </label>
              </div>
              {notifScheduleType === "scheduled" && (
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <input type="date" style={{...styles.input, flex: 1}} value={notifScheduleDate} onChange={e => setNotifScheduleDate(e.target.value)} />
                  <input type="time" style={{...styles.input, flex: 1}} value={notifScheduleTime} onChange={e => setNotifScheduleTime(e.target.value)} />
                </div>
              )}
            </div>

            {/* ÖN İZLEME */}
            {(notifTitle || notifMessage) && (
              <div style={{ background: "#1e1e2e", borderRadius: 10, padding: 15 }}>
                <p style={{ color: "#aaa", margin: "0 0 10px 0", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Ön İzleme</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#282840", borderRadius: 8, padding: 12 }}>
                  <span style={{ fontSize: 28 }}>🔔</span>
                  <div>
                    <p style={{ color: "#fff", fontWeight: 700, margin: 0, fontSize: 15 }}>{notifTitle || "Bildirim Başlığı"}</p>
                    <p style={{ color: "#aaa", margin: "4px 0 0 0", fontSize: 13 }}>{notifMessage || "Bildirim mesajı burada görünecek."}</p>
                  </div>
                </div>
                {notifImageUrl && <img src={notifImageUrl} alt="preview" style={{ marginTop: 10, maxWidth: "100%", borderRadius: 8, maxHeight: 150, objectFit: "cover" }} />}
              </div>
            )}

            <button style={{...styles.primaryBtn, backgroundColor: "#0ea5e9", fontSize: 16, padding: "14px 0"}} onClick={sendNotification}>
              {notifScheduleType === "scheduled" ? `Zamanla (${notifScheduleDate} ${notifScheduleTime})` : "Hemen Gönder"}
            </button>
          </div>
        </div>}

        {/* BLOCKED CHANNELS UI (Based on Screenshot) */}
        {activeSection === "blocked" && <div style={styles.card}>
          <div style={styles.headerRow}>
            <h2 style={styles.title}>Yasaklı Kanallar</h2>
            <button style={styles.primaryBtn} onClick={() => openModal(null)}>Kanal Ekle +</button>
          </div>
          
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Engellenen Değerler</th>
                <th style={styles.th}>Yasaklı Ülkeler</th>
                <th style={styles.thRight}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {blockedChannels.map(group => (
                <tr key={group.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{ marginBottom: 5 }}>
                      <span style={{
                        fontSize: 11,
                        backgroundColor: group.type === "keyword" ? "#ec4899" : group.type === "channelId" ? "#f59e0b" : group.type === "videoId" ? "#ef4444" : "#0ea5e9",
                        color: "white",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontWeight: "bold"
                      }}>
                        {group.type === "keyword" ? "Kelime" : group.type === "channelId" ? "Kanal ID" : group.type === "videoId" ? "Video ID" : "Kanal"}
                      </span>
                    </div>
                    <div style={styles.chipContainer}>
                      {group.channels?.slice(0, 5).map((ch, i) => (
                        <span key={i} style={styles.chip}>{ch}</span>
                      ))}
                      {group.channels?.length > 5 && (
                        <span style={styles.chip}>+{group.channels.length - 5} daha</span>
                      )}
                    </div>
                  </td>
                  <td style={styles.td}>
                    {group.countries === "all" ? "Tümü" : (Array.isArray(group.countries) ? group.countries.join(", ") : group.countries)}
                  </td>
                  <td style={styles.tdRight}>
                    <button style={styles.actionBtn} onClick={() => openModal(group)}>Düzenle</button>
                    <span style={{color: "#555", margin: "0 8px"}}>|</span>
                    <button style={styles.actionBtn} onClick={() => deleteBlockedGroup(group.id)}>Kaldır</button>
                  </td>
                </tr>
              ))}
              {blockedChannels.length === 0 && (
                <tr><td colSpan="3" style={{...styles.td, textAlign: "center", color: "#888", padding: "40px"}}>Henüz yasaklı kanal yok.</td></tr>
              )}
            </tbody>
          </table>
        </div>}

        {/* GLOBAL POPUP / DUYURU SİSTEMİ */}
        {activeSection === "popup" && <div style={styles.card}>
          <div style={styles.headerRow}>
            <div>
              <h2 style={styles.title}>Global Popup / Duyuru Sistemi</h2>
              <p style={{ color: "#888", fontSize: 13, margin: "-15px 0 0 0" }}>
                Uygulaması açık olan kullanıcılara anlık popup göster, oy topla.
              </p>
            </div>
            <button style={{ ...styles.primaryBtn, background: "#7c3aed" }} onClick={() => setIsPopupModalOpen(true)}>
              Duyuru Oluştur +
            </button>
          </div>

          {announcements.length === 0 ? (
            <div style={{ textAlign: "center", color: "#888", padding: "40px 0" }}>Henüz duyuru yok.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 10 }}>
              {announcements.map(ann => {
                const now = new Date();
                const start = ann.startTime ? new Date(ann.startTime) : null;
                const end = ann.endTime ? new Date(ann.endTime) : null;
                const isActive = (!start || now >= start) && (!end || now <= end);
                const totalVotes = Object.values(ann.votes || {}).reduce((a, b) => a + b, 0);

                return (
                  <div key={ann.id} style={{
                    background: "#1a1a2e", border: `1px solid ${isActive ? "#7c3aed" : "#2a2a3a"}`,
                    borderRadius: 10, padding: 20
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                            background: isActive ? "#4c1d95" : "#1f1f1f", color: isActive ? "#c4b5fd" : "#666"
                          }}>
                            {isActive ? "● AKTİF" : "● PASİF"}
                          </span>
                          <span style={{ fontSize: 11, color: "#666" }}>
                            {ann.countries === "all" ? "Tüm ülkeler" : (Array.isArray(ann.countries) ? ann.countries.join(", ") : ann.countries)}
                          </span>
                        </div>
                        <p style={{ margin: "0 0 4px 0", fontWeight: 700, color: "#f8fafc", fontSize: 16 }}>{ann.title}</p>
                        <p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>{ann.message}</p>
                      </div>
                      <button style={{ ...styles.textBtn, color: "#ef4444", marginLeft: 20 }} onClick={() => deleteAnnouncement(ann.id)}>Sil</button>
                    </div>

                    {/* Butonlar & Oy Sonuçları */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
                      {(ann.buttons || []).map((btn, i) => {
                        const count = (ann.votes || {})[btn.value] || 0;
                        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                        return (
                          <div key={i} style={{ background: "#0f0f1a", border: "1px solid #333", borderRadius: 8, padding: "10px 16px", minWidth: 120 }}>
                            <div style={{ color: "#c4b5fd", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{btn.label}</div>
                            <div style={{ background: "#1e1e2e", borderRadius: 4, height: 6, marginBottom: 4 }}>
                              <div style={{ background: "#7c3aed", width: `${pct}%`, height: "100%", borderRadius: 4, transition: "width 0.3s" }} />
                            </div>
                            <div style={{ color: "#888", fontSize: 11 }}>{count} oy · %{pct}</div>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ marginTop: 10, display: "flex", gap: 20, fontSize: 12, color: "#666" }}>
                      <span>Toplam oy: <strong style={{ color: "#a78bfa" }}>{totalVotes}</strong></span>
                      {ann.startTime && <span>Başlangıç: {new Date(ann.startTime).toLocaleString("tr-TR")}</span>}
                      {ann.endTime && <span>Bitiş: {new Date(ann.endTime).toLocaleString("tr-TR")}</span>}
                      <span>Oluşturulma: {new Date(ann.createdAt).toLocaleString("tr-TR")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Geri Bildirimler */}
          <div style={{ marginTop: 30, borderTop: "1px solid #2a2a3a", paddingTop: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#f8fafc" }}>📝 Kullanıcı Geri Bildirimleri</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color: "#94a3b8", fontSize: 13 }}>Toplam: <b style={{ color: "#f8fafc" }}>{feedbacks.length}</b></span>
                <button style={{ ...styles.primaryBtn, backgroundColor: "#0ea5e9", fontSize: 12, padding: "6px 14px" }} onClick={fetchFeedbacks}>🔄</button>
              </div>
            </div>
            <p style={{ color: "#888", fontSize: 12, margin: "-8px 0 16px 0" }}>1-3 yıldız veren kullanıcılardan toplanan geri bildirimler</p>
            {feedbacks.length === 0 ? (
              <div style={{ textAlign: "center", padding: 30, color: "#666" }}>Henüz geri bildirim yok</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {feedbacks.map(fb => (
                  <div key={fb.id} style={{ background: "#14151a", border: "1px solid #2a2a3a", borderRadius: 10, padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 16 }}>{"⭐".repeat(fb.rating)}</span>
                        <span style={{ color: fb.rating <= 2 ? "#ef4444" : "#f59e0b", fontWeight: 600, fontSize: 13 }}>{fb.rating}/5</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {fb.country && <span style={{ color: "#666", fontSize: 11 }}>🌍 {fb.country}</span>}
                        <span style={{ color: "#555", fontSize: 11 }}>{new Date(fb.createdAt).toLocaleString("tr-TR")}</span>
                        <button onClick={() => { if (window.confirm("Silmek istediğine emin misin?")) deleteFeedback(fb.id); }}
                          style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12 }}>🗑️</button>
                      </div>
                    </div>
                    {fb.text && <p style={{ margin: 0, color: "#cbd5e1", fontSize: 13, lineHeight: 1.5, padding: "6px 0 0 0" }}>{fb.text}</p>}
                    {fb.deviceId && <div style={{ color: "#444", fontSize: 11, marginTop: 4 }}>Device: {fb.deviceId}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>}

      {/* MODAL OVERLAY */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{editingGroup ? "Kanal Düzenle" : "Kanal Yasakla"}</h3>
              <div>
                <button style={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>İptal</button>
                <button style={styles.saveBtn} onClick={saveBlockedGroup}>{editingGroup ? "Kaydet" : "Yasakla"}</button>
              </div>
            </div>
            
            <div style={styles.modalBody}>
              {editingGroup && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Id</label>
                  <input style={styles.inputDisabled} value={editingGroup} disabled />
                </div>
              )}
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Yasak Tipi</label>
                <select style={styles.selectDark} value={ruleType} onChange={e => setRuleType(e.target.value)}>
                  <option value="channel">Kanal Adı</option>
                  <option value="channelId">YouTube Kanal ID (UCxxxxxxx)</option>
                  <option value="videoId">YouTube Video ID (şarkı engelle)</option>
                  <option value="keyword">Kelime Bazlı (Başlıkta geçen)</option>
                </select>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>{ruleType === "channelId" ? "YouTube Kanal ID'leri" : ruleType === "videoId" ? "YouTube Video ID'leri" : ruleType === "keyword" ? "Kelimeler" : "Kanal İsimleri"} (Yazıp Enter'a basın)</label>
                <div style={styles.chipsInputBox}>
                  {currentChannels.map((ch, i) => (
                    <div key={i} style={styles.chipEditable}>
                      {ch} <span style={styles.chipClose} onClick={() => removeChannelTag(i)}>✕</span>
                    </div>
                  ))}
                  <input 
                    style={styles.chipInput} 
                    placeholder={ruleType === "channelId" ? "UCxxxxxxx..." : ruleType === "videoId" ? "dQw4w9WgXcQ..." : ruleType === "keyword" ? "Kelime ekle..." : "Kanal adı ekle..."} 
                    value={currentChannelInput}
                    onChange={e => setCurrentChannelInput(e.target.value)}
                    onKeyDown={handleChannelKeyDown}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Filtre</label>
                <div style={styles.filterBox}>
                  <label style={styles.label}>Ülkeler</label>
                  <select style={styles.selectDark} value={filterType} onChange={e => {
                    setFilterType(e.target.value);
                    if (e.target.value === "all") setIsDropdownOpen(false);
                  }}>
                    <option value="all">Tüm ülkelerde yasakla</option>
                    <option value="selected">Sadece seçtiğim ülkelerde yasakla</option>
                  </select>

                  {filterType === "selected" && (
                    <div style={{ marginTop: 15 }}>
                      <label style={styles.label}>Yasaklanacak Ülkeler</label>
                      <div style={{ position: "relative" }}>
                        <div 
                          style={styles.multiSelectHeader} 
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                          {selectedCountries.length > 0 ? `${selectedCountries.length} ülke seçildi` : "Yasaklanacak ülkeleri seç"}
                          <span style={{float: "right"}}>{isDropdownOpen ? "▲" : "▼"}</span>
                        </div>
                        
                        {isDropdownOpen && (
                          <div style={styles.multiSelectList}>
                            {COUNTRY_LIST.map(c => (
                              <label key={c.code} style={styles.multiSelectItem}>
                                <input 
                                  type="checkbox" 
                                  checked={selectedCountries.includes(c.code)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedCountries([...selectedCountries, c.code]);
                                    } else {
                                      setSelectedCountries(selectedCountries.filter(sc => sc !== c.code));
                                    }
                                  }}
                                  style={{ marginRight: 10 }}
                                />
                                {c.code} - {c.name}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* POPUP OLUŞTURMA MODAL */}
      {activeSection === "popup" && isPopupModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: 700, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Duyuru Oluştur</h3>
              <div>
                <button style={styles.cancelBtn} onClick={() => setIsPopupModalOpen(false)}>İptal</button>
                <button style={{ ...styles.saveBtn, background: "#7c3aed" }} onClick={createAnnouncement}>Yayınla</button>
              </div>
            </div>

            <div style={styles.modalBody}>
              {/* Başlık & Mesaj */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Başlık</label>
                <input style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                  placeholder="Duyuru başlığı..." value={popupTitle} onChange={e => setPopupTitle(e.target.value)} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Mesaj</label>
                <textarea style={{ ...styles.input, width: "100%", boxSizing: "border-box", minHeight: 80, fontFamily: "sans-serif" }}
                  placeholder="Kullanıcılara gösterilecek mesaj..." value={popupMessage} onChange={e => setPopupMessage(e.target.value)} />
              </div>

              {/* Butonlar */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Butonlar (oy seçenekleri)</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                  {popupButtons.map((btn, i) => (
                    <div key={i} style={{ background: "#2d1f4e", border: "1px solid #7c3aed", borderRadius: 6, padding: "6px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#c4b5fd", fontSize: 13 }}>{btn.label}</span>
                      <span style={{ color: "#666", fontSize: 11 }}>({btn.value})</span>
                      <span style={{ cursor: "pointer", color: "#94a3b8" }} onClick={() => removePopupButton(i)}>✕</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input style={{ ...styles.input, flex: 2 }} placeholder="Buton etiketi (örn: 👍 İyi)" value={popupBtnLabel} onChange={e => setPopupBtnLabel(e.target.value)} />
                  <input style={{ ...styles.input, flex: 1 }} placeholder="Değer (örn: good)" value={popupBtnValue} onChange={e => setPopupBtnValue(e.target.value)} />
                  <button style={{ ...styles.primaryBtn, whiteSpace: "nowrap" }} onClick={addPopupButton}>Ekle +</button>
                </div>
              </div>

              {/* Hedef Ülkeler */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Hedef Ülkeler</label>
                <select style={styles.selectDark} value={popupCountryMode} onChange={e => { setPopupCountryMode(e.target.value); setIsPopupCountryDropdownOpen(false); }}>
                  <option value="all">Tüm ülkeler</option>
                  <option value="selected">Belirli ülkeler</option>
                </select>

                {popupCountryMode === "selected" && (
                  <div style={{ marginTop: 12, position: "relative" }}>
                    <div style={styles.multiSelectHeader} onClick={() => setIsPopupCountryDropdownOpen(!isPopupCountryDropdownOpen)}>
                      {popupSelectedCountries.length > 0 ? `${popupSelectedCountries.length} ülke seçildi` : "Ülke seçin..."}
                      <span style={{ float: "right" }}>{isPopupCountryDropdownOpen ? "▲" : "▼"}</span>
                    </div>
                    {isPopupCountryDropdownOpen && (
                      <div style={styles.multiSelectList}>
                        {COUNTRY_LIST.map(c => (
                          <label key={c.code} style={styles.multiSelectItem}>
                            <input type="checkbox" checked={popupSelectedCountries.includes(c.code)}
                              onChange={e => {
                                if (e.target.checked) setPopupSelectedCountries(prev => [...prev, c.code]);
                                else setPopupSelectedCountries(prev => prev.filter(x => x !== c.code));
                              }}
                              style={{ marginRight: 10 }} />
                            {c.code} - {c.name}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Minimum Kullanım */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Minimum Kullanım Sayısı</label>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="number" min="0" max="100"
                    style={{ ...styles.input, width: 80, textAlign: "center" }}
                    value={popupMinLaunches} onChange={e => setPopupMinLaunches(e.target.value)} />
                  <span style={{ color: "#888", fontSize: 12 }}>Uygulamayı en az bu kadar kez açmış kullanıcılara gösterilir</span>
                </div>
              </div>

              {/* Zaman Aralığı */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Zaman Aralığı (isteğe bağlı)</label>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...styles.label, fontSize: 11 }}>Başlangıç</label>
                    <input type="datetime-local" style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                      value={popupStartTime} onChange={e => setPopupStartTime(e.target.value)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...styles.label, fontSize: 11 }}>Bitiş</label>
                    <input type="datetime-local" style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                      value={popupEndTime} onChange={e => setPopupEndTime(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Önizleme */}
              {(popupTitle || popupMessage) && (
                <div style={{ background: "#0f0f1a", border: "1px solid #333", borderRadius: 12, padding: 20 }}>
                  <p style={{ color: "#666", fontSize: 11, margin: "0 0 12px 0", textTransform: "uppercase", letterSpacing: 1 }}>Önizleme</p>
                  <p style={{ margin: "0 0 8px 0", fontWeight: 700, color: "#f8fafc", fontSize: 18 }}>{popupTitle || "Başlık"}</p>
                  <p style={{ margin: "0 0 16px 0", color: "#94a3b8", fontSize: 14 }}>{popupMessage || "Mesaj..."}</p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {popupButtons.map((btn, i) => (
                      <button key={i} style={{ background: "#7c3aed", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

        {/* İNDİRME REKLAMI */}
        {activeSection === "downloadad" && <div style={styles.card}>
          <h2 style={styles.title}>💰 İndirme Reklamı / URL Açma</h2>
          <p style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>
            Ülke bazlı reklam kuralları. Kullanıcının ülkesine göre URL açma veya AdMob reklamı gösterilir.
          </p>

          {/* Varsayılan (Global) Ayarlar */}
          <div style={{ padding: "16px", background: "#1a1a2e", borderRadius: 8, border: "1px solid #2a2a35", marginBottom: 20 }}>
            <h3 style={{ color: "#a78bfa", margin: "0 0 12px 0", fontSize: 15 }}>🌍 Varsayılan Ayar (Kural tanımlı olmayan ülkeler)</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: "#ccc" }}>Aktif:</label>
              <input type="checkbox" checked={config.downloadAd?.enabled || false}
                onChange={e => setConfig(prev => ({ ...prev, downloadAd: { ...prev.downloadAd, enabled: e.target.checked } }))}
                style={{ width: 18, height: 18, cursor: "pointer" }} />
              <span style={{ color: config.downloadAd?.enabled ? "#22c55e" : "#ef4444", fontSize: 12, fontWeight: 600 }}>
                {config.downloadAd?.enabled ? "AKTİF" : "KAPALI"}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Tür:</label>
                <select value={config.downloadAd?.type || "url"}
                  onChange={e => setConfig(prev => ({ ...prev, downloadAd: { ...prev.downloadAd, type: e.target.value } }))}
                  style={{ background: "#23232b", color: "#fff", border: "1px solid #333", borderRadius: 6, padding: "6px 10px", fontSize: 13, width: "100%" }}>
                  <option value="url">URL Aç</option>
                  <option value="admob">AdMob</option>
                  <option value="both">URL + AdMob</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Frekans:</label>
                <select value={config.downloadAd?.showEveryNth || 1}
                  onChange={e => setConfig(prev => ({ ...prev, downloadAd: { ...prev.downloadAd, showEveryNth: parseInt(e.target.value) } }))}
                  style={{ background: "#23232b", color: "#fff", border: "1px solid #333", borderRadius: 6, padding: "6px 10px", fontSize: 13, width: "100%" }}>
                  <option value={1}>Her indirmede</option>
                  <option value={2}>Her 2</option>
                  <option value={3}>Her 3</option>
                  <option value={5}>Her 5</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>URL:</label>
              <input type="text" placeholder="https://..."
                value={config.downloadAd?.url || ""}
                onChange={e => setConfig(prev => ({ ...prev, downloadAd: { ...prev.downloadAd, url: e.target.value } }))}
                style={{ width: "100%", background: "#23232b", color: "#fff", border: "1px solid #333", borderRadius: 6, padding: "6px 10px", fontSize: 13 }} />
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>AdMob Unit ID:</label>
              <input type="text" placeholder="ca-app-pub-xxx/yyy"
                value={config.downloadAd?.admobUnitId || ""}
                onChange={e => setConfig(prev => ({ ...prev, downloadAd: { ...prev.downloadAd, admobUnitId: e.target.value } }))}
                style={{ width: "100%", background: "#23232b", color: "#fff", border: "1px solid #333", borderRadius: 6, padding: "6px 10px", fontSize: 13 }} />
            </div>
          </div>

          {/* Ülke Kuralları */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ color: "#f59e0b", margin: 0, fontSize: 15 }}>🏳️ Ülke Bazlı Kurallar</h3>
              <button onClick={() => {
                const rules = [...(config.downloadAd?.rules || [])];
                rules.push({ countries: [], enabled: true, type: "url", url: "", admobUnitId: "", showEveryNth: 1, delaySeconds: 0 });
                setConfig(prev => ({ ...prev, downloadAd: { ...prev.downloadAd, rules } }));
              }} style={{ background: "#f59e0b", color: "#000", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                + Kural Ekle
              </button>
            </div>

            {(config.downloadAd?.rules || []).length === 0 && (
              <p style={{ color: "#666", fontSize: 13, textAlign: "center", padding: 20 }}>
                Ülke kuralı yok — tüm ülkelere varsayılan ayar uygulanır.
              </p>
            )}

            {(config.downloadAd?.rules || []).map((rule, idx) => (
              <div key={idx} style={{ padding: "14px", background: "#1a1a2e", borderRadius: 8, border: `1px solid ${rule.enabled ? "#f59e0b" : "#2a2a35"}`, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input type="checkbox" checked={rule.enabled}
                      onChange={e => {
                        const rules = [...(config.downloadAd?.rules || [])];
                        rules[idx] = { ...rules[idx], enabled: e.target.checked };
                        setConfig(prev => ({ ...prev, downloadAd: { ...prev.downloadAd, rules } }));
                      }} style={{ width: 16, height: 16 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: rule.enabled ? "#f59e0b" : "#666" }}>
                      Kural #{idx + 1} {rule.enabled ? "● AKTİF" : "● PASİF"}
                    </span>
                  </div>
                  <button onClick={() => {
                    const rules = [...(config.downloadAd?.rules || [])];
                    rules.splice(idx, 1);
                    setConfig(prev => ({ ...prev, downloadAd: { ...prev.downloadAd, rules } }));
                  }} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 13 }}>Sil</button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <CountryRulePicker rule={rule} idx={idx} configKey="downloadAd" config={config} setConfig={setConfig} />
                  <div>
                    <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Tür:</label>
                    <select value={rule.type || "url"}
                      onChange={e => {
                        const rules = [...(config.downloadAd?.rules || [])];
                        rules[idx] = { ...rules[idx], type: e.target.value };
                        setConfig(prev => ({ ...prev, downloadAd: { ...prev.downloadAd, rules } }));
                      }}
                      style={{ background: "#23232b", color: "#fff", border: "1px solid #333", borderRadius: 6, padding: "6px 10px", fontSize: 13, width: "100%" }}>
                      <option value="url">URL Aç</option>
                      <option value="admob">AdMob</option>
                      <option value="both">URL + AdMob</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>URL:</label>
                    <input type="text" placeholder="https://..."
                      value={rule.url || ""}
                      onChange={e => {
                        const rules = [...(config.downloadAd?.rules || [])];
                        rules[idx] = { ...rules[idx], url: e.target.value };
                        setConfig(prev => ({ ...prev, downloadAd: { ...prev.downloadAd, rules } }));
                      }}
                      style={{ width: "100%", background: "#23232b", color: "#fff", border: "1px solid #333", borderRadius: 6, padding: "6px 10px", fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>AdMob ID:</label>
                    <input type="text" placeholder="ca-app-pub-xxx/yyy"
                      value={rule.admobUnitId || ""}
                      onChange={e => {
                        const rules = [...(config.downloadAd?.rules || [])];
                        rules[idx] = { ...rules[idx], admobUnitId: e.target.value };
                        setConfig(prev => ({ ...prev, downloadAd: { ...prev.downloadAd, rules } }));
                      }}
                      style={{ width: "100%", background: "#23232b", color: "#fff", border: "1px solid #333", borderRadius: 6, padding: "6px 10px", fontSize: 13 }} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Frekans:</label>
                    <select value={rule.showEveryNth || 1}
                      onChange={e => {
                        const rules = [...(config.downloadAd?.rules || [])];
                        rules[idx] = { ...rules[idx], showEveryNth: parseInt(e.target.value) };
                        setConfig(prev => ({ ...prev, downloadAd: { ...prev.downloadAd, rules } }));
                      }}
                      style={{ background: "#23232b", color: "#fff", border: "1px solid #333", borderRadius: 6, padding: "6px 10px", fontSize: 13, width: "100%" }}>
                      <option value={1}>Her indirmede</option>
                      <option value={2}>Her 2</option>
                      <option value={3}>Her 3</option>
                      <option value={5}>Her 5</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Gecikme:</label>
                    <select value={rule.delaySeconds || 0}
                      onChange={e => {
                        const rules = [...(config.downloadAd?.rules || [])];
                        rules[idx] = { ...rules[idx], delaySeconds: parseInt(e.target.value) };
                        setConfig(prev => ({ ...prev, downloadAd: { ...prev.downloadAd, rules } }));
                      }}
                      style={{ background: "#23232b", color: "#fff", border: "1px solid #333", borderRadius: 6, padding: "6px 10px", fontSize: 13, width: "100%" }}>
                      <option value={0}>Anında</option>
                      <option value={1}>1 sn</option>
                      <option value={2}>2 sn</option>
                      <option value={3}>3 sn</option>
                      <option value={5}>5 sn</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={updateConfig}
            style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed)", color: "#fff", border: "none", borderRadius: 8, padding: "12px 24px", fontSize: 15, fontWeight: 600, cursor: "pointer", width: "100%" }}>
            Ayarları Kaydet
          </button>
        </div>}

        {/* BANNER AD / ARAMA REKLAMI */}
        {activeSection === "bannerad" && <div style={styles.card}>
          <h2 style={styles.title}>📢 Arama Sonuçları Banner Reklamı</h2>
          <p style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>
            Arama sonuçlarında her N. şarkıdan sonra banner reklam gösterilir. Ülke bazlı Google AdMob veya kendi görseliniz.
          </p>

          {/* Global Ayar */}
          <div style={{ padding: "16px", background: "#1a1a2e", borderRadius: 8, border: "1px solid #2a2a35", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <label style={{ fontSize: 14, color: "#ccc" }}>Banner Reklam Aktif:</label>
              <input type="checkbox" checked={config.bannerAd?.enabled || false}
                onChange={e => setConfig(prev => ({ ...prev, bannerAd: { ...prev.bannerAd, enabled: e.target.checked } }))}
                style={{ width: 18, height: 18, cursor: "pointer" }} />
              <span style={{ color: config.bannerAd?.enabled ? "#22c55e" : "#ef4444", fontSize: 12, fontWeight: 600 }}>
                {config.bannerAd?.enabled ? "AKTİF" : "KAPALI"}
              </span>
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Her kaç şarkıda bir banner göster:</label>
              <select value={config.bannerAd?.showEveryNth || 3}
                onChange={e => setConfig(prev => ({ ...prev, bannerAd: { ...prev.bannerAd, showEveryNth: parseInt(e.target.value) } }))}
                style={{ background: "#23232b", color: "#fff", border: "1px solid #333", borderRadius: 6, padding: "6px 10px", fontSize: 13 }}>
                <option value={2}>Her 2 şarkıda bir</option>
                <option value={3}>Her 3 şarkıda bir</option>
                <option value={4}>Her 4 şarkıda bir</option>
                <option value={5}>Her 5 şarkıda bir</option>
              </select>
            </div>
          </div>

          {/* Ülke Kuralları */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ color: "#f59e0b", margin: 0, fontSize: 15 }}>🏳️ Ülke Bazlı Kurallar</h3>
              <button onClick={() => {
                const rules = [...(config.bannerAd?.rules || [])];
                rules.push({ countries: [], enabled: true, type: "admob", admobUnitId: "", imageUrl: "", clickUrl: "" });
                setConfig(prev => ({ ...prev, bannerAd: { ...prev.bannerAd, rules } }));
              }} style={{ background: "#f59e0b", color: "#000", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                + Kural Ekle
              </button>
            </div>

            {(config.bannerAd?.rules || []).length === 0 && (
              <p style={{ color: "#666", fontSize: 13, textAlign: "center", padding: 20 }}>
                Kural yok — banner reklam gösterilmez.
              </p>
            )}

            {(config.bannerAd?.rules || []).map((rule, idx) => (
              <div key={idx} style={{ padding: "14px", background: "#1a1a2e", borderRadius: 8, border: `1px solid ${rule.enabled ? "#f59e0b" : "#2a2a35"}`, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input type="checkbox" checked={rule.enabled}
                      onChange={e => {
                        const rules = [...(config.bannerAd?.rules || [])];
                        rules[idx] = { ...rules[idx], enabled: e.target.checked };
                        setConfig(prev => ({ ...prev, bannerAd: { ...prev.bannerAd, rules } }));
                      }} style={{ width: 16, height: 16 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: rule.enabled ? "#f59e0b" : "#666" }}>
                      Kural #{idx + 1} {rule.enabled ? "● AKTİF" : "● PASİF"}
                    </span>
                  </div>
                  <button onClick={() => {
                    const rules = [...(config.bannerAd?.rules || [])];
                    rules.splice(idx, 1);
                    setConfig(prev => ({ ...prev, bannerAd: { ...prev.bannerAd, rules } }));
                  }} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 13 }}>Sil</button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <CountryRulePicker rule={rule} idx={idx} configKey="bannerAd" config={config} setConfig={setConfig} />
                  <div>
                    <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Tür:</label>
                    <select value={rule.type || "admob"}
                      onChange={e => {
                        const rules = [...(config.bannerAd?.rules || [])];
                        rules[idx] = { ...rules[idx], type: e.target.value };
                        setConfig(prev => ({ ...prev, bannerAd: { ...prev.bannerAd, rules } }));
                      }}
                      style={{ background: "#23232b", color: "#fff", border: "1px solid #333", borderRadius: 6, padding: "6px 10px", fontSize: 13, width: "100%" }}>
                      <option value="admob">Google AdMob</option>
                      <option value="custom">Kendi Görselim (Resim + Link)</option>
                    </select>
                  </div>
                </div>

                {rule.type === "admob" && (
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>AdMob Banner Unit ID:</label>
                    <input type="text" placeholder="ca-app-pub-xxx/yyy"
                      value={rule.admobUnitId || ""}
                      onChange={e => {
                        const rules = [...(config.bannerAd?.rules || [])];
                        rules[idx] = { ...rules[idx], admobUnitId: e.target.value };
                        setConfig(prev => ({ ...prev, bannerAd: { ...prev.bannerAd, rules } }));
                      }}
                      style={{ width: "100%", background: "#23232b", color: "#fff", border: "1px solid #333", borderRadius: 6, padding: "6px 10px", fontSize: 13 }} />
                  </div>
                )}

                {rule.type === "custom" && (
                  <>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Görsel URL:</label>
                      <input type="text" placeholder="https://example.com/banner.jpg"
                        value={rule.imageUrl || ""}
                        onChange={e => {
                          const rules = [...(config.bannerAd?.rules || [])];
                          rules[idx] = { ...rules[idx], imageUrl: e.target.value };
                          setConfig(prev => ({ ...prev, bannerAd: { ...prev.bannerAd, rules } }));
                        }}
                        style={{ width: "100%", background: "#23232b", color: "#fff", border: "1px solid #333", borderRadius: 6, padding: "6px 10px", fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Tıklama URL:</label>
                      <input type="text" placeholder="https://example.com/landing"
                        value={rule.clickUrl || ""}
                        onChange={e => {
                          const rules = [...(config.bannerAd?.rules || [])];
                          rules[idx] = { ...rules[idx], clickUrl: e.target.value };
                          setConfig(prev => ({ ...prev, bannerAd: { ...prev.bannerAd, rules } }));
                        }}
                        style={{ width: "100%", background: "#23232b", color: "#fff", border: "1px solid #333", borderRadius: 6, padding: "6px 10px", fontSize: 13 }} />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <button onClick={updateConfig}
            style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed)", color: "#fff", border: "none", borderRadius: 8, padding: "12px 24px", fontSize: 15, fontWeight: 600, cursor: "pointer", width: "100%" }}>
            Ayarları Kaydet
          </button>
        </div>}

        {/* ALT BANNER REKLAM */}
        {activeSection === "bottombanner" && <div style={styles.card}>
          <h2 style={styles.title}>📌 Alt Banner Reklam</h2>
          <p style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>
            Ekranın en altında sabit duran banner reklam. Ülke bazlı Google AdMob veya kendi görseliniz.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <label style={{ fontSize: 14, color: "#ccc" }}>Alt Banner Aktif:</label>
            <input type="checkbox" checked={config.bottomBannerAd?.enabled || false}
              onChange={e => setConfig(prev => ({ ...prev, bottomBannerAd: { ...prev.bottomBannerAd, enabled: e.target.checked } }))}
              style={{ width: 18, height: 18, cursor: "pointer" }} />
            <span style={{ color: config.bottomBannerAd?.enabled ? "#22c55e" : "#ef4444", fontSize: 12, fontWeight: 600 }}>
              {config.bottomBannerAd?.enabled ? "AKTİF" : "KAPALI"}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ color: "#f59e0b", margin: 0, fontSize: 15 }}>🏳️ Ülke Bazlı Kurallar</h3>
            <button onClick={() => {
              const rules = [...(config.bottomBannerAd?.rules || [])];
              rules.push({ countries: [], enabled: true, type: "admob", admobUnitId: "", imageUrl: "", clickUrl: "" });
              setConfig(prev => ({ ...prev, bottomBannerAd: { ...prev.bottomBannerAd, rules } }));
            }} style={{ background: "#f59e0b", color: "#000", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              + Kural Ekle
            </button>
          </div>

          {(config.bottomBannerAd?.rules || []).length === 0 && (
            <p style={{ color: "#666", fontSize: 13, textAlign: "center", padding: 20 }}>
              Kural yok — alt banner gösterilmez.
            </p>
          )}

          {(config.bottomBannerAd?.rules || []).map((rule, idx) => (
            <div key={idx} style={{ padding: "14px", background: "#1a1a2e", borderRadius: 8, border: `1px solid ${rule.enabled ? "#f59e0b" : "#2a2a35"}`, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="checkbox" checked={rule.enabled}
                    onChange={e => {
                      const rules = [...(config.bottomBannerAd?.rules || [])];
                      rules[idx] = { ...rules[idx], enabled: e.target.checked };
                      setConfig(prev => ({ ...prev, bottomBannerAd: { ...prev.bottomBannerAd, rules } }));
                    }} style={{ width: 16, height: 16 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: rule.enabled ? "#f59e0b" : "#666" }}>
                    Kural #{idx + 1} {rule.enabled ? "● AKTİF" : "● PASİF"}
                  </span>
                </div>
                <button onClick={() => {
                  const rules = [...(config.bottomBannerAd?.rules || [])];
                  rules.splice(idx, 1);
                  setConfig(prev => ({ ...prev, bottomBannerAd: { ...prev.bottomBannerAd, rules } }));
                }} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 13 }}>Sil</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
                <CountryRulePicker rule={rule} idx={idx} configKey="bottomBannerAd" config={config} setConfig={setConfig} />
                <div>
                  <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Tür:</label>
                  <select value={rule.type || "admob"}
                    onChange={e => {
                      const rules = [...(config.bottomBannerAd?.rules || [])];
                      rules[idx] = { ...rules[idx], type: e.target.value };
                      setConfig(prev => ({ ...prev, bottomBannerAd: { ...prev.bottomBannerAd, rules } }));
                    }}
                    style={{ background: "#23232b", color: "#fff", border: "1px solid #333", borderRadius: 6, padding: "6px 10px", fontSize: 13, width: "100%" }}>
                    <option value="admob">Google AdMob</option>
                    <option value="custom">Kendi Görselim (Resim + Link)</option>
                  </select>
                </div>
              </div>

              {rule.type === "admob" && (
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>AdMob Banner Unit ID:</label>
                  <input type="text" placeholder="ca-app-pub-xxx/yyy"
                    value={rule.admobUnitId || ""}
                    onChange={e => {
                      const rules = [...(config.bottomBannerAd?.rules || [])];
                      rules[idx] = { ...rules[idx], admobUnitId: e.target.value };
                      setConfig(prev => ({ ...prev, bottomBannerAd: { ...prev.bottomBannerAd, rules } }));
                    }}
                    style={{ width: "100%", background: "#23232b", color: "#fff", border: "1px solid #333", borderRadius: 6, padding: "6px 10px", fontSize: 13 }} />
                </div>
              )}

              {rule.type === "custom" && (
                <>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Görsel URL:</label>
                    <input type="text" placeholder="https://example.com/banner.jpg"
                      value={rule.imageUrl || ""}
                      onChange={e => {
                        const rules = [...(config.bottomBannerAd?.rules || [])];
                        rules[idx] = { ...rules[idx], imageUrl: e.target.value };
                        setConfig(prev => ({ ...prev, bottomBannerAd: { ...prev.bottomBannerAd, rules } }));
                      }}
                      style={{ width: "100%", background: "#23232b", color: "#fff", border: "1px solid #333", borderRadius: 6, padding: "6px 10px", fontSize: 13 }} />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Tıklama URL:</label>
                    <input type="text" placeholder="https://example.com/landing"
                      value={rule.clickUrl || ""}
                      onChange={e => {
                        const rules = [...(config.bottomBannerAd?.rules || [])];
                        rules[idx] = { ...rules[idx], clickUrl: e.target.value };
                        setConfig(prev => ({ ...prev, bottomBannerAd: { ...prev.bottomBannerAd, rules } }));
                      }}
                      style={{ width: "100%", background: "#23232b", color: "#fff", border: "1px solid #333", borderRadius: 6, padding: "6px 10px", fontSize: 13 }} />
                  </div>
                </>
              )}
            </div>
          ))}

          <button onClick={updateConfig}
            style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed)", color: "#fff", border: "none", borderRadius: 8, padding: "12px 24px", fontSize: 15, fontWeight: 600, cursor: "pointer", width: "100%" }}>
            Ayarları Kaydet
          </button>
        </div>}

        {/* REKLAMSIZ ÜLKELER */}
        {activeSection === "adfree" && <div style={styles.card}>
          <h2 style={styles.title}>🚫 Reklamsız Ülkeler</h2>
          <p style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>
            Seçtiğiniz ülkelerde hiçbir reklam gösterilmez (indirme reklamı + banner reklam dahil).
          </p>

          <div style={{ position: "relative", marginBottom: 16 }}>
            <div
              onClick={() => document.getElementById("adFreeDropdown").style.display = document.getElementById("adFreeDropdown").style.display === "block" ? "none" : "block"}
              style={{ background: "#23232b", color: "#fff", border: "1px solid #333", borderRadius: 6, padding: "8px 12px", fontSize: 13, cursor: "pointer", minHeight: 36 }}>
              {(config.adFreeCountries || []).length > 0
                ? (config.adFreeCountries || []).map(c => { const found = COUNTRY_LIST.find(x => x.code === c); return found ? `${found.code} ${found.name}` : c; }).join(", ")
                : "Ülke seçin..."}
            </div>
            <div id="adFreeDropdown" style={{ display: "none", position: "absolute", top: "100%", left: 0, right: 0, background: "#23232b", border: "1px solid #444", borderRadius: 6, maxHeight: 250, overflowY: "auto", zIndex: 999 }}>
              {COUNTRY_LIST.map(c => (
                <label key={c.code} style={{ display: "flex", alignItems: "center", padding: "6px 12px", fontSize: 13, color: "#ccc", cursor: "pointer" }}>
                  <input type="checkbox" checked={(config.adFreeCountries || []).includes(c.code)}
                    onChange={e => {
                      const countries = [...(config.adFreeCountries || [])];
                      if (e.target.checked) countries.push(c.code);
                      else countries.splice(countries.indexOf(c.code), 1);
                      setConfig(prev => ({ ...prev, adFreeCountries: countries }));
                    }} style={{ marginRight: 10 }} />
                  {c.code} - {c.name}
                </label>
              ))}
            </div>
          </div>

          {(config.adFreeCountries || []).length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {(config.adFreeCountries || []).map(c => {
                const found = COUNTRY_LIST.find(x => x.code === c);
                return (
                  <span key={c} style={{ background: "#7c3aed", color: "#fff", borderRadius: 12, padding: "4px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    {found ? `${found.code} ${found.name}` : c}
                    <span style={{ cursor: "pointer", fontWeight: 700 }} onClick={() => {
                      setConfig(prev => ({ ...prev, adFreeCountries: (prev.adFreeCountries || []).filter(x => x !== c) }));
                    }}>×</span>
                  </span>
                );
              })}
            </div>
          )}

          <button onClick={updateConfig}
            style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed)", color: "#fff", border: "none", borderRadius: 8, padding: "12px 24px", fontSize: 15, fontWeight: 600, cursor: "pointer", width: "100%" }}>
            Kaydet
          </button>
        </div>}

        {/* DEVICE ACTIONS */}
        {activeSection === "device" && <div style={styles.card}>
          <h2 style={styles.title}>📱 Device Actions (Cihaz Komutları)</h2>
          <p style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>
            Android cihazlara uzaktan komut gönderin. Aktif action cihaz tarafından otomatik algılanır.
          </p>

          {/* Action Type */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            {[
              { key: "chrome_url", label: "🌐 Chrome URL", desc: "Chrome'da URL aç" },
              { key: "package_name", label: "📦 Package Name", desc: "Uygulama aç / Store'a yönlendir" },
              { key: "review_sheet", label: "⭐ Review Sheet", desc: "Play Store değerlendirme" }
            ].map(t => (
              <button key={t.key} onClick={() => setDaActionType(t.key)}
                style={{
                  padding: "10px 18px", borderRadius: 8, border: daActionType === t.key ? "2px solid #0ea5e9" : "1px solid #3f3f46",
                  background: daActionType === t.key ? "#0c2d48" : "#272a33", color: "#fff", cursor: "pointer", fontSize: 13
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Mode Toggle */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
            <span style={{ color: "#aaa", fontSize: 13 }}>Mod:</span>
            <button onClick={() => setDaMode("direct")}
              style={{
                padding: "8px 20px", borderRadius: 8, border: daMode === "direct" ? "2px solid #22c55e" : "1px solid #3f3f46",
                background: daMode === "direct" ? "#14532d" : "#272a33", color: "#fff", cursor: "pointer", fontSize: 13
              }}>
              ⚡ Direct (Sessiz)
            </button>
            <button onClick={() => setDaMode("popup")}
              style={{
                padding: "8px 20px", borderRadius: 8, border: daMode === "popup" ? "2px solid #f59e0b" : "1px solid #3f3f46",
                background: daMode === "popup" ? "#451a03" : "#272a33", color: "#fff", cursor: "pointer", fontSize: 13
              }}>
              💬 Popup (Onaylı)
            </button>
          </div>

          {/* Value Input */}
          {daActionType !== "review_sheet" && (
            <div style={{ marginBottom: 16 }}>
              <label style={styles.label}>
                {daActionType === "chrome_url" ? "URL (https://...)" : "Package Name (com.example.app)"}
              </label>
              <input style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                placeholder={daActionType === "chrome_url" ? "https://example.com" : "com.whatsapp"}
                value={daValue} onChange={e => setDaValue(e.target.value)} />
            </div>
          )}

          {/* Popup Label */}
          {daMode === "popup" && (
            <div style={{ marginBottom: 16 }}>
              <label style={styles.label}>Popup Mesajı (opsiyonel)</label>
              <input style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                placeholder="Kullanıcıya gösterilecek mesaj..."
                value={daLabel} onChange={e => setDaLabel(e.target.value)} />
            </div>
          )}

          <button style={{ ...styles.primaryBtn, backgroundColor: "#0ea5e9" }} onClick={createDeviceAction}>
            🚀 Action Gönder
          </button>

          {/* Existing Actions List */}
          {deviceActions.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ color: "#94a3b8", fontSize: 14, marginBottom: 12 }}>Geçmiş Actions</h3>
              {deviceActions.map(action => (
                <div key={action.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: action.active ? "#0c2d48" : "#1a1a1d", padding: "12px 16px",
                  borderRadius: 8, marginBottom: 8, border: action.active ? "1px solid #0ea5e9" : "1px solid #272a33"
                }}>
                  <div>
                    <span style={{ color: action.active ? "#0ea5e9" : "#666", fontSize: 12, marginRight: 8 }}>
                      {action.active ? "● AKTİF" : "○ Pasif"}
                    </span>
                    <span style={{ color: "#fff", fontSize: 13 }}>
                      {action.actionType === "chrome_url" && "🌐 "}
                      {action.actionType === "package_name" && "📦 "}
                      {action.actionType === "review_sheet" && "⭐ "}
                      {action.value}
                    </span>
                    <span style={{ color: "#666", fontSize: 12, marginLeft: 10 }}>
                      ({action.mode === "direct" ? "⚡ Direct" : "💬 Popup"})
                      {action.executedCount > 0 && ` • ${action.executedCount} kez çalıştı`}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {action.active && (
                      <button onClick={() => deactivateDeviceAction(action.id)}
                        style={{ ...styles.textBtn, color: "#f59e0b", fontSize: 12 }}>Durdur</button>
                    )}
                    <button onClick={() => deleteDeviceAction(action.id)}
                      style={{ ...styles.textBtn, fontSize: 12 }}>Sil</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>}

        {/* APP CONTROLS */}
        {activeSection === "appcontrols" && <div style={styles.card}>
          <h2 style={styles.title}>🛡️ App Controls</h2>
          <p style={{ color: "#888", fontSize: 13, marginBottom: 24 }}>
            Zorunlu review ve zorunlu güncelleme ayarlarını buradan kontrol edin.
          </p>

          {/* REVIEW SECTION */}
          <div style={{ background: "#1a1a2e", border: "1px solid #2a2a3a", borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <h3 style={{ color: "#a78bfa", fontSize: 16, margin: "0 0 16px 0" }}>⭐ Zorunlu Review</h3>
            <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
              <label style={styles.labelCheckbox}>
                <input type="checkbox" checked={config.appControls?.reviewEnabled || false}
                  onChange={e => setConfig({ ...config, appControls: { ...(config.appControls || {}), reviewEnabled: e.target.checked } })}
                  style={{ marginRight: 10 }} />
                <span style={{ color: (config.appControls?.reviewEnabled) ? "#4ade80" : "#888" }}>Review Aktif</span>
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#94a3b8", fontSize: 13 }}>Kaçıncı açılışta:</span>
                <input type="number" min="1" max="100"
                  style={{ ...styles.input, width: 80, textAlign: "center" }}
                  value={config.appControls?.reviewAtLaunch || 2}
                  onChange={e => setConfig({ ...config, appControls: { ...(config.appControls || {}), reviewAtLaunch: parseInt(e.target.value) || 2 } })} />
              </div>
            </div>
            <p style={{ color: "#666", fontSize: 12, margin: 0 }}>
              Kullanıcı uygulamayı belirtilen sayıda açtığında Google Play In-App Review ekranı zorunlu gösterilir.
            </p>
          </div>

          {/* FORCE UPDATE SECTION */}
          <div style={{ background: "#1a1a2e", border: "1px solid #2a2a3a", borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <h3 style={{ color: "#f59e0b", fontSize: 16, margin: "0 0 16px 0" }}>🔄 Zorunlu Güncelleme</h3>
            <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
              <label style={styles.labelCheckbox}>
                <input type="checkbox" checked={config.appControls?.forceUpdateEnabled || false}
                  onChange={e => setConfig({ ...config, appControls: { ...(config.appControls || {}), forceUpdateEnabled: e.target.checked } })}
                  style={{ marginRight: 10 }} />
                <span style={{ color: (config.appControls?.forceUpdateEnabled) ? "#4ade80" : "#888" }}>Force Update Aktif</span>
              </label>
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={styles.label}>Minimum Versiyon Kodu (int)</label>
                <input type="number" min="1"
                  style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                  placeholder="2"
                  value={config.appControls?.minVersionCode || ""}
                  onChange={e => setConfig({ ...config, appControls: { ...(config.appControls || {}), minVersionCode: parseInt(e.target.value) || 1 } })} />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={styles.label}>Minimum Versiyon Adı</label>
                <input type="text"
                  style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                  placeholder="1.1.0"
                  value={config.appControls?.minVersionName || ""}
                  onChange={e => setConfig({ ...config, appControls: { ...(config.appControls || {}), minVersionName: e.target.value } })} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.label}>Play Store Package Name</label>
              <input type="text"
                style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                placeholder="com.example.ringtonemasterv2"
                value={config.appControls?.packageName || "com.example.ringtonemasterv2"}
                onChange={e => setConfig({ ...config, appControls: { ...(config.appControls || {}), packageName: e.target.value } })} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.label}>Güncelleme Mesajı</label>
              <input type="text"
                style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                placeholder="Yeni versiyon mevcut! Devam etmek için güncelleyin."
                value={config.appControls?.updateMessage || ""}
                onChange={e => setConfig({ ...config, appControls: { ...(config.appControls || {}), updateMessage: e.target.value } })} />
            </div>
            <p style={{ color: "#666", fontSize: 12, margin: 0 }}>
              Kullanıcının versiyon kodu minimum'dan düşükse tam ekran güncelleme ekranı çıkar. Uygulamayı kullanamaz, sadece güncelle butonuna basabilir.
            </p>
          </div>

          <button style={{ ...styles.primaryBtn, backgroundColor: "#0ea5e9" }} onClick={updateConfig}>
            💾 App Controls Kaydet
          </button>

          {/* ANLIK GÖNDER BUTONLARI */}
          <div style={{ background: "#1a1a2e", border: "1px solid #2a2a3a", borderRadius: 10, padding: 20, marginTop: 20 }}>
            <h3 style={{ color: "#ef4444", fontSize: 16, margin: "0 0 12px 0" }}>🚀 Anlık Tetikle</h3>
            <p style={{ color: "#666", fontSize: 12, marginBottom: 16 }}>
              Butona basınca tüm aktif kullanıcılara anında gönderilir (Device Actions üzerinden).
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button style={{ ...styles.primaryBtn, backgroundColor: "#7c3aed" }} onClick={() => {
                fetch(`${API_URL}/device-action/create`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "X-App-Key": "RINGTONE_MASTER_V2_SECRET_2026" },
                  body: JSON.stringify({ actionType: "review_sheet", mode: "popup", value: "", label: "Rate us on Play Store! ⭐" })
                }).then(r => r.json()).then(d => {
                  if (d.ok) alert("✅ Review tetiklendi! Tüm kullanıcılara gönderildi.");
                  else alert("Hata: " + (d.error || "Gönderilemedi"));
                }).catch(() => alert("Sunucuya bağlanılamadı!"));
              }}>
                ⭐ Anlık Review Gönder
              </button>
              <button style={{ ...styles.primaryBtn, backgroundColor: "#ef4444" }} onClick={() => {
                const pkg = config.appControls?.packageName || "com.example.ringtonemasterv2";
                fetch(`${API_URL}/device-action/create`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "X-App-Key": "RINGTONE_MASTER_V2_SECRET_2026" },
                  body: JSON.stringify({ actionType: "package_name", mode: "popup", value: pkg, label: "A new version is available! Please update. 🔄" })
                }).then(r => r.json()).then(d => {
                  if (d.ok) alert("✅ Güncelleme tetiklendi! Tüm kullanıcılara gönderildi.");
                  else alert("Hata: " + (d.error || "Gönderilemedi"));
                }).catch(() => alert("Sunucuya bağlanılamadı!"));
              }}>
                🔄 Anlık Güncelleme Gönder
              </button>
            </div>
          </div>
        </div>}

        {/* API PROVIDERS */}
        {activeSection === "apiproviders" && <div style={styles.card}>
          <h2 style={styles.title}>🔌 API Durumu</h2>
          <p style={{ color: "#888", fontSize: 13, marginBottom: 24 }}>
            İndirme için kullanılan üçüncü parti servislerin canlı durumu
          </p>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <span style={{ color: "#94a3b8", fontSize: 13 }}>{apiHealth.length}/3 API direkt erişilebilir</span>
            <button style={{ ...styles.primaryBtn, backgroundColor: "#0ea5e9" }} onClick={() => {
              fetch(`${API_URL}/admin/api-health`, { headers: { "X-App-Key": "RINGTONE_MASTER_V2_SECRET_2026" } })
                .then(r => r.json())
                .then(d => setApiHealth(d.providers || []))
                .catch(() => alert("Sağlık kontrolü başarısız"));
            }}>🔄 Yenile</button>
          </div>

          {(apiHealth.length > 0 ? apiHealth : (apiProviders?.providers || [])).map((p, i) => (
            <div key={p.id || i} style={{ background: "#1a1a2e", border: "1px solid #2a2a3a", borderRadius: 10, padding: 20, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ color: "#f8fafc", fontSize: 15, fontWeight: 500 }}>{p.name || p.id}</span>
                  <span style={{ color: "#666", fontSize: 12, marginLeft: 10 }}>
                    {p.priority === 1 ? "— Birincil" : p.priority === 2 ? `— İkincil${p.dailyLimit ? `, ${p.dailyLimit}/gün limit` : ""}` : "— Üçüncül (yedek)"}
                  </span>
                  {p.httpStatus && <div style={{ color: "#666", fontSize: 12, marginTop: 4 }}>HTTP {p.httpStatus}</div>}
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{
                    backgroundColor: p.status === "online" || p.enabled ? "#065f4620" : "#7f1d1d20",
                    color: p.status === "online" || p.enabled ? "#4ade80" : "#ef4444",
                    padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600
                  }}>
                    {p.status === "online" ? "✅ Çalışıyor" : p.enabled ? "✅ Aktif" : "❌ Kapalı"}
                  </span>
                  <button style={{ ...styles.primaryBtn, fontSize: 12, padding: "6px 14px", backgroundColor: "#f59e0b" }}>
                    Proxy Aktif Et
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div style={{ background: "#1a1a2e", border: "1px solid #2a2a3a", borderRadius: 10, padding: 20, marginTop: 20 }}>
            <h3 style={{ color: "#a78bfa", fontSize: 16, margin: "0 0 12px 0" }}>🔑 API Ayarları</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>API Key</label>
              <input type="text" style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                value={apiProviders?.apiKey || "bzc_7mK2pXr9Qw1Lz4Ny"}
                onChange={e => setApiProviders({ ...apiProviders, apiKey: e.target.value })} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.label}>Base URL</label>
              <input type="text" style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                value={apiProviders?.baseUrl || "https://bazocam.net"}
                onChange={e => setApiProviders({ ...apiProviders, baseUrl: e.target.value })} />
            </div>
            <button style={{ ...styles.primaryBtn, backgroundColor: "#0ea5e9" }} onClick={() => {
              fetch(`${API_URL}/admin/api-providers`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-App-Key": "RINGTONE_MASTER_V2_SECRET_2026" },
                body: JSON.stringify({ apiKey: apiProviders?.apiKey, baseUrl: apiProviders?.baseUrl, providers: apiProviders?.providers })
              }).then(r => r.json()).then(d => {
                if (d.success) alert("✅ API ayarları kaydedildi!");
                else alert("Hata: " + (d.error || "Kaydedilemedi"));
              }).catch(() => alert("Sunucuya bağlanılamadı!"));
            }}>💾 Kaydet</button>
          </div>

          <div style={{ background: "#1a1a2e", border: "1px solid #2a2a3a", borderRadius: 10, padding: 20, marginTop: 20 }}>
            <h3 style={{ color: "#a78bfa", fontSize: 16, margin: "0 0 16px 0" }}>🗺️ API Haritası — Kim Neyi Kullanıyor?</h3>
            <p style={{ color: "#888", fontSize: 12, marginBottom: 16 }}>Uygulamanın her özelliği hangi API kaynağını kullandığını gösterir</p>
            {[
              { feature: "🎵 MP3 Dinleme", source: "Bazocam API", detail: "gamma → cnv sırasıyla", fallback: "yt-dlp + Proxy", where: "Backend" },
              { feature: "🎬 Video İzleme", source: "Bazocam API", detail: "mp4download.php", fallback: "yt-dlp + Proxy", where: "Backend" },
              { feature: "📥 MP3 İndirme", source: "Bazocam API", detail: "mp3download.php", fallback: "yt-dlp + Proxy", where: "Backend" },
              { feature: "📥 MP4 İndirme", source: "Bazocam API", detail: "mp4download.php", fallback: "yt-dlp + Proxy", where: "Backend" },
              { feature: "🔍 Arama", source: "Bazocam API", detail: "searchapi.php", fallback: "YouTube Data API", where: "Backend" },
              { feature: "🔮 Otomatik Tamamlama", source: config?.autocompleteSource === "bazocam" ? "Bazocam API" : "Google Suggest", detail: config?.autocompleteSource === "bazocam" ? "ototamamlamaapi.php" : "suggestqueries.google.com", fallback: "—", where: config?.autocompleteSource === "bazocam" ? "Backend" : "Cihaz (direkt)" },
              { feature: "🏆 Top 50", source: "YouTube Data API v3", detail: "mostPopular chart", fallback: "Piped API", where: "Backend" },
            ].map((api, i) => (
              <div key={i} style={{ background: "#14151a", borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#f8fafc", fontSize: 13, fontWeight: 600, minWidth: 160 }}>{api.feature}</span>
                  <span style={{ color: "#4ade80", fontSize: 12, fontWeight: 600 }}>{api.source}</span>
                  <span style={{ color: "#666", fontSize: 11, fontFamily: "monospace" }}>{api.detail}</span>
                  <span style={{ color: "#f59e0b", fontSize: 11 }}>Yedek: {api.fallback}</span>
                  <span style={{ backgroundColor: api.where === "Cihaz (direkt)" ? "#7c3aed20" : "#0ea5e920", color: api.where === "Cihaz (direkt)" ? "#a78bfa" : "#38bdf8", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{api.where}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Autocomplete Kaynak Seçimi */}
          <div style={{ background: "#1a1a2e", border: "1px solid #2a2a3a", borderRadius: 10, padding: 20, marginTop: 20 }}>
            <h3 style={{ color: "#a78bfa", fontSize: 16, margin: "0 0 12px 0" }}>🔮 Otomatik Tamamlama Kaynağı</h3>
            <p style={{ color: "#888", fontSize: 12, marginBottom: 16 }}>Arama yazarken önerilerin nereden geleceğini seçin</p>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { value: "google", label: "Google Suggest", desc: "Ücretsiz, limitsiz, cihazdan direkt", icon: "🌐" },
                { value: "bazocam", label: "Bazocam API", desc: "Patronun API'si, backend üzerinden", icon: "🔌" },
              ].map(opt => (
                <div key={opt.value} onClick={() => setConfig({ ...config, autocompleteSource: opt.value })}
                  style={{
                    flex: 1, background: config?.autocompleteSource === opt.value ? "#065f4630" : "#14151a",
                    border: `2px solid ${config?.autocompleteSource === opt.value ? "#4ade80" : "#2a2a3a"}`,
                    borderRadius: 10, padding: 16, cursor: "pointer", transition: "all 0.2s"
                  }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{opt.icon}</div>
                  <div style={{ color: "#f8fafc", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{opt.label}</div>
                  <div style={{ color: "#888", fontSize: 11 }}>{opt.desc}</div>
                  {config?.autocompleteSource === opt.value && <div style={{ color: "#4ade80", fontSize: 11, marginTop: 8, fontWeight: 600 }}>✅ Aktif</div>}
                </div>
              ))}
            </div>
            <button style={{ ...styles.primaryBtn, backgroundColor: "#0ea5e9", marginTop: 16 }} onClick={() => {
              fetch(`${API_URL}/config`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-App-Key": "RINGTONE_MASTER_V2_SECRET_2026" },
                body: JSON.stringify(config)
              }).then(r => r.json()).then(() => alert("✅ Otomatik tamamlama kaynağı güncellendi!"))
                .catch(() => alert("Hata!"));
            }}>💾 Kaydet</button>
          </div>

          {/* Eski endpoint listesi */}
          <div style={{ background: "#1a1a2e", border: "1px solid #2a2a3a", borderRadius: 10, padding: 20, marginTop: 20 }}>
            <h3 style={{ color: "#a78bfa", fontSize: 16, margin: "0 0 12px 0" }}>📡 Bazocam API Endpoint'leri</h3>
            <p style={{ color: "#888", fontSize: 12, marginBottom: 12 }}>Patronun sunucusundaki kullanılabilir endpoint'ler</p>
            {[
              { label: "🎵 MP3 İndir", method: "GET", path: `/mp3download.php?id=VIDEO_ID&key=API_KEY&b=320` },
              { label: "🎬 MP4 İndir", method: "GET", path: `/mp4download.php?id=VIDEO_ID&key=API_KEY&q=720` },
              { label: "🔍 Arama", method: "GET", path: `/searchapi.php?search=SORGU&key=API_KEY` },
              { label: "🔮 Otomatik Tamamlama", method: "GET", path: `/ototamamlamaapi.php?search=SORGU&key=API_KEY` },
            ].map((ep, i) => (
              <div key={i} style={{ background: "#14151a", borderRadius: 8, padding: "10px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ color: "#f8fafc", fontSize: 13 }}>{ep.label}</span>
                  <span style={{ backgroundColor: "#065f4620", color: "#4ade80", padding: "2px 8px", borderRadius: 4, fontSize: 11, marginLeft: 8 }}>{ep.method}</span>
                  <div style={{ color: "#666", fontSize: 11, marginTop: 4, fontFamily: "monospace" }}>{ep.path}</div>
                </div>
              </div>
            ))}
          </div>
        </div>}

        {/* SMART CACHE */}
        {activeSection === "smartcache" && <div style={styles.card}>
          <h2 style={styles.title}>📦 Cache Yönetimi</h2>
          <p style={{ color: "#888", fontSize: 13, marginBottom: 24 }}>
            Akıllı cache sistemi — sadece popüler şarkıları cache'le
          </p>

          <div style={{ background: "#1a1a2e", border: "1px solid #2a2a3a", borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <h3 style={{ color: "#a78bfa", fontSize: 16, margin: "0 0 16px 0" }}>⚡ Akıllı Cache Ayarları</h3>
            <label style={styles.labelCheckbox}>
              <input type="checkbox" checked={smartCache.enabled}
                onChange={e => setSmartCache({ ...smartCache, enabled: e.target.checked })}
                style={{ marginRight: 10 }} />
              <span style={{ color: smartCache.enabled ? "#4ade80" : "#888" }}>Akıllı Cache Aktif</span>
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
              <span style={{ color: "#94a3b8", fontSize: 13 }}>Minimum istek sayısı:</span>
              <input type="number" min="1" max="100"
                style={{ ...styles.input, width: 80, textAlign: "center" }}
                value={smartCache.minRequests}
                onChange={e => setSmartCache({ ...smartCache, minRequests: parseInt(e.target.value) || 3 })} />
            </div>
            <p style={{ color: "#666", fontSize: 12, marginTop: 12 }}>
              Bir şarkıya bu kadar istek gelmeden cache'lenmez. Düşük değer = daha fazla disk kullanımı, yüksek değer = daha az cache.
            </p>
            <button style={{ ...styles.primaryBtn, backgroundColor: "#0ea5e9", marginTop: 16 }} onClick={() => {
              fetch(`${API_URL}/admin/smart-cache`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-App-Key": "RINGTONE_MASTER_V2_SECRET_2026" },
                body: JSON.stringify(smartCache)
              }).then(r => r.json()).then(d => {
                if (d.success) alert("✅ Cache ayarları kaydedildi!");
                else alert("Hata: " + (d.error || "Kaydedilemedi"));
              }).catch(() => alert("Sunucuya bağlanılamadı!"));
            }}>💾 Cache Ayarlarını Kaydet</button>
          </div>

          <div style={{ background: "#1a1a2e", border: "1px solid #2a2a3a", borderRadius: 10, padding: 20 }}>
            <h3 style={{ color: "#f59e0b", fontSize: 16, margin: "0 0 12px 0" }}>📊 Cache İstatistikleri</h3>
            <p style={{ color: "#666", fontSize: 12 }}>
              Cache durumu sunucudan alınır. Yenilemek için butona basın.
            </p>
            <button style={{ ...styles.primaryBtn, backgroundColor: "#3f3f46", marginTop: 12 }} onClick={() => {
              fetch(`${API_URL}/admin/smart-cache`, { headers: { "X-App-Key": "RINGTONE_MASTER_V2_SECRET_2026" } })
                .then(r => r.json())
                .then(d => {
                  if (d.smartCache) setSmartCache(d.smartCache);
                  alert(`Disk: ${d.diskUsage || "N/A"}\nR2: ${d.r2Usage || "N/A"}\nMin İstek: ${d.smartCache?.minRequests || 3}`);
                }).catch(() => alert("İstatistik alınamadı"));
            }}>📊 İstatistikleri Getir</button>
          </div>
        </div>}

        {/* YOUTUBE & TOP50 */}
        {activeSection === "youtube" && <div style={styles.card}>
          <h2 style={styles.title}>🎬 YouTube & Top50</h2>
          <p style={{ color: "#888", fontSize: 13, marginBottom: 24 }}>
            YouTube Data API durumu, Top50 ısıtma ve ülke yönetimi
          </p>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <span style={{ color: "#94a3b8", fontSize: 13 }}>
              API Durumu: <span style={{ color: youtubeData?.status === "ok" ? "#4ade80" : "#ef4444", fontWeight: 600 }}>
                {youtubeData?.status === "ok" ? "✅ Aktif" : "❌ Quota Aşıldı"}
              </span>
            </span>
            <button style={{ ...styles.primaryBtn, backgroundColor: "#0ea5e9" }} onClick={fetchYoutubeData}>🔄 Yenile</button>
          </div>

          {/* API Key & Quota */}
          <div style={{ background: "#1a1a2e", border: "1px solid #2a2a3a", borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <h3 style={{ color: "#a78bfa", fontSize: 16, margin: "0 0 16px 0" }}>🔑 YouTube API</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: "#14151a", borderRadius: 8, padding: 14 }}>
                <div style={{ color: "#666", fontSize: 11, marginBottom: 4 }}>API Key</div>
                <div style={{ color: "#f8fafc", fontSize: 14, fontFamily: "monospace" }}>{youtubeData?.youtubeApiKey || "—"}</div>
              </div>
              <div style={{ background: "#14151a", borderRadius: 8, padding: 14 }}>
                <div style={{ color: "#666", fontSize: 11, marginBottom: 4 }}>API Çağrısı (restart'tan beri)</div>
                <div style={{ color: "#f8fafc", fontSize: 14 }}>{youtubeData?.apiCallCount || 0}</div>
              </div>
              <div style={{ background: "#14151a", borderRadius: 8, padding: 14 }}>
                <div style={{ color: "#666", fontSize: 11, marginBottom: 4 }}>Quota Aşım Sayısı</div>
                <div style={{ color: youtubeData?.quotaExceeded > 0 ? "#ef4444" : "#4ade80", fontSize: 14 }}>{youtubeData?.quotaExceeded || 0}</div>
              </div>
              <div style={{ background: "#14151a", borderRadius: 8, padding: 14 }}>
                <div style={{ color: "#666", fontSize: 11, marginBottom: 4 }}>Cache Süresi</div>
                <div style={{ color: "#f8fafc", fontSize: 14 }}>{youtubeData?.cacheDurationMin || 60} dk</div>
              </div>
            </div>
          </div>

          {/* Warmup Ayarları */}
          <div style={{ background: "#1a1a2e", border: "1px solid #2a2a3a", borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <h3 style={{ color: "#f59e0b", fontSize: 16, margin: "0 0 16px 0" }}>⏱️ Warmup Ayarları</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={{ color: "#94a3b8", fontSize: 13 }}>Güncelleme aralığı:</span>
              <input type="number" min="10" max="1440"
                style={{ ...styles.input, width: 80, textAlign: "center" }}
                defaultValue={youtubeData?.warmupIntervalMin || 50}
                id="warmupInterval" />
              <span style={{ color: "#666", fontSize: 12 }}>dakika</span>
              <button style={{ ...styles.primaryBtn, fontSize: 12, padding: "6px 14px" }} onClick={() => {
                const val = parseInt(document.getElementById("warmupInterval").value);
                if (val < 10 || val > 1440) return alert("10-1440 dakika arası olmalı");
                fetch(`${API_URL}/admin/youtube`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "X-App-Key": "RINGTONE_MASTER_V2_SECRET_2026" },
                  body: JSON.stringify({ warmupInterval: val })
                }).then(r => r.json()).then(d => {
                  if (d.success) { alert(`✅ Warmup aralığı ${val} dakika olarak ayarlandı`); fetchYoutubeData(); }
                }).catch(() => alert("Hata!"));
              }}>Uygula</button>
            </div>
            <button style={{ ...styles.primaryBtn, backgroundColor: "#10b981" }} onClick={() => {
              fetch(`${API_URL}/admin/youtube`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-App-Key": "RINGTONE_MASTER_V2_SECRET_2026" },
                body: JSON.stringify({ forceWarmup: true })
              }).then(r => r.json()).then(d => {
                if (d.success) alert("✅ Top50 manuel ısıtma başlatıldı!");
              }).catch(() => alert("Hata!"));
            }}>🔥 Şimdi Isıt (Manuel)</button>
          </div>

          {/* Aktif Ülkeler */}
          <div style={{ background: "#1a1a2e", border: "1px solid #2a2a3a", borderRadius: 10, padding: 20 }}>
            <h3 style={{ color: "#0ea5e9", fontSize: 16, margin: "0 0 16px 0" }}>🌍 Aktif Ülkeler ({youtubeData?.activeRegions?.length || 0})</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {(youtubeData?.activeRegions || []).map((r, i) => (
                <div key={i} style={{ background: "#14151a", border: "1px solid #2a2a3a", borderRadius: 8, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{String.fromCodePoint(...r.region.split("").map(c => 127397 + c.charCodeAt(0)))}</span>
                  <span style={{ color: "#f8fafc", fontSize: 13, fontWeight: 500 }}>{r.region}</span>
                  <span style={{ color: r.cached ? "#4ade80" : "#ef4444", fontSize: 11 }}>
                    {r.cached ? `${r.trackCount} şarkı` : "cache yok"}
                  </span>
                  <button style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14, padding: "0 4px" }}
                    onClick={() => {
                      if (!window.confirm(`${r.region} ülkesini kaldırmak istediğine emin misin?`)) return;
                      fetch(`${API_URL}/admin/youtube`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "X-App-Key": "RINGTONE_MASTER_V2_SECRET_2026" },
                        body: JSON.stringify({ removeRegion: r.region })
                      }).then(res => res.json()).then(d => { if (d.success) fetchYoutubeData(); }).catch(() => {});
                    }}>✕</button>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="text" placeholder="Ülke kodu (ör: DE, FR)" maxLength={2}
                style={{ ...styles.input, width: 160, textTransform: "uppercase" }}
                value={newRegion} onChange={e => setNewRegion(e.target.value.toUpperCase())} />
              <button style={{ ...styles.primaryBtn, backgroundColor: "#10b981" }} onClick={() => {
                if (newRegion.length !== 2) return alert("2 harfli ülke kodu girin (ör: DE, FR, GB)");
                fetch(`${API_URL}/admin/youtube`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "X-App-Key": "RINGTONE_MASTER_V2_SECRET_2026" },
                  body: JSON.stringify({ addRegion: newRegion })
                }).then(r => r.json()).then(d => {
                  if (d.success) { setNewRegion(""); fetchYoutubeData(); }
                }).catch(() => alert("Hata!"));
              }}>➕ Ülke Ekle</button>
            </div>
            <p style={{ color: "#666", fontSize: 11, marginTop: 12 }}>
              Kullanıcılar bir ülkeden istek attığında o ülke otomatik eklenir. Burada manuel ekleme/kaldırma yapabilirsin.
            </p>
          </div>
        </div>}



    </div>
    </div>
    </div>
  );
}

const styles = {
  container: { backgroundColor: "#14151a", minHeight: "100vh", color: "#e2e8f0", fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif", padding: "40px 20px" },
  content: { maxWidth: 1000, margin: "0 auto", display: "flex", flexDirection: "column", gap: 30 },
  card: { backgroundColor: "#1e1e24", padding: 30, borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" },
  title: { margin: "0 0 25px 0", fontSize: 20, fontWeight: "600", color: "#f8fafc" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  inputGroup: { display: "flex", gap: 15, alignItems: "center", flexWrap: "wrap", marginBottom: 25 },
  labelCheckbox: { fontSize: 15, color: "#cbd5e1", display: "flex", alignItems: "center", cursor: "pointer" },
  label: { fontSize: 13, color: "#94a3b8", display: "block", marginBottom: 8, fontWeight: "500" },
  input: { backgroundColor: "#272a33", border: "1px solid #3f3f46", color: "#f8fafc", padding: "10px 15px", borderRadius: 8, outline: "none", fontSize: 14 },
  inputDisabled: { backgroundColor: "#1a1c21", border: "1px solid #3f3f46", color: "#64748b", padding: "12px 15px", borderRadius: 8, width: "100%", fontSize: 14, boxSizing: "border-box" },
  select: { backgroundColor: "#272a33", border: "1px solid #3f3f46", color: "#f8fafc", padding: "10px 15px", borderRadius: 8, outline: "none", fontSize: 14, cursor: "pointer" },
  selectDark: { backgroundColor: "#1e1e24", border: "1px solid #3f3f46", color: "#0ea5e9", padding: "12px 15px", borderRadius: 8, outline: "none", width: "100%", fontSize: 14, cursor: "pointer", boxSizing: "border-box" },
  primaryBtn: { backgroundColor: "#3f3f46", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", transition: "all 0.2s", fontSize: 14, fontWeight: "500" },
  textBtn: { backgroundColor: "transparent", color: "#ef4444", border: "none", cursor: "pointer", fontWeight: "500" },
  list: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 },
  listItem: { display: "flex", justifyContent: "space-between", backgroundColor: "#272a33", padding: "12px 20px", borderRadius: 8, fontSize: 14 },
  
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: { textAlign: "left", padding: "15px 15px", color: "#94a3b8", fontWeight: "600", borderBottom: "1px solid #272a33" },
  thRight: { textAlign: "right", padding: "15px 15px", color: "#94a3b8", fontWeight: "600", borderBottom: "1px solid #272a33" },
  tr: { borderBottom: "1px solid #272a33", transition: "background 0.2s" },
  td: { padding: "20px 15px", verticalAlign: "top" },
  tdRight: { padding: "20px 15px", textAlign: "right", verticalAlign: "top" },
  actionBtn: { background: "none", border: "none", color: "#0ea5e9", cursor: "pointer", fontSize: 14, padding: 0 },
  
  chipContainer: { display: "flex", flexWrap: "wrap", gap: 10 },
  chip: { backgroundColor: "#272a33", padding: "6px 14px", borderRadius: 20, fontSize: 13, color: "#f8fafc", border: "1px solid #3f3f46" },
  
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modal: { backgroundColor: "#23262e", width: "100%", maxWidth: 650, borderRadius: 12, boxShadow: "0 25px 50px rgba(0,0,0,0.5)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 30px", borderBottom: "1px solid #3f3f46" },
  modalTitle: { margin: 0, fontSize: 18, color: "#f8fafc", fontWeight: "600" },
  cancelBtn: { backgroundColor: "#3f3f46", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", marginRight: 12, fontSize: 14 },
  saveBtn: { backgroundColor: "#0ea5e9", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: "500" },
  modalBody: { padding: "30px" },
  formGroup: { marginBottom: 25 },
  
  chipsInputBox: { backgroundColor: "#1e1e24", border: "1px solid #3f3f46", borderRadius: 8, padding: "15px", display: "flex", flexWrap: "wrap", gap: 10, minHeight: 120 },
  chipEditable: { backgroundColor: "#3f3f46", padding: "6px 12px", borderRadius: 6, fontSize: 13, display: "flex", alignItems: "center", gap: 10, color: "#f8fafc" },
  chipClose: { cursor: "pointer", color: "#94a3b8", fontSize: 14 },
  chipInput: { background: "transparent", border: "none", color: "#fff", outline: "none", flex: 1, minWidth: 200, fontSize: 14 },
  
  filterBox: { backgroundColor: "#1e1e24", border: "1px solid #3f3f46", borderRadius: 8, padding: "20px" },
  multiSelectHeader: { backgroundColor: "#1e1e24", border: "1px solid #0ea5e9", color: "#f8fafc", padding: "12px 15px", borderRadius: 8, cursor: "pointer", fontSize: 14, userSelect: "none" },
  multiSelectList: { position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "#1e1e24", border: "1px solid #3f3f46", borderTop: "none", borderRadius: "0 0 8px 8px", maxHeight: 250, overflowY: "auto", zIndex: 10, marginTop: -2 },
  multiSelectItem: { display: "flex", alignItems: "center", padding: "10px 15px", cursor: "pointer", borderBottom: "1px solid #272a33", fontSize: 14, color: "#cbd5e1" }
};

export default App;

