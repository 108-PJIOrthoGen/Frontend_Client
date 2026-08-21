# Tài Liệu Thiết Kế & Thay Đổi Kiến Trúc: PJI Diagnosis & Genomic Interpretation

**Ngày cập nhật:** 21/08/2026  
**Vị trí module:** `Frontend_Client/src/components/user/quick_diagnosis/`  
**Trạng thái:** Hoàn thiện 100%, 8/8 unit tests passed, build thành công.

---

## 1. Tổng Quan & Cấu Trúc Hai Chế Độ

Công cụ chẩn đoán PJI (`PjiDiagnosisCalculator`) được đồng bộ hoàn toàn theo cấu trúc chuẩn của trang [ICM Ortho PJIDx](https://www.icmortho.org/pjidx), cung cấp 2 chế độ đánh giá:

1. **PJI Diagnosis Algorithm**:
   - Thuật toán chẩn đoán chuẩn ICM 2018 (10 câu hỏi từ tiền sử thay khớp, đường rò, nuôi cấy, CRP, ESR, D-dimer, WBC dịch khớp, PMN%, LE, Alpha-defensin, mô bệnh học, mủ trong mổ).
2. **Interpret Genomic Results**:
   - Thuật toán tích hợp MicroGenDX & ICM 2018:
   - **Câu 1**: Nhập kết quả MicroGen Testing (Dương tính / Âm tính / Chưa làm, kèm tên vi khuẩn, tỷ lệ phong phú % reads và gen kháng thuốc AMR).
   - **Câu 2 đến 11**: Trả lời đầy đủ bảng câu hỏi tiêu chuẩn ICM 2018.
   - **Kết quả tổng hợp**: Đưa ra đồng thời điểm số ICM 2018 và **Bảng đối chiếu chéo (Cross-Validation Matrix)** giữa kết quả lâm sàng và vi sinh phân tử.

---

## 2. Ma Trận Đối Chiếu Chéo (Cross-Validation Matrix)

```
                      ┌───────────────────────────────────────────────┐
                      │             KẾT QUẢ ĐIỂM ICM 2018             │
                      ├───────────────────────┬───────────────────────┤
                      │   NHIỄM (INFECTED)    │ KHÔNG NHIỄM (ASEPTIC) │
                      │   (Điểm ≥ 6 / Đường rò)│   (Điểm 0 – 1)        │
┌──────────┬──────────┼───────────────────────┼───────────────────────┤
│          │ DƯƠNG    │  KỊCH BẢN 1 (LÝ TƯỞNG)│  KỊCH BẢN 2 (CẢNH BÁO)│
│ KẾT QUẢ  │ TÍNH (+) │ Xác nhận căn nguyên,  │ Nghi ngờ TẠP NHIỄM    │
│ MICROGEN │          │ định hướng KS đích.   │ Không vội dùng KS!    │
│          ├──────────┼───────────────────────┼───────────────────────┤
│          │ ÂM       │  KỊCH BẢN 3 (CẢNH BÁO)│  KỊCH BẢN 4 (AN TÂM)  │
│          │ TÍNH (−) │ VẪN ĐIỀU TRỊ PJI      │ Lỏng khớp vô khuẩn,   │
│          │          │ (Nghi ngờ âm tính giả)│ không cần kháng sinh. │
└──────────┴──────────┴───────────────────────┴───────────────────────┘
```

### Chi tiết 5 Kịch bản xử lý:
1. **`ICM_INFECTED_GENOMIC_POSITIVE` (Kịch bản 1: PJI Xác Định + Căn Nguyên Đích)**:
   - Thỏa tiêu chuẩn ICM 2018 + MicroGen dương tính.
   - Hành động: Can thiệp phẫu thuật điều trị PJI (DAIR hoặc thay lại 1/2 thì) và sử dụng kháng sinh đích theo gen kháng thuốc (`mecA`, `vanA`, v.v.).
2. **`ICM_NOT_INFECTED_GENOMIC_POSITIVE` (Kịch bản 2: Cảnh báo Tạp nhiễm)**:
   - ICM 2018 không nhiễm + MicroGen dương tính.
   - Hành động: Cảnh báo nguy cơ tạp nhiễm phòng xét nghiệm hoặc DNA vi khuẩn thoái hóa; **không vội vã chỉ định phẫu thuật thay lại nhiễm trùng hoặc dùng kháng sinh kéo dài**.
3. **`ICM_INFECTED_GENOMIC_NEGATIVE` (Kịch bản 3: Cảnh báo Âm tính giả của Genomic)**:
   - ICM 2018 xác nhận PJI + MicroGen âm tính.
   - Hành động: **Vẫn điều trị PJI đầy đủ theo tiêu chuẩn ICM 2018**; đánh giá nguyên nhân âm tính giả (ức chế PCR, tải lượng dưới LOD, biofilm) và lấy lại mẫu mô trong mổ để nuôi cấy kéo dài.
4. **`ICM_NOT_INFECTED_GENOMIC_NEGATIVE` (Kịch bản 4: Lỏng khớp vô khuẩn)**:
   - Cả ICM 2018 và MicroGen đều âm tính.
   - Hành động: An tâm thay lại khớp vô khuẩn cơ học, không cần dùng kháng sinh điều trị.
5. **`ICM_EQUIVOCAL_GENOMIC_CORRELATION` (Kịch bản 5: Ca nghi ngờ / Giáp ranh 2–5 điểm)**:
   - Hội chẩn đa chuyên khoa (Chỉnh hình, Truyền nhiễm, Vi sinh) và cân nhắc xét nghiệm bổ sung.

---

## 3. Cấu Trúc Module & Mã Nguồn Sau Tái Cấu Trúc

* [`quickDiagnosisModel.ts`](file:///run/media/hieupham/hieuvolume/pog/Frontend_Client/src/components/user/quick_diagnosis/quickDiagnosisModel.ts): Chứa mô hình chẩn đoán ICM 2018, thuật toán tổng hợp đối chiếu chéo `synthesizeIcmAndGenomic` và tính nguy cơ PJI.
* [`constants/diagnosisQuestions.ts`](file:///run/media/hieupham/hieuvolume/pog/Frontend_Client/src/components/user/quick_diagnosis/constants/diagnosisQuestions.ts): Cấu hình danh sách câu hỏi cho cả 2 mode (`BASE_DIAGNOSIS_QUESTIONS` và `BASE_GENOMIC_DIAGNOSIS_QUESTIONS`).
* [`components/DiagnosisQuestionStep.tsx`](file:///run/media/hieupham/hieuvolume/pog/Frontend_Client/src/components/user/quick_diagnosis/components/DiagnosisQuestionStep.tsx): Render bước câu hỏi số 1 (MicroGen testing) cùng các câu hỏi lâm sàng/xét nghiệm 2–11.
* [`components/DiagnosisResultCard.tsx`](file:///run/media/hieupham/hieuvolume/pog/Frontend_Client/src/components/user/quick_diagnosis/components/DiagnosisResultCard.tsx): Render điểm số ICM 2018 kèm Card Tổng Hợp Đối Chiếu Chéo vi sinh phân tử.
* [`PjiDiagnosisCalculator.tsx`](file:///run/media/hieupham/hieuvolume/pog/Frontend_Client/src/components/user/quick_diagnosis/PjiDiagnosisCalculator.tsx): Component điều phối tinh gọn (~180 dòng).
* [`quickDiagnosisModel.test.ts`](file:///run/media/hieupham/hieuvolume/pog/Frontend_Client/src/components/user/quick_diagnosis/quickDiagnosisModel.test.ts): 8 unit tests kiểm thử tự động đạt **8/8 PASS**.
