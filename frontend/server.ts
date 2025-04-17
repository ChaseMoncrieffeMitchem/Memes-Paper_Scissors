import express from "express";
import { Server } from "socket.io";

const app = express();
const server = app.listen(3001, () => console.log("Socket.IO server running on port 3001"));

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

interface GameUpdate {
  gameId: string;
  action: "joined" | "move1Submitted" | "move2Submitted";
  playerAddress?: string;
}

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("gameUpdate", (data: GameUpdate) => {
    try {
      if (!data.gameId || !data.action) {
        throw new Error("Invalid game update: missing gameId or action");
      }
      io.to(data.gameId).emit("gameUpdate", data);
      console.log(`Broadcasted ${data.action} for game ${data.gameId}`);
    } catch (error: unknown) {
      console.error("Error processing gameUpdate:", error instanceof Error ? error.message : "Server error");
      socket.emit("error", { message: error instanceof Error ? error.message : "Server error" });
    }
  });

  socket.on("joinGame", (gameId: string) => {
    try {
      if (!gameId) {
        throw new Error("Invalid game ID");
      }
      socket.join(gameId);
      console.log(`Client ${socket.id} joined game ${gameId}`);
    } catch (error: unknown) {
      console.error("Error joining game:", error instanceof Error ? error.message : "Failed to join game");
      socket.emit("error", { message: error instanceof Error ? error.message : "Failed to join game" });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});