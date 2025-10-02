require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());

// existing routes
const projectsRouter = require("./routes/projects");
app.use("/api/projects", projectsRouter);

// contact route
const contactRouter = require("./routes/contact");
app.use("/api/contact", contactRouter);

// chat route for the widget
const chatRouter = require("./routes/chat");
app.use("/api/ask", chatRouter);

app
  .listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
  })
  .on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.log(
        "Port is already in use, try a different port or close another server."
      );
    } else {
      console.log("Server error: ", error);
    }
  });
