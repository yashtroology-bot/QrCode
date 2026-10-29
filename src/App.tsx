import { useState, useRef, useEffect } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Download,
  Copy,
  Check,
  Moon,
  Sun,
  Globe,
  FileText,
  Phone,
  Mail,
  Wifi,
  Palette,
  Sliders,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  Zap,
  Image as ImageIcon
} from 'lucide-react';

type InputType = 'url' | 'text' | 'phone' | 'email' | 'wifi';
type ErrorLevel = 'L' | 'M' | 'Q' | 'H';

const PRESET_COLORS = [
  { fg: '#000000', bg: '#FFFFFF', name: 'Classic' },
  { fg: '#4F46E5', bg: '#EEF2FF', name: 'Indigo' },
  { fg: '#0F766E', bg: '#F0FDFA', name: 'Teal' },
  { fg: '#1E293B', bg: '#F8FAFC', name: 'Slate' },
  { fg: '#BE123C', bg: '#FFF1F2', name: 'Rose' },
  { fg: '#6D28D9', bg: '#F5F3FF', name: 'Purple' },
];

export function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('qr_dark_mode');
      if (saved !== null) return saved === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // QR Content State
  const [inputType, setInputType] = useState<InputType>('url');
  const [inputValue, setInputValue] = useState<string>('https://www.troology.com.sg/');
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Customization States
  const [fgColor, setFgColor] = useState<string>('#000000');
  const [bgColor, setBgColor] = useState<string>('#FFFFFF');
  const [qrSize, setQrSize] = useState<number>(240);
  const [errorLevel, setErrorLevel] = useState<ErrorLevel>('H');
  const [includeMargin, setIncludeMargin] = useState<boolean>(true);
  const [includeTextLabel, setIncludeTextLabel] = useState<boolean>(true);
  const [customLabel, setCustomLabel] = useState<string>('');

  // WiFi specific states
  const [wifiSsid, setWifiSsid] = useState<string>('');
  const [wifiPass, setWifiPass] = useState<string>('');
  const [wifiType, setWifiType] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');

  // Phone / Email helpers
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [emailTo, setEmailTo] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');

  const qrCanvasContainerRef = useRef<HTMLDivElement>(null);

  // Sync dark mode class with DOM
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('qr_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('qr_dark_mode', 'false');
    }
  }, [darkMode]);

  // Compute final QR payload
  const getQrPayload = (): string => {
    switch (inputType) {
      case 'url':
        return inputValue.trim();
      case 'text':
        return inputValue;
      case 'phone':
        return phoneNumber ? `tel:${phoneNumber.trim()}` : '';
      case 'email':
        return emailTo ? `mailto:${emailTo.trim()}${emailSubject ? `?subject=${encodeURIComponent(emailSubject)}` : ''}` : '';
      case 'wifi':
        if (!wifiSsid) return '';
        return `WIFI:T:${wifiType};S:${wifiSsid};P:${wifiPass};;`;
      default:
        return inputValue;
    }
  };

  const payload = getQrPayload() || 'https://www.troology.com.sg/';
  const displayLabel = customLabel || (inputType === 'url' ? inputValue : payload);

  // Reset colors to default
  const resetColors = () => {
    setFgColor('#000000');
    setBgColor('#FFFFFF');
  };

  // Swap foreground and background
  const swapColors = () => {
    setFgColor(bgColor);
    setBgColor(fgColor);
  };

  // High-Resolution PNG Download
  const downloadPng = () => {
    try {
      const exportCanvas = document.createElement('canvas');
      const exportCtx = exportCanvas.getContext('2d');
      if (!exportCtx) return;

      const baseQrSize = 1000; // High resolution for clear print & scanning
      const padding = includeMargin ? 80 : 40;
      const textHeight = includeTextLabel ? 120 : 0;

      const totalWidth = baseQrSize + padding * 2;
      const totalHeight = baseQrSize + padding * 2 + textHeight;

      exportCanvas.width = totalWidth;
      exportCanvas.height = totalHeight;

      // 1. Fill Background
      exportCtx.fillStyle = bgColor;
      exportCtx.fillRect(0, 0, totalWidth, totalHeight);

      // 2. Render QR onto temporary canvas via DOM or drawing
      const qrCanvas = qrCanvasContainerRef.current?.querySelector('canvas');
      if (qrCanvas) {
        exportCtx.drawImage(qrCanvas, padding, padding, baseQrSize, baseQrSize);
      }

      // 3. Render optional text label under QR
      if (includeTextLabel && displayLabel) {
        exportCtx.fillStyle = fgColor;
        exportCtx.textAlign = 'center';
        exportCtx.textBaseline = 'middle';
        exportCtx.font = `600 36px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`;

        // Truncate text if excessively long for canvas width
        let textToShow = displayLabel;
        if (textToShow.length > 55) {
          textToShow = textToShow.slice(0, 52) + '...';
        }

        exportCtx.fillText(textToShow, totalWidth / 2, baseQrSize + padding + 60);
      }

      // 4. Trigger download
      const dataUrl = exportCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `qrcode-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      setDownloadSuccess('PNG downloaded in Ultra-HD!');
      setTimeout(() => setDownloadSuccess(null), 3500);
    } catch (err) {
      console.error('Failed to download QR code:', err);
    }
  };

  // SVG Download
  const downloadSvg = () => {
    try {
      const svgElement = qrCanvasContainerRef.current?.querySelector('svg');
      if (!svgElement) return;

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `qrcode-${Date.now()}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      setDownloadSuccess('Vector SVG downloaded!');
      setTimeout(() => setDownloadSuccess(null), 3500);
    } catch (err) {
      console.error('Failed to download SVG:', err);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      const qrCanvas = qrCanvasContainerRef.current?.querySelector('canvas');
      if (!qrCanvas) return;

      qrCanvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } else {
          // Fallback: copy raw text
          await navigator.clipboard.writeText(payload);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        }
      });
    } catch (err) {
      console.error('Copy failed:', err);
      // Fallback
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200 flex flex-col justify-between">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-3xl" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Instant QR
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                  Stateless
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                100% Client-Side • Private • Permanent
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Zero tracking or servers</span>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all shadow-sm"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
        {/* Hero title */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant Real-Time Generation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Generate Static QR Codes Instantly
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Type a URL, text, or phone number below. The QR code generates in real-time right inside your browser.
          </p>
        </div>

        {/* 2-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Input and Customization Controls (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Input Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Select Content Type
                </span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Live updating
                </span>
              </div>

              {/* Type Switcher Tabs */}
              <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl mb-5">
                {[
                  { id: 'url', label: 'URL', icon: Globe },
                  { id: 'text', label: 'Text', icon: FileText },
                  { id: 'phone', label: 'Phone', icon: Phone },
                  { id: 'email', label: 'Email', icon: Mail },
                  { id: 'wifi', label: 'WiFi', icon: Wifi },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = inputType === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setInputType(item.id as InputType)}
                      className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Inputs based on type */}
              {inputType === 'url' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Website or Link URL
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                    />
                    {inputValue && (
                      <button
                        onClick={() => setInputValue('')}
                        className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-400">Quick suggestions:</span>
                    <button
                      onClick={() => setInputValue('https://www.troology.com.sg/')}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Troology.com.sg
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => setInputValue('https://google.com')}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Google
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => setInputValue('https://github.com')}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      GitHub
                    </button>
                  </div>
                </div>
              )}

              {inputType === 'text' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Plain Text Message
                  </label>
                  <textarea
                    rows={4}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter any text, address, or serial code..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none font-sans"
                  />
                  <div className="mt-1 text-right text-xs text-slate-400">
                    {inputValue.length} characters
                  </div>
                </div>
              )}

              {inputType === 'phone' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Phone Number (With Country Code)
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+65 9123 4567 or +91 9876543210"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                  />
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    Scanning will prompt the user&apos;s phone to directly dial this number.
                  </p>
                </div>
              )}

              {inputType === 'email' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Recipient Email
                    </label>
                    <input
                      type="email"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      placeholder="info@troology.com.sg"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Subject (Optional)
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Inquiry from QR Code"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              {inputType === 'wifi' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Network Name (SSID)
                    </label>
                    <input
                      type="text"
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      placeholder="e.g. Office_Guest_WiFi"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Password
                      </label>
                      <input
                        type="password"
                        value={wifiPass}
                        onChange={(e) => setWifiPass(e.target.value)}
                        placeholder="WiFi Password"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Security Type
                      </label>
                      <select
                        value={wifiType}
                        onChange={(e) => setWifiType(e.target.value as 'WPA' | 'WEP' | 'nopass')}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="WPA">WPA / WPA2 (Default)</option>
                        <option value="WEP">WEP</option>
                        <option value="nopass">None (Open Network)</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Guests can scan to connect to your WiFi automatically without typing passwords.
                  </p>
                </div>
              )}
            </div>

            {/* Customization Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Styling & Color Customization
                  </h3>
                </div>
                <button
                  onClick={resetColors}
                  className="text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 font-medium transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              {/* Color Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Quick Color Themes
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        setFgColor(preset.fg);
                        setBgColor(preset.bg);
                      }}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all flex flex-col items-center gap-1.5 group"
                    >
                      <div
                        className="w-7 h-7 rounded-lg border border-black/10 flex items-center justify-center shadow-inner"
                        style={{ backgroundColor: preset.bg }}
                      >
                        <div
                          className="w-3.5 h-3.5 rounded-sm"
                          style={{ backgroundColor: preset.fg }}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 group-hover:text-indigo-600">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Foreground Color */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Foreground (Dots)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-600 bg-transparent p-0.5"
                    />
                    <input
                      type="text"
                      value={fgColor.toUpperCase()}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-24 px-2 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 uppercase"
                    />
                  </div>
                </div>

                {/* Background Color */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Background Color
                    </label>
                    <button
                      onClick={swapColors}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Invert
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-600 bg-transparent p-0.5"
                    />
                    <input
                      type="text"
                      value={bgColor.toUpperCase()}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-24 px-2 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Options & Labeling */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Print & Framing Options
                  </span>
                </div>

                {/* Text Label Below QR (User's Favorite Feature) */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Include URL / Text Under QR Code
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Prints the full destination text below the QR image for easy reading.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeTextLabel}
                        onChange={(e) => setIncludeTextLabel(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {includeTextLabel && (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={customLabel}
                        onChange={(e) => setCustomLabel(e.target.value)}
                        placeholder={displayLabel}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Leave blank to automatically use the destination URL.
                      </span>
                    </div>
                  )}
                </div>

                {/* Error Correction Level and Margin */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Error Correction Level
                    </label>
                    <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      {(['L', 'M', 'Q', 'H'] as ErrorLevel[]).map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => setErrorLevel(lvl)}
                          className={`py-1 text-xs font-bold rounded ${
                            errorLevel === lvl
                              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Quiet Zone (Margin)
                    </label>
                    <button
                      onClick={() => setIncludeMargin(!includeMargin)}
                      className={`w-full py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                        includeMargin
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {includeMargin ? 'Margin Enabled (Recommended)' : 'Tight Fit (No Margin)'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live QR Preview & Download (5 Cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Live Preview
                </span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Level {errorLevel}
                </span>
              </div>

              {/* QR Code Container */}
              <div
                ref={qrCanvasContainerRef}
                className="p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all flex flex-col items-center justify-center max-w-full"
                style={{ backgroundColor: bgColor }}
              >
                {/* Canvas renderer for live preview & PNG extraction */}
                <div className="flex items-center justify-center">
                  <QRCodeCanvas
                    value={payload}
                    size={qrSize}
                    fgColor={fgColor}
                    bgColor={bgColor}
                    level={errorLevel}
                    marginSize={includeMargin ? 2 : 0}
                  />
                </div>

                {/* Optional visible text label underneath in preview */}
                {includeTextLabel && displayLabel && (
                  <p
                    className="mt-3 text-center font-bold text-xs sm:text-sm tracking-tight break-all max-w-[280px]"
                    style={{ color: fgColor }}
                  >
                    {displayLabel}
                  </p>
                )}

                {/* Hidden SVG for vector download */}
                <div className="hidden">
                  <QRCodeSVG
                    value={payload}
                    size={qrSize}
                    fgColor={fgColor}
                    bgColor={bgColor}
                    level={errorLevel}
                    marginSize={includeMargin ? 2 : 0}
                  />
                </div>
              </div>

              {/* Size Adjustment Slider */}
              <div className="w-full mt-6 px-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>Display Size</span>
                  <span className="font-mono">{qrSize}px</span>
                </div>
                <input
                  type="range"
                  min="160"
                  max="320"
                  step="10"
                  value={qrSize}
                  onChange={(e) => setQrSize(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none"
                />
              </div>

              {/* Download Notification Toast */}
              {downloadSuccess && (
                <div className="mt-4 w-full p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 animate-fade-in">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{downloadSuccess}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="w-full mt-6 space-y-3">
                {/* Primary Download PNG Button */}
                <button
                  onClick={downloadPng}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm shadow-md shadow-indigo-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 group"
                >
                  <Download className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
                  <span>Download QR Code (PNG)</span>
                </button>

                {/* Secondary Actions (Copy & SVG) */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={copyToClipboard}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Image</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={downloadSvg}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                    title="Download vector SVG for high quality print"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Download SVG</span>
                  </button>
                </div>
              </div>

              {/* Status Note */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 w-full text-center">
                <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1">
                  <span>Export resolution: 1000 × 1000px Ultra HD</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Instant QR Generator • 100% Client-Side React Application
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Stateless & No Database
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
