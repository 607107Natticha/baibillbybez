import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const CURRENCY_DISPLAY_KEY = 'sabaibill_currency_display';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const PROTECTED_PATHS = ['/dashboard', '/history', '/customers', '/settings', '/create-document', '/documents'];

const CurrencyContext = createContext({
  displayCurrency: 'primary',
  setDisplayCurrency: () => {},
  formatCurrency: () => '',
  currencySettings: null,
});

export function CurrencyProvider({ children }) {
  const location = useLocation();
  const [displayCurrency, setDisplayCurrencyState] = useState(() => localStorage.getItem(CURRENCY_DISPLAY_KEY) || 'primary');
  const [currencySettings, setCurrencySettings] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const onProtected = PROTECTED_PATHS.some((p) => location.pathname === p || location.pathname.startsWith(p + '/'));
    if (!token || !onProtected) return;
    axios.get(`${API_URL}/api/settings`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setCurrencySettings(res.data))
      .catch(() => setCurrencySettings(null));
  }, [location.pathname]);

  const setDisplayCurrency = useCallback((value) => {
    setDisplayCurrencyState(value);
    localStorage.setItem(CURRENCY_DISPLAY_KEY, value);
  }, []);

  const formatCurrency = useCallback((amount) => {
    const num = Number(amount) || 0;
    const opts = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
    if (displayCurrency === 'secondary' && currencySettings?.secondaryCurrency && currencySettings?.exchangeRateToSecondary) {
      const converted = num / Number(currencySettings.exchangeRateToSecondary);
      const code = currencySettings.secondaryCurrency;
      const sym = code === 'USD' ? '$' : code === 'EUR' ? '€' : code === 'THB' ? '฿' : code;
      return `${converted.toLocaleString(undefined, opts)} ${sym}`;
    }
    const sym = currencySettings?.currencySymbol || '฿';
    return `${num.toLocaleString(undefined, opts)} ${sym}`;
  }, [displayCurrency, currencySettings]);

  return (
    <CurrencyContext.Provider value={{ displayCurrency, setDisplayCurrency, formatCurrency, currencySettings }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  return {
    displayCurrency: ctx.displayCurrency ?? 'primary',
    setDisplayCurrency: ctx.setDisplayCurrency ?? (() => {}),
    formatCurrency: ctx.formatCurrency ?? ((amount) => `${(Number(amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} ฿`),
    currencySettings: ctx.currencySettings,
  };
}

export default CurrencyContext;
