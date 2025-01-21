import { useState, useEffect } from 'react';
import Select from 'react-select';
import axios from 'axios';
import { FiAlertCircle, FiDroplet } from 'react-icons/fi';

export default function App() {
  const [weight, setWeight] = useState('');
  const [selectedDrugs, setSelectedDrugs] = useState([]);
  const [drugOptions, setDrugOptions] = useState([]);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDrugs = async () => {
      try {
        const { data } = await axios.get('http://74.243.209.111/:8080/api/drugs');
        setDrugOptions(data.map(drug => ({
          value: drug.id,
          label: drug.name,
          indication: drug.indication || 'بدون مورد مصرف مشخص'
        })));
        setLoading(false);
      } catch (err) {
        setError('خطا در دریافت اطلاعات داروها');
        setLoading(false);
      }
    };

    fetchDrugs();
  }, []);

  useEffect(() => {
    const calculateDose = async () => {
      if (weight > 0 && selectedDrugs.length > 0) {
        try {
          const { data } = await axios.post('http://74.243.209.111/:8080/api/calculate', {
            weight: parseFloat(weight),
            drugIds: selectedDrugs.map(d => d.value)
          });
          setResults(data);
        } catch (err) {
          console.error('خطای محاسبه:', err);
          setResults({});
        }
      } else {
        setResults({});
      }
    };

    calculateDose();
  }, [weight, selectedDrugs]);

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

        {/* Drug Selector */}
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
            noOptionsMessage={() => "دارویی یافت نشد"}
            isLoading={loading}
            className="react-select-container"
            classNamePrefix="react-select"
            formatOptionLabel={drug => (
              <div>
                <div className="text-sm">{drug.label}</div>
                <div className="text-xs text-gray-400">{drug.indication}</div>
              </div>
            )}
            styles={{
              control: (base) => ({
                ...base,
                border: 0,
                boxShadow: 'none',
                minHeight: '48px',
                backgroundColor: '#f8fafc'
              })
            }}
          />
        </div>

        {/* Results */}
        {Object.entries(results).length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <FiAlertCircle className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-800">نتایج محاسبه</h2>
            </div>
            
            <div className="space-y-3">
              {Object.entries(results).map(([drug, dose]) => (
                <div key={drug} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-600">{drug}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-600">{dose.toFixed(2)}</span>
                    <span className="text-slate-400 text-sm">سی‌سی</span>
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