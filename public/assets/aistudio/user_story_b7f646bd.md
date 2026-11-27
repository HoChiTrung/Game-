# USER STORIES — LEXICON ISLE
**Dự án:** Lexicon Isle (2D Pixel-art Chibi English Learning RPG)  
**Tài liệu liên quan:** `SRS_Lexicon_Isle.md`  
**Đối tượng người dùng chính:** Người học tiếng Anh trình độ A1 – B1 (Người chơi / Player)  

---

## EPIC 1: KHỞI ĐỘNG, ĐIỀU KHIỂN & TRẢI NGHIỆM CỐT LÕI

### US-01: Khởi động và tiếp tục hành trình
* **Ưu tiên:** Cao (Phase 1)
* **Mô tả:** Là một **người chơi**, tôi muốn có màn hình chính rõ ràng cho phép bắt đầu mới hoặc chơi tiếp bản lưu cũ, để tôi có thể quay lại hòn đảo bất cứ lúc nào mà không mất công cày lại từ đầu.
* **Tiêu chí chấp nhận (Acceptance Criteria):**
  * [ ] Hiển thị Title Screen với tiêu đề game, nút `Start Adventure`, nút `Continue` (chỉ kích hoạt khi đã có dữ liệu lưu trong `localStorage`) và nút `Reset Save` (có hộp thoại xác nhận).
  * [ ] Khi bấm `Start Adventure`, nhân vật chibi xuất hiện tại Khu Trại (Homestead) với đầy đủ HP, Stamina và túi đồ khởi đầu (hạt giống cơ bản).

### US-02: Di chuyển mượt mà và khám phá 3 vùng bản đồ
* **Ưu tiên:** Cao (Phase 1)
* **Mô tả:** Là một **người chơi**, tôi muốn điều khiển nhân vật chibi di chuyển 4 hướng mượt mà qua các vùng đất mà không bị xuyên tường hay kẹt vật thể, để tôi có cảm giác khám phá một thế giới mở thực thụ.
* **Tiêu chí chấp nhận (Acceptance Criteria):**
  * [ ] Hỗ trợ di chuyển bằng `WASD` hoặc các phím mũi tên với animation bước đi 4 hướng rõ ràng.
  * [ ] Camera đi theo nhân vật mượt mà và dừng lại đúng mép bản đồ `48x36`.
  * [ ] Va chạm chính xác với cây cối, nhà gỗ, dòng sông, tường đá và cổng bị khóa.
  * [ ] HUD tự động cập nhật tên khu vực hiện tại (`Homestead`, `Whispering Woods`, `Ancient Ruins`) khi nhân vật đi qua ranh giới.

### US-03: Theo dõi trạng thái nhân vật và bật/tắt trợ giúp Tiếng Anh
* **Ưu tiên:** Cao (Phase 1)
* **Mô tả:** Là một **người học tiếng Anh**, tôi muốn quan sát nhanh Máu, Thể lực, Thời gian và chuyển đổi chế độ gợi ý `EN / EN+VI` ngay trên màn hình, để tôi luôn kiểm soát được tình hình sinh tồn và tự điều chỉnh độ khó ngôn ngữ.
* **Tiêu chí chấp nhận (Acceptance Criteria):**
  * [ ] HUD hiển thị thanh `HP`, thanh `Stamina`, đồng hồ Ngày/Buổi, biểu tượng Thời tiết, thanh Hotbar `1–5` và chân dung chibi đổi biểu cảm theo trạng thái.
  * [ ] Có nút chuyển nhanh giữa chế độ `EN` (chỉ tiếng Anh) và `EN+VI` (có gợi ý tiếng Việt) hoạt động tức thì trên mọi hộp thoại và câu đố.

---

## EPIC 2: SINH TỒN NHẸ, NÔNG TRẠI & NẤU ĂN

