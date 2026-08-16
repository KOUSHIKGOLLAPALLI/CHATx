import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import { useAuth } from "../context/AuthContext";

function ChatWindow({
  conversation,
  messages,
  send,
  typingChange,
  loadingMessages = false,
  onBack,
}) {
  const { user } = useAuth();

  /* =====================================================
     NO CONVERSATION
  ===================================================== */

  if (!conversation) {
    return (
      <div className="chat-window">
        <div className="empty-chat">
          <h2>Your conversations</h2>

          <p>
            Select a conversation or search for someone
            to start chatting.
          </p>
        </div>
      </div>
    );
  }

  /* =====================================================
     CURRENT USER ID
  ===================================================== */

  const currentUserId =
    user?._id ||
    user?.id;

  /* =====================================================
     FIND OTHER USER
  ===================================================== */

  let otherUser = null;

  if (
    Array.isArray(conversation.participants) &&
    conversation.participants.length > 0
  ) {
    otherUser = conversation.participants.find(
      (participant) =>
        String(participant?._id) !==
        String(currentUserId)
    );
  }

  /* =====================================================
     FALLBACKS
  ===================================================== */

  if (!otherUser) {
    otherUser =
      conversation.otherUser ||
      conversation.user ||
      conversation.recipient ||
      conversation.receiver;
  }

  if (!otherUser) {
    otherUser = {};
  }

  /* =====================================================
     USER INFORMATION
  ===================================================== */

  const username =
    otherUser.username ||
    otherUser.name ||
    otherUser.displayName ||
    "User";

  const email =
    otherUser.email ||
    "";

  const profilePicture =
    otherUser.profilePicture ||
    otherUser.avatar ||
    otherUser.profilePic ||
    "";

  /* =====================================================
     ONLINE STATUS
  ===================================================== */

  const isOnline =
    otherUser.isOnline === true ||
    otherUser.online === true ||
    otherUser.status === "online";

  /* =====================================================
     LAST SEEN
  ===================================================== */

  const lastSeen =
    otherUser.lastSeen ||
    otherUser.lastSeenAt;

  function formatLastSeen(date) {
    if (!date) {
      return "Offline";
    }

    const parsedDate = new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "Offline";
    }

    return (
      "last seen " +
      parsedDate.toLocaleString(
        [],
        {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }
      )
    );
  }

  /* =====================================================
     STATUS
  ===================================================== */

  let statusText;

  if (isOnline) {
    statusText = "Online";
  } else if (lastSeen) {
    statusText =
      formatLastSeen(lastSeen);
  } else {
    statusText =
      email || "Offline";
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="chat-window">

      {/* =================================================
          CHAT HEADER
      ================================================= */}

      <div className="chat-header">

        {/* MOBILE BACK BUTTON */}
        <button
          type="button"
          className="mobile-back-button"
          onClick={onBack}
          aria-label="Back to chats"
        >
          ←
        </button>

        {/* PROFILE IMAGE */}
        <div className="avatar">

          {profilePicture ? (
            <img
              src={profilePicture}
              alt={username}
              className="chat-avatar-image"
            />
          ) : (
            username
              .charAt(0)
              .toUpperCase()
          )}

        </div>

        {/* USER DETAILS */}
        <div className="chat-user-info">

          <strong>
            {username}
          </strong>

          <span
            className={
              isOnline
                ? "online-status"
                : "last-seen-status"
            }
          >
            {statusText}
          </span>

        </div>

      </div>

      {/* =================================================
          MESSAGES
      ================================================= */}

      <div className="messages">

        {loadingMessages ? (

          <div className="empty-chat">

            <h2>
              Loading messages...
            </h2>

            <p>
              Please wait.
            </p>

          </div>

        ) : messages &&
          messages.length > 0 ? (

          messages.map(
            (message, index) => (

              <MessageBubble
                key={
                  message._id ||
                  message.id ||
                  index
                }
                message={message}
              />

            )
          )

        ) : (

          <div className="empty-chat">

            <h2>
              Start a conversation
            </h2>

            <p>
              Send a message to {username}.
            </p>

          </div>

        )}

      </div>

      {/* =================================================
          MESSAGE INPUT
      ================================================= */}

      <MessageInput
        onSend={send}
        onTyping={typingChange}
      />

    </div>
  );
}

export default ChatWindow;
