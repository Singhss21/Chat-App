import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";

// Get all users except the logged-in user + unseen message count
export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;

        const filteredUsers = await User.find({ _id: { $ne: userId } }).select("-password");

        // Count number of unseen messages per user
        const unseenMessage = {};
        const promises = filteredUsers.map(async (user) => {
            const count = await Message.countDocuments({
                senderId: user._id,
                receiverId: userId,
                seen: false
            });
            unseenMessage[user._id] = count;
        });
        await Promise.all(promises);

        res.json({ success: true, users: filteredUsers, unseenMessage });
    } catch (error) {
        console.error("Error in getUsersForSidebar:", error.message);
        res.json({ success: false, message: error.message });
    }
};

// Get all messages for a selected user
export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId }
            ]
        }).sort({ createdAt: 1 }); // sort by time (optional)

        // Mark messages from selectedUserId as seen
        await Message.updateMany({ senderId: selectedUserId, receiverId: myId, seen: false }, { seen: true });

        res.json({ success: true, messages });
    } catch (error) {
        console.error("Error in getMessages:", error.message);
        res.json({ success: false, message: error.message });
    }
};

// Mark individual message as seen (by ID)
export const markMessageAsSeen = async (req, res) => {
    try {
        const { id } = req.params;
        await Message.findByIdAndUpdate(id, { seen: true });
        res.json({ success: true });
    } catch (error) {
        console.error("Error in markMessageAsSeen:", error.message);
        res.json({ success: false, message: error.message });
    }
};

// Send a message
export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let imageUrl = null;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl
        });

        // Emit real-time message to receiver
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.json({ success: true, newMessage });
    } catch (error) {
        console.error("Error in sendMessage:", error.message);
        res.json({ success: false, message: error.message });
    }
};


// Get unseen count for all chats for current user
export const getUnseenMessageCounts = async (req, res) => {
  const userId = req.user._id;

  try {
    const messages = await Message.aggregate([
      { $match: { seen: false, receiver: userId } },
      { $group: { _id: "$chatId", count: { $sum: 1 } } },
    ]);

    res.status(200).json(messages); // [{ _id: chatId, count: 3 }, ...]
  } catch (error) {
    console.error("Error getting unseen counts:", error);
    res.status(500).json({ error: "Server error" });
  }
};
