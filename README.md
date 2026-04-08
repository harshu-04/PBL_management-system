
# 🎓 PBL Management System (MERN)

A robust, full-stack management platform designed to digitize the **Project-Based Learning (PBL)** lifecycle. This system moves beyond basic CRUD operations by enforcing strict academic workflows, automated mentor allocation, and semester-based data integrity.

---

## 🚀 Key Features

### 🛡️ Academic Guardrails
* **Sequential Phase Activation:** Enforces a strict order of operations (Synopsis → Development → Final Review). Phases cannot be skipped or reactivated once closed.
* **Phase-Locked Team Formation:** Restricts team creation and joining strictly to Phase 1 to ensure project stability before evaluation begins.
* **Semester-Strict Logic:** Automatically filters subjects and teams based on the student's current semester (e.g., B.Tech CSE Semester 6).

### 👥 Team & Mentor Management
* **Automated Load Balancing:** Intelligently assigns mentors based on their current team count to ensure equitable workload distribution.
* **Multi-Team Context Switching:** A custom React Context-driven dashboard allowing students to seamlessly switch between two concurrent projects.

### 📤 Submission & Grading
* **Cloud-Integrated Uploads:** Secure project synopsis handling using **Cloudinary** for PDF storage with automated file validation.
* **Conditional Resubmission:** Allows students to resubmit work only if the mentor has rejected the previous version (Grade = 0), ensuring a fair "correction-and-feedback" loop.

---

## 🛠️ Tech Stack

* **Frontend:** React.js (Vite), Tailwind CSS, React Router, Axios
* **Backend:** Node.js, Express.js
* **Database:** MongoDB (NoSQL) with Mongoose ODM
* **Security:** JWT (JSON Web Tokens) for RBAC, Bcrypt.js for password hashing
* **Storage:** Cloudinary API for cloud-based file management

---

## 📂 Project Structure

```text
pblpbl/
├── backend/            # Express Server, API Routes, & Logic
│   ├── config/         # Database & Cloudinary configurations
│   ├── controllers/    # Business logic for Teams, Phases, & Grades
│   ├── models/         # Mongoose Schemas (User, Team, Submission)
│   └── middlewares/    # Auth, Role-Check, & Multer (Upload) logic
└── frontend/           # React App (Vite)
    ├── src/
    │   ├── context/    # Global Auth & Team state
    │   ├── pages/      # Role-specific dashboards (Student/Mentor/Admin)
    │   └── components/ # Reusable UI components
```

---

## ⚙️ Local Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/harshu-04/PBL_management-system.git](https://github.com/harshu-04/PBL_management-system.git)
   cd PBL_management-system
   ```

2. **Setup Backend:**
   ```bash
   cd backend
   npm install
   ```
   > **Note:** Create a `.env` file based on `.env.example` and add your `MONGO_URI`, `JWT_SECRET`, and `CLOUDINARY` keys.

3. **Setup Frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

---

## 👤 Author
**Harshita Mehta** *B.Tech CSE Student*

