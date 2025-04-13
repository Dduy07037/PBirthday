# Ứng dụng 3D Chúc mừng Sinh nhật

Đây là ứng dụng web hiển thị hiệu ứng 3D Chúc mừng Sinh nhật sử dụng Spline.

## Cách chạy ứng dụng

1. Cài đặt các thư viện cần thiết:
```bash
npm install
```

2. Chạy ứng dụng ở môi trường phát triển:
```bash
npm run dev
```

3. Mở trình duyệt và truy cập địa chỉ: [http://localhost:3000](http://localhost:3000)

## Thông tin kỹ thuật

- Next.js: Framework React
- Spline: Thư viện hiển thị 3D
- Scene 3D đang sử dụng: Bánh sinh nhật 3D với chữ "Happy Birthday" và hiệu ứng nến

## Thay đổi scene 3D

Để thay đổi scene 3D:
1. Tạo scene của riêng bạn trên [Spline](https://spline.design)
2. Xuất scene và lấy URL
3. Thay thế URL trong file `app/page.js` 