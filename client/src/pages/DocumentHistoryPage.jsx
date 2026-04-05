import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search, Layers, Eye, Filter, Trash2, Copy, Download } from 'lucide-react';
import * as XLSX from 'xlsx/xlsx.mjs';
import { getDocTypeName, t } from '../utils/translations';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const TYPE_ORDER = ['QT', 'SO', 'DO', 'IV'];

// Soft UI status tags: pastel colors for readability
const STATUS_CONFIG = {
  'ร่าง': { color: 'bg-gray-100 text-gray-600 border-gray-200', label: { th: 'ร่าง', en: 'Draft' } },
  'ส่งแล้ว': { color: 'bg-blue-50 text-blue-800 border-blue-100', label: { th: 'ส่งแล้ว', en: 'Sent' } },
  'อนุมัติ': { color: 'bg-green-50 text-green-800 border-green-100', label: { th: 'อนุมัติ', en: 'Approved' } },
  'ยืนยัน': { color: 'bg-orange-50 text-orange-800 border-orange-100', label: { th: 'ยืนยัน', en: 'Confirmed' } },
  'จัดส่งแล้ว': { color: 'bg-purple-50 text-purple-800 border-purple-100', label: { th: 'จัดส่งแล้ว', en: 'Delivered' } },
  'ค้างชำระ': { color: 'bg-amber-50 text-amber-800 border-amber-100', label: { th: 'รอชำระ', en: 'Pending' } },
  'ชำระแล้ว': { color: 'bg-emerald-50 text-emerald-800 border-emerald-100', label: { th: 'จ่ายแล้ว', en: 'Paid' } },
  'ยกเลิก': { color: 'bg-gray-100 text-gray-500 border-gray-200', label: { th: 'ยกเลิก', en: 'Cancelled' } },
};


const getCustomerLabel = (doc, language) => {
  if (!doc) return '-';
  return (language === 'en' && doc.customerEn) ? doc.customerEn : (doc.customer || '-');
};

const getStatusLabel = (status, language) => {
  const cfg = STATUS_CONFIG[status];
  return cfg?.label?.[language] || status || '-';
};

const getStageDoc = (docs, type) => {
  const candidates = docs.filter((d) => d.type === type);
  if (candidates.length === 0) return null;
  return candidates
    .slice()
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))[0];
};

