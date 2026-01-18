import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { format, isWithinInterval, endOfDay, startOfDay } from 'date-fns';
import { 
    UploadCloud, Activity, Users, DollarSign, FileText, 
    LayoutDashboard, Building2, Stethoscope, Pill, AlertTriangle, ClipboardCopy, Link2, X, PlusCircle, CheckCircle2,
    BedDouble, PersonStanding, BriefcaseMedical, Scan, FlaskConical, TrendingUp, UserCheck,
    ArrowLeft
} from 'lucide-react';

import { MedicalRecord, RawMedicalRecord, FilterState } from './types';
import { processRawData, calculateKPIs, generateAlerts, formatCurrency, formatNumber } from './utils';
import FilterBar from './components/FilterBar';
import KPICard from './components/KPICard';
import { 
    CostByTimeLineChart, CostByDeptBarChart, VisitsByDeptBarChart, CostByObjectPieChart, 
    GenericBarChart, GenericPieChart, RevenueStructureChart, MultiLineChart
} from './components/DashboardCharts';
import DataTable from './components/DataTable';

// Helper parse date local
const parseDateInput = (str: string): Date => {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const App: React.FC = () => {
  const [rawData, setRawData] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'dept' | 'icd' | 'service'>('overview');
  
  const [inputMode, setInputMode] = useState<'file' | 'url'>('url');
  const [sheetUrl, setSheetUrl] = useState('https://docs.google.com/spreadsheets/d/1bnNszjpn8hD7r8fjH_8wd1B-UzoOJtlbHD6tGMbcgIU/edit?gid=366163500');

  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
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

  const [selectedICDs, setSelectedICDs] = useState<string[]>([]);

  const handleParseComplete = (results: Papa.ParseResult<RawMedicalRecord>) => {
    try {
      const requiredCols = ['MA_LK', 'MA_BN', 'THANH_TIEN', 'KHOA'];
      const headers = results.meta.fields || [];
      const missing = requiredCols.filter(c => !headers.includes(c));
      
      if (missing.length > 0) {
        setError(`Thiếu cột: ${missing.join(', ')}`);
        setLoading(false);
        return;
      }

      const processed = processRawData(results.data);
      if (processed.length === 0) {
          setError("Không có dữ liệu hợp lệ.");
          setLoading(false);
          return;
      }

      setRawData(processed);
      const dates = processed.map(d => d.NGAY_THONG_KE.getTime());
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      setFilters(prev => ({
           ...prev,
           startDate: format(minDate, 'yyyy-MM-dd'),
           endDate: format(maxDate, 'yyyy-MM-dd')
      }));
      setLoading(false);
    } catch (err) {
      setError("Lỗi xử lý dữ liệu.");
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    Papa.parse<RawMedicalRecord>(file, {
      header: true,
      skipEmptyLines: true,
      complete: handleParseComplete,
      error: (err) => {
        setError(err.message);
        setLoading(false);
      }
    });
  };

  const handleSheetFetch = async () => {
    if (!sheetUrl) return;
    setLoading(true);
    setError(null);
    const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
        setError("Link Sheet không đúng.");
        setLoading(false);
        return;
    }
    const exportUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
    try {
        const response = await fetch(exportUrl);
        if (!response.ok) throw new Error("Không thể tải Sheet.");
        const csvText = await response.text();
        Papa.parse<RawMedicalRecord>(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: handleParseComplete
        });
    } catch (err: any) {
        setError(err.message);
        setLoading(false);
    }
  };

  useEffect(() => {
    if (inputMode === 'url' && sheetUrl) handleSheetFetch();
  }, []);

  const filteredData = useMemo(() => {
    if (rawData.length === 0) return [];
    let start = filters.startDate ? startOfDay(parseDateInput(filters.startDate)) : null;
    let end = filters.endDate ? endOfDay(parseDateInput(filters.endDate)) : null;

    return rawData.filter(item => {
      if (start && end && !isWithinInterval(item.NGAY_THONG_KE, { start, end })) return false;
      if (filters.KHOA && item.KHOA !== filters.KHOA) return false;
      if (filters.BAC_SY && item.BAC_SY !== filters.BAC_SY) return false;
      if (filters.TEN_NHOM && item.TEN_NHOM !== filters.TEN_NHOM) return false;
      if (filters.TEN_DOI_TUONG && item.TEN_DOI_TUONG !== filters.TEN_DOI_TUONG) return false;
      if (filters.MA_LOAI_KCB && item.MA_LOAI_KCB !== filters.MA_LOAI_KCB) return false;
      if (filters.MA_BENH && item.MA_BENH !== filters.MA_BENH) return false;
      if (filters.DICH_VU && !item.DICH_VU.toLowerCase().includes(filters.DICH_VU.toLowerCase())) return false;
      return true;
    });
  }, [rawData, filters]);

  const kpiStats = useMemo(() => calculateKPIs(filteredData), [filteredData]);
  const alerts = useMemo(() => generateAlerts(filteredData), [filteredData]);

  const chartData = useMemo(() => {
    if (filteredData.length === 0) return { byDate: [], byDept: [], visitsByDept: [], byObject: [], topICD: [], topServices: [], byDoc: [], allDocs: [], docPieData: [], byGroup: [], byTreatmentResult: [], byDischargeStatus: [], revenueByDischargeStatus: [], topServicesPie: [], revenueStructurePie: [] };

    const dateMap = new Map();
    const deptCostMap = new Map();
    const deptVisitMap = new Map();
    const objMap = new Map();
    const icdMap = new Map();
    const icdCostMap = new Map();
    const svcMap = new Map();
    const docMap = new Map();
    const groupMap = new Map();
    const resultMap = new Map();
    const statusMap = new Map();
    const statusRevMap = new Map();
    const processedVisits = new Set();

    let revMed = 0, revCLS = 0, revBed = 0, revOther = 0;

    filteredData.forEach(d => {
        const sortKey = format(d.NGAY_THONG_KE, 'yyyy-MM-dd');
        const displayKey = format(d.NGAY_THONG_KE, 'dd/MM');
        if (!dateMap.has(sortKey)) dateMap.set(sortKey, { dateStr: displayKey, cost: 0, visits: new Set() });
        const e = dateMap.get(sortKey);
        e.cost += d.THANH_TIEN;
        e.visits.add(d.MA_LK);

        deptCostMap.set(d.KHOA, (deptCostMap.get(d.KHOA) || 0) + d.THANH_TIEN);
        if(!deptVisitMap.has(d.KHOA)) deptVisitMap.set(d.KHOA, new Set());
        deptVisitMap.get(d.KHOA).add(d.MA_LK);

        objMap.set(d.TEN_DOI_TUONG, (objMap.get(d.TEN_DOI_TUONG) || 0) + d.THANH_TIEN);

        if(!icdMap.has(d.MA_BENH)) icdMap.set(d.MA_BENH, new Set());
        icdMap.get(d.MA_BENH).add(d.MA_LK);
        icdCostMap.set(d.MA_BENH, (icdCostMap.get(d.MA_BENH) || 0) + d.THANH_TIEN);

        if(!svcMap.has(d.DICH_VU)) svcMap.set(d.DICH_VU, { cost: 0, qty: 0, group: d.TEN_NHOM });
        const s = svcMap.get(d.DICH_VU);
        s.cost += d.THANH_TIEN; s.qty += d.SO_LUONG;

        if (d.BAC_SY !== 'Unknown') {
            if (!docMap.has(d.BAC_SY)) docMap.set(d.BAC_SY, { cost: 0, visits: new Set() });
            docMap.get(d.BAC_SY).cost += d.THANH_TIEN;
            docMap.get(d.BAC_SY).visits.add(d.MA_LK);
        }

        groupMap.set(d.TEN_NHOM, (groupMap.get(d.TEN_NHOM) || 0) + d.THANH_TIEN);

        if (!processedVisits.has(d.MA_LK)) {
            processedVisits.add(d.MA_LK);
            resultMap.set(d.KET_QUA_DTRI, (resultMap.get(d.KET_QUA_DTRI) || 0) + 1);
            statusMap.set(d.TINH_TRANG_RV, (statusMap.get(d.TINH_TRANG_RV) || 0) + 1);
        }
        statusRevMap.set(d.TINH_TRANG_RV, (statusRevMap.get(d.TINH_TRANG_RV) || 0) + d.THANH_TIEN);

        const group = d.TEN_NHOM.toLowerCase();
        if (group.includes('thuốc') || group.includes('dược')) revMed += d.THANH_TIEN;
        else if (group.includes('xét nghiệm') || group.includes('chẩn đoán') || group.includes('siêu âm')) revCLS += d.THANH_TIEN;
        else if (group.includes('giường')) revBed += d.THANH_TIEN;
        else revOther += d.THANH_TIEN;
    });

    return {
        byDate: Array.from(dateMap.entries()).sort((a,b) => a[0].localeCompare(b[0])).map(([_, v]) => ({ date: v.dateStr, totalCost: v.cost, totalVisits: v.visits.size })),
        byDept: Array.from(deptCostMap.entries()).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 10),
        visitsByDept: Array.from(deptVisitMap.entries()).map(([name, s]) => ({ name, value: s.size })).sort((a,b) => b.value - a.value).slice(0, 10),
        byObject: Array.from(objMap.entries()).map(([name, value]) => ({ name, value })),
        topICD: Array.from(icdMap.entries()).map(([name, s]) => ({ name, value: s.size, cost: icdCostMap.get(name) })).sort((a,b) => b.value - a.value).slice(0, 20),
        topServices: Array.from(svcMap.entries()).map(([name, v]) => ({ name, value: v.cost, qty: v.qty })).sort((a,b) => b.value - a.value).slice(0, 20),
        allDocs: Array.from(docMap.entries()).map(([name, v]) => ({ name, cost: v.cost, visits: v.visits.size })).sort((a,b) => b.cost - a.cost),
        byGroup: Array.from(groupMap.entries()).map(([name, value]) => ({ name, value })),
        byTreatmentResult: Array.from(resultMap.entries()).map(([name, value]) => ({ name, value })),
        byDischargeStatus: Array.from(statusMap.entries()).map(([name, value]) => ({ name, value })),
        revenueByDischargeStatus: Array.from(statusRevMap.entries()).map(([name, value]) => ({ name, value })),
        revenueStructurePie: [
            { name: 'Thuốc', value: revMed },
            { name: 'Cận Lâm Sàng', value: revCLS },
            { name: 'Tiền Giường', value: revBed },
            { name: 'Khác', value: revOther }
        ].filter(x => x.value > 0),
        byDoc: Array.from(docMap.entries()).slice(0, 20).map(([name, v]) => ({ name, cost: v.cost })),
        docPieData: Array.from(docMap.entries()).slice(0, 5).map(([name, v]) => ({ name, value: v.cost })),
        topServicesPie: Array.from(svcMap.entries()).slice(0, 10).map(([name, v]) => ({ name, value: v.cost }))
    };
  }, [filteredData]);

  const icdTrendData = useMemo(() => {
    if (selectedICDs.length === 0) return [];
    const tMap = new Map();
    filteredData.forEach(d => {
        if (selectedICDs.includes(d.MA_BENH)) {
            const m = format(d.NGAY_THONG_KE, 'MM/yyyy');
            if (!tMap.has(m)) tMap.set(m, { date: m });
            tMap.get(m)[d.MA_BENH] = (tMap.get(m)[d.MA_BENH] || 0) + 1;
        }
    });
    return Array.from(tMap.values()).sort((a,b) => a.date.localeCompare(b.date));
  }, [filteredData, selectedICDs]);

  if (rawData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center">
            <UploadCloud size={48} className="text-blue-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">HIS Dashboard</h1>
            <div className="space-y-4">
                <input 
                    type="text" 
                    placeholder="Link Google Sheet..."
                    className="w-full border p-2 rounded"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                />
                <button 
                    onClick={handleSheetFetch}
                    className="w-full bg-blue-600 text-white py-2 rounded font-bold"
                >
                    {loading ? 'Đang tải...' : 'Bắt đầu phân tích'}
                </button>
            </div>
            {error && <p className="mt-4 text-red-600">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-10 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <Activity className="text-blue-600" />
            <span className="font-bold text-lg">HIS Dashboard</span>
        </div>
        <nav className="flex gap-2">
            {['overview', 'dept', 'icd', 'service'].map(t => (
                <button 
                    key={t}
                    onClick={() => setActiveTab(t as any)}
                    className={`px-3 py-1 rounded text-sm ${activeTab === t ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'}`}
                >
                    {t.toUpperCase()}
                </button>
            ))}
        </nav>
      </header>
      <main className="p-4 max-w-7xl mx-auto">
        <FilterBar data={rawData} filters={filters} setFilters={setFilters} />
        {activeTab === 'overview' && (
            <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <KPICard title="Tổng Chi Phí" value={formatCurrency(kpiStats.totalCost)} icon={DollarSign} color="red" />
                    <KPICard title="Số Lượt" value={formatNumber(kpiStats.totalVisits)} icon={Users} color="blue" />
                    <KPICard title="Nội Trú" value={formatNumber(kpiStats.countNoiTru)} icon={BedDouble} color="purple" />
                    <KPICard title="Ngoại Trú" value={formatNumber(kpiStats.countDieuTriNgoaiTru)} icon={BriefcaseMedical} color="green" />
                    <KPICard title="Khám Bệnh" value={formatNumber(kpiStats.countKhamBenh)} icon={PersonStanding} color="orange" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CostByTimeLineChart data={chartData.byDate} />
                    <RevenueStructureChart data={chartData.revenueStructurePie} />
                    <CostByDeptBarChart data={chartData.byDept} />
                    <VisitsByDeptBarChart data={chartData.visitsByDept} />
                </div>
            </div>
        )}
        {activeTab === 'dept' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <GenericBarChart data={chartData.byDept} title="Chi phí theo Khoa" dataKey="value" name="Tiền" format="currency" />
                    <GenericBarChart data={chartData.byDoc} title="Top Bác sĩ" dataKey="cost" name="Tiền" color="#10b981" format="currency" />
                </div>
                <DataTable 
                    title="Danh sách Bác sĩ"
                    data={chartData.allDocs}
                    columns={[
                        { header: 'Họ tên', accessor: (r:any) => r.name },
                        { header: 'Số lượt', accessor: (r:any) => formatNumber(r.visits), align: 'right' },
                        { header: 'Tổng tiền', accessor: (r:any) => formatCurrency(r.cost), align: 'right' }
                    ]}
                    onExport={() => {}}
                />
            </div>
        )}
        {activeTab === 'icd' && (
            <div className="space-y-6">
                <div className="bg-white p-4 rounded border">
                    <h3 className="font-bold mb-2">So sánh xu hướng (Chọn ICD bên dưới)</h3>
                    {selectedICDs.length > 0 && <MultiLineChart data={icdTrendData} lines={selectedICDs} />}
                </div>
                <DataTable 
                    title="Thống kê Bệnh tật"
                    data={chartData.topICD}
                    columns={[
                        { header: 'Mã ICD', accessor: (r:any) => r.name },
                        { header: 'Lượt', accessor: (r:any) => formatNumber(r.value), align: 'right' },
                        { 
                            header: 'Chọn', 
                            accessor: (r:any) => (
                                <input 
                                    type="checkbox" 
                                    checked={selectedICDs.includes(r.name)} 
                                    onChange={() => {
                                        if(selectedICDs.includes(r.name)) setSelectedICDs(s => s.filter(x => x !== r.name));
                                        else if(selectedICDs.length < 5) setSelectedICDs(s => [...s, r.name]);
                                    }}
                                />
                            )
                        }
                    ]}
                    onExport={() => {}}
                />
            </div>
        )}
        {activeTab === 'service' && (
            <div className="space-y-6">
                <GenericBarChart data={chartData.byGroup} title="Chi phí theo Nhóm" dataKey="value" name="Tiền" color="#6366f1" format="currency" />
                <DataTable 
                    title="Chi tiết Dịch vụ"
                    data={chartData.topServices}
                    columns={[
                        { header: 'Dịch vụ', accessor: (r:any) => r.name },
                        { header: 'SL', accessor: (r:any) => formatNumber(r.qty), align: 'right' },
                        { header: 'Tiền', accessor: (r:any) => formatCurrency(r.value), align: 'right' }
                    ]}
                    onExport={() => {}}
                />
            </div>
        )}
      </main>
    </div>
  );
};

export default App;