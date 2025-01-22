import { useState } from 'react';
import axios from 'axios';
import { FiLock, FiX } from 'react-icons/fi';
import { API_BASE_URL } from '../config';

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (newPassword !== confirmPassword) {
        throw new Error('رمزهای عبور جدید مطابقت ندارند');
      }

      if (newPassword.length < 6) {
        throw new Error('رمز عبور باید حداقل ۶ کاراکتر باشد');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('لطفاً ابتدا وارد شوید');
      }

      await axios.put(
        `${API_BASE_URL}/api/users/change-password`,
        { currentPassword, newPassword },
        { headers: { Authorization: token } }
      );

      setSuccess('رمز عبور با موفقیت تغییر یافت');
      setTimeout(() => {
        onClose();
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">تغییر رمز عبور</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">رمز عبور فعلی</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">رمز عبور جدید</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">تکرار رمز عبور جدید</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {error && <p className="text-red-600 text-sm mt-2">⚠️ {error}</p>}
          {success && <p className="text-green-600 text-sm mt-2">✅ {success}</p>}

          <div className="flex gap-2 justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 ${
                isLoading ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'
              } text-white rounded-lg transition-colors`}
            >
              {isLoading ? 'در حال پردازش...' : 'تغییر رمز عبور'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}