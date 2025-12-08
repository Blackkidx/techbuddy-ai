// mobile/src/services/socket.service.js
// Socket.IO Client Service - เชื่อมต่อกับ Backend Real-time

import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ เปลี่ยน URL ให้ตรงกับ Backend ของคุณ
// สำหรับ Android Emulator: http://10.0.2.2:3000
// สำหรับ iOS Simulator: http://localhost:3000
// สำหรับ Physical Device: http://<YOUR_PC_IP>:3000
const SOCKET_URL = 'http://10.0.2.2:3000';

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        // ไม่ต้องใช้ this.listeners เนื่องจากใช้ .on()/.off() ของ socket.io โดยตรง
    }

    /**
     * เชื่อมต่อ Socket.IO Server
     * @returns {Promise<boolean>} สถานะการเชื่อมต่อ
     */
    async connect() {
        // 1. ป้องกันการเชื่อมต่อซ้ำ
        if (this.socket && this.socket.connected) {
            console.log('Socket is already connected.');
            this.isConnected = true;
            return true;
        }

        // 2. ถ้ามี Instance เก่าที่ยังไม่ connected ให้ตัดการเชื่อมต่อก่อน
        if (this.socket && !this.socket.connected) {
            this.disconnect();
        }

        try {
            const token = await AsyncStorage.getItem('token');

            if (!token) {
                console.warn('⚠️ No token found, cannot connect socket');
                this.isConnected = false;
                return false;
            }

            console.log('🔌 Connecting to Socket.IO Server...');
            console.log('    URL:', SOCKET_URL);

            // 3. สร้าง Socket.IO Instance ใหม่
            this.socket = io(SOCKET_URL, {
                auth: {
                    token: token // ส่ง Token ไปใน Handshake
                },
                transports: ['websocket', 'polling'], // ใช้ websocket เป็นหลัก
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                timeout: 10000,
                pingInterval: 25000,
                pingTimeout: 60000
            });

            // 4. Setup event handlers (Event Handlers หลักที่อัปเดต this.isConnected)
            this.setupEventHandlers();

            // 5. รอให้เชื่อมต่อสำเร็จ (Promise based)
            return new Promise(resolve => {
                const connectHandler = () => {
                    this.isConnected = true;
                    this.socket.off('connect_error', errorHandler); // ลบ error handler ชั่วคราวออก
                    resolve(true);
                };

                const errorHandler = (error) => {
                    console.error('❌ Failed to connect during wait period:', error.message);
                    this.isConnected = false;
                    this.socket.off('connect', connectHandler); // ลบ connect handler ชั่วคราวออก
                    resolve(false);
                };

                // ใช้ .once เพื่อให้ทำงานแค่ครั้งเดียว
                this.socket.once('connect', connectHandler);
                this.socket.once('connect_error', errorHandler);

                // ตั้ง timeout สำหรับ Promise เพื่อไม่ให้ค้าง (ป้องกันกรณีที่ Socket.IO ไม่ emit Event)
                setTimeout(() => {
                    if (!this.isConnected) {
                        this.socket.off('connect', connectHandler);
                        this.socket.off('connect_error', errorHandler);
                        console.log('❌ Connection timeout exceeded.');
                        resolve(false);
                    }
                }, 15000); // 15 วินาที
            });

        } catch (error) {
            console.error('❌ Socket connection error:', error);
            this.isConnected = false;
            return false;
        }
    }

    /**
     * Setup Event Handlers หลักสำหรับ Socket Instance
     */
    setupEventHandlers() {
        if (!this.socket) return;

        // เชื่อมต่อสำเร็จ
        this.socket.on('connect', () => {
            console.log('✅ Socket connected!');
            console.log('    Socket ID:', this.socket.id);
            this.isConnected = true;
            // แจ้ง Server ว่า Client ออนไลน์แล้ว (ตาม Event ที่มีใน index.js)
            this.socket.emit('user:online');
        });

        // Server ยืนยันการเชื่อมต่อ (ตาม Event ที่มีใน index.js)
        this.socket.on('connection:success', (data) => {
            console.log('✅ Server confirmed:', data.message);
        });

        // การเชื่อมต่อหลุด
        this.socket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
            this.isConnected = false;
        });

        // ข้อผิดพลาดในการเชื่อมต่อ
        this.socket.on('connect_error', (error) => {
            console.error('❌ Connection error:', error.message);
            this.isConnected = false;
        });

        // การพยายามเชื่อมต่อใหม่
        this.socket.on('reconnect_attempt', (attemptNumber) => {
            console.log(`🔄 Reconnecting... (attempt ${attemptNumber})`);
        });

        // เชื่อมต่อใหม่สำเร็จ
        this.socket.on('reconnect', (attemptNumber) => {
            console.log(`✅ Reconnected after ${attemptNumber} attempts`);
            this.isConnected = true;
        });
    }

    /**
     * ตัดการเชื่อมต่อ
     */
    disconnect() {
        if (this.socket) {
            console.log('👋 Disconnecting socket...');
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    /**
     * ส่งข้อความ
     * @param {Object} messageData ข้อมูลข้อความ
     */
    sendMessage(messageData) {
        if (!this.socket || !this.isConnected) {
            console.warn('⚠️ Socket not connected, cannot send message');
            // 💡 ให้ return false เพื่อให้ UI รู้ว่าส่งไม่สำเร็จ
            return false;
        }
        console.log('📤 Sending message:', messageData);
        this.socket.emit('message:send', messageData);
        return true;
    }

    // ===============================================
    // เมธอดส่ง Event อื่นๆ
    // ===============================================

    typingStart(receiverId) {
        if (!this.socket || !this.isConnected) return;
        this.socket.emit('typing:start', { receiverId });
    }

    typingStop(receiverId) {
        if (!this.socket || !this.isConnected) return;
        this.socket.emit('typing:stop', { receiverId });
    }

    markAsRead(chatId, senderId) {
        if (!this.socket || !this.isConnected) return;
        this.socket.emit('message:read', { chatId, senderId });
    }

    fetchMessages(friendId, limit = 50) {
        if (!this.socket || !this.isConnected) return;
        console.log(`📥 Fetching messages with friend: ${friendId}`);
        this.socket.emit('messages:fetch', { friendId, limit });
    }

    /**
     * ตรวจสอบสถานะการเชื่อมต่อ (สำหรับ Context)
     */
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            socketId: this.socket?.id || null
        };
    }

    // ===============================================
    // เมธอดสำหรับ Context ในการรับ Event จาก Socket (คงเดิม)
    // ===============================================

    /**
     * ส่งผ่านการฟังเหตุการณ์ไปยัง Socket object ภายใน
     */
    on(eventName, listener) {
        if (this.socket) {
            this.socket.on(eventName, listener);
        } else {
            console.warn(`Socket not ready to listen for ${eventName}. Cannot register: ${eventName}`);
        }
    }

    /**
     * ส่งผ่านการหยุดฟังเหตุการณ์ไปยัง Socket object ภายใน
     */
    off(eventName, listener) {
        if (this.socket) {
            this.socket.off(eventName, listener);
        }
    }
}

// Export singleton instance
export default new SocketService();