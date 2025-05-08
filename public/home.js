document.addEventListener("DOMContentLoaded", () => {
  console.log("Home page loaded")

  // Check if user is logged in
  const checkAuth = () => {
    const user = localStorage.getItem("currentUser")
    if (!user) {
      // Redirect to login if not logged in
      window.location.href = "index.html"
      return null
    }
    return JSON.parse(user)
  }

  const currentUser = checkAuth()
  if (!currentUser) return

  // Update welcome message
  const welcomeMessage = document.getElementById("welcome-message")
  if (welcomeMessage) {
    welcomeMessage.textContent = `${currentUser.username}`
  }

  // Set user as online
  const updateOnlineStatus = async (status = true) => {
    try {
      const response = await fetch("/api/users/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, status }),
      })
      const data = await response.json()
      return data.success
    } catch (error) {
      console.error("Error updating online status:", error)
      return false
    }
  }

  // Update online status when page loads
  updateOnlineStatus()

  // Update online status periodically (every 30 seconds)
  const onlineStatusInterval = setInterval(() => {
    updateOnlineStatus()
  }, 30000)

  // Handle logout
  const handleLogout = async () => {
    // Set user as offline
    await updateOnlineStatus(false)

    // Clear intervals
    clearInterval(onlineStatusInterval)
    if (window.chatRefreshInterval) {
      clearInterval(window.chatRefreshInterval)
    }

    // Clear local storage and redirect
    localStorage.removeItem("currentUser")
    window.location.href = "index.html"
  }

  // Navigation handling
  const navItems = document.querySelectorAll(".nav-item")
  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      const page = item.getAttribute("data-page")

      // Only handle navigation if not already on that page
      if (!item.classList.contains("active")) {
        switch (page) {
          case "home":
            // Just update the content area for home
            updateContentArea("home")
            break
          case "chat":
            updateContentArea("chat")
            break
          case "profile":
            // Update the content area for profile
            updateContentArea("profile")
            break
          case "settings":
            updateContentArea("settings")
            break
        }
      }

      // Prevent default link behavior
      e.preventDefault()

      // Update active state
      navItems.forEach((nav) => nav.classList.remove("active"))
      item.classList.add("active")
    })
  })

  // Store the currently selected chat user
  let selectedChatUser = null

  // Function to update content area
  function updateContentArea(page) {
    const contentArea = document.getElementById("content-area")
    if (!contentArea) return

    // Clear previous chat interval if exists
    if (window.chatRefreshInterval) {
      clearInterval(window.chatRefreshInterval)
    }

    let content = ""

    switch (page) {
      case "home":
        content = `
          <div class="placeholder-content">
            <i class="fas fa-home fa-3x"></i>
            <h3>Home Dashboard</h3>
            <p>Coinbase Support is the customer service team for Coinbase, a popular online platform for buying, selling, and storing cryptocurrencies like Bitcoin, Ethereum, and others.
The Coinbase Support team is responsible for:
1. Answering questions about Coinbase services and features.
2. Resolving issues with accounts, transactions, and payments.
3. Providing guidance on security, verification, and compliance.
4. Assisting with technical problems, such as login or connectivity issues.
You can typically contact Coinbase
Support through here</p>
    /div>
        `
        break
      case "chat":
        content = `
        <div class="chat-container">
          <div class="chat-sidebar">
            <div class="chat-sidebar-header">
              <h3><i class="fas fa-users"></i> Users</h3>
            </div>
            <div class="user-list" id="user-list">
              <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i> Loading users...
              </div>
            </div>
          </div>
          <div class="chat-main">
            <div class="chat-header">
              <h3 id="chat-title"><i class="fas fa-comments"></i> Select a user to chat</h3>
            </div>
            <div class="chat-messages" id="chat-messages">
              <div class="no-chat-selected">
                <i class="fas fa-comments fa-3x"></i>
                <p>Select a user from the list to start chatting</p>
              </div>
            </div>
            <div class="chat-input">
              <textarea id="message-input" placeholder="Type a message..." disabled></textarea>
              <button id="send-message-btn" disabled>
                <i class="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `
        break
      case "profile":
        const profilePic = currentUser.profilePicture || "/placeholder.svg?height=100&width=100"
        content = `
        <div class="user-profile">
          <div class="profile-header">
            <div class="profile-picture-container">
              <img src="${profilePic}" alt="Profile Picture" class="profile-picture" id="profile-picture">
              <div class="profile-picture-overlay">
                <i class="fas fa-camera"></i>
                <span>Change</span>
              </div>
            </div>
            <div class="profile-info">
              <h3>${currentUser.username}</h3>
              <p>${currentUser.email}</p>
              <p>Member since: ${new Date(currentUser.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div class="profile-actions">
            <button class="btn-edit-profile" id="edit-profile-btn">Edit Profile</button>
          </div>
          <div class="profile-details">
            <div class="detail-item">
              <i class="fas fa-shield-alt"></i>
              <div class="detail-content">
                <h4>Security</h4>
                <p>Your account is protected with secure authentication.</p>
              </div>
            </div>
            <div class="detail-item">
              <i class="fas fa-bell"></i>
              <div class="detail-content">
                <h4>Notifications</h4>
                <p>Manage your notification preferences.</p>
              </div>
            </div>
            <div class="detail-item">
              <i class="fas fa-cog"></i>
              <div class="detail-content">
                <h4>Settings</h4>
                <p>Configure your account settings.</p>
              </div>
            </div>
          </div>
          
          <!-- Hidden file input for profile picture -->
          <input type="file" id="profile-picture-input" accept="image/*" style="display: none;">
          
          <!-- Edit Profile Modal -->
          <div class="modal" id="edit-profile-modal">
            <div class="modal-content">
              <div class="modal-header">
                <h3>Edit Profile</h3>
                <button class="modal-close">&times;</button>
              </div>
              <div class="modal-body">
                <form id="edit-profile-form">
                  <div class="form-group">
                    <label for="edit-username">Username</label>
                    <input type="text" id="edit-username" value="${currentUser.username}" required>
                  </div>
                  <div class="form-group">
                    <label for="edit-email">Email</label>
                    <input type="email" id="edit-email" value="${currentUser.email}" required>
                  </div>
                  <div class="form-actions">
                    <button type="button" class="btn-cancel">Cancel</button>
                    <button type="submit" class="btn-save">Save Changes</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      `
        break
      case "settings":
        content = `
        <div class="settings-container">
          <h2><i class="fas fa-cog"></i> Settings</h2>
          
          <div class="settings-section">
            <h3>Account</h3>
            <div class="settings-item">
              <div class="settings-item-info">
                <i class="fas fa-user-circle"></i>
                <div>
                  <h4>Profile Information</h4>
                  <p>Update your name, email, and profile picture</p>
                </div>
              </div>
              <button class="btn-settings" id="edit-profile-settings-btn">Edit</button>
            </div>
            
            <div class="settings-item">
              <div class="settings-item-info">
                <i class="fas fa-lock"></i>
                <div>
                  <h4>Password</h4>
                  <p>Change your password</p>
                </div>
              </div>
              <button class="btn-settings" id="change-password-btn">Change</button>
            </div>
          </div>
          
          <div class="settings-section">
            <h3>Preferences</h3>
            <div class="settings-item">
              <div class="settings-item-info">
                <i class="fas fa-bell"></i>
                <div>
                  <h4>Notifications</h4>
                  <p>Manage notification settings</p>
                </div>
              </div>
              <button class="btn-settings" id="notifications-btn">Configure</button>
            </div>
            
            <div class="settings-item">
              <div class="settings-item-info">
                <i class="fas fa-moon"></i>
                <div>
                  <h4>Theme</h4>
                  <p>Switch between light and dark mode</p>
                </div>
              </div>
              <div class="theme-toggle">
                <span>Light</span>
                <label class="switch">
                  <input type="checkbox" id="theme-switch">
                  <span class="slider round"></span>
                </label>
                <span>Dark</span>
              </div>
            </div>
          </div>
          
          <div class="settings-section">
            <h3>Account Actions</h3>
            <div class="settings-item">
              <div class="settings-item-info">
                <i class="fas fa-sign-out-alt"></i>
                <div>
                  <h4>Logout</h4>
                  <p>Sign out of your account</p>
                </div>
              </div>
              <button class="btn-settings btn-logout-settings" id="settings-logout-btn">Logout</button>
            </div>
            
            <div class="settings-item">
              <div class="settings-item-info">
                <i class="fas fa-trash-alt"></i>
                <div>
                  <h4>Delete Account</h4>
                  <p>Permanently delete your account and all data</p>
                </div>
              </div>
              <button class="btn-settings btn-danger" id="delete-account-btn">Delete</button>
            </div>
          </div>
          
          <!-- Change Password Modal -->
          <div class="modal" id="change-password-modal">
            <div class="modal-content">
              <div class="modal-header">
                <h3>Change Password</h3>
                <button class="modal-close">&times;</button>
              </div>
              <div class="modal-body">
                <form id="change-password-form">
                  <div class="form-group">
                    <label for="current-password">Current Password</label>
                    <input type="password" id="current-password" required>
                  </div>
                  <div class="form-group">
                    <label for="new-password">New Password</label>
                    <input type="password" id="new-password" required>
                  </div>
                  <div class="form-group">
                    <label for="confirm-password">Confirm New Password</label>
                    <input type="password" id="confirm-password" required>
                  </div>
                  <div class="form-actions">
                    <button type="button" class="btn-cancel">Cancel</button>
                    <button type="submit" class="btn-save">Change Password</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          
          <!-- Delete Account Modal -->
          <div class="modal" id="delete-account-modal">
            <div class="modal-content">
              <div class="modal-header">
                <h3>Delete Account</h3>
                <button class="modal-close">&times;</button>
              </div>
              <div class="modal-body">
                <div class="warning-message">
                  <i class="fas fa-exclamation-triangle"></i>
                  <p>Warning: This action cannot be undone. All your data will be permanently deleted.</p>
                </div>
                <form id="delete-account-form">
                  <div class="form-group">
                    <label for="delete-password">Enter your password to confirm</label>
                    <input type="password" id="delete-password" required>
                  </div>
                  <div class="form-actions">
                    <button type="button" class="btn-cancel">Cancel</button>
                    <button type="submit" class="btn-danger">Delete My Account</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      `
        break
    }

    contentArea.innerHTML = content

    // Set up page-specific functionality
    if (page === "profile") {
      setupProfile()
    } else if (page === "chat") {
      setupChat()
    } else if (page === "settings") {
      setupSettings()
    }
  }

  // Function to set up profile functionality
  function setupProfile() {
    // Handle profile picture change
    const profilePicture = document.getElementById("profile-picture")
    const profilePictureInput = document.getElementById("profile-picture-input")
    const profilePictureContainer = document.querySelector(".profile-picture-container")

    if (profilePictureContainer) {
      profilePictureContainer.addEventListener("click", () => {
        profilePictureInput.click()
      })
    }

    if (profilePictureInput) {
      profilePictureInput.addEventListener("change", async (e) => {
        if (e.target.files.length === 0) return

        const file = e.target.files[0]

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert("File size must be less than 5MB")
          return
        }

        // Check file type
        if (!file.type.match(/image.*/)) {
          alert("Only image files are allowed")
          return
        }

        // Create form data
        const formData = new FormData()
        formData.append("profilePicture", file)
        formData.append("userId", currentUser.id)

        try {
          // Show loading state
          profilePicture.style.opacity = "0.5"

          // Upload profile picture
          const response = await fetch("/api/users/profile-picture", {
            method: "POST",
            body: formData,
          })

          const data = await response.json()

          if (data.success) {
            // Update profile picture
            profilePicture.src = data.profilePicture

            // Update current user in localStorage
            currentUser.profilePicture = data.profilePicture
            localStorage.setItem("currentUser", JSON.stringify(currentUser))

            // Show success message
            showToast("Profile picture updated successfully", "success")
          } else {
            showToast(data.message || "Failed to update profile picture", "error")
          }
        } catch (error) {
          console.error("Error uploading profile picture:", error)
          showToast("Error uploading profile picture", "error")
        } finally {
          // Reset loading state
          profilePicture.style.opacity = "1"
        }
      })
    }

    // Handle edit profile
    const editProfileBtn = document.getElementById("edit-profile-btn")
    const editProfileModal = document.getElementById("edit-profile-modal")
    const modalClose = editProfileModal?.querySelector(".modal-close")
    const cancelBtn = editProfileModal?.querySelector(".btn-cancel")
    const editProfileForm = document.getElementById("edit-profile-form")

    if (editProfileBtn && editProfileModal) {
      editProfileBtn.addEventListener("click", () => {
        editProfileModal.style.display = "flex"
      })

      modalClose.addEventListener("click", () => {
        editProfileModal.style.display = "none"
      })

      cancelBtn.addEventListener("click", () => {
        editProfileModal.style.display = "none"
      })

      // Close modal when clicking outside
      window.addEventListener("click", (e) => {
        if (e.target === editProfileModal) {
          editProfileModal.style.display = "none"
        }
      })

      // Handle form submission
      if (editProfileForm) {
        editProfileForm.addEventListener("submit", async (e) => {
          e.preventDefault()

          const username = document.getElementById("edit-username").value.trim()
          const email = document.getElementById("edit-email").value.trim()

          if (!username || !email) {
            showToast("Username and email are required", "error")
            return
          }

          try {
            // Show loading state
            const saveBtn = editProfileForm.querySelector(".btn-save")
            saveBtn.disabled = true
            saveBtn.textContent = "Saving..."

            // Update profile
            const response = await fetch("/api/users/profile", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: currentUser.id,
                username,
                email,
              }),
            })

            const data = await response.json()

            if (data.success) {
              // Update current user in localStorage
              Object.assign(currentUser, data.user)
              localStorage.setItem("currentUser", JSON.stringify(currentUser))

              // Update profile info in UI
              const profileInfo = document.querySelector(".profile-info")
              if (profileInfo) {
                profileInfo.innerHTML = `
                <h3>${currentUser.username}</h3>
                <p>${currentUser.email}</p>
                <p>Member since: ${new Date(currentUser.createdAt).toLocaleDateString()}</p>
              `
              }

              // Update welcome message
              const welcomeMessage = document.getElementById("welcome-message")
              if (welcomeMessage) {
                welcomeMessage.textContent = currentUser.username
              }

              // Close modal
              editProfileModal.style.display = "none"

              // Show success message
              showToast("Profile updated successfully", "success")
            } else {
              showToast(data.message || "Failed to update profile", "error")
            }
          } catch (error) {
            console.error("Error updating profile:", error)
            showToast("Error updating profile", "error")
          } finally {
            // Reset loading state
            const saveBtn = editProfileForm.querySelector(".btn-save")
            saveBtn.disabled = false
            saveBtn.textContent = "Save Changes"
          }
        })
      }
    }
  }

  // Function to set up settings functionality
  function setupSettings() {
    // Handle edit profile button in settings
    const editProfileBtn = document.getElementById("edit-profile-settings-btn")
    if (editProfileBtn) {
      editProfileBtn.addEventListener("click", () => {
        // Switch to profile tab and trigger edit
        document.querySelector('[data-page="profile"]').click()
        setTimeout(() => {
          const profileEditBtn = document.getElementById("edit-profile-btn")
          if (profileEditBtn) {
            profileEditBtn.click()
          }
        }, 100)
      })
    }

    // Handle change password
    const changePasswordBtn = document.getElementById("change-password-btn")
    const changePasswordModal = document.getElementById("change-password-modal")
    const passwordModalClose = changePasswordModal?.querySelector(".modal-close")
    const passwordCancelBtn = changePasswordModal?.querySelector(".btn-cancel")
    const changePasswordForm = document.getElementById("change-password-form")

    if (changePasswordBtn && changePasswordModal) {
      changePasswordBtn.addEventListener("click", () => {
        changePasswordModal.style.display = "flex"
      })

      passwordModalClose.addEventListener("click", () => {
        changePasswordModal.style.display = "none"
      })

      passwordCancelBtn.addEventListener("click", () => {
        changePasswordModal.style.display = "none"
      })

      // Close modal when clicking outside
      window.addEventListener("click", (e) => {
        if (e.target === changePasswordModal) {
          changePasswordModal.style.display = "none"
        }
      })

      // Handle form submission
      if (changePasswordForm) {
        changePasswordForm.addEventListener("submit", async (e) => {
          e.preventDefault()

          const currentPassword = document.getElementById("current-password").value
          const newPassword = document.getElementById("new-password").value
          const confirmPassword = document.getElementById("confirm-password").value

          if (!currentPassword || !newPassword || !confirmPassword) {
            showToast("All fields are required", "error")
            return
          }

          if (newPassword !== confirmPassword) {
            showToast("New passwords do not match", "error")
            return
          }

          if (newPassword.length < 6) {
            showToast("Password must be at least 6 characters", "error")
            return
          }

          try {
            // Show loading state
            const saveBtn = changePasswordForm.querySelector(".btn-save")
            saveBtn.disabled = true
            saveBtn.textContent = "Changing..."

            // Change password
            const response = await fetch("/api/users/password", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: currentUser.id,
                currentPassword,
                newPassword,
              }),
            })

            const data = await response.json()

            if (data.success) {
              // Reset form
              changePasswordForm.reset()

              // Close modal
              changePasswordModal.style.display = "none"

              // Show success message
              showToast("Password changed successfully", "success")
            } else {
              showToast(data.message || "Failed to change password", "error")
            }
          } catch (error) {
            console.error("Error changing password:", error)
            showToast("Error changing password", "error")
          } finally {
            // Reset loading state
            const saveBtn = changePasswordForm.querySelector(".btn-save")
            saveBtn.disabled = false
            saveBtn.textContent = "Change Password"
          }
        })
      }
    }

    // Handle delete account
    const deleteAccountBtn = document.getElementById("delete-account-btn")
    const deleteAccountModal = document.getElementById("delete-account-modal")
    const deleteModalClose = deleteAccountModal?.querySelector(".modal-close")
    const deleteCancelBtn = deleteAccountModal?.querySelector(".btn-cancel")
    const deleteAccountForm = document.getElementById("delete-account-form")

    if (deleteAccountBtn && deleteAccountModal) {
      deleteAccountBtn.addEventListener("click", () => {
        deleteAccountModal.style.display = "flex"
      })

      deleteModalClose.addEventListener("click", () => {
        deleteAccountModal.style.display = "none"
      })

      deleteCancelBtn.addEventListener("click", () => {
        deleteAccountModal.style.display = "none"
      })

      // Close modal when clicking outside
      window.addEventListener("click", (e) => {
        if (e.target === deleteAccountModal) {
          deleteAccountModal.style.display = "none"
        }
      })

      // Handle form submission
      if (deleteAccountForm) {
        deleteAccountForm.addEventListener("submit", async (e) => {
          e.preventDefault()

          const password = document.getElementById("delete-password").value

          if (!password) {
            showToast("Password is required", "error")
            return
          }

          try {
            // Show loading state
            const deleteBtn = deleteAccountForm.querySelector(".btn-danger")
            deleteBtn.disabled = true
            deleteBtn.textContent = "Deleting..."

            // Delete account
            const response = await fetch(`/api/users/${currentUser.id}`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ password }),
            })

            const data = await response.json()

            if (data.success) {
              // Show success message
              showToast("Account deleted successfully", "success")

              // Logout
              setTimeout(() => {
                handleLogout()
              }, 1500)
            } else {
              showToast(data.message || "Failed to delete account", "error")
            }
          } catch (error) {
            console.error("Error deleting account:", error)
            showToast("Error deleting account", "error")
          } finally {
            // Reset loading state
            const deleteBtn = deleteAccountForm.querySelector(".btn-danger")
            deleteBtn.disabled = false
            deleteBtn.textContent = "Delete My Account"
          }
        })
      }
    }

    // Handle notifications button
    const notificationsBtn = document.getElementById("notifications-btn")
    if (notificationsBtn) {
      notificationsBtn.addEventListener("click", () => {
        showToast("Notification settings coming soon!", "info")
      })
    }

    // Handle logout button in settings
    const logoutBtn = document.getElementById("settings-logout-btn")
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        await handleLogout()
      })
    }

    // Handle theme switch
    const themeSwitch = document.getElementById("theme-switch")
    if (themeSwitch) {
      // Check if dark mode is enabled
      const isDarkMode = localStorage.getItem("darkMode") === "true"
      themeSwitch.checked = isDarkMode

      if (isDarkMode) {
        document.body.classList.add("dark-mode")
      }

      themeSwitch.addEventListener("change", () => {
        if (themeSwitch.checked) {
          document.body.classList.add("dark-mode")
          localStorage.setItem("darkMode", "true")
        } else {
          document.body.classList.remove("dark-mode")
          localStorage.setItem("darkMode", "false")
        }
      })
    }
  }

  // Function to set up chat functionality
  function setupChat() {
    // Get chat elements
    const userList = document.getElementById("user-list")
    const chatMessages = document.getElementById("chat-messages")
    const messageInput = document.getElementById("message-input")
    const sendButton = document.getElementById("send-message-btn")
    const chatTitle = document.getElementById("chat-title")
    const chatMain = document.querySelector(".chat-main")

    // Function to load users
    const loadUsers = async () => {
      try {
        const response = await fetch("/api/users/online")
        const users = await response.json()

        // Sort users: online first, then alphabetically
        users.sort((a, b) => {
          if (a.isOnline && !b.isOnline) return -1
          if (!a.isOnline && b.isOnline) return 1
          return a.username.localeCompare(b.username)
        })

        userList.innerHTML = ""

        if (users.length === 0) {
          userList.innerHTML = `<div class="no-users">No users found</div>`
          return
        }

        // Filter out current user
        const otherUsers = users.filter((user) => user.id !== currentUser.id)

        if (otherUsers.length === 0) {
          userList.innerHTML = `<div class="no-users">No other users available</div>`
          return
        }

        otherUsers.forEach((user) => {
          const userElement = document.createElement("div")
          userElement.className = `user-item ${selectedChatUser && selectedChatUser.id === user.id ? "selected" : ""}`
          userElement.dataset.userId = user.id
          userElement.dataset.username = user.username

          // Get profile picture or placeholder
          const profilePic = user.profilePicture || "/placeholder.svg?height=40&width=40"

          userElement.innerHTML = `
        <div class="user-status ${user.isOnline ? "online" : "offline"}"></div>
        <img src="${profilePic}" alt="${user.username}" class="user-avatar">
        <div class="user-info">
          <span class="user-name">${user.username}</span>
          <span class="user-email">${user.email}</span>
        </div>
      `

          // Add click event to select user for chat
          userElement.addEventListener("click", () => {
            // Remove selected class from all users
            document.querySelectorAll(".user-item").forEach((item) => {
              item.classList.remove("selected")
            })

            // Add selected class to clicked user
            userElement.classList.add("selected")

            // Store selected user
            selectedChatUser = user

            // Show chat main area
            chatMain.classList.add("active")

            // Update chat title with user's profile picture
            chatTitle.innerHTML = `
          <img src="${profilePic}" alt="${user.username}" class="chat-user-avatar">
          <span>Chat with ${user.username}</span>
          <span class="user-status-indicator ${user.isOnline ? "online" : "offline"}"></span>
        `

            // Enable message input and send button
            messageInput.disabled = false
            sendButton.disabled = false
            messageInput.focus()

            // Load chat messages for this user
            loadMessages(user.id)
          })

          userList.appendChild(userElement)
        })
      } catch (error) {
        console.error("Error loading users:", error)
        userList.innerHTML = `<div class="error-message">Failed to load users</div>`
      }
    }

    // Function to load chat messages for a specific user
    const loadMessages = async (receiverId) => {
      try {
        const response = await fetch(`/api/chat/private?userId=${currentUser.id}&receiverId=${receiverId}`)
        const messages = await response.json()

        chatMessages.innerHTML = ""

        if (messages.length === 0) {
          chatMessages.innerHTML = `<div class="no-messages">No messages yet. Start the conversation!</div>`
          return
        }

        messages.forEach((message) => {
          const messageElement = document.createElement("div")
          const isSentByMe = message.senderId === currentUser.id
          messageElement.className = `message-item ${isSentByMe ? "my-message" : ""}`

          const timestamp = new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

          messageElement.innerHTML = `
          <div class="message-bubble">
            <div class="message-header">
              <span class="message-sender">${isSentByMe ? "You" : message.senderName}</span>
              <span class="message-time">${timestamp}</span>
            </div>
            <div class="message-text">${message.message}</div>
          </div>
        `
          chatMessages.appendChild(messageElement)
        })

        // Scroll to the bottom
        chatMessages.scrollTop = chatMessages.scrollHeight
      } catch (error) {
        console.error("Error loading messages:", error)
        chatMessages.innerHTML = `<div class="error-message">Failed to load messages</div>`
      }
    }

    // Function to send a message
    const sendMessage = async () => {
      const message = messageInput.value.trim()
      if (!message || !selectedChatUser) return

      try {
        const response = await fetch("/api/chat/private", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.id,
            username: currentUser.username,
            receiverId: selectedChatUser.id,
            receiverName: selectedChatUser.username,
            message,
          }),
        })

        const data = await response.json()

        if (data.success) {
          // Clear input
          messageInput.value = ""

          // Refresh messages
          await loadMessages(selectedChatUser.id)
        } else {
          console.error("Failed to send message:", data.message)
        }
      } catch (error) {
        console.error("Error sending message:", error)
      }
    }

    // Event listeners
    if (sendButton) {
      sendButton.addEventListener("click", sendMessage)
    }

    if (messageInput) {
      messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault()
          sendMessage()
        }
      })
    }

    // Initial load of users
    loadUsers()

    // If a user was previously selected, load their messages
    if (selectedChatUser) {
      // Show chat main area if user is selected
      chatMain.classList.add("active")
      loadMessages(selectedChatUser.id)
    }

    // Set up refresh intervals
    window.chatRefreshInterval = setInterval(async () => {
      await loadUsers()

      // Only refresh messages if a user is selected
      if (selectedChatUser) {
        await loadMessages(selectedChatUser.id)
      }
    }, 5000) // Refresh every 5 seconds
  }

  // Toast notification function
  function showToast(message, type = "info") {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector(".toast-container")
    if (!toastContainer) {
      toastContainer = document.createElement("div")
      toastContainer.className = "toast-container"
      document.body.appendChild(toastContainer)
    }

    // Create toast
    const toast = document.createElement("div")
    toast.className = `toast ${type}`

    // Add icon based on type
    let icon = "info-circle"
    if (type === "success") icon = "check-circle"
    if (type === "error") icon = "exclamation-circle"
    if (type === "warning") icon = "exclamation-triangle"

    toast.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${message}</span>
  `

    // Add to container
    toastContainer.appendChild(toast)

    // Show toast
    setTimeout(() => {
      toast.classList.add("show")
    }, 10)

    // Remove toast after 3 seconds
    setTimeout(() => {
      toast.classList.remove("show")
      setTimeout(() => {
        toast.remove()
      }, 300)
    }, 3000)
  }

  // Set initial page to home
  updateContentArea("home")

  // Check for dark mode on page load
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode")
  }

  // Handle beforeunload to set offline status
  window.addEventListener("beforeunload", () => {
    updateOnlineStatus(false)

    // Clear intervals
    clearInterval(onlineStatusInterval)
    if (window.chatRefreshInterval) {
      clearInterval(window.chatRefreshInterval)
    }
  })
})

