import { io } from "socket.io-client";

let socket = null;
let sessionRestored = false;
let sessionRestorePromise = null;

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

function getServerUrl() {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";
}

export const getSocket = () => {
  if (!socket) {
    const serverUrl = getServerUrl();
    console.log("🟢 Creating socket connection to:", serverUrl);

    socket = io(serverUrl, {
      transports: ["websocket", "polling"],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      sessionRestored = false;
      sessionRestorePromise = null;
    });

    socket.on("disconnect", () => {
      sessionRestored = false;
      sessionRestorePromise = null;
    });
  }
  return socket;
};

export const restoreSocketSession = () => {
  const activeSocket = getSocket();

  if (sessionRestored) {
    return Promise.resolve({ ok: true });
  }

  if (sessionRestorePromise) {
    return sessionRestorePromise;
  }

  sessionRestorePromise = new Promise((resolve) => {
    const token = getCookie("token");
    if (!token) {
      resolve({ error: "no token" });
      return;
    }

    const finish = (result) => {
      if (result?.ok) {
        sessionRestored = true;
      }
      resolve(result);
    };

    const attemptRestore = () => {
      activeSocket.emit("session_restore", { token }, (res) => {
        finish(res || { error: "restore failed" });
      });
    };

    if (activeSocket.connected) {
      attemptRestore();
      return;
    }

    const onConnect = () => {
      activeSocket.off("connect", onConnect);
      attemptRestore();
    };

    activeSocket.on("connect", onConnect);
    activeSocket.connect();
  });

  return sessionRestorePromise;
};

export const connectSocket = () => {
  const activeSocket = getSocket();
  if (!activeSocket.connected) {
    console.log("🟢 Connecting socket...");
    activeSocket.connect();
  }
  return activeSocket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log("🔌 Disconnecting socket");
    socket.disconnect();
    socket = null;
    sessionRestored = false;
    sessionRestorePromise = null;
  }
};

export const markSessionRestored = () => {
  sessionRestored = true;
};

export const waitForSocketConnection = (timeoutMs = 10000) => {
  const activeSocket = getSocket();

  if (activeSocket.connected) {
    return Promise.resolve(activeSocket);
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      activeSocket.off("connect", onConnect);
      activeSocket.off("connect_error", onError);
      reject(new Error("اتصال به سرور برقرار نشد"));
    }, timeoutMs);

    const onConnect = () => {
      clearTimeout(timer);
      activeSocket.off("connect_error", onError);
      resolve(activeSocket);
    };

    const onError = (err) => {
      clearTimeout(timer);
      activeSocket.off("connect", onConnect);
      reject(err || new Error("خطا در اتصال به سرور"));
    };

    activeSocket.once("connect", onConnect);
    activeSocket.once("connect_error", onError);
    activeSocket.connect();
  });
};

export const emitWithAck = (event, payload, timeoutMs = 10000) =>
  waitForSocketConnection(timeoutMs).then(
    (activeSocket) =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error("زمان پاسخگویی سرور به پایان رسید"));
        }, timeoutMs);

        activeSocket.emit(event, payload, (response) => {
          clearTimeout(timer);
          resolve(response);
        });
      }),
  );
