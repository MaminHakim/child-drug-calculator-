import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { FiDroplet, FiPlus, FiUser, FiLogIn, FiLogOut, FiChevronDown, FiActivity } from 'react-icons/fi';
import { FaCalculator } from 'react-icons/fa';

// Import components
import Login from './components/Login';
import DrugManagement from './components/DrugManagement';
import UserManagement from './components/UserManagement';
import DoseCalculator from './components/DoseCalculator';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userFullName, setUserFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // حالت منوی موبایل
  const navigate = useNavigate();

  // استفاده از useRef برای ذخیره‌ی مرجع به منوی آبشاری
  const dropdownRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setIsLoggedIn(true);
        setUserRole(decodedToken.role);
        setUserFullName(decodedToken.fullName || 'کاربر مهمان');
      } catch (error) {
        console.error('خطا در پردازش توکن:', error);
        handleLogout();
      }
    } else {
      navigate('/login');
    }
    setLoading(false);
  }, [navigate]);

  // اضافه کردن event listener برای بستن منو با کلیک خارج از آن
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserRole(null);
    setUserFullName('');
    setIsDropdownOpen(false); // ریست کردن منوی آبشاری
    navigate('/login');
  };

  const handleLogin = (token) => {
    localStorage.setItem('token', token);
    const decodedToken = jwtDecode(token);
    setIsLoggedIn(true);
    setUserRole(decodedToken.role);
    setUserFullName(decodedToken.fullName || 'کاربر مهمان');
    setIsDropdownOpen(false); // ریست کردن منوی آبشاری
    navigate('/');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  if (loading) {
    return <div className="text-center p-8">در حال بارگذاری...</div>;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 p-4">
        {/* نوار ناوبری */}
        <nav className="bg-white shadow-md backdrop-blur-sm border-b border-slate-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* سمت راست - لوگو و لینک‌ها */}
              <div className="flex items-center gap-8">
                <Link to="/" className="flex items-center gap-2 group">
                  {/* آیکون ترکیبی */}
                  <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full group-hover:rotate-12 transition-transform">
                    <FaCalculator className="w-5 h-5 text-white absolute" />
                  </div>
                </Link>

                {/* دکمه همبرگری برای موبایل */}
                <button
                  onClick={toggleMobileMenu}
                  className="md:hidden flex items-center p-2 text-gray-600 hover:text-indigo-600 focus:outline-none"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                  </svg>
                </button>

                {/* لینک‌های نوار ناوبری (برای دسکتاپ) */}
                {isLoggedIn && userRole === 'admin' && (
                  <div className="hidden md:flex items-center gap-4 ml-6">
                    <Link
                      to="/drugs"
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 rounded-lg transition-all hover:bg-indigo-50"
                    >
                      <FiPlus className="w-4 h-4" />
                      داروها
                    </Link>
                    <Link
                      to="/users"
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 rounded-lg transition-all hover:bg-indigo-50"
                    >
                      <FiUser className="w-4 h-4" />
                      کاربران
                    </Link>
                  </div>
                )}
              </div>

              {/* سمت چپ - بخش کاربر */}
              <div className="flex items-center gap-4">
                {isLoggedIn ? (
                  <div className="relative" ref={dropdownRef}>
                    {/* دکمه باز کردن منوی آبشاری */}
                    <button
                      onClick={toggleDropdown}
                      className="flex items-center gap-3 group focus:outline-none"
                    >
                      <div className="flex items-center gap-3 px-4 py-2 rounded-full transition-colors cursor-default bg-white border border-gray-200 hover:border-indigo-200">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600">
                          <FiUser className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium text-gray-900">{userFullName}</span>
                          <span className="text-xs font-light text-gray-500">{userRole}</span>
                        </div>
                        <FiChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {/* منوی آبشاری */}
                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <FiLogOut className="w-5 h-5" />
                          خروج
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <FiLogIn className="w-5 h-5" />
                    ورود به سیستم
                  </Link>
                )}
              </div>
            </div>

            {/* منوی موبایل */}
            {isMobileMenuOpen && (
              <div className="md:hidden mt-4">
                {isLoggedIn && userRole === 'admin' && (
                  <div className="flex flex-col gap-2">
                    <Link
                      to="/drugs"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 rounded-lg"
                    >
                      <FiPlus className="w-4 h-4" />
                      داروها
                    </Link>
                    <Link
                      to="/users"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 rounded-lg"
                    >
                      <FiUser className="w-4 h-4" />
                      کاربران
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* مسیرها */}
        <Routes>
          <Route
            path="/login"
            element={
              <Login
                setIsLoggedIn={setIsLoggedIn}
                setUserRole={setUserRole}
                setUserFullName={setUserFullName}
                handleLogin={handleLogin}
              />
            }
          />
          <Route path="/drugs" element={<DrugManagement userRole={userRole} />} />
          <Route path="/users" element={<UserManagement userRole={userRole} />} />
          <Route path="/" element={<DoseCalculator isLoggedIn={isLoggedIn} userRole={userRole} />} />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}