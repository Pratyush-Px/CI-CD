const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

//This is a pipeline test comment
const SUPPORTED_COURSES = [
    "Computer Science",
    "Information Technology",
    "Data Science",
    "Electronics Engineering",
    "Mechanical Engineering",
    "Civil Engineering"
];

const SUPPORTED_SEMESTERS = [
    "1st Year (Sem 1)",
    "1st Year (Sem 2)",
    "2nd Year (Sem 3)",
    "2nd Year (Sem 4)",
    "3rd Year (Sem 5)",
    "3rd Year (Sem 6)",
    "4th Year (Sem 7)",
    "4th Year (Sem 8)"
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getSampleStudents() {
    const now = new Date();

    // Helpers to create relative dates for sample data
    const dateDaysAgo = (days) => {
        const d = new Date(now);
        d.setDate(d.getDate() - days);
        return d.toISOString();
    };

    return [
        {
            id: 1,
            name: "Aarav Sharma",
            email: "aarav.sharma@example.com",
            course: "Computer Science",
            semester: "3rd Year (Sem 5)",
            enrollmentDate: "2024-08-15",
            createdAt: now.toISOString()
        },
        {
            id: 2,
            name: "Priya Singh",
            email: "priya.singh@example.com",
            course: "Information Technology",
            semester: "2nd Year (Sem 3)",
            enrollmentDate: "2025-01-10",
            createdAt: now.toISOString()
        },
        {
            id: 3,
            name: "Rohan Verma",
            email: "rohan.verma@example.com",
            course: "Data Science",
            semester: "1st Year (Sem 1)",
            enrollmentDate: "2025-08-20",
            createdAt: dateDaysAgo(2)
        },
        {
            id: 4,
            name: "Ananya Patel",
            email: "ananya.patel@example.com",
            course: "Electronics Engineering",
            semester: "4th Year (Sem 7)",
            enrollmentDate: "2023-08-10",
            createdAt: dateDaysAgo(5)
        },
        {
            id: 5,
            name: "Siddharth Nair",
            email: "siddharth.nair@example.com",
            course: "Mechanical Engineering",
            semester: "2nd Year (Sem 4)",
            enrollmentDate: "2024-01-12",
            createdAt: dateDaysAgo(15)
        },
        {
            id: 6,
            name: "Neha Gupta",
            email: "neha.gupta@example.com",
            course: "Civil Engineering",
            semester: "1st Year (Sem 2)",
            enrollmentDate: "2025-02-01",
            createdAt: dateDaysAgo(25)
        }
    ];
}

let students = getSampleStudents();
let nextId = 7;

function resetStudents(customStudents = null) {
    if (customStudents) {
        students = JSON.parse(JSON.stringify(customStudents));
        const maxId = students.reduce((max, s) => (s.id > max ? s.id : max), 0);
        nextId = maxId + 1;
    } else {
        students = getSampleStudents();
        nextId = 7;
    }
}

// Validation helper
function validateStudentInput(data, currentStudentId = null) {
    const { name, email, course, semester, enrollmentDate } = data;

    if (!name || typeof name !== "string" || name.trim() === "") {
        return "Full name is required and cannot be empty.";
    }

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
        return "A valid email address is required (e.g., student@example.com).";
    }

    const normalizedEmail = email.trim().toLowerCase();
    const duplicate = students.find(
        s => s.email.toLowerCase() === normalizedEmail && s.id !== currentStudentId
    );
    if (duplicate) {
        return "A student with this email address already exists.";
    }

    if (!course || !SUPPORTED_COURSES.includes(course.trim())) {
        return `Course is required and must be one of: ${SUPPORTED_COURSES.join(", ")}.`;
    }

    if (!semester || !SUPPORTED_SEMESTERS.includes(semester.trim())) {
        return `Semester/Year is required and must be one of: ${SUPPORTED_SEMESTERS.join(", ")}.`;
    }

    if (!enrollmentDate || isNaN(Date.parse(enrollmentDate))) {
        return "A valid enrollment date is required (YYYY-MM-DD).";
    }

    return null;
}

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "DOWN",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// System configuration (supported dropdown options)
app.get("/api/config", (req, res) => {
    res.json({
        courses: SUPPORTED_COURSES,
        semesters: SUPPORTED_SEMESTERS
    });
});

