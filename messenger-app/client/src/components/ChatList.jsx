import { useAuth } from "../context/AuthContext";

function ChatList({
  conversations = [],
  currentId,
  onSelect,
}) {
  const { user } = useAuth();

  const currentUserId =
    user?._id ||
    user?.id;

  /* =====================================================
     GET OTHER USER
  ===================================================== */

  function getOtherUser(conversation) {
    if (
      Array.isArray(conversation?.participants) &&
      conversation.participants.length > 0
    ) {
      const otherUser =
        conversation.participants.find(
          participant =>
            String(participant?._id) !==
            String(currentUserId)
        );

      if (otherUser) {
        return otherUser;
      }
    }

    /* Fallbacks */

    return (
      conversation?.otherUser ||
      conversation?.recipient ||
      conversation?.receiver ||
      conversation?.user ||
      {}
    );
  }


  /* =====================================================
     FORMAT LAST MESSAGE
  ===================================================== */

  function getLastMessage(conversation) {
    const lastMessage =
      conversation?.lastMessage;

    if (!lastMessage) {
      return "No messages yet";
    }

    return (
      lastMessage.content ||
      lastMessage.text ||
      "Message"
    );
  }


  /* =====================================================
     RENDER
  ===================================================== */

  if (!conversations.length) {
    return (
      <div className="empty-chat-list">
        No conversations yet.
      </div>
    );
  }


  return (
    <div className="chat-list">

      {conversations.map((conversation) => {

        const otherUser =
          getOtherUser(conversation);


        /* ===============================
           OTHER USER DETAILS
        =============================== */

        const username =
          otherUser?.username ||
          otherUser?.name ||
          otherUser?.displayName ||
          "User";


        const profilePicture =
          otherUser?.profilePicture ||
          otherUser?.avatar ||
          otherUser?.profilePic ||
          "";


        const isOnline =
          otherUser?.isOnline === true ||
          otherUser?.online === true ||
          otherUser?.status === "online";


        const lastMessage =
          getLastMessage(
            conversation
          );


        const isSelected =
          String(conversation?._id) ===
          String(currentId);


        return (
          <button
            key={conversation._id}
            type="button"
            className={`chat-list-item ${
              isSelected
                ? "active"
                : ""
            }`}
            onClick={() =>
              onSelect(conversation)
            }
          >

            {/* ===============================
                PROFILE PICTURE
            =============================== */}

            <div className="chat-list-avatar">

              {profilePicture ? (

                <img
                  src={profilePicture}
                  alt={username}
                  className="chat-list-avatar-image"
                />

              ) : (

                username
                  .charAt(0)
                  .toUpperCase()

              )}

            </div>


            {/* ===============================
                USER INFORMATION
            =============================== */}

            <div className="chat-list-info">

              <strong>
                {username}
              </strong>

              <span>
                {lastMessage}
              </span>

            </div>


            {/* ===============================
                ONLINE DOT
            =============================== */}

            {isOnline && (
              <span
                className="chat-online-dot"
              />
            )}

          </button>
        );
      })}

    </div>
  );
}

export default ChatList;