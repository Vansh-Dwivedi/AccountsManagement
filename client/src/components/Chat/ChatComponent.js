import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
} from "react";
import io from "socket.io-client";
import api from "../../utils/api";
import "./ChatComponent.css";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import {
  FaLink,
  FaTimes,
  FaFileAlt,
  FaFilter,
  FaWindowMaximize,
  FaWindowMinimize,
  FaWindowClose,
  FaSearch,
  FaCalendarAlt,
  FaUser,
  FaSort,
  FaExpand,
  FaCompress,
  FaPaperPlane,
  FaCaretDown,
} from "react-icons/fa";
import { Tooltip } from "react-tooltip";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const ChatComponent = ({ currentUser, otherUser, onClose, chatId }) => {
  const { user: authUser } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState("");
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const [error, setError] = useState("");
  const [senderProfilePic, setSenderProfilePic] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showFileTypeMenu, setShowFileTypeMenu] = useState(false);
  const fileInputRef = useRef(null);
  const [fileTypeFilter, setFileTypeFilter] = useState("All");
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showDetailedSearch, setShowDetailedSearch] = useState(false);
  const [detailedSearchParams, setDetailedSearchParams] = useState({
    keyword: "",
    startDate: null,
    endDate: null,
    fileType: "All",
    sortBy: "date",
    sortOrder: "desc",
  });
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchParams, setSearchParams] = useState({
    keyword: "",
    startDate: null,
    endDate: null,
    fileType: "All",
  });
  const [isResizing, setIsResizing] = useState(false);
  const [size, setSize] = useState({ width: 400, height: 500 });
  const resizeRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const [otherUserProfilePic, setOtherUserProfilePic] = useState(null);

  useEffect(() => {
    if (currentUser && otherUser) {
      const constructedChatId = `${currentUser._id}-${otherUser._id}`;
      fetchMessages(constructedChatId);
    }
  }, [currentUser, otherUser]);

  const addMessage = useCallback((message) => {
    setMessages((prevMessages) => {
      const messageExists = prevMessages.some((msg) => msg._id === message._id);
      return messageExists ? prevMessages : [...prevMessages, message];
    });
  }, []);

  const fetchMessages = async (chatId, pageNum = 1) => {
    if (!chatId) return;
    try {
      setLoading(true);
      const response = await api.get(
        `/api/chat/messages/${chatId}?page=${pageNum}&limit=20`
      );
      setMessages((prevMessages) =>
        pageNum === 1
          ? response.data.messages
          : [...response.data.messages, ...prevMessages]
      );
      setPage(response.data.currentPage);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser || !otherUser) return;

    const newSocket = io(process.env.REACT_APP_API_URL);
    setSocket(newSocket);

    newSocket.emit("join", currentUser._id);

    const handleNewMessage = (newMessage) => {
      addMessage(newMessage);
      if (newMessage.sender !== currentUser._id) {
        toast.info(`New message from ${otherUser.username}`, {
          toastId: newMessage._id,
        });
      }
    };

    newSocket.on("newMessage", handleNewMessage);

    fetchMessages();

    return () => {
      newSocket.off("newMessage", handleNewMessage);
      newSocket.disconnect();
    };
  }, [currentUser, otherUser, addMessage, chatId]);

  useEffect(() => {
    if (chatMessagesRef.current) {
      const { scrollHeight, clientHeight, scrollTop } = chatMessagesRef.current;
      const isScrolledToBottom = scrollHeight - clientHeight <= scrollTop + 1;

      if (isScrolledToBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages]);

  useEffect(() => {
    if (otherUser?._id) {
      fetchMessages();
      fetchProfilePics();
    }
  }, [otherUser?._id]);

  const fetchProfilePics = async () => {
    try {
      // Fetch current user's profile pic
      const currentUserResponse = await api.get(
        `/api/users/profile/${currentUser._id}`
      );
      setSenderProfilePic(currentUserResponse.data.profilePic);

      // Fetch other user's profile pic
      const otherUserResponse = await api.get(
        `/api/users/profile/${otherUser._id}`
      );
      setOtherUserProfilePic(otherUserResponse.data.profilePic);
    } catch (error) {
      console.error("Error fetching profile pictures:", error);
    }
  };

  const handleFileTypeSelect = (type) => {
    setFileType(type);
    setShowFileTypeMenu(false);
    fileInputRef.current.click();
  };

  const handleFilterSelect = (filter) => {
    setFileTypeFilter(filter);
    setShowFilterMenu(false);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setInputMessage(selectedFile ? selectedFile.name : "");
  };

  const removeSelectedFile = () => {
    setFile(null);
    setFileType("");
    setInputMessage("");
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    setError("");
    if (inputMessage || file) {
      const formData = new FormData();
      formData.append("message", inputMessage);
      formData.append("receiver", otherUser?._id || "");
      formData.append("sender-profile-pic", senderProfilePic);
      if (file) {
        formData.append("file", file);
        formData.append("fileType", fileType);
      }

      try {
        const response = await api.post("/api/chat/send", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        addMessage(response.data);
        setInputMessage("");
        setFile(null);
        setFileType("");

        if (socket) {
          socket.emit("sendMessage", response.data);
        }

        // Scroll to bottom after sending message
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } catch (error) {
        console.error(
          "Error sending message:",
          error.response?.data || error.message
        );
        setError(error.response?.data?.error || "Error sending message");
      }
    }
  };

  const renderFileAttachment = (file) => {
    if (!file) return null;
    const fileUrl = `${process.env.REACT_APP_API_URL}/uploads/${file.filename}`;
    return (
      <div className="file-attachment">
        <FaFileAlt className="file-icon" />
        <a href={fileUrl} download={file.originalName}>
          Download {file.originalName}
        </a>
      </div>
    );
  };

  const renderMessage = (msg) => {
    const isCurrentUser = msg.sender._id === currentUser._id;
    return (
      <div
        key={msg._id}
        className={`message ${isCurrentUser ? "sent" : "received"}`}
      >
        {msg.file && msg.fileType && (
          <p className="file-type-info">
            {msg.sender.username} sent a {msg.fileType} Attachment:
          </p>
        )}
        <p>{msg.content}</p>
        {msg.file && renderFileAttachment(msg.file)}
        <span className="timestamp">
          {new Date(msg.timestamp).toLocaleString()}
        </span>
      </div>
    );
  };

  useEffect(() => {
    setFilteredMessages(
      fileTypeFilter === "All"
        ? messages
        : messages.filter((msg) => msg.fileType === fileTypeFilter)
    );
  }, [fileTypeFilter, messages]);

  const loadMoreMessages = () => {
    if (page < totalPages) {
      fetchMessages(`${currentUser._id}-${otherUser._id}`, page + 1);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    setIsFullscreen(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setIsMinimized(false);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    const filtered = messages.filter(
      (msg) =>
        msg.content.toLowerCase().includes(e.target.value.toLowerCase()) ||
        (msg.file &&
          msg.file.originalName
            .toLowerCase()
            .includes(e.target.value.toLowerCase()))
    );
    setFilteredMessages(filtered);
  };

  const handleDetailedSearch = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/chat/search", {
        params: {
          chatId,
          ...detailedSearchParams,
        },
      });
      let sortedMessages = sortMessages(
        response.data.messages,
        sortBy,
        sortOrder
      );
      setFilteredMessages(sortedMessages);
    } catch (error) {
      console.error("Error performing detailed search:", error);
      toast.error("Failed to perform detailed search");
    } finally {
      setLoading(false);
    }
  };

  const sortMessages = (messages, sortBy, sortOrder) => {
    return messages.sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "asc"
          ? new Date(a.timestamp) - new Date(b.timestamp)
          : new Date(b.timestamp) - new Date(a.timestamp);
      } else if (sortBy === "fileType") {
        if (a.fileType && b.fileType) {
          return sortOrder === "asc"
            ? a.fileType.localeCompare(b.fileType)
            : b.fileType.localeCompare(a.fileType);
        }
        return a.fileType ? -1 : b.fileType ? 1 : 0;
      }
      return 0;
    });
  };

  const handleSortChange = (newSortBy) => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("asc");
    }
    setFilteredMessages(
      sortMessages(
        [...filteredMessages],
        newSortBy,
        sortOrder === "asc" ? "desc" : "asc"
      )
    );
  };

  const toggleAdvancedSearch = () => {
    setShowAdvancedSearch(!showAdvancedSearch);
  };

  const handleSearchParamChange = (param, value) => {
    setSearchParams((prev) => ({ ...prev, [param]: value }));
  };

  const performAdvancedSearch = () => {
    // This is where you'd typically make an API call to search messages
    // For now, we'll just filter the existing messages
    const filteredMessages = messages.filter((message) => {
      const matchesKeyword = message.content
        .toLowerCase()
        .includes(searchParams.keyword.toLowerCase());
      const matchesFileType =
        searchParams.fileType === "All" ||
        message.fileType === searchParams.fileType;
      const messageDate = new Date(message.timestamp);
      const isAfterStartDate =
        !searchParams.startDate || messageDate >= searchParams.startDate;
      const isBeforeEndDate =
        !searchParams.endDate || messageDate <= searchParams.endDate;

      return (
        matchesKeyword && matchesFileType && isAfterStartDate && isBeforeEndDate
      );
    });

    // Update the displayed messages with the filtered results
    setMessages(filteredMessages);
  };

  const startResize = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const stopResize = () => {
    setIsResizing(false);
  };

  const resize = (e) => {
    if (isResizing) {
      const newWidth =
        e.clientX - resizeRef.current.getBoundingClientRect().left;
      const newHeight =
        e.clientY - resizeRef.current.getBoundingClientRect().top;
      setSize({
        width: Math.max(300, newWidth),
        height: Math.max(400, newHeight),
      });
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResize);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResize);
    };
  }, [isResizing]);

  return (
    <div
      className={`chat-component thrilling-theme ${
        isFullscreen ? "fullscreen" : ""
      }`}
      style={
        !isFullscreen
          ? { width: `${size.width}px`, height: `${size.height}px` }
          : {}
      }
      ref={resizeRef}
    >
      <div className="resize-overlay" onMouseDown={startResize}></div>
      <div className="chat-header">
        <h3 className="chat-header-text">
          Chat with {otherUser.username}
          <img
            className="circle-profile-pic"
            src={
              otherUserProfilePic
                ? `${process.env.REACT_APP_API_URL}/uploads/${otherUserProfilePic}`
                : `${process.env.REACT_APP_API_URL}/default-profile-pic.jpg`
            }
            alt="Profile"
          />
        </h3>
        <div className="header-actions">
          <div className="icon">
            <FaSearch
              className="action-icon"
              data-tooltip-id="search-tooltip"
              data-tooltip-content="Detailed Search"
              onClick={() => setShowDetailedSearch(!showDetailedSearch)}
            />
          </div>
          <div className="filter-dropdown">
            <div className="icon">
              <FaFilter
                className="action-icon"
                data-tooltip-id="filter-tooltip"
                data-tooltip-content="Filter messages"
                onClick={() => setShowFilterMenu(!showFilterMenu)}
              />
            </div>
            {showFilterMenu && (
              <div className="filter-menu">
                <button onClick={() => handleFilterSelect("All")}>All</button>
                <button onClick={() => handleFilterSelect("Tax File")}>Tax File</button>
                <button onClick={() => handleFilterSelect("Payroll File")}>
                  Payroll File
                </button>
                <button onClick={() => handleFilterSelect("Compliance File")}>
                  Compliance File
                </button>
                <button onClick={() => handleFilterSelect("File")}>
                  File
                </button>
              </div>
            )}
          </div>
          <div className="icon">
            {isFullscreen ? (
              <FaCompress
                className="action-icon"
                data-tooltip-id="fullscreen-tooltip"
                data-tooltip-content="Exit Fullscreen"
                onClick={toggleFullscreen}
              />
            ) : (
              <FaExpand
                className="action-icon"
                data-tooltip-id="fullscreen-tooltip"
                data-tooltip-content="Fullscreen"
                onClick={toggleFullscreen}
              />
            )}
          </div>
          <div className="icon">
            <FaTimes
              className="action-icon"
              data-tooltip-id="close-tooltip"
              data-tooltip-content="Close chat"
              onClick={onClose}
            />
          </div>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          {showDetailedSearch && (
            <div className="detailed-search">
              <input
                type="text"
                placeholder="Search keyword..."
                value={detailedSearchParams.keyword}
                onChange={(e) =>
                  setDetailedSearchParams((prev) => ({
                    ...prev,
                    keyword: e.target.value,
                  }))
                }
              />
              <DatePicker
                selected={detailedSearchParams.startDate}
                onChange={(date) =>
                  setDetailedSearchParams((prev) => ({
                    ...prev,
                    startDate: date,
                  }))
                }
                placeholderText="Start Date"
              />
              <DatePicker
                selected={detailedSearchParams.endDate}
                onChange={(date) =>
                  setDetailedSearchParams((prev) => ({
                    ...prev,
                    endDate: date,
                  }))
                }
                placeholderText="End Date"
              />
              <select
                value={detailedSearchParams.fileType}
                onChange={(e) =>
                  setDetailedSearchParams((prev) => ({
                    ...prev,
                    fileType: e.target.value,
                  }))
                }
              >
                <option value="All">All File Types</option>
                <option value="Tax File">Tax File</option>
                <option value="Payroll File File">Payroll File</option>
                <option value="Compliance File">Compliance File</option>
                <option value="File">File</option>
              </select>
              <div className="sort-options">
                <button onClick={() => handleSortChange("date")}>
                  Sort by Date{" "}
                  {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
                </button>
                <button onClick={() => handleSortChange("fileType")}>
                  Sort by File Type{" "}
                  {sortBy === "fileType" && (sortOrder === "asc" ? "↑" : "↓")}
                </button>
              </div>
              <button onClick={handleDetailedSearch}>Search</button>
            </div>
          )}
          <div className="chat-messages" ref={chatMessagesRef}>
            {loading && <div className="loading-spinner">Loading...</div>}
            {filteredMessages.length > 0 ? (
              <>
                {page < totalPages && (
                  <button
                    onClick={loadMoreMessages}
                    disabled={loading}
                    className="load-more-button"
                  >
                    {loading ? "Loading..." : "Load More"}
                  </button>
                )}
                {filteredMessages.map(renderMessage)}
              </>
            ) : (
              <div className="no-messages">No messages/Files found</div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={sendMessage} className="message-input">
            {file && (
              <div className="selected-file-type">
                <span>{file.name.length > 20 ? file.name.slice(0, 17) + '...' : file.name}</span>
                <FaTimes onClick={removeSelectedFile} className="remove-file" />
              </div>
            )}
            <div className="input-wrapper">
              <div className="file-upload-container">
                <div className="file-type-dropdown">
                  <FaLink
                    className="link-icon"
                    onClick={() => setShowFileTypeMenu(!showFileTypeMenu)}
                  />
                  {showFileTypeMenu && (
                    <div className="file-type-menu">
                      <button onClick={() => handleFileTypeSelect("File")}>
                        Normal File
                      </button>
                      <button onClick={() => handleFileTypeSelect("Tax File")}>
                        Tax File
                      </button>
                      <button onClick={() => handleFileTypeSelect("Payroll File")}>
                        Payroll File
                      </button>
                      <button onClick={() => handleFileTypeSelect("Compliance File")}>
                        Compliance File
                      </button>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </div>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type a message..."
              />
              <button type="submit" className="send-button">
                <FaPaperPlane className="send-icon" />
              </button>
            </div>
          </form>
        </>
      )}

      <Tooltip id="filter-tooltip" />
      <Tooltip id="fullscreen-tooltip" />
      <Tooltip id="close-tooltip" />
      <Tooltip id="attach-tooltip" />
      <Tooltip id="search-tooltip" />
    </div>
  );
};

export default ChatComponent;