### US-04: Đọc bảng tin thời tiết buổi sáng bằng Tiếng Anh
* **Ưu tiên:** Cao (Phase 2)
* **Mô tả:** Là một **người chơi**, tôi muốn đọc và nghe dự báo thời tiết mỗi sáng tại Bảng tin, để tôi biết hôm nay có cần tưới cây hay phải nấu súp giữ ấm vào ban đêm hay không.
* **Tiêu chí chấp nhận (Acceptance Criteria):**
  * [ ] Nhấn `E` vào Bảng tin hiển thị câu dự báo thời tiết bằng tiếng Anh kèm nút loa 🔊 phát âm qua Web Speech API.
  * [ ] Nếu báo `Rainy`, toàn bộ 12 ô đất tự động được tưới ướt và có hiệu ứng hạt mưa rơi.
  * [ ] Nếu báo `Cold Wind`, ban đêm nhân vật sẽ bị tụt dần Stamina/HP nếu chưa ăn món giữ ấm (*Warm Pumpkin Soup*).

### US-05: Trồng trọt và thu hoạch tại mảnh vườn 12 ô
* **Ưu tiên:** Cao (Phase 2)
* **Mô tả:** Là một **người chơi**, tôi muốn cuốc đất, gieo hạt, tưới nước và thu hoạch nông sản ngay tại Khu Trại, để tôi tự chủ được nguyên liệu nấu ăn và giải đố.
* **Tiêu chí chấp nhận (Acceptance Criteria):**
  * [ ] Nhấn `E` lên ô đất thực hiện đúng chuỗi trạng thái: Cuốc đất (`Tilled`) → Gieo hạt đang chọn trên Hotbar (`Planted`) → Tưới nước (`Watered`) → Thu hoạch khi chín (`Mature`).
  * [ ] Hiển thị animation nhân vật cúi xuống làm vườn và hiệu ứng hạt khi tưới/thu hoạch.
  * [ ] Cây lớn lên đúng số ngày quy định (`Sunberry`: 1 ngày, `Pumpkin`: 2 ngày) khi người chơi ngủ qua ngày mới.

### US-06: Nấu ăn theo công thức Tiếng Anh
* **Ưu tiên:** Trung bình (Phase 2)
* **Mô tả:** Là một **người chơi**, tôi muốn đọc công thức tiếng Anh tại Nồi nấu ăn và tự chọn đúng nguyên liệu để chế tạo thức ăn/thuốc, để tôi vừa hồi phục chỉ số vừa ghi nhớ từ vựng thực phẩm và động từ nấu nướng.
* **Tiêu chí chấp nhận (Acceptance Criteria):**
  * [ ] Mở Nồi nấu ăn (`E`) hiển thị danh sách công thức viết bằng câu mệnh lệnh tiếng Anh ngắn (kèm nút nghe 🔊).
  * [ ] Khi có đủ nguyên liệu trong túi đồ và ghép đúng công thức, hệ thống trừ nguyên liệu và thêm món ăn/thuốc (*Warm Pumpkin Soup*, *Healing Potion*) vào túi đồ.
  * [ ] Chọn món ăn trên Hotbar và sử dụng sẽ hồi đúng lượng HP/Stamina tương ứng.

---

## EPIC 3: PHIÊU LƯU, TƯƠNG TÁC NPC & GIẢI ĐỐ TIẾNG ANH

### US-07: Trò chuyện với trưởng làng Elder Mara và nhận nhiệm vụ
* **Ưu tiên:** Cao (Phase 3)
* **Mô tả:** Là một **người chơi**, tôi muốn nói chuyện với Elder Mara trong Rừng Thì Thầm để hiểu cốt truyện, nhận nhiệm vụ và mua thêm hạt giống, để tôi luôn biết mục tiêu tiếp theo cần làm là gì.
* **Tiêu chí chấp nhận (Acceptance Criteria):**
  * [ ] Nhấn `E` gần Elder Mara mở khung hội thoại tiếng Anh có kèm nút phát âm 🔊.
  * [ ] Nhiệm vụ đang thực hiện (*Active Quest*) hiển thị ngắn gọn trên HUD (ví dụ: *"Find the Iron Key in Whispering Woods"*).
  * [ ] Hoàn thành yêu cầu nhiệm vụ sẽ nhận được phần thưởng (Coins, XP hoặc hạt giống quý) và cập nhật sang nhiệm vụ tiếp theo.

