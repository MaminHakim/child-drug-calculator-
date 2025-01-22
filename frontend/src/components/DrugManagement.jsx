import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiEdit, FiTrash } from 'react-icons/fi';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../config';
import { useNavigate } from 'react-router-dom';

// تابع تبدیل اعداد فارسی به انگلیسی
const convertToEnglishNumbers = (input) => {
  const persianNumbers = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
  const arabicNumbers = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];

  let output = input;
  for (let i = 0; i < 10; i++) {
    output = output.replace(persianNumbers[i], i).replace(arabicNumbers[i], i);
  }
  return output;
};

// تابع نمایش اعداد به‌صورت یک رقم اعشار
const formatDecimal = (value) => {
  return parseFloat(value).toFixed(1); // نمایش یک رقم اعشار
};

export default function DrugManagement({ userRole }) {
  const [drugs, setDrugs] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDrug, setNewDrug] = useState({
    name: '',
    dosages: [10, 15, 20], // دوزهای ممکن برای دارو
    concentration: '',
    indication: '',
    usageTime: '',
    dosesPerDay: 3, // تعداد نوبت‌های مصرف در شبانه‌روز
  });
  const [editingDrug, setEditingDrug] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDrugs();
  }, []);

  const fetchDrugs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const { data } = await axios.get(`${API_BASE_URL}/api/drugs`, {
        headers: { Authorization: token },
      });
      setDrugs(data);
    } catch (err) {
      console.error('خطا در دریافت داروها:', err);
      Swal.fire('خطا!', 'خطا در دریافت داروها.', 'error');
    }
  };

  const handleAddDrug = async (e) => {
    e.preventDefault();
    if (!newDrug.name || !newDrug.dosages || !newDrug.concentration || !newDrug.dosesPerDay) {
      Swal.fire('خطا!', 'لطفاً فیلدهای اجباری را پر کنید.', 'error');
      return;
    }

    const payload = {
      ...newDrug,
      dosages: newDrug.dosages.map(Number), // تبدیل به آرایه‌ی عددی
      concentration: parseFloat(newDrug.concentration),
      dosesPerDay: parseInt(newDrug.dosesPerDay),
    };

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      await axios.post(`${API_BASE_URL}/api/drugs`, payload, {
        headers: { Authorization: token },
      });
      fetchDrugs();
      setShowAddForm(false);
      setNewDrug({
        name: '',
        dosages: [10, 15, 20],
        concentration: '',
        indication: '',
        usageTime: '',
        dosesPerDay: 3,
      });
      Swal.fire('موفقیت‌آمیز!', 'دارو با موفقیت اضافه شد.', 'success');
    } catch (err) {
      console.error('خطا در افزودن دارو:', err);
      Swal.fire('خطا!', err.response?.data?.message || 'خطا در افزودن دارو.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDrug = async (e) => {
    e.preventDefault();
    if (!editingDrug.name || !editingDrug.dosages || !editingDrug.concentration || !editingDrug.dosesPerDay) {
      Swal.fire('خطا!', 'لطفاً فیلدهای اجباری را پر کنید.', 'error');
      return;
    }

    const payload = {
      ...editingDrug,
      dosages: editingDrug.dosages.map(Number), // تبدیل به آرایه‌ی عددی
      concentration: parseFloat(editingDrug.concentration),
      dosesPerDay: parseInt(editingDrug.dosesPerDay),
    };

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      await axios.put(`${API_BASE_URL}/api/drugs/${editingDrug.id}`, payload, {
        headers: { Authorization: token },
      });
      fetchDrugs();
      setEditingDrug(null);
      Swal.fire('موفقیت‌آمیز!', 'دارو با موفقیت ویرایش شد.', 'success');
    } catch (err) {
      console.error('خطا در ویرایش دارو:', err);
      Swal.fire('خطا!', err.response?.data?.message || 'خطا در ویرایش دارو.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDrug = async (drugId) => {
    const result = await Swal.fire({
      title: 'آیا مطمئن هستید؟',
      text: 'این عمل قابل بازگشت نیست!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'بله، حذف کن!',
      cancelButtonText: 'لغو',
    });

    if (result.isConfirmed) {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        await axios.delete(`${API_BASE_URL}/api/drugs/${drugId}`, {
          headers: { Authorization: token },
        });
        fetchDrugs();
        Swal.fire('حذف شد!', 'دارو با موفقیت حذف شد.', 'success');
      } catch (err) {
        console.error('خطا در حذف دارو:', err);
        Swal.fire('خطا!', err.response?.data?.message || 'خطا در حذف دارو.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 font-shabnam">
      <h1 className="text-2xl font-bold mb-6">مدیریت داروها</h1>
      {userRole === 'admin' && (
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg mb-6 hover:bg-blue-700"
        >
          <FiPlus className="inline-block mr-2" />
          افزودن دارو
        </button>
      )}
      {showAddForm && (
        <form onSubmit={handleAddDrug} className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">افزودن دارو جدید</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">نام دارو</label>
              <input
                type="text"
                value={newDrug.name}
                onChange={(e) => setNewDrug({ ...newDrug, name: e.target.value })}
                placeholder="نام دارو"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">دوزهای ممکن (میلی‌گرم)</label>
              <input
                type="text"
                value={newDrug.dosages.join(', ')}
                onChange={(e) => setNewDrug({ ...newDrug, dosages: e.target.value.split(',').map(Number) })}
                placeholder="دوزهای ممکن (مثلاً 10, 15, 20)"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">غلظت دارو (میلی‌گرم بر سی‌سی)</label>
              <input
                type="text"
                value={newDrug.concentration}
                onChange={(e) => {
                  const value = convertToEnglishNumbers(e.target.value); // تبدیل اعداد فارسی به انگلیسی
                  setNewDrug({ ...newDrug, concentration: value });
                }}
                placeholder="غلظت دارو"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">تعداد نوبت‌های مصرف در شبانه‌روز</label>
              <input
                type="text"
                value={newDrug.dosesPerDay}
                onChange={(e) => {
                  const value = convertToEnglishNumbers(e.target.value); // تبدیل اعداد فارسی به انگلیسی
                  setNewDrug({ ...newDrug, dosesPerDay: value });
                }}
                placeholder="تعداد نوبت‌های مصرف در شبانه‌روز"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">مورد مصرف</label>
              <input
                type="text"
                value={newDrug.indication}
                onChange={(e) => setNewDrug({ ...newDrug, indication: e.target.value })}
                placeholder="مورد مصرف"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">زمان مصرف</label>
              <input
                type="text"
                value={newDrug.usageTime}
                onChange={(e) => setNewDrug({ ...newDrug, usageTime: e.target.value })}
                placeholder="زمان مصرف (مثلاً هر 8 ساعت)"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? 'در حال افزودن...' : 'افزودن'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg ml-2 hover:bg-gray-700"
            >
              لغو
            </button>
          </div>
        </form>
      )}
      {editingDrug && (
        <form onSubmit={handleEditDrug} className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">ویرایش دارو</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">نام دارو</label>
              <input
                type="text"
                value={editingDrug.name}
                onChange={(e) => setEditingDrug({ ...editingDrug, name: e.target.value })}
                placeholder="نام دارو"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">دوزهای ممکن (میلی‌گرم)</label>
              <input
                type="text"
                value={editingDrug.dosages.join(', ')}
                onChange={(e) => setEditingDrug({ ...editingDrug, dosages: e.target.value.split(',').map(Number) })}
                placeholder="دوزهای ممکن (مثلاً 10, 15, 20)"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">غلظت دارو (میلی‌گرم بر سی‌سی)</label>
              <input
                type="text"
                value={editingDrug.concentration}
                onChange={(e) => {
                  const value = convertToEnglishNumbers(e.target.value); // تبدیل اعداد فارسی به انگلیسی
                  setEditingDrug({ ...editingDrug, concentration: value });
                }}
                placeholder="غلظت دارو"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">تعداد نوبت‌های مصرف در شبانه‌روز</label>
              <input
                type="text"
                value={editingDrug.dosesPerDay}
                onChange={(e) => {
                  const value = convertToEnglishNumbers(e.target.value); // تبدیل اعداد فارسی به انگلیسی
                  setEditingDrug({ ...editingDrug, dosesPerDay: value });
                }}
                placeholder="تعداد نوبت‌های مصرف در شبانه‌روز"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">مورد مصرف</label>
              <input
                type="text"
                value={editingDrug.indication}
                onChange={(e) => setEditingDrug({ ...editingDrug, indication: e.target.value })}
                placeholder="مورد مصرف"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">زمان مصرف</label>
              <input
                type="text"
                value={editingDrug.usageTime}
                onChange={(e) => setEditingDrug({ ...editingDrug, usageTime: e.target.value })}
                placeholder="زمان مصرف (مثلاً هر 8 ساعت)"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              type="submit"
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
              disabled={isLoading}
            >
              {isLoading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </button>
            <button
              type="button"
              onClick={() => setEditingDrug(null)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg ml-2 hover:bg-gray-700"
            >
              لغو
            </button>
          </div>
        </form>
      )}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">لیست داروها</h2>
        <div className="space-y-3">
          {drugs.map((drug) => (
            <div key={drug.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
              <div>
                <div className="text-sm font-medium">{drug.name}</div>
                <div className="text-xs text-gray-400">
                  دوزهای ممکن: {drug.dosages.map((dose) => formatDecimal(dose)).join(', ')} میلی‌گرم
                </div>
                <div className="text-xs text-gray-400">{drug.indication}</div>
                <div className="text-xs text-gray-400">{drug.usageTime}</div>
              </div>
              {userRole === 'admin' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingDrug(drug)}
                    className="text-yellow-600 hover:text-yellow-700"
                  >
                    <FiEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteDrug(drug.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <FiTrash className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}