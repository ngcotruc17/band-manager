import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';

export class SocketService {
  private static io: SocketIOServer | null = null;

  public static init(server: HTTPServer): SocketIOServer {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: [
          'http://localhost:3000',
          'http://localhost:5173',
          'https://sacband.vercel.app'
        ],
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`🔌 Thiết bị kết nối WebSocket: ${socket.id}`);

      // 1. Nhạc công hoặc Admin tham gia vào phòng diễn của Show cụ thể
      socket.on('live-show:join', (showId: string) => {
        const roomName = `show_${showId}`;
        socket.join(roomName);
        console.log(`👥 Socket ${socket.id} đã tham gia phòng: ${roomName}`);
        
        // Gửi xác nhận cho client
        socket.emit('live-show:joined', { room: roomName });
      });

      // 2. Rời khỏi phòng diễn
      socket.on('live-show:leave', (showId: string) => {
        const roomName = `show_${showId}`;
        socket.leave(roomName);
        console.log(`🚪 Socket ${socket.id} đã rời phòng: ${roomName}`);
      });

      // 3. Admin thay đổi bài hát đang diễn trong Setlist -> Đồng bộ cho cả ban nhạc
      socket.on('setlist:active-song', (data: { showId: string; songIndex: number }) => {
        const roomName = `show_${data.showId}`;
        console.log(`🎵 Đồng bộ bài hát trong phòng ${roomName}: bài số ${data.songIndex}`);
        
        // Gửi tới tất cả thiết bị khác trong phòng (ngoại trừ người gửi nếu cần, hoặc gửi tất cả)
        socket.to(roomName).emit('setlist:active-song', { songIndex: data.songIndex });
      });

      // 4. Admin cuộn trang sheet nhạc PDF -> Đồng bộ cuộn cho các nhạc công khác
      socket.on('sheet:scroll', (data: { showId: string; pageIndex: number; scrollPct?: number }) => {
        const roomName = `show_${data.showId}`;
        // Gửi tới tất cả nhạc công khác trong phòng để tự động lật/cuộn trang
        socket.to(roomName).emit('sheet:scroll', { 
          pageIndex: data.pageIndex,
          scrollPct: data.scrollPct || 0
        });
      });

      // 5. Admin gửi Lệnh chỉ huy (Live Cues) -> Đồng bộ hiển thị cho cả phòng
      socket.on('live-cue:send', (data: { showId: string; cueText: string }) => {
        const roomName = `show_${data.showId}`;
        console.log(`📣 Đồng bộ live cue trong phòng ${roomName}: ${data.cueText}`);
        socket.to(roomName).emit('live-cue:receive', { cueText: data.cueText });
      });

      // 6. Ngắt kết nối
      socket.on('disconnect', () => {
        console.log(`❌ Thiết bị ngắt kết nối WebSocket: ${socket.id}`);
      });
    });

    return this.io;
  }

  // Hàm helper để gửi thông báo đẩy thời gian thực từ API sang WebSocket
  public static sendToRoom(room: string, event: string, data: any) {
    if (this.io) {
      this.io.to(room).emit(event, data);
    }
  }

  // Gửi cho toàn bộ hệ thống
  public static broadcast(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }
}