### US-08: Đọc manh mối môi trường để tìm kho báu và chìa khóa
* **Ưu tiên:** Cao (Phase 3)
* **Mô tả:** Là một **người chơi**, tôi muốn đọc các biển chỉ dẫn bằng tiếng Anh rải rác trong rừng để suy luận vị trí giấu *Iron Key*, để việc học từ vựng phương hướng và giới từ trở thành một phần của cuộc thám hiểm.
* **Tiêu chí chấp nhận (Acceptance Criteria):**
  * [ ] Nhấn `E` vào biển báo/bia đá hiển thị câu chỉ dẫn rõ ràng (vd: *"The Iron Key rests beside the three pine trees north of the pond"*).
  * [ ] Khi người chơi đi đúng đến vị trí mô tả trên bản đồ và nhấn `E`, nhân vật đào được *Iron Key* kèm hiệu ứng thông báo.

### US-09: Giải đố mở Rương cổ ngữ và dâng vật phẩm cho Tượng đá
* **Ưu tiên:** Cao (Phase 3)
* **Mô tả:** Là một **người chơi**, tôi muốn giải các câu đố điền từ theo ngữ cảnh trên rương khóa và tìm đúng vật phẩm cho bức tượng cổ, để nhận được trang bị/phần thưởng giá trị mà không bị cảm giác làm bài kiểm tra khô khan.
* **Tiêu chí chấp nhận (Acceptance Criteria):**
  * [ ] Mở 2 Rương khóa cổ ngữ hiển thị câu chuyện/câu đố điền từ khuyết; chọn đúng sẽ mở rương, nhận thưởng và đánh dấu rương đã mở.
  * [ ] Tương tác với bức tượng đá hiển thị câu đố mô tả tính chất vật phẩm (*Bitter Root*); nếu người chơi có vật phẩm đó trong túi đồ và dâng lên, câu đố hoàn tất và trao thưởng.
  * [ ] Nếu bật gợi ý tiếng Việt trong lúc giải đố sẽ trừ nhẹ 5 Stamina/Coins (hoặc hiện nghĩa khi `hintMode = EN_VI`).

---

## EPIC 4: CHIẾN ĐẤU & ĐẤU BOSS PHẢN XẠ NGÔN NGỮ

### US-10: Chiến đấu với quái thường và tung chí mạng Word Strike
* **Ưu tiên:** Cao (Phase 3)
* **Mô tả:** Là một **người chơi**, tôi muốn vừa đánh kiếm thời gian thực vừa có thể chọn nhanh nghĩa của từ tiếng Anh trên đầu quái để nổ chí mạng, để việc chiến đấu trở nên kịch tính và giúp tôi thuộc từ vựng nhanh hơn.
* **Tiêu chí chấp nhận (Acceptance Criteria):**
  * [ ] Nhấn `Space` chém quái gây sát thương thường (`10 dmg`) có hiệu ứng đẩy lùi, chớp trắng và số sát thương bay lên.
  * [ ] Quái vật (*Word Slimes, Goblins, Bramble Plants, Night Bat/Owl, Ruin Sentinels*) hiển thị từ tiếng Anh trên đầu.
  * [ ] Khi lại gần quái, thanh **Word Strike** hiện gọn ở mép dưới màn hình với 3 lựa chọn; chọn đúng lập tức gây sát thương chí mạng (`35 dmg`), rung màn hình nhẹ và thưởng gấp đôi XP.
  * [ ] Quái *Night Bat & Owl* chỉ xuất hiện khi thời gian chuyển sang ban đêm (`Night`).

