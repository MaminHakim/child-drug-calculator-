import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiEdit, FiTrash, FiSearch } from 'react-icons/fi';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import qs from 'qs';

// تنظیمات اولیه برای React Modal
Modal.setAppElement('#root');

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
  return parseFloat(value).toFixed(1);
};

// تابع تبدیل JSON به آرایه
const parseJSON = (str) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return []; // یا هر مقدار پیش‌فرض دیگری
  }
};

export default function DrugManagement({ userRole }) {
  const [drugs, setDrugs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDrug, setNewDrug] = useState({
    name: '',
    dosages: [10],
    concentration: '',
    indication: '',
    usageTime: '',
    dosesPerDay: 3,
  });
  const [editingDrug, setEditingDrug] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDrugs();
  }, []);

  const fetchDrugs = async () => {
    setIsFetching(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const { data } = await axios.get(`${API_BASE_URL}/api/drugs`, {
        headers: { Authorization: token },
      });

      // تبدیل dosages و concentration به آرایه
      const formattedData = data.map(drug => ({
        ID: drug.ID,
        name: drug.name,
        dosages: parseJSON(drug.dosages), // تبدیل به آرایه
        concentration: parseJSON(drug.concentration), // تبدیل به آرایه
        indication: drug.indication,
        usageTime: drug.usageTime,
        dosesPerDay: drug.dosesPerDay
      }));

      setDrugs(formattedData);
    } catch (err) {
      console.error('خطا در دریافت داروها:', err);
      Swal.fire('خطا!', 'خطا در دریافت داروها.', 'error');
    } finally {
      setIsFetching(false);
    }
  };

  const filteredDrugs = drugs.filter((drug) =>
    drug.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDrugs.length / itemsPerPage);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDrugs = filteredDrugs.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleAddDrug = async (e) => {
    e.preventDefault();

    const payload = {
      name: newDrug.name,
      dosages: JSON.stringify(newDrug.dosages), // تبدیل به string
      concentration: JSON.stringify([parseFloat(newDrug.concentration)]), // تبدیل به string
      indication: newDrug.indication,
      usageTime: newDrug.usageTime,
      dosesPerDay: parseInt(newDrug.dosesPerDay),
    };

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.post(`${API_BASE_URL}/api/drugs`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
      });

      fetchDrugs();
      setIsModalOpen(false);
      setNewDrug({
        name: '',
        dosages: [10],
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

  const handleEditDrug = async (updatedDrug) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        Swal.fire('خطا!', 'توکن یافت نشد. لطفاً دوباره وارد شوید.', 'error');
        setIsLoading(false);
        return;
      }

      const payload = {
        id: updatedDrug.ID,
        name: updatedDrug.name,
        dosages: JSON.stringify(updatedDrug.dosages),
        concentration: JSON.stringify([parseFloat(updatedDrug.concentration || 0)]), // اعتبارسنجی و تبدیل
        indication: updatedDrug.indication,
        usageTime: updatedDrug.usageTime,
        dosesPerDay: parseInt(updatedDrug.dosesPerDay || 3), // اعتبارسنجی و تبدیل
      };

      // اعتبارسنجی مقادیر عددی
      if (isNaN(parseFloat(updatedDrug.concentration)) || isNaN(payload.dosesPerDay)) {
        Swal.fire('خطا!', 'مقادیر عددی نامعتبر هستند.', 'error');
        setIsLoading(false);
        return;
      }

      await axios.put(`${API_BASE_URL}/api/drugs/${updatedDrug.ID}`, payload, {
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
    console.log('Deleting drug with ID:', drugId); // چاپ مقدار drugId برای دیباگ
    const result = await Swal.fire({
      title: 'آیا مطمئن هستید؟',
      text: 'این عمل قابل بازگشت نیست!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'بله، حذف شود!',
      cancelButtonText: 'لغو',
    });
  
    if (result.isConfirmed) {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE_URL}/api/drugs/${drugId}`, {
          headers: { Authorization: token },
          params: {id: drugId},
          paramsSerializer: (params) => qs.stringify(params),
        });

        setDrugs(prev => prev.filter(drug => drug.ID !== drugId));
        // fetchDrugs();
        Swal.fire('موفقیت‌آمیز!', 'دارو با موفقیت حذف شد.', 'success');
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

      {isFetching && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-blue-600">در حال بارگذاری...</span>
        </div>
      )}

      {!isFetching && (
        <>
          {userRole === 'admin' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg mb-6 hover:bg-blue-700"
            >
              <FiPlus className="inline-block mr-2" />
              افزودن دارو
            </button>
          )}

          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی دارو..."
                className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-slate-700 mr-2">تعداد در هر صفحه:</label>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">لیست داروها</h2>
            <div className="space-y-3">
              {currentDrugs.map((drug) => (
                // console.log('Drug Object:', drug), // چاپ اطلاعات داروها برای دیباگ
                <div key={drug.ID} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
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
                        onClick={() => handleDeleteDrug(drug.ID)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <FiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                قبلی
              </button>
              <span className="text-sm text-gray-600">
                صفحه {currentPage} از {totalPages}
              </span>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                بعدی
              </button>
            </div>
          </div>
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel="افزودن دارو"
        className="modal"
        overlayClassName="overlay"
      >
        <h2 className="text-xl font-bold mb-4">افزودن دارو جدید</h2>
        <form onSubmit={handleAddDrug} className="space-y-4">
          <input
            type="text"
            value={newDrug.name}
            onChange={(e) => setNewDrug({ ...newDrug, name: e.target.value })}
            placeholder="نام دارو"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">دوزهای ممکن (میلی‌گرم):</label>
            {newDrug.dosages.map((dose, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="number"
                  value={dose}
                  onChange={(e) => {
                    const updatedDosages = [...newDrug.dosages];
                    updatedDosages[index] = parseFloat(e.target.value);
                    setNewDrug({ ...newDrug, dosages: updatedDosages });
                  }}
                  placeholder="دوز"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    const updatedDosages = newDrug.dosages.filter((_, i) => i !== index);
                    setNewDrug({ ...newDrug, dosages: updatedDosages });
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  حذف
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setNewDrug({ ...newDrug, dosages: [...newDrug.dosages, 0] })}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              افزودن دوز جدید
            </button>
          </div>

          <input
            type="number"
            value={newDrug.concentration}
            onChange={(e) => setNewDrug({ ...newDrug, concentration: e.target.value })}
            placeholder="غلظت دارو"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="text"
            value={newDrug.indication}
            onChange={(e) => setNewDrug({ ...newDrug, indication: e.target.value })}
            placeholder="مورد مصرف"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="text"
            value={newDrug.usageTime}
            onChange={(e) => setNewDrug({ ...newDrug, usageTime: e.target.value })}
            placeholder="زمان مصرف (مثلاً هر 8 ساعت)"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تعداد نوبت‌های مصرف در شبانه‌روز:</label>
            <input
              type="number"
              value={newDrug.dosesPerDay}
              onChange={(e) => setNewDrug({ ...newDrug, dosesPerDay: parseInt(e.target.value) })}
              placeholder="تعداد نوبت‌ها"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
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
              onClick={() => setIsModalOpen(false)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg ml-2 hover:bg-gray-700"
            >
              لغو
            </button>
          </div>
        </form>
      </Modal>

      <Modal
  isOpen={!!editingDrug}
  onRequestClose={() => setEditingDrug(null)}
  contentLabel="ویرایش دارو"
  className="modal"
  overlayClassName="overlay"
>
  <h2 className="text-xl font-bold mb-4">ویرایش دارو</h2>
  <form
    onSubmit={(e) => {
      e.preventDefault();
      handleEditDrug(editingDrug);
    }}
    className="space-y-4"
  >
    {/* فیلد نام دارو */}
    <input
      type="text"
      value={editingDrug?.name || ''}
      onChange={(e) => setEditingDrug({ ...editingDrug, name: e.target.value })}
      placeholder="نام دارو"
      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      required
    />

    {/* فیلد دوزهای ممکن */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">دوزهای ممکن (میلی‌گرم):</label>
      {editingDrug?.dosages?.map((dose, index) => (
        <div key={index} className="flex items-center gap-2 mb-2">
          <input
            type="number"
            value={dose}
            onChange={(e) => {
              const updatedDosages = [...editingDrug.dosages];
              updatedDosages[index] = parseFloat(e.target.value);
              setEditingDrug({ ...editingDrug, dosages: updatedDosages });
            }}
            placeholder="دوز"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="button"
            onClick={() => {
              const updatedDosages = editingDrug.dosages.filter((_, i) => i !== index);
              setEditingDrug({ ...editingDrug, dosages: updatedDosages });
            }}
            className="text-red-600 hover:text-red-700"
          >
            حذف
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setEditingDrug({ ...editingDrug, dosages: [...editingDrug.dosages, 0] })}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        افزودن دوز جدید
      </button>
    </div>

    {/* فیلد غلظت دارو */}
    <input
      type="number"
      value={editingDrug?.concentration || ''}
      onChange={(e) => setEditingDrug({ ...editingDrug, concentration: e.target.value })}
      placeholder="غلظت دارو"
      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      required
    />

    {/* فیلد مورد مصرف */}
    <input
      type="text"
      value={editingDrug?.indication || ''} // نمایش مقدار indication
      onChange={(e) => setEditingDrug({ ...editingDrug, indication: e.target.value })}
      placeholder="مورد مصرف"
      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      required
    />

    {/* فیلد زمان مصرف */}
    <input
      type="text"
      value={editingDrug?.usageTime || ''} // نمایش مقدار usageTime
      onChange={(e) => setEditingDrug({ ...editingDrug, usageTime: e.target.value })}
      placeholder="زمان مصرف (مثلاً هر 8 ساعت)"
      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      required
    />

    {/* فیلد تعداد نوبت‌های مصرف */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">تعداد نوبت‌های مصرف در شبانه‌روز:</label>
      <input
        type="number"
        value={editingDrug?.dosesPerDay || 3}
        onChange={(e) => setEditingDrug({ ...editingDrug, dosesPerDay: parseInt(e.target.value) })}
        placeholder="تعداد نوبت‌ها"
        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        required
      />
    </div>

    {/* دکمه‌های ویرایش و لغو */}
    <div className="mt-4">
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        disabled={isLoading}
      >
        {isLoading ? 'در حال ویرایش...' : 'ویرایش'}
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
</Modal>

      <style>
        {`
          .modal {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 2rem;
            border-radius: 8px;
            max-width: 500px;
            width: 90%;
            outline: none;
          }
          .overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
          }
        `}
      </style>
    </div>
  );
}