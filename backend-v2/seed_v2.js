const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const run = async () => {
  try {
    console.log("Connecting to:", process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected successfully!");

    const db = mongoose.connection.db;

    // 1. Get existing users
    const users = await db.collection('users').find({}).toArray();
    console.log(`Found ${users.length} users in database.`);

    if (users.length === 0) {
      console.log("No users found. Please register some users first!");
      process.exit(1);
    }

    const userMap = {};
    users.forEach(u => {
      userMap[u.username] = u._id;
    });

    // 2. Update user statuses and stats to make them look real & beautiful
    console.log("Updating users stats...");
    for (const u of users) {
      let walletBalance = 1500000;
      let totalFinePaid = 50000;
      let attendanceRate = 95;
      let points = 110;
      let instrument = u.instrument || 'Guitar';

      let role = u.role || 'student';

      if (u.username === 'nctdev') {
        walletBalance = 2500000;
        totalFinePaid = 0;
        attendanceRate = 100;
        points = 150;
        instrument = 'Keyboard';
        role = 'admin';
      } else if (u.username === 'DylanCN') {
        walletBalance = 1800000;
        totalFinePaid = 50000;
        attendanceRate = 95;
        points = 120;
        instrument = 'Bass';
        role = 'manager';
      } else if (u.username === 'anchan276') {
        walletBalance = 800000;
        totalFinePaid = 100000;
        attendanceRate = 80;
        points = 70;
        instrument = 'Drums';
        role = 'lecturer';
      } else if (u.username === 'Phương nò') {
        walletBalance = 950000;
        totalFinePaid = 50000;
        attendanceRate = 90;
        points = 90;
        instrument = 'Vocal';
        role = 'student';
      }

      await db.collection('users').updateOne(
        { _id: u._id },
        { 
          $set: { 
            status: 'active',
            isApproved: true,
            role,
            walletBalance,
            totalFinePaid,
            attendanceRate,
            points,
            instrument,
            badges: [
              { badgeId: 'badge1', name: 'Chiến thần đúng giờ', icon: 'Clock', earnedAt: new Date() },
              { badgeId: 'badge2', name: 'Vua Chạy Show', icon: 'Trophy', earnedAt: new Date() }
            ]
          } 
        }
      );
    }
    console.log("Users stats updated successfully.");

    // 3. Seed Shows
    console.log("Seeding shows...");
    await db.collection('shows').deleteMany({});
    
    const show1Date = new Date();
    show1Date.setDate(show1Date.getDate() - 5); // 5 days ago
    
    const show2Date = new Date();
    show2Date.setDate(show2Date.getDate() + 2); // in 2 days
    
    const show3Date = new Date();
    show3Date.setDate(show3Date.getDate() + 7); // in 7 days

    const showsData = [
      {
        title: "Show Lễ Khai Giảng K20 & Ngày Hội Chào Tân Sinh Viên",
        customerName: "Phòng CTSV Trường ĐH FPT TP.HCM",
        phone: "02873005588",
        date: show1Date,
        time: "08:00",
        location: "Hội trường Innovation Hall, Tòa nhà Gamma, ĐH FPT TP.HCM",
        price: 1500000, // price per member
        deposit: 3000000, // total deposit
        status: "completed",
        eventType: "Sự kiện Trường ĐH FPT / Khai Giảng - Tốt Nghiệp",
        memberCount: 5,
        dresscode: "Áo sơ mi trắng / Cam FPTU đồng điệu",
        notes: "Duyệt bởi Cán bộ Phòng CTSV. Setlist 4 bài sôi động chào đón tân sinh viên.",
        isRegistrationClosed: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Show Gala Giao Lưu Văn Hoá Quốc Tế Global Exchange",
        customerName: "Bộ Môn Nghệ Thuật & Kỹ Năng Mềm ĐH FPT",
        phone: "0901234567",
        date: show2Date,
        time: "18:30",
        location: "Quảng trường Trống Đồng, Campus FPTU Quận 9",
        price: 1800000,
        deposit: 2000000,
        status: "confirmed",
        eventType: "Sự kiện Bộ Môn / Hội Thảo / Workshop",
        memberCount: 6,
        dresscode: "Smart Casual / Tông màu pastel hiện đại",
        notes: "Ban nhạc phối hợp cùng giảng viên thỉnh giảng và sinh viên quốc tế biểu diễn acoustic.",
        isRegistrationClosed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Show Đêm Nhạc Sinh Viên FPTU Sunset Acoustic",
        customerName: "Sinh Viên / Ban Đại Diện Khoa CNTT",
        phone: "0988776655",
        date: show3Date,
        time: "19:00",
        location: "Khu vực Hồ Sen & Sảnh Beta, Campus ĐH FPT TP.HCM",
        price: 1200000,
        deposit: 1500000,
        status: "pending",
        eventType: "Sự kiện CLB & Sinh viên",
        memberCount: 4,
        dresscode: "Trang phục tự do trẻ trung",
        notes: "Show do sinh viên đặt ban nhạc qua cổng FPTU Band. Đang chờ cán bộ CTSV duyệt xếp lịch diễn.",
        isRegistrationClosed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const showResult = await db.collection('shows').insertMany(showsData);
    console.log(`Successfully seeded ${showResult.insertedCount} shows.`);

    // 4. Seed Rehearsals
    console.log("Seeding rehearsals...");
    await db.collection('rehearsals').deleteMany({});

    const reh1Date = new Date();
    reh1Date.setDate(reh1Date.getDate() - 3); // 3 days ago

    const reh2Date = new Date();
    reh2Date.setDate(reh2Date.getDate() + 1); // tomorrow

    const memberList = Object.values(userMap);
    
    const rehearsalsData = [
      {
        date: reh1Date,
        time: "18:00",
        location: "Phòng tập Arirang, 145 Điện Biên Phủ, Q1",
        content: "Tập ráp setlist Acoustic Landmark 81 & Nhạc trẻ mới",
        token: "ABCXYZ",
        attendance: memberList.map((mId, idx) => ({
          userId: mId,
          status: idx === 2 ? 'late' : 'present', // one member late
          fine: idx === 2 ? 50000 : 0,
          checkedInAt: new Date(),
          gpsVerified: true,
          faceVerified: true
        })),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        date: reh2Date,
        time: "19:00",
        location: "Phòng tập Arirang, 145 Điện Biên Phủ, Q1",
        content: "Tập ráp bài mới cho show Gala GEM Center",
        token: "REH123",
        attendance: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const rehResult = await db.collection('rehearsals').insertMany(rehearsalsData);
    console.log(`Successfully seeded ${rehResult.insertedCount} rehearsals.`);

    // 5. Seed Songs
    console.log("Seeding songs...");
    await db.collection('songs').deleteMany({});

    const songsData = [
      {
        title: "Cắt Đôi Nỗi Sầu",
        name: "Cắt Đôi Nỗi Sầu",
        note: "Tone Dm - Điệu Disco (Tempo 120)",
        sheetUrl: "uploads/sheets/cat_doi_noi_sau.pdf",
        beatUrl: "uploads/beats/cat_doi_noi_sau.mp3",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Ngày Mai Người Ta Lấy Chồng",
        name: "Ngày Mai Người Ta Lấy Chồng",
        note: "Tone C#m - Pop Ballad (Tempo 78)",
        sheetUrl: "",
        beatUrl: "",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Bật Tình Yêu Lên",
        name: "Bật Tình Yêu Lên",
        note: "Tone G - Synthpop (Tempo 116)",
        sheetUrl: "",
        beatUrl: "",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const songResult = await db.collection('songs').insertMany(songsData);
    console.log(`Successfully seeded ${songResult.insertedCount} songs.`);

    // 6. Seed Transactions
    console.log("Seeding transactions...");
    await db.collection('transactions').deleteMany({});

    const transData = [
      {
        title: "Cát-xê Show Acoustic Landmark 81",
        amount: 4800000,
        type: "income",
        category: "show",
        date: show1Date,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Tiền thuê phòng tập Rehearsal tuần 4 tháng 5",
        amount: -300000,
        type: "expense",
        category: "rehearsal",
        date: reh1Date,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Quỹ phạt đi trễ (Thành viên anchan276)",
        amount: 50000,
        type: "income",
        category: "fine",
        date: reh1Date,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const transResult = await db.collection('transactions').insertMany(transData);
    console.log(`Successfully seeded ${transResult.insertedCount} transactions.`);

    console.log("Seeding complete! Database is now rich with v2.0 mock data.");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
};

run();