### US-11: Mở cổng Tàn Tích Cổ và đấu Boss Stone Guardian
* **Ưu tiên:** Cao (Phase 4)
* **Mô tả:** Là một **người chơi**, tôi muốn dùng *Iron Key* mở cổng đấu trường và đọc/nghe hiểu khẩu lệnh tiếng Anh của Boss để né chiêu và phản công, để kiểm chứng toàn bộ kỹ năng tiếng Anh tôi đã rèn luyện trên đảo.
* **Tiêu chí chấp nhận (Acceptance Criteria):**
  * [ ] Cổng Tàn Tích Cổ yêu cầu có *Iron Key* trong túi đồ mới mở được.
  * [ ] Boss *Stone Guardian* (`300 HP`) luân phiên tung 3 tuyệt chiêu có thông báo chữ tiếng Anh + giọng đọc phát âm trước 4 giây:
    * `"Stand on the BLUE rune!"` → Chỉ an toàn khi đứng trên bệ xanh dương.
    * `"Hide behind the STONE pillar!"` → Chỉ an toàn khi nấp sau 1 trong 4 cột đá.
    * `"Strike my shield when I sleep!"` → Boss hạ giáp 4 giây, nhận `x2` sát thương.
  * [ ] Khi hạ gục Boss, hiển thị màn hình Chiến thắng (Victory Summary) thống kê số ngày sinh tồn, tổng từ vựng đã thu thập và cho phép tiếp tục chơi tự do.

---

## EPIC 5: HỆ THỐNG HỌC TIẾNG ANH & LƯU TRỮ TIẾN ĐỘ

### US-12: Tra cứu và luyện phát âm trong Sổ tay Lexicon
* **Ưu tiên:** Cao (Phase 3)
* **Mô tả:** Là một **người học tiếng Anh**, tôi muốn mọi từ vựng mình từng gặp qua biển báo, công thức hay quái vật đều tự động lưu vào Sổ tay, để tôi có thể mở ra ôn lại ngữ cảnh và nghe phát âm bất cứ lúc nào.
* **Tiêu chí chấp nhận (Acceptance Criteria):**
  * [ ] Nhấn phím `L` mở *Lexicon Notebook* (tạm dừng vòng lặp game khi đang mở sổ).
  * [ ] Lọc được từ vựng theo khu vực (`Homestead`, `Woods`, `Ruins`) hoặc cấp độ (`A1`, `A2`, `B1`).
  * [ ] Mỗi thẻ từ hiển thị: Từ tiếng Anh, loại từ, nút phát âm 🔊, câu ví dụ gốc trong game, nghĩa tiếng Việt (ẩn/hiện tùy chọn) và số sao thông thạo (`1–3 sao`).

### US-13: Ôn tập từ vựng bên Lửa trại trước khi ngủ
* **Ưu tiên:** Trung bình (Phase 2/4)
* **Mô tả:** Là một **người chơi**, tôi muốn được ôn nhanh vài từ vừa gặp trong ngày khi đi ngủ bên Lửa trại để nhận buff cho sáng hôm sau, giúp tôi ghi nhớ từ vựng lâu dài theo nguyên lý lặp lại ngắt quãng.
* **Tiêu chí chấp nhận (Acceptance Criteria):**
  * [ ] Tương tác với Lửa trại/Căn chòi để kết thúc ngày sẽ gợi ý mini-game ôn 3 từ vựng đã gặp (nghe chọn từ hoặc chọn nghĩa đúng).
  * [ ] Người chơi có thể chọn bỏ qua để ngủ ngay, hoặc hoàn thành ôn tập để tăng sao thông thạo cho từ và nhận buff **Well Rested** (+20% tốc độ chạy, +25% XP) cho ngày mới.

### US-14: Tự động lưu tiến độ không mất dữ liệu
* **Ưu tiên:** Cao (Phase 1)
* **Mô tả:** Là một **người chơi**, tôi muốn game tự động lưu lại vị trí, nông trại, túi đồ và sổ từ vựng sau các mốc quan trọng, để lỡ đóng tab trình duyệt tôi vẫn không bị mất công sức.
* **Tiêu chí chấp nhận (Acceptance Criteria):**
  * [ ] Tự động lưu `SaveState` vào `localStorage` khi: ngủ qua ngày mới, mở rương, hoàn thành nhiệm vụ, hạ gục Boss hoặc định kỳ mỗi 60 giây.
  * [ ] Tải lại trang (`F5`) và bấm `Continue` khôi phục chính xác 100% trạng thái trước đó mà không phát sinh lỗi Console.