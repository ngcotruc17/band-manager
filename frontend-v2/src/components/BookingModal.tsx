import React from "react";
import { Edit, Plus, X, Calendar, Clock, MapPin, DollarSign, User, Phone, Music, Users, Shirt, Tag, FileText } from "lucide-react";

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
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">{label}</label>
    <div className="relative group">
      <Icon className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-650 transition" size={18}/>
      <input
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        required={required}
        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200/50 rounded-2xl focus:ring-2 ring-indigo-500 outline-none font-bold text-slate-800 transition text-sm focus:bg-white"
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-7 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="text-left">
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3 leading-none">
              {editingId
                ? <><Edit className="text-indigo-650" size={24}/> Cập nhật Show</>
                : <><Plus className="text-indigo-600" size={24}/> Tạo Booking Mới</>}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1.5">Điền thông tin chi tiết để lên lịch diễn</p>
          </div>
          <button onClick={onClose} className="p-2.5 bg-white border border-slate-100 rounded-full text-slate-400 hover:text-rose-500 hover:border-rose-100 transition shadow-sm">
            <X size={20}/>
          </button>
        </div>

        <div className="p-7 space-y-5 max-h-[72vh] overflow-y-auto">

          {/* Tên show & Khách hàng */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputGroup label="Tên Show diễn *" icon={Music} name="title" value={formData.title} onChange={handleChange} placeholder="VD: Đám cưới khách sạn A..." required/>
            <InputGroup label="Tên khách hàng" icon={User} name="customerName" value={formData.customerName} onChange={handleChange} placeholder="Người liên hệ chính"/>
          </div>

          {/* Loại sự kiện */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Loại Sự Kiện</label>
            <div className="relative group">
              <Tag className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-650 transition z-10" size={18}/>
              <select
                name="eventType"
                value={formData.eventType}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200/50 rounded-2xl focus:ring-2 ring-indigo-500 outline-none font-bold text-slate-800 transition text-sm focus:bg-white appearance-none cursor-pointer"
              >
                <option value="">-- Chọn loại sự kiện --</option>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* SĐT, Ngày, Giờ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputGroup label="SĐT Khách" icon={Phone} name="phone" value={formData.phone} onChange={handleChange} placeholder="090..."/>
            <InputGroup label="Ngày diễn *" icon={Calendar} name="date" value={formData.date} onChange={handleChange} type="date" required/>
            <InputGroup label="Giờ diễn" icon={Clock} name="time" value={formData.time} onChange={handleChange} type="time"/>
          </div>

          {/* Địa điểm */}
          <InputGroup label="Địa điểm chính xác" icon={MapPin} name="location" value={formData.location} onChange={handleChange} placeholder="Số nhà, tên sảnh, quận/huyện..."/>

          {/* Số thành viên & Dress code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputGroup label="Số thành viên tham diễn" icon={Users} name="memberCount" value={formData.memberCount} onChange={handleChange} type="number" placeholder="VD: 6"/>
            <InputGroup label="Dress code / Trang phục" icon={Shirt} name="dresscode" value={formData.dresscode} onChange={handleChange} placeholder="VD: Vest đen, áo dài trắng..."/>
          </div>

          {/* Tài chính */}
          <div className="grid grid-cols-3 gap-4 p-5 bg-emerald-50 rounded-[28px] border border-emerald-100">
            <InputGroup label="Cát-xê / người" icon={DollarSign} name="price" value={formData.price} onChange={handleChange} type="number" placeholder="0"/>
            <InputGroup label="Tiền đã cọc" icon={DollarSign} name="deposit" value={formData.deposit} onChange={handleChange} type="number" placeholder="0"/>
            <InputGroup label="Phụ phí khác" icon={DollarSign} name="extraFee" value={formData.extraFee} onChange={handleChange} type="number" placeholder="0"/>
          </div>

          {/* Ghi chú */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
              <FileText size={14}/> Ghi chú yêu cầu
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full p-4 bg-slate-50 border border-slate-150 rounded-[20px] focus:ring-2 ring-indigo-500 outline-none font-medium text-slate-700 transition text-sm focus:bg-white resize-none"
              placeholder="Yêu cầu riêng của khách, setlist concept, bố cục sân khấu..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-5 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition">Hủy bỏ</button>
          <button onClick={onSave} className="px-10 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest bg-slate-900 text-white hover:bg-black shadow-xl shadow-slate-200 transition transform active:scale-95">
            {editingId ? "Lưu thay đổi" : "Xác nhận tạo"}
          </button>
        </div>
      </div>
    </div>
  );
}
