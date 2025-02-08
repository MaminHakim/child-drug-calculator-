import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiAlertCircle, FiDroplet } from 'react-icons/fi';
import Select from 'react-select';
import { API_BASE_URL } from '../config';

export default function DoseCalculator({ isLoggedIn, userRole }) {
  const [weight, setWeight] = useState('');
  const [selectedDrugs, setSelectedDrugs] = useState([]);
  const [drugOptions, setDrugOptions] = useState([]);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDosage, setSelectedDosage] = useState({});

  // تابع تبدیل JSON به آرایه
  const parseJSON = (str) => {
    try {
      return JSON.parse(str);
    } catch (e) {
      return []; // یا هر مقدار پیش‌فرض دیگری
    }
  };

  // دریافت لیست داروها از سرور
  useEffect(() => {
    const fetchDrugs = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`${API_BASE_URL}/api/drugs`, {
          headers: { Authorization: token },
        });

        // تبدیل dosages و concentration به آرایه
        const formattedData = data.map((drug) => ({
          ...drug,
          dosages: parseJSON(drug.dosages), // تبدیل به آرایه
          concentration: parseJSON(drug.concentration), // تبدیل به آرایه
        }));

        setDrugOptions(
          formattedData.map((drug) => ({
            value: drug.ID,
            label: drug.name,
            dosages: drug.dosages,
            concentration: drug.concentration[0], // استفاده از اولین مقدار آرایه
            indication: drug.indication || 'بدون مورد مصرف مشخص',
            usageTime: drug.usageTime || 'بدون زمان مصرف مشخص',
            dosesPerDay: drug.dosesPerDay,
          }))
        );
        setLoading(false);
      } catch (err) {
        console.error('خطا در دریافت داروها:', err);
        if (err.response) {
          if (err.response.status === 401) {
            setError('احراز هویت نامعتبر است. لطفاً دوباره وارد شوید.');
          } else {
            setError('خطا در دریافت داروها. لطفاً دوباره تلاش کنید.');
          }
        } else {
          setError('خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.');
        }
        setLoading(false);
      }
    };

    if (isLoggedIn) {
      fetchDrugs();
    }
  }, [isLoggedIn]);

  // محاسبه دوز داروها
  const calculateDose = () => {
    if (weight <= 0 || isNaN(weight) || selectedDrugs.length === 0) {
      setResults({});
      return;
    }

    const calculatedResults = {};
    selectedDrugs.forEach((drug) => {
      const drugInfo = drugOptions.find((d) => d.value === drug.value);
      if (drugInfo) {
        const selectedDosageValue = selectedDosage[drug.value] || drugInfo.dosages[0];
        const totalDose = (weight * selectedDosageValue * 5) / drugInfo.concentration;
        const dosePerDose = totalDose / drugInfo.dosesPerDay;

        calculatedResults[drugInfo.label] = {
          totalDose: totalDose.toFixed(0),
          dosePerDose: dosePerDose.toFixed(0),
          usageTime: drugInfo.usageTime,
          dosesPerDay: drugInfo.dosesPerDay,
        };
      }
    });

    setResults(calculatedResults);
  };

  // محاسبه دوز هنگام تغییر وزن، داروها یا دوز انتخاب‌شده
  useEffect(() => {
    if (weight > 0 && selectedDrugs.length > 0) {
      calculateDose();
    } else {
      setResults({});
    }
  }, [weight, selectedDrugs, selectedDosage]);

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
        <div className="mb-8 self-center">
          <div className="flex justify-center gap-2">
          <img src="icons/100.png" alt="" className='item-center'/>
            {/* <FiDroplet className="w-8 h-8 text-blue-600" /> */}
            <div className='justify-item-start content-center'>
            <h1 className="text-2xl font-bold text-slate-800 m4k">Med4Kids</h1>
            <h4 className='text-sm'> محاسبه دوز داروی کودکان</h4>

            </div>
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
                if (/^\d*\.?\d*$/.test(value) && parseFloat(value) >= 0) {
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
              onChange={(selected) => {
                setSelectedDrugs(selected);
                const dosageMap = {};
                selected.forEach((drug) => {
                  dosageMap[drug.value] = selectedDosage[drug.value] || drug.dosages[0];
                });
                setSelectedDosage(dosageMap);
              }}
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
                menu: (base) => ({
                  ...base,
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
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
              {Object.entries(results).map(([drug, details]) => {
                const drugInfo = drugOptions.find((d) => d.label === drug);
                return (
                  <div key={drug} className="flex flex-col p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-600">{drug}</span>
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        انتخاب دوز (میلی‌گرم به ازای هر کیلوگرم)
                      </label>
                      <select
                        value={selectedDosage[drugInfo.value] || drugInfo.dosages[0]}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          setSelectedDosage((prev) => ({
                            ...prev,
                            [drugInfo.value]: value,
                          }));
                        }}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {drugInfo.dosages.map((dosage, index) => (
                          <option key={index} value={dosage}>
                            {dosage} میلی‌گرم
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-blue-600">{details.totalDose} سی‌سی</span>
                      <span className="text-slate-400 text-sm">{details.usageTime}</span>
                      <span className="text-slate-400 text-sm">{details.dosesPerDay} نوبت</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-sm text-gray-600">دوز هر نوبت: {details.dosePerDose} سی‌سی</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}