# 🚀 TaskFlow

**TaskFlow** is a full-stack, aesthetically-driven task management web application designed as an all-in-one productivity workspace — inspired by tools like Trello and Jira, but with a modern, custom-built UI and smooth user experience.

---

## ✨ Features

### 🔐 Authentication & User Management

* Secure signup/login using JWT
* Password hashing with bcrypt
* User profile management

### 📁 Project Management

* Create and manage custom projects
* Color-coded project identification
* Automatic progress tracking
* Cascading delete support

### ✅ Task Management

* Tasks with title, description, due date, priority
* Kanban Board (Drag & Drop)
* List View option
* Filtering & Search functionality

### 🧠 Smart Features

* Overdue task detection
* Activity logging system
* Task comments & collaboration

### 📊 Dashboard & Analytics

* Task summaries & insights
* Progress bars & statistics
* Export reports as CSV

### 🛠️ Developer Feature

* Built-in SQL Database Viewer (Log Page)

---

## 🛠️ Tech Stack

### Frontend

* React.js (Vite)
* CSS-in-JS (custom styling)
* Glassmorphism UI & animations

### Backend

* Node.js
* Express.js

### Database

* MySQL (mysql2)

### Security

* JWT Authentication
* bcryptjs Password Hashing

---

## 🎨 UI Highlights

* 🌙 Dark Mode (default)
* ✨ Glassmorphism design
* 🎬 Smooth animations (fade, slide, pulse)
* 🎯 Color-coded priorities & statuses
* 🔤 Fonts: Space Grotesk & DM Sans

---

## 📂 Project Structure

```
TaskFlow/
│
├── client/        # React frontend
├── server/        # Node.js backend
├── database/      # SQL schema
├── README.md
└── package.json
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```
git clone https://github.com/your-username/TaskFlow.git
cd TaskFlow
```

### 2️⃣ Setup Backend

```
cd server
npm install
```

Create `.env` file:

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=taskflow
JWT_SECRET=your_secret_key
```

Run server:

```
npm start
```

---

### 3️⃣ Setup Frontend

```
cd client
npm install
npm run dev
```

---

## 🗄️ Database Setup

Import the schema:

```
database/schema.sql
```

---

## 🚀 Future Improvements

* Real-time collaboration (WebSockets)
* Notifications system
* Mobile responsive enhancements
* Role-based access control

---

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first.

---

## 📜 License

MIT License

---

## 👨‍💻 Author

Developed by **Geerthan**

---

⭐ If you like this project, give it a star!
