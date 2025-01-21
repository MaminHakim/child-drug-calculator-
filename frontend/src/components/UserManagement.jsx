import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiEdit, FiTrash, FiRefreshCw } from 'react-icons/fi';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../config';

export default function UserManagement({ userRole }) {
  const [users, setUsers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'user',
  });
  const [editingUser, setEditingUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchUsers();
    }
  }, [userRole]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_BASE_URL}/api/users`, {
        headers: { Authorization: token },
      });
      setUsers(data);
    } catch (err) {
      console.error('خطا در دریافت کاربران:', err);
      Swal.fire('خطا!', 'خطا در دریافت کاربران.', 'error');
    }
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
      setShowAddForm(false);
      setNewUser({ username: '', password: '', fullName: '', role: 'user' });
      Swal.fire('موفقیت‌آمیز!', 'کاربر جدید با موفقیت اضافه شد.', 'success');
    } catch (err) {
      console.error('خطا در افزودن کاربر:', err);
      Swal.fire('خطا!', err.response?.data?.message || 'خطا در افزودن کاربر.', 'error');
    } finally {
      setIsLoading(false); // پایان لودینگ
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser.username || !editingUser.fullName) {
      Swal.fire('خطا!', 'لطفاً فیلدهای اجباری را پر کنید.', 'error');
      return;
    }
    setIsLoading(true); // شروع لودینگ
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/users/${editingUser.username}`, editingUser, {
        headers: { Authorization: token },
      });
      fetchUsers();
      setEditingUser(null);
      Swal.fire('موفقیت‌آمیز!', 'اطلاعات کاربر با موفقیت به‌روزرسانی شد.', 'success');
    } catch (err) {
      console.error('خطا در به‌روزرسانی کاربر:', err);
      Swal.fire('خطا!', err.response?.data?.message || 'خطا در به‌روزرسانی کاربر.', 'error');
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
      confirmButtonText: 'بله، حذف کن!',
      cancelButtonText: 'لغو',
    });

    if (result.isConfirmed) {
      setIsLoading(true); // شروع لودینگ
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE_URL}/api/users/${username}`, {
          headers: { Authorization: token },
        });
        fetchUsers();
        Swal.fire('حذف شد!', 'کاربر با موفقیت حذف شد.', 'success');
      } catch (err) {
        console.error('خطا در حذف کاربر:', err);
        Swal.fire('خطا!', err.response?.data?.message || 'خطا در حذف کاربر.', 'error');
      } finally {
        setIsLoading(false); // پایان لودینگ
      }
    }
  };

  const handleResetPassword = async (username) => {
    const result = await Swal.fire({
      title: 'ریست کردن پسورد',
      input: 'password',
      inputLabel: 'پسورد جدید را وارد کنید',
      inputPlaceholder: 'پسورد جدید',
      showCancelButton: true,
      confirmButtonText: 'ریست کن',
      cancelButtonText: 'لغو',
    });

    if (result.isConfirmed) {
      setIsLoading(true); // شروع لودینگ
      try {
        const token = localStorage.getItem('token');
        await axios.put(
          `${API_BASE_URL}/api/users/${username}/reset-password`,
          { newPassword: result.value },
          {
            headers: { Authorization: token },
          }
        );
        Swal.fire('موفقیت‌آمیز!', 'پسورد با موفقیت ریست شد.', 'success');
      } catch (err) {
        console.error('خطا در ریست کردن پسورد:', err);
        Swal.fire('خطا!', err.response?.data?.message || 'خطا در ریست کردن پسورد.', 'error');
      } finally {
        setIsLoading(false); // پایان لودینگ
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">مدیریت کاربران</h1>
      {userRole === 'admin' && (
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg mb-6 hover:bg-blue-700"
        >
          <FiPlus className="inline-block mr-2" />
          افزودن کاربر
        </button>
      )}
      {showAddForm && (
        <form onSubmit={handleAddUser} className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">افزودن کاربر جدید</h2>
          <div className="space-y-4">
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
      {editingUser && (
        <form onSubmit={handleUpdateUser} className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">ویرایش کاربر</h2>
          <div className="space-y-4">
            <input
              type="text"
              value={editingUser.username}
              disabled
              className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
            />
            <input
              type="text"
              value={editingUser.fullName}
              onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
              placeholder="نام و نام خانوادگی"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
            <select
              value={editingUser.role}
              onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="user">کاربر معمولی</option>
              <option value="admin">ادمین</option>
            </select>
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
              onClick={() => setEditingUser(null)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg ml-2 hover:bg-gray-700"
            >
              لغو
            </button>
          </div>
        </form>
      )}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">لیست کاربران</h2>
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.username} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
              <div>
                <div className="text-sm font-medium">{user.username}</div>
                <div className="text-xs text-gray-400">{user.fullName}</div>
                <div className="text-xs text-gray-400">({user.role})</div>
              </div>
              {userRole === 'admin' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingUser(user)}
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
      </div>
    </div>
  );
}