const DocumentHistoryPage = () => {
  const navigate = useNavigate();
  const language = useLanguage();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [incompleteOnly, setIncompleteOnly] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, docNo } for modal
  const { formatCurrency } = useCurrency();
  const now = new Date();
  const [exportMonth, setExportMonth] = useState(String(now.getMonth() + 1));
  const [exportYear, setExportYear] = useState(String(now.getFullYear()));

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/documents`);
        setDocuments(res.data || []);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const statusOptions = useMemo(() => {
    const set = new Set();
    (documents || []).forEach((d) => d?.status && set.add(d.status));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'th'));
  }, [documents]);

  const groups = useMemo(() => {
    const docs = documents || [];
    const noMap = new Map(docs.filter((d) => d?.no).map((d) => [d.no, d]));
    const rootCache = new Map();

    const getRootNo = (doc) => {
      if (!doc?.no) return null;
      if (rootCache.has(doc.no)) return rootCache.get(doc.no);
      const seen = new Set([doc.no]);
      let cur = doc;
      let root = doc.no;
      while (cur?.refNo && noMap.has(cur.refNo) && !seen.has(cur.refNo)) {
        seen.add(cur.refNo);
        cur = noMap.get(cur.refNo);
        root = cur.no;
      }
      rootCache.set(doc.no, root);
      return root;
    };

    const map = new Map();
    for (const d of docs) {
      const rootNo = getRootNo(d);
      if (!rootNo) continue;
      const arr = map.get(rootNo) || [];
      arr.push(d);
      map.set(rootNo, arr);
    }

    const list = Array.from(map.entries()).map(([rootNo, setDocs]) => {
      const qt = getStageDoc(setDocs, 'QT');
      const so = getStageDoc(setDocs, 'SO');
      const doDoc = getStageDoc(setDocs, 'DO');
      const iv = getStageDoc(setDocs, 'IV');

      const latest = setDocs
        .slice()
        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))[0];

      const total = (iv?.netPayable != null ? iv.netPayable : iv?.total) ?? (latest?.netPayable != null ? latest.netPayable : latest?.total) ?? 0;
      const customer = getCustomerLabel(qt || latest, language);

      const stageDocs = { QT: qt, SO: so, DO: doDoc, IV: iv };
      const missing = ['SO', 'DO', 'IV'].filter((k) => !stageDocs[k]);
      const incomplete = missing.length > 0;

      return {
        rootNo,
        docs: setDocs,
        stageDocs,
        incomplete,
        latestDate: latest?.updatedAt || latest?.createdAt || null,
        customer,
        total,
      };
    });

    return list.sort((a, b) => new Date(b.latestDate || 0) - new Date(a.latestDate || 0));
  }, [documents, language]);

  const handleDeleteDocument = (id, docNo) => {
    setDeleteConfirm({ id, docNo });
  };

  const handleDeleteConfirmClose = () => setDeleteConfirm(null);

  const handleDeleteConfirmSubmit = async () => {
    if (!deleteConfirm) return;
    const { id } = deleteConfirm;
    setDeletingId(id);
    try {
      await axios.delete(`${API_URL}/api/documents/${id}`);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Delete document error:', err);
      alert(err.response?.data?.message || (language === 'th' ? 'ลบเอกสารไม่สำเร็จ' : 'Failed to delete document'));
    } finally {
      setDeletingId(null);
    }
  };

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups.filter((g) => {
      if (incompleteOnly && !g.incomplete) return false;
      if (typeFilter !== 'ALL' && !g.stageDocs[typeFilter]) return false;

      if (statusFilter !== 'ALL') {
        const matchesStatus = Object.values(g.stageDocs).some((d) => {
          if (!d) return false;
          if (typeFilter !== 'ALL' && d.type !== typeFilter) return false;
          return d.status === statusFilter;
        });
        if (!matchesStatus) return false;
      }

      if (!q) return true;
      const haystack = [
        g.rootNo,
        g.customer,
        ...(g.docs || []).map((d) => d?.no),
        ...(g.docs || []).map((d) => (language === 'en' ? d?.customerEn : d?.customer)),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [groups, incompleteOnly, query, statusFilter, typeFilter, language]);

  const metrics = useMemo(() => {
    const docs = documents || [];
    const counts = { QT: 0, SO: 0, DO: 0, IV: 0 };
    for (const d of docs) if (counts[d.type] !== undefined) counts[d.type] += 1;
    const salesTotal = docs.filter((d) => d.type === 'IV').reduce((sum, d) => sum + (Number(d.total) || 0), 0);
    return { counts, salesTotal, sets: groups.length, filteredSets: filteredGroups.length };
  }, [documents, groups.length, filteredGroups.length]);

  const docsForExport = useMemo(() => {
    const m = parseInt(exportMonth, 10);
    const y = parseInt(exportYear, 10);
    if (Number.isNaN(m) || Number.isNaN(y)) return [];
    return (documents || []).filter((d) => {
      const dt = new Date(d.date);
      return dt.getMonth() + 1 === m && dt.getFullYear() === y;
    });
  }, [documents, exportMonth, exportYear]);

  const buildExportRows = () => {
    const lang = language;
    const header = lang === 'th'
      ? ['วันที่', 'เลขที่', 'ประเภท', 'ลูกค้า', 'ยอดรวม', 'สถานะ']
      : ['Date', 'Document No', 'Type', 'Customer', 'Total', 'Status'];
    const rows = docsForExport.map((d) => {
      const dt = d.date ? new Date(d.date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US') : '';
      const amt = d.netPayable != null ? Number(d.netPayable) : Number(d.total) || 0;
      return [dt, d.no || '', d.type || '', getCustomerLabel(d, lang), amt, getStatusLabel(d.status, lang)];
    });
    return [header, ...rows];
  };

  const handleExportCSV = () => {
    const rows = buildExportRows();
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bills_${exportYear}_${exportMonth.padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const rows = buildExportRows();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, language === 'th' ? 'รายการบิล' : 'Bills');
    XLSX.writeFile(wb, `bills_${exportYear}_${exportMonth.padStart(2, '0')}.xlsx`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 skeleton w-64 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="col-span-2 h-20 skeleton rounded-2xl" />
          <div className="h-20 skeleton rounded-2xl" />
          <div className="h-20 skeleton rounded-2xl" />
          <div className="h-20 skeleton rounded-2xl" />
          <div className="h-20 skeleton rounded-2xl" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 skeleton rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Delete confirmation modal — senior-friendly, large buttons */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border-2 border-gray-200">
            <h2 id="delete-modal-title" className="text-xl font-bold text-gray-900 mb-2">
              {language === 'th' ? 'ยืนยันการลบ' : 'Confirm delete'}
            </h2>
            <p className="text-gray-700 mb-4">
              {language === 'th'
                ? `คุณต้องการลบเอกสาร ${deleteConfirm.docNo || deleteConfirm.id} ใช่หรือไม่? (ข้อมูลนี้ลบแล้วกู้คืนไม่ได้)`
                : `Do you want to delete document ${deleteConfirm.docNo || deleteConfirm.id}? (This cannot be undone.)`}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleDeleteConfirmClose}
                className="min-h-touch px-5 py-3 rounded-xl border-2 border-gray-400 bg-gray-100 text-gray-800 font-bold hover:bg-gray-200 transition touch-target"
              >
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmSubmit}
                disabled={deletingId === deleteConfirm.id}
                className="min-h-touch px-5 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition touch-target disabled:opacity-50"
              >
                {language === 'th' ? 'ยืนยันลบ' : 'Confirm delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-primary" />
            <h1 className="text-xl md:text-2xl font-black text-gray-900">
              {language === 'th' ? 'ประวัติเอกสาร (จัดชุด)' : 'Document History (Grouped)'}
            </h1>
          </div>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            {language === 'th'
              ? `แสดงชุดเอกสารตามลำดับ QT → SO → DO → IV (${metrics.filteredSets}/${metrics.sets} ชุด)`
              : `Grouped by QT → SO → DO → IV (${metrics.filteredSets}/${metrics.sets} sets)`}
          </p>
        </div>
      </div>

      {/* Export */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 shadow-md">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-gray-700">{language === 'th' ? 'ส่งออกรายการบิล (ตามเดือน)' : 'Export bills (by month)'}</span>
          <select value={exportMonth} onChange={(e) => setExportMonth(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg bg-white">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={String(m)}>{language === 'th' ? `เดือน ${m}` : `Month ${m}`}</option>
            ))}
          </select>
          <select value={exportYear} onChange={(e) => setExportYear(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg bg-white">
            {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
          <span className="text-sm text-gray-500">({docsForExport.length} {language === 'th' ? 'รายการ' : 'items'})</span>
          <button type="button" onClick={handleExportCSV} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-800 transition">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button type="button" onClick={handleExportExcel} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition">
            <Download className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
          <div className="col-span-2 md:col-span-2 bg-white rounded-2xl border border-gray-200 p-4 shadow-md">
            <div className="text-xs text-gray-500">{language === 'th' ? 'ยอดขาย (รวม IV)' : 'Sales (All IV)'}</div>
            <div className="text-2xl font-black text-gray-900">{formatCurrency(metrics.salesTotal)}</div>
          </div>
          {(['QT', 'SO', 'DO', 'IV']).map((tp) => (
            <div key={tp} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-md">
              <div className="text-xs text-gray-500">{getDocTypeName(tp, language)}</div>
              <div className="text-2xl font-black text-gray-900">{metrics.counts[tp]}</div>
            </div>
          ))}
        </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={language === 'th' ? 'ค้นหาเลขที่เอกสาร/ชื่อลูกค้า...' : 'Search document no/customer...'}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="ALL">{language === 'th' ? 'ทุกประเภท' : 'All types'}</option>
                {TYPE_ORDER.map((tp) => (
                  <option key={tp} value={tp}>{getDocTypeName(tp, language)}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="ALL">{language === 'th' ? 'ทุกสถานะ' : 'All statuses'}</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{getStatusLabel(s, language)}</option>
                ))}
              </select>

              <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
                <input
                  type="checkbox"
                  checked={incompleteOnly}
                  onChange={(e) => setIncompleteOnly(e.target.checked)}
                />
                <span className="text-sm font-bold text-gray-700">
                  {language === 'th' ? 'เฉพาะชุดที่ยังไม่ครบ' : 'Incomplete only'}
                </span>
              </label>
            </div>
          </div>
        </div>

      {/* Sets */}
      <div className="space-y-3">
          {filteredGroups.map((g) => (
            <div key={g.rootNo} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black px-2 py-1 rounded bg-gray-900 text-white">
                      {g.rootNo}
                    </span>
                    {g.incomplete && (
                      <span className="text-xs font-bold px-2 py-1 rounded bg-yellow-50 text-yellow-800 border border-yellow-200">
                        {language === 'th' ? 'ชุดยังไม่ครบ' : 'Incomplete'}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-gray-800 font-bold truncate">
                    {g.customer}
                  </div>
                </div>

                <div className="flex items-center gap-2 md:justify-end flex-wrap">
                  {(() => {
                    const nextMissing = ['SO', 'DO', 'IV'].find((t) => !g.stageDocs[t]);
                    const primaryType = nextMissing === 'SO' ? 'QT' : nextMissing === 'DO' ? 'SO' : nextMissing === 'IV' ? 'DO' : 'IV';
                    return TYPE_ORDER.map((tp) => {
                    const d = g.stageDocs[tp];
                    if (!d) {
                      return (
                        <span
                          key={tp}
                          className="text-xs font-bold px-2 py-1 rounded border border-dashed border-gray-300 text-gray-400 opacity-60"
                          title={language === 'th' ? 'ยังไม่มีเอกสาร' : 'Missing'}
                        >
                          {getDocTypeName(tp, language)} ({tp})
                        </span>
                      );
                    }
                    const cfg = STATUS_CONFIG[d.status];
                    const isNextStep = tp === primaryType;
                    return (
                      <div key={tp} className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/documents/${d.id}`)}
                          className={`text-xs font-bold px-2 py-1 rounded border hover:opacity-90 transition ${cfg?.color || 'bg-gray-100 text-gray-700 border-gray-200'} ${isNextStep ? 'ring-2 ring-brand-primary ring-offset-1' : ''}`}
                          title={language === 'th' ? 'เปิดเอกสาร' : 'Open document'}
                        >
                          {getDocTypeName(tp, language)} ({tp}) • {getStatusLabel(d.status, language)}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/create-document', { state: { sourceDoc: d, duplicate: true } });
                          }}
                          className="min-h-touch flex flex-col items-center justify-center p-2.5 rounded-xl text-gray-600 hover:bg-gray-100 border-2 border-gray-300 hover:border-gray-400 transition touch-target min-w-[56px]"
                          title={language === 'th' ? 'คัดลอกบิล' : 'Duplicate / Copy bill'}
                          aria-label={language === 'th' ? 'คัดลอก' : 'Copy'}
                        >
                          <Copy className="w-5 h-5 shrink-0" />
                          <span className="text-[10px] font-bold mt-0.5 text-gray-600">{language === 'th' ? 'คัดลอก' : 'Copy'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDeleteDocument(d.id, d.no); }}
                          disabled={deletingId === d.id}
                          className="min-h-touch flex flex-col items-center justify-center p-2.5 rounded-xl text-red-600 hover:bg-red-50 border-2 border-red-200 hover:border-red-300 transition-all duration-200 hover:scale-105 touch-target disabled:opacity-50 min-w-[56px]"
                          title={language === 'th' ? 'ลบเอกสาร' : 'Delete document'}
                          aria-label={language === 'th' ? 'ลบเอกสาร' : 'Delete'}
                        >
                          <Trash2 className="w-5 h-5 shrink-0" />
                          <span className="text-[10px] font-bold mt-0.5 text-red-600">{language === 'th' ? 'ลบ' : 'Delete'}</span>
                        </button>
                      </div>
                    );
                  });
                  })()}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {language === 'th' ? 'ยอดชุดเอกสาร' : 'Set total'}:{' '}
                  <span className="font-black text-gray-900">{formatCurrency(g.total)}</span>
                </div>
                <button
                  onClick={() => {
                    const best = g.stageDocs.IV || g.stageDocs.DO || g.stageDocs.SO || g.stageDocs.QT;
                    if (best?.id) navigate(`/documents/${best.id}`);
                  }}
                  className="flex items-center min-h-touch px-5 py-3 rounded-2xl bg-brand-primary text-white text-base font-bold hover:bg-pink-500 touch-target transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                >
                  <Eye className="w-5 h-5 mr-2 shrink-0" />
                  {language === 'th' ? 'ดูชุดนี้' : 'View set'}
                </button>
              </div>
            </div>
          ))}

          {filteredGroups.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              {language === 'th' ? 'ไม่พบชุดเอกสารที่ตรงกับตัวกรอง' : 'No document sets match your filters'}
            </div>
          )}
      </div>
    </>
  );
};

export default DocumentHistoryPage;

