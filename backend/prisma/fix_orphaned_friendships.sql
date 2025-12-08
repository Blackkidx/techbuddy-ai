-- Fix orphaned Friendship records
-- Delete friendships where userId or friendId doesn't exist in User table

DELETE FROM "Friendship" 
WHERE "userId" NOT IN (SELECT id FROM "User")
   OR "friendId" NOT IN (SELECT id FROM "User");
