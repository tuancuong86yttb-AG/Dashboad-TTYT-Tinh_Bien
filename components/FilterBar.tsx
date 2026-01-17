
import React, { useState, useRef, useEffect } from 'react';
import { FilterState, MedicalRecord } from '../types.ts';
import { Filter, ChevronDown, ChevronUp, Search, X, Calendar, Check } from 'lucide-react';
import { format } from 'date-fns';
import { 
  subDays, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, 
  startOfQuarter, endOfQuarter, startOfYear, endOfYear 
} from '../utils.ts';

interface FilterBarProps {
  data: MedicalRecord[];
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

const FilterBar: React.FC<FilterBarProps> = ({ data, filters, setFilters }) => {
  const [expanded, setExpanded] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Local state for the date picker popup
  const [tempStart, setTempStart] = useState(filters.startDate);
  const [tempEnd, setTempEnd] = useState(filters.endDate);
  const [activePreset, setActivePreset] = useState('custom');

  useEffect(() => {
    setTempStart(filters.startDate);
    setTempEnd(filters.endDate);
  }, [filters.startDate, filters.endDate, showDatePicker]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to get unique options
  const getOptions = (field: keyof MedicalRecord): string[] => {
    const values: string[] = data.map(d => {
        const val = d[field];
        return val !== null && val !== undefined ? String(val) : '';
    });
    return Array.from(new Set(values)).sort();
  };

  const handleChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyPreset = (preset: string) => {
    setActivePreset(preset);
    const today = new Date();
    let start = today;
    let end = today;

    switch (preset) {
      case 'today':
        break;
      case 'yesterday':
        start = subDays(today, 1);
        end = subDays(today, 1);
        break;
      case 'last7days':
        start = subDays(today, 6);
        break;
      case 'thisMonth':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      case 'thisQuarter':
        start = startOfQuarter(today);
        end = endOfQuarter(today);
        break;
      case 'thisYear':
        start = startOfYear(today);
        end = endOfYear(today);
        break;
      default:
        return;
    }

    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');
    setTempStart(startStr);
    setTempEnd(endStr);
    setFilters(prev => ({ ...prev, startDate: startStr, endDate: endStr }));
    setShowDatePicker(false);
  };

  const clearFilters = () => {
    setFilters({
      startDate: filters.startDate,
      endDate: filters.endDate,
      KHOA: '',
      BAC_SY: '',
      TEN_NHOM: '',
      DICH_VU: '',
      TEN_DOI_TUONG: '',
      MA_LOAI_KCB: '',
      MA_BENH: '',
      KET_QUA_DTRI: '',
      TINH_TRANG_RV: ''
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
      <div className="p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-[300px]">
          {/* Date Range Selector */}
          <div className="relative" ref={datePickerRef}>
            <button 
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <Calendar size={16} className="text-blue-500" />
              <span>{filters.startDate ? format(new Date(filters.startDate), 'dd/MM/yyyy') : '...'} - {filters.endDate ? format(new Date(filters.endDate), 'dd/MM/yyyy') : '...'}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {showDatePicker && (
              <div className="absolute top-full left-0 mt-2 p-4 bg-white border border-slate-200 shadow-xl rounded-xl z-50 w-[480px] animate-in fade-in zoom-in-95 duration-200">
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-1 border-r border-slate-100 pr-4 flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Phạm vi nhanh</p>
                    {[
                      { id: 'today', label: 'Hôm nay' },
                      { id: 'yesterday', label: 'Hôm qua' },
                      { id: 'last7days', label: '7 ngày qua' },
                      { id: 'thisMonth', label: 'Tháng này' },
                      { id: 'lastMonth', label: 'Tháng trước' },
                      { id: 'thisQuarter', label: 'Quý này' },
                      { id: 'thisYear', label: 'Năm nay' },
                    ].map(p => (
                      <button 
                        key={p.id}
                        onClick={() => applyPreset(p.id)}
                        className={`text-left px-2 py-1.5 rounded text-sm transition-colors ${activePreset === p.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="col-span-2 space-y-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Tùy chỉnh ngày</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Từ ngày</label>
                        <input 
                          type="date" 
                          className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          value={tempStart}
                          onChange={(e) => setTempStart(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Đến ngày</label>
                        <input 
                          type="date" 
                          className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          value={tempEnd}
                          onChange={(e) => setTempEnd(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                      <button 
                        onClick={() => setShowDatePicker(false)}
                        className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 rounded"
                      >
                        Hủy
                      </button>
                      <button 
                        onClick={() => {
                          setFilters(prev => ({ ...prev, startDate: tempStart, endDate: tempEnd }));
                          setActivePreset('custom');
                          setShowDatePicker(false);
                        }}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 text-sm flex items-center gap-1"
                      >
                        <Check size={14} /> Áp dụng
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Tìm tên dịch vụ, ICD..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
              value={filters.DICH_VU}
              onChange={(e) => handleChange('DICH_VU', e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setExpanded(!expanded)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${expanded ? 'bg-blue-50 text-blue-700 border-blue-200 border' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent'}`}
          >
            <Filter size={16} /> 
            Lọc nâng cao
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          
          {(Object.values(filters).some(v => v !== '') && filters.startDate !== '' ) && (
            <button 
              onClick={clearFilters}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Xóa bộ lọc"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-6 pt-2 border-t border-slate-100 bg-slate-50/50 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Khoa điều trị</label>
              <select 
                className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.KHOA}
                onChange={(e) => handleChange('KHOA', e.target.value)}
              >
                <option value="">-- Tất cả khoa --</option>
                {getOptions('KHOA').map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Bác sĩ chỉ định</label>
              <select 
                className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.BAC_SY}
                onChange={(e) => handleChange('BAC_SY', e.target.value)}
              >
                <option value="">-- Tất cả bác sĩ --</option>
                {getOptions('BAC_SY').map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Đối tượng</label>
              <select 
                className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.TEN_DOI_TUONG}
                onChange={(e) => handleChange('TEN_DOI_TUONG', e.target.value)}
              >
                <option value="">-- Tất cả đối tượng --</option>
                {getOptions('TEN_DOI_TUONG').map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Kết quả điều trị</label>
              <select 
                className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.KET_QUA_DTRI}
                onChange={(e) => handleChange('KET_QUA_DTRI', e.target.value)}
              >
                <option value="">-- Tất cả kết quả --</option>
                {getOptions('KET_QUA_DTRI').map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