// Dashboard statistics
app.get("/api/stats", (req, res) => {
    const now = new Date();
    const todayStr = now.toDateString();
    const sevenDaysAgoTime = now.getTime() - 7 * 24 * 60 * 60 * 1000;

    const totalStudents = students.length;
    const uniqueCourses = new Set(students.map(s => s.course)).size;

    const recentlyAdded = students.filter(s => {
        const createdTime = new Date(s.createdAt).getTime();
        return createdTime >= sevenDaysAgoTime;
    }).length;

    const addedToday = students.filter(s => {
        const createdDate = new Date(s.createdAt).toDateString();
        return createdDate === todayStr;
    }).length;

    res.json({
        totalStudents,
        totalCourses: uniqueCourses,
        recentlyAdded,
        addedToday
    });
});

// Get all students (with optional query filter/search/sort)
app.get("/api/students", (req, res) => {
    let result = [...students];
    const { search, course, sortBy, order } = req.query;

    if (search) {
        const term = search.trim().toLowerCase();
        result = result.filter(s =>
            String(s.id).toLowerCase().includes(term) ||
            s.name.toLowerCase().includes(term) ||
            s.email.toLowerCase().includes(term) ||
            s.course.toLowerCase().includes(term)
        );
    }

    if (course && course !== "All") {
        result = result.filter(s => s.course.toLowerCase() === course.trim().toLowerCase());
    }

    if (sortBy) {
        const sortField = sortBy.trim();
        const sortOrder = (order && order.toLowerCase() === "desc") ? -1 : 1;
        result.sort((a, b) => {
            if (sortField === "id") {
                return (a.id - b.id) * sortOrder;
            }
            if (sortField === "name") {
                return a.name.localeCompare(b.name) * sortOrder;
            }
            if (sortField === "enrollmentDate") {
                return (new Date(a.enrollmentDate) - new Date(b.enrollmentDate)) * sortOrder;
            }
            return 0;
        });
    }

    res.json(result);
});

// Get single student by ID
app.get("/api/students/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid student ID. ID must be a positive integer." });
    }

    const student = students.find(s => s.id === id);
    if (!student) {
        return res.status(404).json({ error: "Student not found." });
    }

    res.json(student);
});

// Add new student
app.post("/api/students", (req, res) => {
    const validationError = validateStudentInput(req.body);
    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    const { name, email, course, semester, enrollmentDate } = req.body;

    const newStudent = {
        id: nextId++,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        course: course.trim(),
        semester: semester.trim(),
        enrollmentDate: enrollmentDate.trim(),
        createdAt: new Date().toISOString()
    };

    students.push(newStudent);
    res.status(201).json(newStudent);
});

// Update student
app.put("/api/students/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid student ID. ID must be a positive integer." });
    }

    const studentIndex = students.findIndex(s => s.id === id);
    if (studentIndex === -1) {
        return res.status(404).json({ error: "Student not found." });
    }

    const validationError = validateStudentInput(req.body, id);
    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    const { name, email, course, semester, enrollmentDate } = req.body;
    const existing = students[studentIndex];

    const updatedStudent = {
        ...existing,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        course: course.trim(),
        semester: semester.trim(),
        enrollmentDate: enrollmentDate.trim()
    };

    students[studentIndex] = updatedStudent;
    res.json(updatedStudent);
});

// Delete student
app.delete("/api/students/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid student ID. ID must be a positive integer." });
    }

    const studentIndex = students.findIndex(s => s.id === id);
    if (studentIndex === -1) {
        return res.status(404).json({ error: "Student not found." });
    }

    students.splice(studentIndex, 1);
    res.json({ message: "Student deleted successfully", id });
});

// Export helper and app for testing
app.resetStudents = resetStudents;
app.SUPPORTED_COURSES = SUPPORTED_COURSES;
app.SUPPORTED_SEMESTERS = SUPPORTED_SEMESTERS;
app.getStudents = () => students;

module.exports = app;

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Student Management System running on http://localhost:${PORT}`);
    });
}
