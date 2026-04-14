import { Edit, Plus, X, Calendar, Clock, MapPin, DollarSign, User, Phone, FileText, Music } from "lucide-react";

// 👈 ĐƯA INPUTGROUP RA NGOÀI NÀY ĐỂ TRÁNH MẤT FOCUS
const InputGroup = ({ label, icon: Icon, name, value, type = "text", placeholder, onChange }) => (
  <div className="space-y-1.5 text-left">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">{label}</label>
    <div className="relative group">
      <Icon className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-violet-500 transition" size={18}/>
      <input 
        name={name} 
        value={value} 
        onChange={onChange} 
        type={type}
        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 ring-violet-500 outline-none font-bold text-slate-800 transition" 
        placeholder={placeholder}
      />
    </div>
  </div>
);

const BookingModal = ({ isOpen, onClose, onSave, formData, handleChange, editingId }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden animate-slide-up border border-white">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
           <div className="text-left">
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3 leading-none">
                {editingId ? <><Edit className="text-violet-600" size={24}/> Cập nhật Show</> : <><Plus className="text-blue-600" size={24}/> Tạo Booking Mới</>}
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-1.5">Điền thông tin chi tiết để lên lịch diễn</p>
           </div>
           <button onClick={onClose} className="p-2.5 bg-white border border-slate-100 rounded-full text-slate-400 hover:text-rose-500 hover:border-rose-100 transition shadow-sm"><X size={20}/></button>
        </div>
        
        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputGroup label="Tên Show diễn *" icon={Music} name="title" value={formData.title} onChange={handleChange} placeholder="VD: Đám cưới khách sạn A..."/>
              <InputGroup label="Tên khách hàng" icon={User} name="customerName" value={formData.customerName} onChange={handleChange} placeholder="Người liên hệ chính"/>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <InputGroup label="SĐT Khách" icon={Phone} name="phone" value={formData.phone} onChange={handleChange} placeholder="090..."/>
              <InputGroup label="Ngày diễn *" icon={Calendar} name="date" value={formData.date} onChange={handleChange} type="date"/>
              <InputGroup label="Giờ diễn" icon={Clock} name="time" value={formData.time} onChange={handleChange} type="time"/>
           </div>

           <InputGroup label="Địa điểm chính xác" icon={MapPin} name="location" value={formData.location} onChange={handleChange} placeholder="Số nhà, tên sảnh, quận/huyện..."/>

           <div className="grid grid-cols-2 gap-5 p-6 bg-emerald-50 rounded-[32px] border border-emerald-100">
              <InputGroup label="Cát-xê / người" icon={DollarSign} name="price" value={formData.price} onChange={handleChange} type="number" placeholder="0"/>
              <InputGroup label="Tiền đã cọc" icon={DollarSign} name="deposit" value={formData.deposit} onChange={handleChange} type="number" placeholder="0"/>
           </div>

           <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ghi chú yêu cầu</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[24px] focus:ring-2 ring-violet-500 outline-none font-medium text-slate-700 transition" placeholder="Yêu cầu riêng của khách, concept trang phục..."></textarea>
           </div>
        </div>

        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
           <button onClick={onClose} className="px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition">Hủy bỏ</button>
           <button onClick={onSave} className="px-10 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest bg-slate-900 text-white hover:bg-black shadow-xl shadow-slate-200 transition transform active:scale-95">
              {editingId ? "Lưu thay đổi" : "Xác nhận tạo"}
           </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;