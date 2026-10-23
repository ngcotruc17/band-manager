import React from "react";
import { Edit, Plus, X, Calendar, Clock, MapPin, DollarSign, User, Phone, Music, Users, Shirt, Tag, FileText, ChevronDown } from "lucide-react";

interface InputGroupProps {
  label: string;
  icon: React.ComponentType<any>;
  name: string;
  value: any;
  type?: string;
  placeholder?: string;
  required?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputGroup = ({ label, icon: Icon, name, value, type = "text", placeholder, required, onChange }: InputGroupProps) => (
  <div className="space-y-1.5 text-left">
    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">{label}</label>
    <div className="relative flex items-center">
      <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition">
        <Icon size={16}/>
      </div>
      <input
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        required={required}
        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none font-bold text-slate-800 transition text-xs shadow-2xs"
        placeholder={placeholder}
      />
    </div>
  </div>
);

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  editingId: string | null;
}

const EVENT_TYPES = [
  "Đám cưới / Tiệc cưới",
  "Sinh nhật / Kỷ niệm",
  "Sự kiện doanh nghiệp",
  "Hội trường / Liên hoan",
  "Bar / Pub / Lounge",
  "Ngoài trời / Picnic",
  "Tết / Lễ hội",
  "Khác"
];

export default function BookingModal({ isOpen, onClose, onSave, formData, handleChange, editingId }: BookingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-fade-in">
      {/* 🍏 iOS Fluid Frosted Glass Modal */}
      <div className="bg-white/95 backdrop-blur-3xl rounded-[2rem] w-full max-w-2xl shadow-[0_25px_60px_-15px_rgba(15,23,42,0.25)] overflow-hidden border border-white/80 animate-slide-up">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="text-left">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2.5 tracking-tight">
              {editingId
                ? <><Edit className="text-indigo-600" size={20}/> Cập nhật Show Diễn</>
                : <><Plus className="text-indigo-600" size={20}/> Tạo Booking Show Mới</>}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Lên lịch trình, thông tin khách hàng & phân bổ cát-xê</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-white border border-slate-200/80 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-2xs cursor-pointer"
          >
            <X size={18}/>
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">

          {/* Tên show & Khách hàng */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <InputGroup label="Tên Show diễn *" icon={Music} name="title" value={formData.title} onChange={handleChange} placeholder="VD: Đám cưới khách sạn A..." required/>
            <InputGroup label="Tên khách hàng" icon={User} name="customerName" value={formData.customerName} onChange={handleChange} placeholder="Người liên hệ chính"/>
          </div>

          {/* Loại sự kiện */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Loại Sự Kiện</label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400 z-10">
                <Tag size={16}/>
              </div>
              <select
                name="eventType"
                value={formData.eventType}
                onChange={handleChange}
                className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none font-bold text-slate-800 transition text-xs shadow-2xs appearance-none cursor-pointer"
              >
                <option value="">-- Chọn loại sự kiện --</option>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="absolute right-4 pointer-events-none text-slate-400">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          {/* SĐT, Ngày, Giờ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <InputGroup label="SĐT Khách" icon={Phone} name="phone" value={formData.phone} onChange={handleChange} placeholder="090..."/>
            <InputGroup label="Ngày diễn *" icon={Calendar} name="date" value={formData.date} onChange={handleChange} type="date" required/>
            <InputGroup label="Giờ diễn" icon={Clock} name="time" value={formData.time} onChange={handleChange} type="time"/>
          </div>

          {/* Địa điểm */}
          <InputGroup label="Địa điểm chính xác" icon={MapPin} name="location" value={formData.location} onChange={handleChange} placeholder="Số nhà, tên sảnh, quận/huyện..."/>

          {/* Số thành viên & Dress code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <InputGroup label="Số thành viên tham diễn" icon={Users} name="memberCount" value={formData.memberCount} onChange={handleChange} type="number" placeholder="VD: 6"/>
            <InputGroup label="Dress code / Trang phục" icon={Shirt} name="dresscode" value={formData.dresscode} onChange={handleChange} placeholder="VD: Vest đen, áo dài trắng..."/>
          </div>

          {/* Tài chính */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80">
            <InputGroup label="Cát-xê / người" icon={DollarSign} name="price" value={formData.price} onChange={handleChange} type="number" placeholder="0"/>
            <InputGroup label="Tiền đã cọc" icon={DollarSign} name="deposit" value={formData.deposit} onChange={handleChange} type="number" placeholder="0"/>
            <InputGroup label="Phụ phí khác" icon={DollarSign} name="extraFee" value={formData.extraFee} onChange={handleChange} type="number" placeholder="0"/>
          </div>

          {/* Ghi chú */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
              <FileText size={14}/> Ghi chú yêu cầu
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none font-medium text-slate-700 transition text-xs shadow-2xs resize-none"
              placeholder="Yêu cầu riêng của khách, setlist concept, bố cục sân khấu..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex justify-end gap-2.5">
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-200/60 transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={onSave} 
            className="px-8 py-2.5 rounded-xl font-extrabold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            {editingId ? "Lưu thay đổi" : "Xác nhận tạo"}
          </button>
        </div>
      </div>
    </div>
  );
}
