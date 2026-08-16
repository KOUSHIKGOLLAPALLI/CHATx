import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";

import { useAuth } from "../context/AuthContext";

import {
  getConversations,
  getMessages,
  sendMessage,
} from "../services/chatService";

import ChatList from "../components/ChatList";
import ChatWindow from "../components/ChatWindow";
import UserSearch from "../components/UserSearch";
import ChatRequest from "../components/ChatRequest";

import { SocketProvider } from "../context/SocketContext";


/* =====================================================
   DASHBOARD CONTENT
===================================================== */

function DashboardContent() {

  const { user, logout } = useAuth();


  /* =====================================================
     CONVERSATIONS
  ===================================================== */

  const [conversations, setConversations] =
    useState([]);


  /* =====================================================
     SELECTED CONVERSATION
  ===================================================== */

  const [selected, setSelected] =
    useState(null);


  /* =====================================================
     MESSAGES
  ===================================================== */

  const [messages, setMessages] =
    useState([]);


  /* =====================================================
     LOADING
  ===================================================== */

  const [loadingMessages, setLoadingMessages] =
    useState(false);


  /* =====================================================
     LOAD CONVERSATIONS
  ===================================================== */

  async function loadConversations() {

    try {

      const response =
        await getConversations();

      console.log(
        "CONVERSATIONS RESPONSE:",
        response.data
      );

      const conversationList =
        response?.data?.conversations || [];

      setConversations(
        conversationList
      );


      /*
        Keep selected conversation updated.
      */

      if (selected?._id) {

        const updatedConversation =
          conversationList.find(
            conversation =>
              String(conversation._id) ===
              String(selected._id)
          );

        if (updatedConversation) {

          setSelected(
            updatedConversation
          );

        }

      }

    } catch (error) {

      console.error(
        "FAILED TO LOAD CONVERSATIONS:",
        error
      );

      console.error(
        "STATUS:",
        error?.response?.status
      );

      console.error(
        "DATA:",
        error?.response?.data
      );

    }

  }


  /* =====================================================
     LOAD MESSAGES
  ===================================================== */

  async function loadMessages(
    conversationId,
    showLoading = true
  ) {

    if (!conversationId) {

      setMessages([]);

      return;

    }


    try {

      if (showLoading) {

        setLoadingMessages(true);

      }


      const response =
        await getMessages(
          conversationId
        );


      console.log(
        "MESSAGES RESPONSE:",
        response.data
      );


      const messageList =
        response?.data?.messages || [];


      setMessages(
        messageList
      );

    } catch (error) {

      console.error(
        "FAILED TO LOAD MESSAGES:",
        error
      );

      console.error(
        "STATUS:",
        error?.response?.status
      );

      console.error(
        "DATA:",
        error?.response?.data
      );

      setMessages([]);

    } finally {

      if (showLoading) {

        setLoadingMessages(false);

      }

    }

  }


  /* =====================================================
     SELECT CONVERSATION
  ===================================================== */

  function handleSelectConversation(
    conversation
  ) {

    console.log(
      "SELECTED CONVERSATION:",
      conversation
    );


    if (!conversation?._id) {

      console.error(
        "Conversation has no _id:",
        conversation
      );

      return;

    }


    setSelected(
      conversation
    );


    /*
      Clear previous messages.
    */

    setMessages([]);


    /*
      Load selected conversation.
    */

    loadMessages(
      conversation._id,
      true
    );

  }


  /* =====================================================
     SEND MESSAGE
  ===================================================== */

  async function send(text) {

    console.log(
      "================================"
    );

    console.log(
      "SEND FUNCTION CALLED"
    );

    console.log(
      "TEXT:",
      text
    );

    console.log(
      "SELECTED CONVERSATION:",
      selected
    );


    /* =================================================
       CHECK CONVERSATION
    ================================================= */

    if (!selected?._id) {

      console.error(
        "NO CONVERSATION SELECTED"
      );

      return;

    }


    /* =================================================
       CLEAN MESSAGE
    ================================================= */

    const cleanText =
      text?.trim();


    if (!cleanText) {

      console.error(
        "EMPTY MESSAGE"
      );

      return;

    }


    try {

      console.log(
        "SENDING MESSAGE..."
      );

      console.log(
        "CONVERSATION ID:",
        selected._id
      );

      console.log(
        "TEXT:",
        cleanText
      );


      /* =================================================
         SEND TO BACKEND
      ================================================= */

      const response =
        await sendMessage(
          selected._id,
          cleanText
        );


      console.log(
        "SERVER RESPONSE:",
        response
      );

      console.log(
        "SERVER DATA:",
        response?.data
      );


      /* =================================================
         GET CREATED MESSAGE
      ================================================= */

      const createdMessage =
        response?.data?.message;


      if (createdMessage) {

        console.log(
          "CREATED MESSAGE:",
          createdMessage
        );


        /*
          Immediately add message
          to current chat.
        */

        setMessages(
          previousMessages => {

            /*
              Prevent duplicate message.
            */

            const messageId =
              createdMessage._id ||
              createdMessage.id;


            if (messageId) {

              const alreadyExists =
                previousMessages.some(
                  message =>
                    String(
                      message._id ||
                      message.id
                    ) ===
                    String(messageId)
                );

              if (alreadyExists) {

                return previousMessages;

              }

            }


            return [
              ...previousMessages,
              createdMessage,
            ];

          }
        );

      } else {

        console.warn(
          "SERVER DID NOT RETURN CREATED MESSAGE"
        );


        /*
          Reload messages from database.
        */

        await loadMessages(
          selected._id,
          false
        );

      }


      /* =================================================
         UPDATE CONVERSATION LIST
      ================================================= */

      await loadConversations();


      console.log(
        "MESSAGE SENT SUCCESSFULLY"
      );

      console.log(
        "================================"
      );

    } catch (error) {

      console.error(
        "================================"
      );

      console.error(
        "SEND MESSAGE FAILED"
      );

      console.error(
        "ERROR:",
        error
      );

      console.error(
        "STATUS:",
        error?.response?.status
      );

      console.error(
        "SERVER ERROR:",
        error?.response?.data
      );

      console.error(
        "MESSAGE:",
        error?.message
      );

      console.error(
        "================================"
      );

    }

  }


  /* =====================================================
     TYPING
  ===================================================== */

  function typingChange(value) {

    /*
      Kept for future Socket.IO typing indicator.
    */

    console.log(
      "TYPING:",
      value
    );

  }


  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {

    loadConversations();

  }, []);


  /* =====================================================
     LIVE MESSAGE REFRESH
     
     TEMPORARY SOLUTION

     Until Socket.IO is connected properly,
     check the database every 2 seconds.
  ===================================================== */

  useEffect(() => {

    if (!selected?._id) {

      return;

    }


    let cancelled = false;


    async function refreshMessages() {

      try {

        const response =
          await getMessages(
            selected._id
          );


        if (cancelled) {

          return;

        }


        const latestMessages =
          response?.data?.messages || [];


        /*
          Only update if component
          is still active.
        */

        setMessages(
          latestMessages
        );


      } catch (error) {

        if (!cancelled) {

          console.error(
            "LIVE MESSAGE REFRESH FAILED:",
            error
          );

        }

      }

    }


    /*
      Load immediately.
    */

    refreshMessages();


    /*
      Check every 2 seconds.
    */

    const interval =
      setInterval(
        refreshMessages,
        2000
      );


    /*
      Cleanup.
    */

    return () => {

      cancelled = true;

      clearInterval(
        interval
      );

    };

  }, [selected?._id]);


  /* =====================================================
     RENDER
  ===================================================== */

  return (

    <div className={`app-shell ${selected ? "chat-selected" : ""}`}>


      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="sidebar">


        {/* =================================================
            HEADER
        ================================================= */}

        <header className="sidebar-header">

          <div>

            <strong>
              CHATx
            </strong>

            <span>
              @{user?.username}
            </span>

          </div>


         <div className="header-actions">

    <NotificationBell />

    <Link to="/profile">
        Profile
    </Link>

    <button
        type="button"
        className="secondary small"
        onClick={logout}
    >
        Logout
    </button>

</div>
        </header>


        {/* =================================================
            USER SEARCH
        ================================================= */}

        <UserSearch />


        {/* =================================================
            CHAT REQUESTS
        ================================================= */}

        <ChatRequest
          onAccepted={
            loadConversations
          }
        />


        {/* =================================================
            CHAT TITLE
        ================================================= */}

        <h3 className="section-title">
          Chats
        </h3>


        {/* =================================================
            CHAT LIST
        ================================================= */}

        <ChatList

          conversations={
            conversations
          }

          currentId={
            selected?._id
          }

          onSelect={
            handleSelectConversation
          }

        />

      </aside>


      {/* =================================================
          CHAT WINDOW
      ================================================= */}

      <ChatWindow

        conversation={
          selected
        }

        messages={
          messages
        }

        send={
          send
        }

        typingChange={
          typingChange
        }

        loadingMessages={
          loadingMessages
        }

      />

    </div>

  );

}


/* =====================================================
   DASHBOARD
===================================================== */

export default function Dashboard() {

  return (

    <SocketProvider>

      <DashboardContent />

    </SocketProvider>

  );

}
