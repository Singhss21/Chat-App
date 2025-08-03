import { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { AuthContext } from "./AuthContext";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(
        JSON.parse(localStorage.getItem("selectedUser")) || null
    );
    const [unseenMessages, setUnseenMessages] = useState(
        JSON.parse(localStorage.getItem("unseenMessages")) || {}
    );

    const { socket } = useContext(AuthContext);

    // Get all users and unseen messages
    const getUsers = async () => {
        try {
            const { data } = await axios.get("/api/messages/users");
            if (data.success) {
                setUsers(data.users);

                // Merge unseenMessages with localStorage unseenMessages
                const storedUnseen = JSON.parse(localStorage.getItem("unseenMessages")) || {};
                const freshUnseen = data.unseenMessages || {};

                const mergedUnseen = { ...storedUnseen, ...freshUnseen };
                setUnseenMessages(mergedUnseen);
                localStorage.setItem("unseenMessages", JSON.stringify(mergedUnseen));
            }
        } catch (error) {
            toast.error("Error fetching users: " + error.message);
        }
    };

    // Get chat messages with a selected user
    const getMessages = async (userId) => {
        if (!userId) return;

        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) {
                setMessages(data.messages);

                if (unseenMessages[userId]) {
                    const updated = { ...unseenMessages };
                    delete updated[userId];
                    setUnseenMessages(updated);
                    localStorage.setItem("unseenMessages", JSON.stringify(updated));
                    await axios.put(`/api/messages/mark-all/${userId}`);
                }
            }
        } catch (error) {
            toast.error("Error loading messages: " + error.message);
        }
    };

    // Send a new message
    const sendMessage = async (messageData) => {
        if (!selectedUser?._id) return;

        try {
            const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
            if (data.success) {
                setMessages((prev) => [...prev, data.newMessage]);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Message send failed: " + error.message);
        }
    };

    // Socket: handle incoming messages
    const subscribeToMessages = () => {
        if (!socket) return;

        socket.on("newMessage", async (newMessage) => {
            if (selectedUser && newMessage.senderId === selectedUser._id) {
                newMessage.seen = true;
                setMessages((prev) => [...prev, newMessage]);
                await axios.put(`/api/messages/mark/${newMessage._id}`);
            } else {
                setUnseenMessages((prev) => {
                    const updated = {
                        ...prev,
                        [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1,
                    };
                    localStorage.setItem("unseenMessages", JSON.stringify(updated));
                    return updated;
                });
            }
        });
    };

    // Unsubscribe socket listeners to avoid memory leaks
    const unsubscribeFromMessages = () => {
        if (socket) {
            socket.off("newMessage");
        }
    };

    // Sync selected user to localStorage
    useEffect(() => {
        if (selectedUser) {
            localStorage.setItem("selectedUser", JSON.stringify(selectedUser));
        } else {
            localStorage.removeItem("selectedUser");
        }
    }, [selectedUser]);

    // Re-subscribe on socket or selectedUser change
    useEffect(() => {
        subscribeToMessages();
        return () => unsubscribeFromMessages();
    }, [socket?.connected, selectedUser]);

    // On mount, fetch users and unseen messages
    useEffect(() => {
        getUsers();
    }, []);

    const value = {
        messages,
        users,
        selectedUser,
        setSelectedUser,
        getUsers,
        getMessages,
        sendMessage,
        unseenMessages,
        setUnseenMessages,
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
