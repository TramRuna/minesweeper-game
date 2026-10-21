# Dò Mìn Logic — Minesweeper

## Chạy game
1. Giải nén thư mục.
2. Mở `index.html` bằng Chrome, Edge hoặc Firefox. Không cần cài thư viện hay chạy máy chủ.
3. Chuột trái: mở ô. Chuột phải: cắm/bỏ cờ. Trên điện thoại có thể bật chế độ cắm cờ.

## Cấu trúc
- `index.html`: cấu trúc giao diện.
- `style.css`: giao diện responsive.
- `script.js`: luật game, bộ đếm thời gian, kiểm tra thắng/thua và AI suy luận.

## Thuật toán AI
AI duyệt các ô số đã mở. Với mỗi ô số:
- `hidden`: số ô chưa mở và chưa cắm cờ xung quanh.
- `flags`: số cờ xung quanh.
- `remaining = clue - flags`.
- Nếu `remaining == 0`, các ô `hidden` là an toàn.
- Nếu `remaining == hidden.length`, các ô `hidden` đều là mìn.
AI gợi ý ô an toàn trước; nếu không có ô an toàn chắc chắn, AI có thể chỉ ra ô mìn. Nếu không có suy luận chắc chắn, AI không đoán ngẫu nhiên.

## Giới hạn
Đây là AI dựa trên luật suy luận cục bộ, không phải học máy. Nó giả định các cờ người chơi đã đặt là đúng và không giải được mọi trạng thái. Nếu không tìm thấy nước đi chắc chắn, game sẽ thông báo điều đó.

## Kiểm thử thủ công
- Mở ô thường và ô trống.
- Cắm/bỏ cờ bằng chuột phải.
- Thử chế độ cắm cờ.
- Chạm mìn để kiểm tra thua.
- Mở hết ô an toàn để kiểm tra thắng.
- Bấm chơi lại.
- Thử AI gợi ý trước và sau khi mở vài ô.
