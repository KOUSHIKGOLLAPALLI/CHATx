import { useAuth } from "../context/AuthContext";

function MessageBubble({ message }) {
  const { user } = useAuth();

  if (!message) {
    return null;
  }

  /* =====================================================
     CURRENT USER ID
  ===================================================== */

  const currentUserId = String(
    user?._id ||
    user?.id ||
    user?.userId ||
    ""
  );


  /* =====================================================
     FIND SENDER
  ===================================================== */

  const sender =
    message.sender ||
    message.senderId ||
    message.from ||
    message.user ||
    message.createdBy;


  /* =====================================================
     EXTRACT SENDER ID
  ===================================================== */

  let senderId = "";

  if (typeof sender === "object" && sender !== null) {

    senderId = String(
      sender._id ||
      sender.id ||
      sender.userId ||
      ""
    );

  } else if (sender) {

    senderId = String(sender);

  }


  /* =====================================================
     OTHER POSSIBLE MESSAGE FIELDS
  ===================================================== */

  if (!senderId) {

    senderId = String(
      message.sender?._id ||
      message.sender?.id ||
      message.senderId ||
      message.userId ||
      message.fromUserId ||
      ""
    );

  }


  /* =====================================================
     CHECK WHETHER MESSAGE IS MINE
  ===================================================== */

  const isMine =
    message.isMine === true ||
    (
      currentUserId &&
      senderId &&
      currentUserId === senderId
    );


  /* =====================================================
     MESSAGE TEXT
  ===================================================== */

  const messageText =
    message.text ||
    message.content ||
    message.message ||
    "";


  /* =====================================================
     MESSAGE TIME
  ===================================================== */

  let messageTime = "";

  const messageDate =
    message.createdAt ||
    message.timestamp ||
    message.sentAt;

  if (messageDate) {

    const date =
      new Date(messageDate);

    if (!Number.isNaN(date.getTime())) {

      messageTime =
        date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

    }

  }


  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div
      className={
        isMine
          ? "message-row own-message"
          : "message-row"
      }
    >

      <div
        className={
          isMine
            ? "message-bubble own"
            : "message-bubble"
        }
      >

        {/* MESSAGE TEXT */}

        {messageText && (
          <div className="message-text">
            {messageText}
          </div>
        )}


        {/* IMAGE */}

        {message.image && (
          <div className="message-image">

            <img
              src={
                message.image.url ||
                message.image
              }
              alt="Attachment"
            />

          </div>
        )}


        {/* FILE */}

        {message.file && (
          <div className="message-attachment">

            <a
              href={
                message.file.url ||
                message.file.path ||
                message.file
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              📎{" "}
              {message.file.name ||
                "Attachment"}
            </a>

          </div>
        )}


        {/* TIME */}

        {messageTime && (
          <div className="message-meta">

            <span className="message-time">
              {messageTime}
            </span>

            {isMine && (
              <span className="message-check">
                ✓✓
              </span>
            )}

          </div>
        )}

      </div>

    </div>
  );
}

export default MessageBubble;