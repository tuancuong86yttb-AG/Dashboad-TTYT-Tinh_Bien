
export interface RawMedicalRecord {
  STT: string;
  TEN_DOI_TUONG: string;
  MA_LK: string;
  MA_BN: string;
  MA_BA: string;
  SO_VAO_VIEN: string;
  NGAY_VAO_VIEN: string;
  NGAY_VAO_KHOA: string;
  NGAY_RA_VIEN: string;
  NGAY_THANH_TOAN: string;
  SO_NGAY_DTRI: string;
  KET_QUA_DTRI: string;
  MA_BENH: string;
  MA_BENHKHAC: string;
  CHAN_DOAN: string;
  CHAN_DOAN_KHAC: string;
  MA_KHOA_CHI_DINH: string;
  MA_BAC_SY: string;
  BAC_SY: string;
  KHOA: string;
  TEN_NHOM: string;
  DICH_VU: string;
  SO_LUONG: string;
  THANH_TIEN: string;
  MA_LOAI_KCB: string;
  TINH_TRANG_RV: string;
}

export interface MedicalRecord {
  id: string; // Unique ID for row (usually combined index or STT)
  TEN_DOI_TUONG: string;
  MA_LK: string;
  MA_BN: string;
  NGAY_VAO_VIEN: Date | null;
  NGAY_VAO_KHOA: Date | null;
  NGAY_RA_VIEN: Date | null;
  NGAY_THANH_TOAN: Date | null;
  NGAY_THONG_KE: Date; // Calculated priority date
  SO_NGAY_DTRI: number;
  KET_QUA_DTRI: string;
  MA_BENH: string;
  CHAN_DOAN: string;
  BAC_SY: string;
  KHOA: string;
  TEN_NHOM: string;
  DICH_VU: string;
  SO_LUONG: number;
  THANH_TIEN: number;
  MA_LOAI_KCB: string;
  TINH_TRANG_RV: string;
  NAM: number;
  THANG: number;
  QUY: number;
}

export interface FilterState {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  KHOA: string;
  BAC_SY: string;
  TEN_NHOM: string;
  DICH_VU: string;
  TEN_DOI_TUONG: string;
  MA_LOAI_KCB: string;
  MA_BENH: string;
  KET_QUA_DTRI: string;
  TINH_TRANG_RV: string;
}

export type KPIStats = {
  totalVisits: number; // Unique MA_LK
  totalPatients: number; // Unique MA_BN
  totalCost: number; // Sum THANH_TIEN
  totalRows: number;
  activeDepts: number;
  activeDoctors: number;
  avgTreatmentDays: number;
  topICD: string;
  topService: string;
  
  // Counts by Visit Type
  countKhamBenh: number;        // 01 - Khám bệnh
  countDieuTriNgoaiTru: number; // 02 - Điều trị ngoại trú
  countNoiTru: number;          // 03 - Điều trị nội trú
  countKhac: number;            // Khác
  
  // Revenue by Visit Type (New)
  revenueKhamBenh: number;
  revenueDieuTriNgoaiTru: number;
  revenueNoiTru: number;
  revenueKhac: number;
  
  // Specific Category Revenue
  totalMedicineRevenue: number; // Revenue from medicine groups
  totalCDHARevenue: number;     // Revenue from Diagnostic Imaging (CĐHA)
  totalLabRevenue: number;      // Revenue from Laboratory (Xét nghiệm)
  totalBedRevenue: number;      // Revenue from Beds (Tiền giường)
};

export interface AlertItem {
  type: 'warning' | 'info' | 'danger';
  message: string;
  detail: string;
}
