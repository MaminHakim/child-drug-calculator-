import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { FiLogIn } from 'react-icons/fi';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

export default function Login({ setIsLoggedIn, setUserRole, setUserFullName }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/login`, { username, password });
      localStorage.setItem('token', data.token);
      const decodedToken = jwtDecode(data.token);
      setIsLoggedIn(true);
      setUserRole(decodedToken.role);
      setUserFullName(decodedToken.fullName); // ذخیره نام و نام خانوادگی کاربر
      navigate('/'); // هدایت کاربر به صفحه اصلی پس از لاگین موفق
    } catch (err) {
      console.error('خطا در ورود:', err);
      setError('نام کاربری یا رمز عبور اشتباه است.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-purple-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-6">
          <FiLogIn className="w-12 h-12 mx-auto text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">ورود به سیستم</h1>
          <p className="text-gray-600">لطفاً اطلاعات خود را وارد کنید.</p>
        </div>
        {error && <div className="text-red-600 text-center mb-4">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              نام کاربری
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              رمز عبور
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            ورود
          </button>
        </form>
      </div>
    </div>
  );
}