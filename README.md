# TaskMint 🌿

TaskMint is a modern task management application that combines productivity with Gmail integration, offering a seamless way to manage tasks and email workflows.

## 🚀 Features

- **Task Management**: Create, organize, and track tasks efficiently
- **Gmail Integration**: View and manage emails directly within the application
- **Analytics Dashboard**: Get insights into your task completion and productivity
- **User Authentication**: Secure login and signup functionality
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## 🛠️ Tech Stack

### Frontend
- React.js with Vite
- Tailwind CSS for styling
- Axios for API requests
- Real-time analytics visualization
- Gmail API integration

### Backend
- Node.js & Express.js
- MongoDB for database
- JWT authentication
- RESTful API architecture
- Middleware for authentication and request handling

## 📦 Project Structure

```
TaskMint/
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utility functions
│   │   └── assets/        # Static assets
│   └── public/            # Public assets
│
└── backend/               # Node.js backend server
    ├── controllers/       # Request handlers
    ├── models/           # Database models
    ├── routes/           # API routes
    ├── middlewares/      # Custom middlewares
    └── utils/            # Helper functions
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB installed and running
- Gmail API credentials (for email integration)

### Installation

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`

3. **Backend Setup**
   ```bash
   cd backend
   npm install
   npm start
   ```
   The backend server will run on `http://localhost:3000`

## 🔑 Environment Variables

### Frontend (.env)
```
VITE_API=http://localhost:3000/api
VITE_GMAIL_CLIENT_ID=your_gmail_client_id
```

### Backend (.env)
```
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

## 📱 Key Features Breakdown

### Task Management
- Create and organize tasks
- Set priorities and deadlines
- Track task progress
- Add task descriptions and attachments

### Gmail Integration
- View Gmail inbox
- Read and manage emails
- Convert emails to tasks
- Email notifications for task updates

### Analytics
- Task completion metrics
- Productivity trends
- Time tracking analytics
- Custom reports

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Your Name - *Initial work* - [YourGithub](https://github.com/yourusername)

## 🙏 Acknowledgments

- Thanks to all contributors who have helped shape TaskMint
- Special thanks to the open source community