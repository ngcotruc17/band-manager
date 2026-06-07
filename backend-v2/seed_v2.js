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

      if (u.username === 'nctdev') {
        walletBalance = 2500000;
        totalFinePaid = 0;
        attendanceRate = 100;
        points = 150;
        instrument = 'Keyboard';
      } else if (u.username === 'DylanCN') {
        walletBalance = 1800000;
        totalFinePaid = 50000;
        attendanceRate = 95;
        points = 120;
        instrument = 'Bass';
      } else if (u.username === 'anchan276') {
        walletBalance = 800000;
        totalFinePaid = 100000;
        attendanceRate = 80;
        points = 70;
        instrument = 'Drums';
      } else if (u.username === 'Phương nò') {
        walletBalance = 950000;
        totalFinePaid = 50000;
        attendanceRate = 90;
        points = 90;
        instrument = 'Vocal';
      }

      await db.collection('users').updateOne(
        { _id: u._id },
        { 
          $set: { 
            status: 'active',
            isApproved: true,
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
        title: "Show Acoustic Rooftop Landmark 81",
        customerName: "Anh Hoàng (Manager)",
        phone: "0901234567",
        date: show1Date,
        time: "20:00",
        location: "Rooftop Cafe Landmark 81, Bình Thạnh",
        price: 1200000, // price per member
        deposit: 2000000, // total deposit
        status: "completed",
        notes: "Trang phục màu đen lịch lãm",
        isRegistrationClosed: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Show Event Beer Club Quận 3",
        customerName: "Chị Thảo (Event Organizer)",
        phone: "0911223344",
        date: show2Date,
        time: "21:30",
        location: "District 3 Beer Club, Nguyễn Thị Minh Khai, Q3",
        price: 1500000,
        deposit: 1000000,
        status: "confirmed",
        notes: "Trang phục màu đỏ/trắng năng động",
        isRegistrationClosed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Show Gala Dinner Gem Center",
        customerName: "Công ty Vinamilk",
        phone: "0988776655",
        date: show3Date,
        time: "19:00",
        location: "Sảnh Castor, GEM Center, Đa Kao, Quận 1",
        price: 2500000,
        deposit: 5000000,
        status: "pending",
        notes: "Đội hình chính thức 5 người, trang phục vest sang trọng",
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
