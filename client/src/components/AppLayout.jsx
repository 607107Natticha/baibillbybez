import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  ClockIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { t } from '../utils/translations';
import { useLanguage, useSetLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import BottomNav from './BottomNav';

const navItems = [
  { path: '/dashboard', labelKey: 'home', Icon: HomeIcon },
  { path: '/history', labelKey: 'history', Icon: ClockIcon },
  { path: '/customers', labelKey: 'customers', Icon: UsersIcon },
  { path: '/settings', labelKey: 'settings', Icon: Cog6ToothIcon },
];

export default function AppLayout({ children, title }) {
  const navigate = useNavigate();
  const location = useLocation();
  const language = useLanguage();
  const setLanguage = useSetLanguage();
  const { displayCurrency, setDisplayCurrency, currencySettings } = useCurrency();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'th' ? 'en' : 'th');
  };

  const isActive = (path) => location.pathname === path || (path === '/dashboard' && location.pathname === '/');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top bar: mobile = logo + title; desktop = full navbar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="max-w-3xl mx-auto px-4 grid grid-cols-[1fr_auto] items-center gap-2 h-14 lg:h-16 min-w-0">
          <Link
            to="/dashboard"
            className="flex items-center min-h-touch rounded-2xl p-2 hover:bg-gray-50 transition-colors w-fit lg:justify-self-end"
          >
            <img src="/logo.png" alt="Sabaibill" className="h-9 w-9 shrink-0 object-contain rounded-full border border-gray-100" />
          </Link>

          {/* Mobile: สกุลเงิน (ถ้ามี) | เปลี่ยนภาษา | ออกระบบ */}
          <div className="flex lg:hidden items-center justify-end gap-2 min-w-0">
            {currencySettings?.secondaryCurrency && (
              <button
                onClick={() => setDisplayCurrency(displayCurrency === 'primary' ? 'secondary' : 'primary')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl min-h-touch text-gray-600 hover:bg-gray-100 transition-colors font-medium text-sm touch-target"
                title={language === 'th' ? 'สลับสกุลเงิน' : 'Toggle currency'}
              >
                <span className="text-sm whitespace-nowrap">{displayCurrency === 'primary' ? (currencySettings?.currencySymbol || '฿') : currencySettings?.secondaryCurrency}</span>
              </button>
            )}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl min-h-touch text-gray-600 hover:bg-gray-100 transition-colors font-medium text-sm touch-target"
              aria-label={language === 'th' ? 'เปลี่ยนภาษา' : 'Language'}
            >
              <GlobeAltIcon className="w-5 h-5 shrink-0" />
              <span className="text-sm whitespace-nowrap">{language === 'th' ? 'TH' : 'EN'}</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl min-h-touch text-red-600 hover:bg-red-50 transition-colors font-medium text-sm touch-target"
              aria-label={t('logout', language)}
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
              <span className="text-sm whitespace-nowrap">{t('logout', language)}</span>
            </button>
          </div>

          {/* Desktop: โลโก้ | หน้าหลัก | ประวัติ | ลูกค้า | ตั้งค่า | เปลี่ยนภาษา | ออกระบบ */}
          <div className="hidden lg:flex items-center justify-end gap-2 min-w-0">
            {navItems.map(({ path, labelKey, Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl min-h-touch transition-all duration-200 ${
                  isActive(path) ? 'bg-brand-light text-brand-primary font-semibold' : 'text-gray-600 hover:bg-gray-100 font-medium'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-sm whitespace-nowrap">{t(labelKey, language)}</span>
              </Link>
            ))}
            {currencySettings?.secondaryCurrency && (
              <>
                <span className="w-px h-5 bg-gray-200 shrink-0" aria-hidden />
                <button
                  onClick={() => setDisplayCurrency(displayCurrency === 'primary' ? 'secondary' : 'primary')}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl min-h-touch text-gray-600 hover:bg-gray-100 transition-colors font-medium text-sm"
                  title={language === 'th' ? 'สลับสกุลเงิน' : 'Toggle currency'}
                >
                  <span className="text-sm whitespace-nowrap">{displayCurrency === 'primary' ? (currencySettings?.currencySymbol || '฿') : currencySettings?.secondaryCurrency}</span>
                </button>
              </>
            )}
            <span className="w-px h-5 bg-gray-200 shrink-0" aria-hidden />
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-2 rounded-xl min-h-touch text-gray-600 hover:bg-gray-100 transition-colors font-medium text-sm"
              aria-label={language === 'th' ? 'เปลี่ยนภาษา' : 'Language'}
            >
              <GlobeAltIcon className="w-5 h-5 shrink-0" />
              <span className="text-sm whitespace-nowrap">{language === 'th' ? 'TH' : 'EN'}</span>
            </button>
            <span className="w-px h-5 bg-gray-200 shrink-0" aria-hidden />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl min-h-touch text-red-600 hover:bg-red-50 transition-colors font-medium text-sm"
              aria-label={t('logout', language)}
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
              <span className="text-sm whitespace-nowrap">{t('logout', language)}</span>
            </button>
          </div>
        </div>
        {title && (
          <div className="lg:hidden border-t border-gray-100 px-4 py-2.5 bg-gray-50/80">
            <h1 className="text-base font-semibold text-gray-800 truncate">{title}</h1>
          </div>
        )}
      </header>

      {/* Main content: page transition fade-in */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-4 pb-24 lg:pb-8">
        <div key={location.pathname} className="animate-fadeIn">
          {children}
        </div>
      </main>

      {/* Bottom nav: mobile/tablet only */}
      <BottomNav />
    </div>
  );
}
