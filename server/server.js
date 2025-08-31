import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

// Create express app and http server
const app = express();
const server = http.createServer(app);

// Intialize socket.io server
export const io = new Server(server, {
<<<<<<< HEAD
    cors: {origin: "*"}
=======
    cors: { origin: "*" }
>>>>>>> 5c5ce75 (vercel.json added)
})

// store online users
export const userSocketMap = {}; // { userid: socketid }

// socket.io connection handler
<<<<<<< HEAD
io.on("connection", (socket)=>{
    const userId = socket.handshake.query.userId;
    console.log("User Connected", userId);

    if(userId) userSocketMap[userId] = socket.id;
=======
io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log("User Connected", userId);

    if (userId) userSocketMap[userId] = socket.id;
>>>>>>> 5c5ce75 (vercel.json added)

    // Emit online users to all connected client 
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

<<<<<<< HEAD
    socket.on("disconnect", ()=>{
=======
    socket.on("disconnect", () => {
>>>>>>> 5c5ce75 (vercel.json added)
        console.log("User Disconnected", userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap))
    })
})

// Middleware setup
<<<<<<< HEAD
app.use(express.json({limit: "4mb"}));
=======
app.use(express.json({ limit: "4mb" }));
>>>>>>> 5c5ce75 (vercel.json added)
app.use(cors());


// Route setup
<<<<<<< HEAD
app.use("/api/status", (req,res)=>res.send("Server is live"));
=======
app.use("/api/status", (req, res) => res.send("Server is live"));
>>>>>>> 5c5ce75 (vercel.json added)
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter)

// connect to mongodb
await connectDB();

<<<<<<< HEAD
const PORT = process.env.PORT || 5000;
server.listen(PORT, ()=> console.log("Server is running on PORT:" + PORT));
=======
if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log("Server is running on PORT:" + PORT));
}

// Export server for vercel
export default server;
>>>>>>> 5c5ce75 (vercel.json added)
