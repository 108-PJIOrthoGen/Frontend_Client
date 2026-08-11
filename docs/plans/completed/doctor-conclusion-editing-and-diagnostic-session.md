# Chẩn đoán theo luật và kết luận bác sĩ theo phiên bản

## Mục tiêu

- Khi người dùng xác nhận bệnh nhân và bệnh án trong PatientSelection, đánh giá PJI theo luật phải chạy lại và kết quả phải được lưu theo đúng phạm vi phiên làm việc.
- Bỏ chọn final decision khỏi DoctorDiagnosisStep; việc chọn phiên bản cuối cùng chỉ diễn ra trong tab Kết luận bác sĩ.
- Tab Kết luận bác sĩ cho phép chỉnh sửa review/kết luận của phiên bản AI đã chọn và cảnh báo rõ ràng nếu bệnh án chưa có phiên bản cuối cùng.

## Thực hiện

1. [completed] Gắn việc gọi và lưu `callEvaluatePjiDiagnostic` với thao tác xác nhận bệnh nhân/bệnh án.
2. [completed] Chuyển DoctorConclusionTab sang biểu mẫu chỉnh sửa và lưu review theo phiên bản.
3. [completed] Di chuyển điều khiển chọn final sang tab kết luận, Việt hóa nhãn còn lại, rồi kiểm tra build liên quan.

## Phục hồi

Các thay đổi chỉ giới hạn trong frontend workflow và UI review; có thể hoàn nguyên commit tương ứng mà không cần migration dữ liệu.
