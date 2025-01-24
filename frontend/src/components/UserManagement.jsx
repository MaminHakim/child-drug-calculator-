import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiEdit, FiTrash, FiRefreshCw, FiSearch } from 'react-icons/fi';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../config';
import Modal from 'react-modal';

// تنظیمات اولیه برای React Modal
Modal.setAppElement('#root'); // این خط برای دسترسی بهتر به Modal توسط screen readerها است.

export default function UserManagement({ userRole }) {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // حالت Modal
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'user',
  });
  const [editingUser, setEditingUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false); // وضعیت لودینگ
  const [currentPage, setCurrentPage] = useState(1); // صفحه فعلی
  const [itemsPerPage, setItemsPerPage] = useState(10); // تعداد آیتم‌ها در هر صفحه
  const [searchQuery, setSearchQuery] = useState(''); // عبارت جستجو

  useEffect(() => {
    if (userRole === 'admin') {
      fetchUsers();
    }
  }, [userRole]);

  const fetchUsers = async () => {
    setIsFetching(true); // شروع لودینگ
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_BASE_URL}/api/users`, {
        headers: { Authorization: token },
      });
      setUsers(data);
    } catch (err) {
      console.error('خطا در دریافت کاربران:', err);
      Swal.fire('خطا!', 'خطا در دریافت کاربران.', 'error');
    } finally {
      setIsFetching(false); // پایان لودینگ
    }
  };

  // فیلتر کردن کاربران بر اساس جستجو
  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // محاسبه تعداد صفحات
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // دریافت کاربران صفحه فعلی
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  // تغییر صفحه
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // تغییر تعداد آیتم‌ها در هر صفحه
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // بازگشت به صفحه اول
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password || !newUser.fullName) {
      Swal.fire('خطا!', 'لطفاً فیلدهای اجباری را پر کنید.', 'error');
      return;
    }
    setIsLoading(true); // شروع لودینگ
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/users`, newUser, {
        headers: { Authorization: token },
      });
      fetchUsers();
      setIsModalOpen(false); // بستن Modal پس از افزودن کاربر
      setNewUser({ username: '', password: '', fullName: '', role: 'user' });
      Swal.fire('موفقیت‌آمیز!', 'کاربر جدید با موفقیت اضافه شد.', 'success');
    } catch (err) {
      console.error('خطا در افزودن کاربر:', err);
      Swal.fire('خطا!', err.response?.data?.message || 'خطا در افزودن کاربر.', 'error');
    } finally {
      setIsLoading(false); // پایان لودینگ
    }
  };

  const handleUpdateUser = async (updatedUser) => {
    setIsLoading(true); // شروع لودینگ
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/users/${updatedUser.username}`, updatedUser, {
        headers: { Authorization: token },
      });
      fetchUsers(); // دریافت مجدد لیست کاربران
      setEditingUser(null); // پاک کردن حالت ویرایش
      Swal.fire('موفقیت‌آمیز!', 'کاربر با موفقیت ویرایش شد.', 'success');
    } catch (err) {
      console.error('خطا در ویرایش کاربر:', err);
      Swal.fire('خطا!', err.response?.data?.message || 'خطا در ویرایش کاربر.', 'error');
    } finally {
      setIsLoading(false); // پایان لودینگ
    }
  };

  const handleDeleteUser = async (username) => {
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
      setIsLoading(true); // شروع لودینگ
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE_URL}/api/users/${username}`, {
          headers: { Authorization: token },
        });
        fetchUsers(); // دریافت مجدد لیست کاربران
        Swal.fire('موفقیت‌آمیز!', 'کاربر با موفقیت حذف شد.', 'success');
      } catch (err) {
        console.error('خطا در حذف کاربر:', err);
        Swal.fire('خطا!', err.response?.data?.message || 'خطا در حذف کاربر.', 'error');
      } finally {
        setIsLoading(false); // پایان لودینگ
      }
    }
  };

  const handleResetPassword = async (username) => {
    const { value: newPassword } = await Swal.fire({
      title: 'تغییر رمز عبور',
      input: 'password',
      inputLabel: 'رمز عبور جدید',
      inputPlaceholder: 'رمز عبور جدید را وارد کنید',
      showCancelButton: true,
      confirmButtonText: 'تغییر رمز عبور',
      cancelButtonText: 'لغو',
      inputValidator: (value) => {
        if (!value) {
          return 'لطفاً رمز عبور جدید را وارد کنید!';
        }
      },
    });

    if (newPassword) {
      setIsLoading(true); // شروع لودینگ
      try {
        const token = localStorage.getItem('token');
        await axios.put(
          `${API_BASE_URL}/api/users/${username}/reset-password`,
          { newPassword },
          {
            headers: { Authorization: token },
          }
        );
        Swal.fire('موفقیت‌آمیز!', 'رمز عبور با موفقیت تغییر یافت.', 'success');
      } catch (err) {
        console.error('خطا در تغییر رمز عبور:', err);
        Swal.fire('خطا!', err.response?.data?.message || 'خطا در تغییر رمز عبور.', 'error');
      } finally {
        setIsLoading(false); // پایان لودینگ
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">مدیریت کاربران</h1>

      {/* نمایش لودینگ اسپینر */}
      {isFetching && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-blue-600">در حال بارگذاری...</span>
        </div>
      )}

      {/* نمایش محتوا پس از پایان لودینگ */}
      {!isFetching && (
        <>
          {/* دکمه افزودن کاربر */}
          {userRole === 'admin' && (
            <button
              onClick={() => setIsModalOpen(true)} // باز کردن Modal
              className="bg-blue-600 text-white px-4 py-2 rounded-lg mb-6 hover:bg-blue-700"
            >
              <FiPlus className="inline-block mr-2" />
              افزودن کاربر
            </button>
          )}

          {/* فیلد جستجو */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی کاربر..."
                className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>

          {/* انتخاب تعداد آیتم‌ها در هر صفحه */}
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

          {/* لیست کاربران */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">لیست کاربران</h2>
            <div className="space-y-3">
              {currentUsers.map((user) => (
                <div key={user.username} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium">{user.username}</div>
                    <div className="text-xs text-gray-400">{user.fullName}</div>
                    <div className="text-xs text-gray-400">({user.role})</div>
                  </div>
                  {userRole === 'admin' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingUser(user)} // نمایش فرم ویرایش
                        className="text-yellow-600 hover:text-yellow-700"
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleResetPassword(user.username)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <FiRefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.username)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <FiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
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

      {/* Modal برای افزودن کاربر */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel="افزودن کاربر"
        className="modal"
        overlayClassName="overlay"
      >
        <h2 className="text-xl font-bold mb-4">افزودن کاربر جدید</h2>
        <form onSubmit={handleAddUser} className="space-y-4">
          <input
            type="text"
            value={newUser.username}
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            placeholder="نام کاربری"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            placeholder="رمز عبور"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            value={newUser.fullName}
            onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
            placeholder="نام و نام خانوادگی"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="user">کاربر معمولی</option>
            <option value="admin">ادمین</option>
          </select>
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

      {/* Modal برای ویرایش کاربر */}
      <Modal
        isOpen={!!editingUser}
        onRequestClose={() => setEditingUser(null)}
        contentLabel="ویرایش کاربر"
        className="modal"
        overlayClassName="overlay"
      >
        <h2 className="text-xl font-bold mb-4">ویرایش کاربر</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUpdateUser(editingUser);
          }}
          className="space-y-4"
        >
          <input
            type="text"
            disabled={true}
            value={editingUser?.username || ''}
            // onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
            placeholder="نام کاربری"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            value={editingUser?.fullName || ''}
            onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
            placeholder="نام و نام خانوادگی"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <select
            value={editingUser?.role || 'user'}
            onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="user">کاربر معمولی</option>
            <option value="admin">ادمین</option>
          </select>
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
              onClick={() => setEditingUser(null)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg ml-2 hover:bg-gray-700"
            >
              لغو
            </button>
          </div>
        </form>
      </Modal>

      {/* استایل‌های سفارشی برای Modal */}
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