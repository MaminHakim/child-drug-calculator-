import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiAlertCircle, FiDroplet } from 'react-icons/fi';
import Select from 'react-select';

export default function DoseCalculator({ isLoggedIn, userRole }) {
  const [weight, setWeight] = useState('');
  const [selectedDrugs, setSelectedDrugs] = useState([]);
  const [drugOptions, setDrugOptions] = useState([]);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch drugs from the server
  useEffect(() => {
    const fetchDrugs = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get('http://localhost:8080/api/drugs', {
          headers: { Authorization: token },
        });
        setDrugOptions(
          data.map((drug) => ({
            value: drug.id,
            label: drug.name,
            dosagePerKg: drug.dosagePerKg,
            concentration: drug.concentration,
            indication: drug.indication || 'بدون مورد مصرف مشخص',
            usageTime: drug.usageTime || 'بدون زمان مصرف مشخص',
          }))
        );
        setLoading(false);
      } catch (err) {
        console.error('خطا در دریافت داروها:', err);
        setError('خطا در دریافت داروها. لطفاً دوباره تلاش کنید.');
        if (err.response && err.response.status === 401) {
          alert('احراز هویت نامعتبر است. لطفاً دوباره وارد شوید.');
        }
      }
    };

    if (isLoggedIn) {
      fetchDrugs();
    }
  }, [isLoggedIn]);

  // Calculate dose when weight or selected drugs change
  useEffect(() => {
    const calculateDose = async () => {
      if (weight > 0 && selectedDrugs.length > 0) {
        try {
          const token = localStorage.getItem('token');
          const { data } = await axios.post(
            'http://localhost:8080/api/calculate',
            {
              weight: parseFloat(weight),
              drugIds: selectedDrugs.map((d) => d.value),
            },
            {
              headers: { Authorization: token },
            }
          );
          setResults(data);
        } catch (err) {
          console.error('خطای محاسبه:', err);
          setError('خطا در محاسبه دوز دارو. لطفاً دوباره تلاش کنید.');
          if (err.response && err.response.status === 401) {
            alert('احراز هویت نامعتبر است. لطفاً دوباره وارد شوید.');
          }
        }
      } else {
        setResults({});
      }
    };

    if (isLoggedIn) {
      calculateDose();
    }
  }, [weight, selectedDrugs, isLoggedIn]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-red-600 text-center">
          <FiAlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p className="text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-3">
            <FiDroplet className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-800">محاسبه دارو کودکان</h1>
          </div>
        </div>

        {/* Weight Input */}
        {isLoggedIn && (
          <div className="bg-white rounded-xl p-4 shadow-sm mb-4 border border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              وزن کودک (کیلوگرم)
            </label>
            <input
              type="number"
              value={weight}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || (/^\d*\.?\d*$/.test(value) && parseFloat(value) >= 0)) {
                  setWeight(value);
                }
              }}
              className="w-full p-3 bg-slate-50 rounded-lg focus:ring-2 focus:ring-blue-500 border-0"
              placeholder="مثال: ۱۲٫۵"
              inputMode="decimal"
              min="0"
            />
          </div>
        )}

        {/* Drug Selector */}
        {isLoggedIn && (
          <div className="bg-white rounded-xl p-4 shadow-sm mb-4 border border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              انتخاب داروها
            </label>
            <Select
              isMulti
              options={drugOptions}
              value={selectedDrugs}
              onChange={setSelectedDrugs}
              placeholder="جستجو و انتخاب دارو..."
              noOptionsMessage={() => 'دارویی یافت نشد'}
              isLoading={loading}
              className="react-select-container"
              classNamePrefix="react-select"
              formatOptionLabel={(drug) => (
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm">{drug.label}</div>
                    <div className="text-xs text-gray-400">{drug.indication}</div>
                    <div className="text-xs text-gray-400">{drug.usageTime}</div>
                  </div>
                </div>
              )}
              styles={{
                control: (base) => ({
                  ...base,
                  border: 0,
                  boxShadow: 'none',
                  minHeight: '48px',
                  backgroundColor: '#f8fafc',
                }),
              }}
            />
          </div>
        )}

        {/* Results */}
        {isLoggedIn && Object.entries(results).length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <FiAlertCircle className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-800">نتایج محاسبه</h2>
            </div>

            <div className="space-y-3">
              {Object.entries(results).map(([drug, details]) => (
                <div key={drug} className="flex flex-col p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-600">{drug}</span>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-600">{details.dose.toFixed(2)} سی‌سی</span>
                    <span className="text-slate-400 text-sm">{details.usageTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}