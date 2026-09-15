2 CẢNH ĐẦU (nguyên gốc từ lovegiftspecial)
- Cảnh 1: loading "Đang chuẩn bị yêu thương..." (hàm hideLoading())
- Cảnh 2: nền sao Three.js (assets/enhanced-effects.js) + nút "Giữ để bắt đầu"

Điểm nối phần sau: khi giữ đủ 1 giây, trang bắn sự kiện window "__textStart".
Chỉ cần thêm: window.addEventListener("__textStart", function(){ /* cảnh 3 */ });

Đã lược bỏ: quả cầu ảnh, phong bì, popup, modal ảnh, nhạc nền, chặn devtools.
Chạy: mở index.html qua web server (vd: python3 -m http.server) vì có script type=module.
