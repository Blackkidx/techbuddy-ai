// mobile/src/utils/friendHelpers.js
// ✅ Helper function for extracting user ID safely

/**
 * ดึง String ID (TBxxxxxx) ของเพื่อนจาก Object ข้อมูล
 * * ฟังก์ชันนี้ถูกแยกออกมาเพื่อให้ ChatScreen.js สามารถเรียกใช้ได้โดยไม่ละเมิดกฎของ React Hooks
 * * @param {Object} friend Object ข้อมูลเพื่อนที่ส่งมาจาก route params หรือ list
 * @returns {string|null} userId (String ID) หรือ null
 */
export const getFriendUserId = (friend) => {
    if (!friend || typeof friend !== 'object' || Object.keys(friend).length === 0) {
        return null;
    }

    const userId = friend.userId || friend.user?.userId || null;

    if (!userId) {
        return null;
    }

    return userId;
};

// ===============================================
// ✅ Optional: Helper functions จาก FriendListScreen.js
// ===============================================

/**
 * กรองเพื่อนที่มีข้อมูลไม่ครบถ้วน (ใช้ใน FriendListScreen)
 */
export const filterValidFriends = (friends) => {
    if (!Array.isArray(friends)) {
        // console.warn('⚠️ friends is not an array:', typeof friends);
        return [];
    }

    return friends.filter(friend => {
        if (!friend || typeof friend !== 'object') return false;
        // ต้องมี userId (String ID) และต้องไม่เป็น 'Unknown'
        if (!friend.userId || friend.userId === null || friend.username === 'Unknown') return false;
        // ต้องมี id (PK) ที่ถูกต้อง
        if (!friend.id || friend.id === null) return false;

        return true;
    });
};

/**
 * ลบเพื่อนที่ซ้ำกัน (เก็บรายการล่าสุด) (ใช้ใน FriendListScreen)
 */
export const removeDuplicateFriends = (friends) => {
    const seen = new Map();

    friends.forEach(friend => {
        const existing = seen.get(friend.userId);

        // เก็บรายการที่มี id มากกว่า (เป็นข้อมูลล่าสุด)
        if (!existing || friend.id > existing.id) {
            seen.set(friend.userId, friend);
        }
    });

    const uniqueFriends = Array.from(seen.values());

    // if (uniqueFriends.length < friends.length) {
    //   console.log(`🔄 Removed ${friends.length - uniqueFriends.length} duplicate friends`);
    // }

    return uniqueFriends;
};
