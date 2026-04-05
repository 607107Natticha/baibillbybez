import { useState, useEffect } from 'react';
import axios from 'axios';
import { UsersIcon, PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { t } from '../utils/translations';
import { useLanguage } from '../context/LanguageContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const CustomersPage = () => {
  const language = useLanguage();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({ name: '', nameEn: '', address: '', addressEn: '', taxId: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/customers`);
      setCustomers(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert(language === 'th' ? 'กรุณากรอกชื่อลูกค้า' : 'Please enter customer name');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCustomer) {
        await axios.put(`${API_URL}/api/customers/${editingCustomer.id}`, formData);
        alert(language === 'th' ? 'แก้ไขข้อมูลสำเร็จ' : 'Updated successfully');
      } else {
        await axios.post(`${API_URL}/api/customers`, formData);
        alert(language === 'th' ? 'เพิ่มลูกค้าสำเร็จ' : 'Customer added successfully');
      }
      setShowModal(false);
      setEditingCustomer(null);
      setFormData({ name: '', nameEn: '', address: '', addressEn: '', taxId: '', phone: '' });
      fetchCustomers();
    } catch (error) {
      alert(error.response?.data?.message || (language === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      nameEn: customer.nameEn || '',
      address: customer.address || '',
      addressEn: customer.addressEn || '',
      taxId: customer.taxId || '',
      phone: customer.phone || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm(language === 'th' ? 'ยืนยันการลบลูกค้า?' : 'Confirm delete customer?')) return;

    try {
      await axios.delete(`${API_URL}/api/customers/${id}`);
      alert(language === 'th' ? 'ลบลูกค้าสำเร็จ' : 'Customer deleted successfully');
      fetchCustomers();
    } catch (error) {
      alert(language === 'th' ? 'เกิดข้อผิดพลาดในการลบ' : 'Error deleting customer');
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4 mb-6">
          <div className="h-10 skeleton flex-1 rounded-xl" />
          <div className="h-10 skeleton w-32 rounded-xl" />
        </div>
        <div className="h-14 skeleton rounded-2xl w-full" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 skeleton rounded-2xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center">
          <UsersIcon className="w-8 h-8 mr-3 text-brand-primary" /> {t('manageCustomers', language)}
        </h2>
        <button
          onClick={() => { setEditingCustomer(null); setFormData({ name: '', nameEn: '', address: '', addressEn: '', taxId: '', phone: '' }); setShowModal(true); }}
          className="min-h-touch w-full sm:w-auto flex items-center justify-center px-4 py-3 bg-pastel-green text-gray-900 font-bold rounded-2xl hover:bg-emerald-400 transition shadow touch-target"
        >
          <PlusIcon className="w-5 h-5 mr-2" /> {t('addCustomer', language)}
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 border border-gray-200">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('searchCustomers', language)}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-light bg-gray-50"
          />
        </div>
      </div>

      {/* Customer List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500">{t('loading', language)}</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500">
          {searchTerm ? t('noCustomersFound', language) : t('noCustomersYet', language)}
        </div>
      ) : (
        <>
          {/* Mobile: card-based list (no horizontal scroll) */}
          <div className="md:hidden space-y-3">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <div className="font-bold text-gray-800 text-lg mb-1">
                  {language === 'en' && customer.nameEn ? customer.nameEn : customer.name}
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div><span className="text-gray-500">{t('phone', language)}:</span> {customer.phone || '-'}</div>
                  <div><span className="text-gray-500">{t('address', language)}:</span> {language === 'en' && customer.addressEn ? customer.addressEn : (customer.address || '-')}</div>
                  <div><span className="text-gray-500">{t('taxId', language)}:</span> {customer.taxId || '-'}</div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleEdit(customer)}
                    className="min-h-touch flex-1 flex items-center justify-center gap-2 py-2 bg-pastel-orange text-gray-900 rounded-xl font-bold hover:bg-orange-300 transition touch-target"
                  >
                    <PencilIcon className="w-5 h-5" /> {language === 'th' ? 'แก้ไข' : 'Edit'}
                  </button>
                  <button
                    onClick={() => handleDelete(customer.id)}
                    className="min-h-touch flex-1 flex items-center justify-center gap-2 py-2 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200 transition touch-target"
                  >
                    <TrashIcon className="w-5 h-5" /> {language === 'th' ? 'ลบ' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-base font-bold text-gray-700">{t('customerNameTh', language)}</th>
                  <th className="px-4 py-3 text-left text-base font-bold text-gray-700">{t('phone', language)}</th>
                  <th className="px-4 py-3 text-left text-base font-bold text-gray-700">{t('address', language)}</th>
                  <th className="px-4 py-3 text-left text-base font-bold text-gray-700">{t('taxId', language)}</th>
                  <th className="px-4 py-3 text-center text-base font-bold text-gray-700">{t('manage', language)}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-4 text-base font-medium text-gray-800">{language === 'en' && customer.nameEn ? customer.nameEn : customer.name}</td>
                    <td className="px-4 py-4 text-base text-gray-600">{customer.phone || '-'}</td>
                    <td className="px-4 py-4 text-base text-gray-600">{language === 'en' && customer.addressEn ? customer.addressEn : (customer.address || '-')}</td>
                    <td className="px-4 py-4 text-base text-gray-600">{customer.taxId || '-'}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="min-h-touch min-w-touch p-2 bg-orange-100 text-orange-600 rounded-xl hover:bg-orange-200 transition touch-target"
                          title={language === 'th' ? 'แก้ไข' : 'Edit'}
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="min-h-touch min-w-touch p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition touch-target"
                          title={language === 'th' ? 'ลบ' : 'Delete'}
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="mt-4 text-gray-500 text-center text-base">
        {t('totalItems', language)} {filteredCustomers.length} {t('items', language)}
      </p>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">
                {editingCustomer ? t('editCustomer', language) : t('addNewCustomer', language)}
              </h3>
              <button onClick={() => setShowModal(false)} className="min-h-touch min-w-touch p-2 hover:bg-gray-100 rounded-2xl touch-target">
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-base font-bold text-gray-700 mb-2">{t('customerNameTh', language)} <span className="text-red-500">{t('required', language)}</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={language === 'th' ? 'ชื่อบริษัทหรือร้านค้า' : 'Company or shop name'}
                  className="w-full p-3 text-base border-2 border-gray-300 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-light"
                />
              </div>

              <div>
                <label className="block text-base font-bold text-gray-700 mb-2">{t('customerNameEn', language)} <span className="text-sm text-gray-500">{t('optionalEnglish', language)}</span></label>
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  placeholder="Customer name in English"
                  className="w-full p-3 text-base border-2 border-gray-300 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-light"
                />
              </div>

              <div>
                <label className="block text-base font-bold text-gray-700 mb-2">{t('customerAddressTh', language)}</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={language === 'th' ? 'ที่อยู่ลูกค้า' : 'Customer address'}
                  rows="3"
                  className="w-full p-3 text-base border-2 border-gray-300 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-light"
                />
              </div>

              <div>
                <label className="block text-base font-bold text-gray-700 mb-2">{t('customerAddressEn', language)} <span className="text-sm text-gray-500">{t('optionalEnglish', language)}</span></label>
                <textarea
                  value={formData.addressEn}
                  onChange={(e) => setFormData({ ...formData, addressEn: e.target.value })}
                  placeholder="Customer address in English"
                  rows="3"
                  className="w-full p-3 text-base border-2 border-gray-300 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-light"
                />
              </div>

              <div>
                <label className="block text-base font-bold text-gray-700 mb-2">{t('phone', language)}</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={language === 'th' ? 'เบอร์โทรศัพท์ลูกค้า' : 'Customer phone number'}
                  className="w-full p-3 text-base border-2 border-gray-300 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-light"
                />
              </div>

              <div>
                <label className="block text-base font-bold text-gray-700 mb-2">{t('taxId', language)}</label>
                <input
                  type="text"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  placeholder={language === 'th' ? 'เลขผู้เสียภาษี (ถ้ามี)' : 'Tax ID (if any)'}
                  className="w-full p-3 text-base border-2 border-gray-300 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-light"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="min-h-touch flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-300 transition touch-target"
                >
                  {t('cancel', language)}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-touch flex-1 py-3 bg-brand-primary text-white font-bold rounded-2xl hover:bg-pink-500 transition flex items-center justify-center disabled:bg-gray-400 touch-target"
                >
                  <CheckIcon className="w-5 h-5 mr-2" />
                  {submitting ? t('saving', language) : t('save', language)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomersPage;
