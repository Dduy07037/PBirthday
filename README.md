# Ứng dụng 3D Chúc mừng Sinh nhật

Ứng dụng hiển thị mô hình 3D với hiệu ứng đẹp mắt để gửi lời chúc mừng sinh nhật đặc biệt.

## Tính năng

- Hiển thị mô hình ngôi nhà hộp sữa 3D và mô hình mèo 3D
- Hiệu ứng mây di chuyển và mặt trời lấp lánh
- Hiệu ứng loading đám mây đẹp mắt 
- Giao diện người dùng với màu sắc pastel dễ thương
- Điều khiển camera để xem mô hình từ nhiều góc độ
- Hiệu ứng ánh sáng và bóng đổ tạo không gian hoàng hôn ấm áp
- Trang debug để hỗ trợ phát hiện và khắc phục sự cố

## Công nghệ sử dụng

- Next.js
- Three.js
- React Three Fiber
- React Three Drei
- JavaScript/ES6

## Cài đặt

1. Clone repository về máy:
```
git clone https://github.com/Dduy07037/PBirthday.git
```

2. Di chuyển vào thư mục dự án:
```
cd PBirthday
```

3. Cài đặt các dependencies:
```
npm install
```

4. Chạy ứng dụng ở môi trường phát triển:
```
npm run dev
```

5. Mở trình duyệt và truy cập địa chỉ:
```
http://localhost:3000
```

## Cấu trúc dự án

```
PBirthday/
├── app/                  # Thư mục chứa mã nguồn chính
│   ├── debug/            # Trang debug
│   ├── gltf-model.js     # Component hiển thị mô hình 3D
│   ├── page.js           # Trang chính
│   └── ...
├── public/               # Tài nguyên tĩnh
│   ├── cardboard_house/  # Mô hình 3D ngôi nhà
│   ├── cat_model/        # Mô hình 3D con mèo
│   └── ...
└── ...
```

## Tùy chỉnh

Để thay đổi màu sắc, bạn có thể chỉnh sửa các giá trị trong đối tượng `COLORS` trong file `app/gltf-model.js`.

## Khắc phục sự cố

Nếu gặp vấn đề khi tải mô hình 3D, hãy truy cập trang debug tại địa chỉ:
```
http://localhost:3000/debug
```

## Thông tin kỹ thuật

- Next.js: Framework React
- Spline: Thư viện hiển thị 3D
- Scene 3D đang sử dụng: Bánh sinh nhật 3D với chữ "Happy Birthday" và hiệu ứng nến

## Thay đổi scene 3D

Để thay đổi scene 3D:
1. Tạo scene của riêng bạn trên [Spline](https://spline.design)
2. Xuất scene và lấy URL
3. Thay thế URL trong file `app/page.js` 