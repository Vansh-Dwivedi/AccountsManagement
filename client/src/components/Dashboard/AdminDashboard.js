import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import "./AdminDashboard.css";
import AuditLogs from "../AuditLogs";
import ChatSubmissions from "../ChatSubmissions";
import ChatComponent from "../Chat/ChatComponent"; // Import the ChatComponent
import Header from "../Header";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");
  const [roles, setRoles] = useState([]);
  const [pendingChanges, setPendingChanges] = useState({});
  const [message, setMessage] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchAdminData();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log("Fetching users...");
      const response = await api.get("/api/users/all");
      console.log("Response received:", response);
      setUsers(response.data);
      setError(null);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to fetch users. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      const response = await api.get("/api/users/profile");
      setAdminData(response.data);
      setProfilePic(response.data.profilePic);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      if (error.response && error.response.status === 401) {
        navigate("/login");
      }
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get("/api/users/roles");
      console.log("Roles fetched from API:", response.data);
      setRoles(response.data);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const handleRoleChange = (userId, newRole) => {
    setPendingChanges((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], role: newRole },
    }));
  };

  const handleAssignManager = (clientId, managerId) => {
    setPendingChanges((prev) => ({
      ...prev,
      [clientId]: { ...prev[clientId], assignedManager: managerId },
    }));
  };

  const handleDeleteUser = (userId) => {
    setPendingChanges((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], delete: true },
    }));
  };

  const applyChanges = async (userId) => {
    try {
      const changes = pendingChanges[userId];
      if (!changes) return;

      if (changes.delete) {
        await api.delete(`/api/users/${userId}`);
        setUsers(users.filter((user) => user._id !== userId));
        setMessage(`User deleted successfully`);
      } else {
        if (changes.role) {
          await api.put(`/api/users/update-role/${userId}`, {
            role: changes.role,
          });
        }

        if (changes.assignedManager) {
          await api.put(`/api/users/${userId}/assign-manager`, {
            managerId: changes.assignedManager,
          });
          await api.put(`/api/users/${changes.assignedManager}/assign-client`, {
            clientId: userId,
          });
        }

        setUsers(
          users.map((user) =>
            user._id === userId ? { ...user, ...changes } : user
          )
        );

        setMessage(
          `Changes applied successfully for ${
            users.find((u) => u._id === userId).username
          }`
        );
      }

      setPendingChanges((prev) => {
        const newPending = { ...prev };
        delete newPending[userId];
        return newPending;
      });

      setTimeout(() => setMessage(""), 3000); // Clear message after 3 seconds
    } catch (error) {
      console.error("Error applying changes:", error);
      setMessage("Failed to apply changes. Please try again.");
    }
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("profilePic", file);

    try {
      const response = await api.post("/api/users/profile-pic", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfilePic(response.data.profilePic);
    } catch (error) {
      console.error("Error uploading profile picture:", error);
    }
  };

  const handleProfilePicDelete = async () => {
    try {
      await api.delete("/api/users/profile-pic");
      setProfilePic(null);
    } catch (error) {
      console.error("Error deleting profile picture:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  const handleStartChat = (user) => {
    setSelectedUser(user);
    setShowChat(true);
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setSelectedUser(null);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  // Add this line just before the return statement
  console.log("Current roles state before rendering:", roles);

  return (
    <div>
      <Header />
      <div className="admin-dashboard">
        <h2>Admin Dashboard</h2>
        <div className="profile-section">
          {profilePic ? (
            <div className="profile-pic-container">
              <img
                src={`${process.env.REACT_APP_API_URL}/uploads/${profilePic}`}
                alt="Profile"
                className="profile-pic"
                crossOrigin="anonymous"
              />
            </div>
          ) : (
            <div className="profile-pic-placeholder">No Image</div>
          )}
          <input
            type="file"
            onChange={handleProfilePicUpload}
            accept="image/*"
          />
          {profilePic && (
            <button onClick={handleProfilePicDelete}>Delete Picture</button>
          )}
        </div>
        {adminData && (
          <div className="admin-info">
            <p>Username: {adminData.username}</p>
            <p>Email: {adminData.email}</p>
            <p>Role: {adminData.role}</p>
          </div>
        )}
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>

        <div className="dashboard-tabs">
          <button
            onClick={() => setActiveTab("users")}
            className={activeTab === "users" ? "active" : ""}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={activeTab === "logs" ? "active" : ""}
          >
            Audit Logs
          </button>
          <button
            onClick={() => setActiveTab("chatSubmissions")}
            className={activeTab === "chatSubmissions" ? "active" : ""}
          >
            Chat Submissions
          </button>
        </div>

        {message && <div className="message">{message}</div>}

        {activeTab === "users" && (
          <div className="user-management">
            <h3>User Management</h3>
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Assigned Manager</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      {user.role === "client" && (
                        <select
                          value={
                            pendingChanges[user._id]?.assignedManager ||
                            user.assignedManager ||
                            ""
                          }
                          onChange={(e) =>
                            handleAssignManager(user._id, e.target.value)
                          }
                        >
                          <option value="">Unassigned</option>
                          {users
                            .filter((u) => u.role === "manager")
                            .map((manager) => (
                              <option key={manager._id} value={manager._id}>
                                {manager.username}
                              </option>
                            ))}
                        </select>
                      )}
                    </td>
                    <td>{user.isBlocked ? "Blocked" : "Active"}</td>
                    <td>
                      <select
                        value={pendingChanges[user._id]?.role || user.role}
                        onChange={(e) =>
                          handleRoleChange(user._id, e.target.value)
                        }
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="delete-button"
                      >
                        Delete
                      </button>
                      {pendingChanges[user._id] && (
                        <button
                          onClick={() => applyChanges(user._id)}
                          className="apply-button"
                        >
                          Apply
                        </button>
                      )}
                      <button onClick={() => handleStartChat(user)}>
                        Chat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "logs" && <AuditLogs />}
        {activeTab === "chatSubmissions" && <ChatSubmissions />}

        {showChat && selectedUser && (
          <ChatComponent otherUser={selectedUser} onClose={handleCloseChat} />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
