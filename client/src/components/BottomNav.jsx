import { NavLink, useLocation } from 'react-router-dom';
import { HomeIcon, ClockIcon, UsersIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeIconSolid, ClockIcon as ClockIconSolid, UsersIcon as UsersIconSolid, Cog6ToothIcon as Cog6ToothIconSolid } from '@heroicons/react/24/solid';
import { t } from '../utils/translations';
import { useLanguage } from '../context/LanguageContext';

const navItems = [
  { path: '/dashboard', labelKey: 'home', Icon: HomeIcon, IconActive: HomeIconSolid },
  { path: '/history', labelKey: 'history', Icon: ClockIcon, IconActive: ClockIconSolid },
  { path: '/customers', labelKey: 'customers', Icon: UsersIcon, IconActive: UsersIconSolid },
  { path: '/settings', labelKey: 'settings', Icon: Cog6ToothIcon, IconActive: Cog6ToothIconSolid },
];

export default function BottomNav() {
  const location = useLocation();
  const language = useLanguage();
  const getLabel = (labelKey) => t(labelKey, language);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-1px_3px_rgba(0,0,0,0.06)] safe-area-pb lg:hidden"
      aria-label="Bottom navigation"
    >
      {/* ลำดับเหมือนแถบบน: หน้าหลัก | ประวัติ | ลูกค้า | ตั้งค่า — ระยะห่างเท่ากัน EN/TH */}
      <div className="max-w-3xl mx-auto flex items-stretch gap-2 px-2 py-2">
        {navItems.map(({ path, labelKey, Icon, IconActive }) => {
          const isActive = location.pathname === path || (path === '/dashboard' && location.pathname === '/');
          const ActiveIcon = isActive ? IconActive : Icon;
          return (
            <NavLink
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center min-h-touch flex-1 rounded-xl gap-1 py-2 transition-all duration-200 touch-target min-w-0 ${
                isActive ? 'text-brand-primary bg-brand-light font-semibold' : 'text-gray-500 hover:bg-gray-50 font-medium'
              }`}
              end={path === '/dashboard'}
            >
              <ActiveIcon className="w-6 h-6 shrink-0" aria-hidden />
              <span className="text-xs leading-tight text-center whitespace-nowrap">{getLabel(labelKey)}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
