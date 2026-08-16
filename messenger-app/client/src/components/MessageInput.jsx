import { useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";

function MessageInput({
  onSend,
  onTyping,
  disabled = false,
}) {
  const [message, setMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const fileInputRef = useRef(null);

  /* =====================================================
     EMOJI
  ===================================================== */

  const handleEmojiClick = (emojiData) => {
    const newMessage =
      message + emojiData.emoji;

    setMessage(newMessage);

    if (onTyping) {
      onTyping(newMessage);
    }
  };


  /* =====================================================
     MESSAGE CHANGE
  ===================================================== */

  const handleMessageChange = (event) => {
    const value = event.target.value;

    setMessage(value);

    if (onTyping) {
      onTyping(value);
    }
  };


  /* =====================================================
     FILE SELECT
  ===================================================== */

  const handleFileSelect = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const maxSize =
      10 * 1024 * 1024;

    if (file.size > maxSize) {
      alert(
        "File size must be less than 10 MB."
      );

      event.target.value = "";

      return;
    }

    setSelectedFile(file);
  };


  /* =====================================================
     REMOVE FILE
  ===================================================== */

  const removeFile = () => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  /* =====================================================
     SEND
  ===================================================== */

  const handleSend = async () => {

    const text =
      message.trim();

    console.log(
      "SEND BUTTON CLICKED"
    );

    console.log(
      "Message:",
      text
    );

    console.log(
      "File:",
      selectedFile
    );


    /*
      Don't send empty message.
    */

    if (!text && !selectedFile) {
      console.log(
        "Nothing to send"
      );

      return;
    }


    /*
      Make sure onSend exists.
    */

    if (typeof onSend !== "function") {

      console.error(
        "onSend is not a function"
      );

      return;
    }


    try {

      /*
        Currently send text.
      */

      if (text) {

        await onSend(text);

      }


      /*
        Clear input after successful send.
      */

      setMessage("");

      removeFile();

      setShowEmoji(false);


      if (onTyping) {
        onTyping("");
      }

    } catch (error) {

      console.error(
        "Send message error:",
        error
      );

    }

  };


  /* =====================================================
     ENTER KEY
  ===================================================== */

  const handleKeyDown = (event) => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      handleSend();

    }

  };


  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="message-input-wrapper">


      {/* =================================================
          EMOJI PICKER
      ================================================= */}

      {showEmoji && (
        <div className="emoji-picker-container">

          <EmojiPicker
            onEmojiClick={
              handleEmojiClick
            }
            width={320}
            height={400}
          />

        </div>
      )}


      {/* =================================================
          SELECTED FILE
      ================================================= */}

      {selectedFile && (
        <div className="selected-file">

          <div className="selected-file-icon">

            {selectedFile.type.startsWith(
              "image/"
            )
              ? "🖼️"
              : "📎"}

          </div>


          <div className="selected-file-info">

            <strong>
              {selectedFile.name}
            </strong>

            <span>
              {(
                selectedFile.size /
                1024 /
                1024
              ).toFixed(2)}{" "}
              MB
            </span>

          </div>


          <button
            type="button"
            className="remove-file"
            onClick={removeFile}
          >
            ×
          </button>

        </div>
      )}


      {/* =================================================
          MESSAGE INPUT
      ================================================= */}

      <div className="message-input">


        {/* =================================================
            FILE BUTTON
        ================================================= */}

        <button
          type="button"
          className="composer-icon"
          onClick={() =>
            fileInputRef.current?.click()
          }
          disabled={disabled}
          title="Attach file"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
            />
          </svg>
        </button>


        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={handleFileSelect}
        />


        {/* =================================================
            EMOJI BUTTON
        ================================================= */}

        <button
          type="button"
          className="composer-icon"
          onClick={() =>
            setShowEmoji(
              previous => !previous
            )
          }
          disabled={disabled}
          title="Emoji"
        >
          <svg
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
            />

            <path
              d="M8 14s1.5 2 4 2 4-2 4-2"
            />

            <path
              d="M9 9h.01"
            />

            <path
              d="M15 9h.01"
            />
          </svg>
        </button>


        {/* =================================================
            TEXT INPUT
        ================================================= */}

        <input
          type="text"
          value={message}
          onChange={
            handleMessageChange
          }
          onKeyDown={
            handleKeyDown
          }
          placeholder="Type a message..."
          disabled={disabled}
        />


        {/* =================================================
            SEND BUTTON
        ================================================= */}

        <button
          type="button"
          className="send-button"
          onClick={handleSend}
          disabled={
            disabled ||
            (
              !message.trim() &&
              !selectedFile
            )
          }
          title="Send message"
        >
          ➤
        </button>

      </div>

    </div>
  );
}

export default MessageInput;