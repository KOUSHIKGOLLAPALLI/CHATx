import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";

function NotificationBell() {
  const socket = useSocket();

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification) => {
      setNotifications((previous) => [
        notification,
        ...previous
      ]);

      // Browser notification
      if (
        Notification.permission === "granted"
      ) {
        new Notification(
          notification.title || "New message",
          {
            body:
              notification.message ||
              "You received a new message"
          }
        );
      }
    };

    socket.on(
      "notification:new",
      handleNotification
    );

    return () => {
      socket.off(
        "notification:new",
        handleNotification
      );
    };
  }, [socket]);

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  const markAsRead = (id) => {
    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              isRead: true
            }
          : notification
      )
    );
  };

  useEffect(() => {
    if (
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="notification-container">

      <button
        type="button"
        className="notification-button"
        onClick={() =>
          setShowNotifications(
            !showNotifications
          )
        }
      >
        🔔

        {unreadCount > 0 && (
          <span className="notification-count">
            {unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="notification-dropdown">

          <div className="notification-header">
            <h3>Notifications</h3>
          </div>

          {notifications.length === 0 ? (
            <p className="no-notifications">
              No notifications
            </p>
          ) : (
            notifications.map(
              (notification) => (
                <div
                  key={notification.id}
                  className={
                    notification.isRead
                      ? "notification-item read"
                      : "notification-item"
                  }
                  onClick={() =>
                    markAsRead(
                      notification.id
                    )
                  }
                >
                  <strong>
                    {notification.title ||
                      "New message"}
                  </strong>

                  <p>
                    {notification.message}
                  </p>

                  <small>
                    {notification.createdAt
                      ? new Date(
                          notification.createdAt
                        ).toLocaleTimeString()
                      : "Just now"}
                  </small>
                </div>
              )
            )
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;