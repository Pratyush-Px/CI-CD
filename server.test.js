const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert");
const request = require("supertest");
const app = require("./server");

describe("Student Management System API Tests", () => {
  beforeEach(() => {
    // Reset in-memory student data before each test for total test isolation
    app.resetStudents();
  });

  describe("GET /health", () => {
    it("should return HTTP 200 with status UP and uptime", async () => {
      const res = await request(app).get("/health");
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, "UP");
      assert.ok(typeof res.body.uptime === "number");
      assert.ok(typeof res.body.timestamp === "string");
    });
  });

  describe("GET /api/config", () => {
    it("should return supported courses and semesters", async () => {
      const res = await request(app).get("/api/config");
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.courses));
      assert.ok(Array.isArray(res.body.semesters));
      assert.ok(res.body.courses.includes("Computer Science"));
    });
  });

  describe("GET /api/stats", () => {
    it("should return calculated metrics from in-memory data", async () => {
      const res = await request(app).get("/api/stats");
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.totalStudents, 6);
      assert.strictEqual(res.body.totalCourses, 6);
      assert.ok(typeof res.body.recentlyAdded === "number");
      assert.ok(typeof res.body.addedToday === "number");
    });
  });

  describe("GET /api/students", () => {
    it("should return all student records", async () => {
      const res = await request(app).get("/api/students");
      assert.strictEqual(res.status, 200);
      assert.strictEqual(Array.isArray(res.body), true);
      assert.strictEqual(res.body.length, 6);
      assert.strictEqual(res.body[0].name, "Aarav Sharma");
    });

    it("should filter students by search term", async () => {
      const res = await request(app).get("/api/students?search=Priya");
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.length, 1);
      assert.strictEqual(res.body[0].name, "Priya Singh");
    });

    it("should filter students by course", async () => {
      const res = await request(app).get("/api/students?course=Information%20Technology");
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.length, 1);
      assert.strictEqual(res.body[0].course, "Information Technology");
    });

    it("should sort students by name ascending", async () => {
      const res = await request(app).get("/api/students?sortBy=name&order=asc");
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body[0].name, "Aarav Sharma");
      assert.strictEqual(res.body[res.body.length - 1].name, "Siddharth Nair");
    });
  });

  describe("GET /api/students/:id", () => {
    it("should return student details for a valid ID", async () => {
      const res = await request(app).get("/api/students/1");
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.id, 1);
      assert.strictEqual(res.body.name, "Aarav Sharma");
      assert.strictEqual(res.body.email, "aarav.sharma@example.com");
    });

    it("should return 404 for a nonexistent student ID", async () => {
      const res = await request(app).get("/api/students/9999");
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error, "Student not found.");
    });

    it("should return 400 for a malformed non-integer ID", async () => {
      const res = await request(app).get("/api/students/invalid-id");
      assert.strictEqual(res.status, 400);
      assert.ok(res.body.error.includes("Invalid student ID"));
    });

    it("should return 400 for negative or zero ID", async () => {
      const res = await request(app).get("/api/students/-5");
      assert.strictEqual(res.status, 400);
      assert.ok(res.body.error.includes("Invalid student ID"));
    });
  });

  describe("POST /api/students", () => {
    it("should successfully create a new student and return HTTP 201", async () => {
      const newStudent = {
        name: "Vikram Malhotra",
        email: "vikram.m@example.com",
        course: "Computer Science",
        semester: "1st Year (Sem 1)",
        enrollmentDate: "2026-09-01"
      };

      const res = await request(app)
        .post("/api/students")
        .send(newStudent);

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.name, "Vikram Malhotra");
      assert.strictEqual(res.body.email, "vikram.m@example.com");
      assert.strictEqual(res.body.id, 7);
      assert.ok(typeof res.body.createdAt === "string");

      // Verify the student is now in the list
      const listRes = await request(app).get("/api/students");
      assert.strictEqual(listRes.body.length, 7);
    });

    it("should reject creation if name is missing or empty", async () => {
      const res = await request(app)
        .post("/api/students")
        .send({
          name: "   ",
          email: "test@example.com",
          course: "Computer Science",
          semester: "1st Year (Sem 1)",
          enrollmentDate: "2026-09-01"
        });

      assert.strictEqual(res.status, 400);
      assert.ok(res.body.error.includes("Full name is required"));
    });

    it("should reject creation with invalid email format", async () => {
      const res = await request(app)
        .post("/api/students")
        .send({
          name: "Test Student",
          email: "not-an-email",
          course: "Computer Science",
          semester: "1st Year (Sem 1)",
          enrollmentDate: "2026-09-01"
        });

      assert.strictEqual(res.status, 400);
      assert.ok(res.body.error.includes("valid email address"));
    });

    it("should reject creation with duplicate email address (case-insensitive)", async () => {
      const res = await request(app)
        .post("/api/students")
        .send({
          name: "Duplicate User",
          email: "AARAV.sharma@example.com", // Same as ID 1 but different case
          course: "Information Technology",
          semester: "2nd Year (Sem 3)",
          enrollmentDate: "2026-09-01"
        });

      assert.strictEqual(res.status, 400);
      assert.ok(res.body.error.includes("already exists"));
    });

    it("should reject creation with an unsupported course", async () => {
      const res = await request(app)
        .post("/api/students")
        .send({
          name: "Test Student",
          email: "test2@example.com",
          course: "Astrophysics",
          semester: "1st Year (Sem 1)",
          enrollmentDate: "2026-09-01"
        });

      assert.strictEqual(res.status, 400);
      assert.ok(res.body.error.includes("Course is required"));
    });

    it("should reject creation with an unsupported semester/year", async () => {
      const res = await request(app)
        .post("/api/students")
        .send({
          name: "Test Student",
          email: "test3@example.com",
          course: "Computer Science",
          semester: "10th Year",
          enrollmentDate: "2026-09-01"
        });

      assert.strictEqual(res.status, 400);
      assert.ok(res.body.error.includes("Semester/Year is required"));
    });

    it("should reject creation with an invalid enrollment date", async () => {
      const res = await request(app)
        .post("/api/students")
        .send({
          name: "Test Student",
          email: "test4@example.com",
          course: "Computer Science",
          semester: "1st Year (Sem 1)",
          enrollmentDate: "not-a-date"
        });

      assert.strictEqual(res.status, 400);
      assert.ok(res.body.error.includes("valid enrollment date"));
    });
  });

  describe("PUT /api/students/:id", () => {
    it("should update an existing student record", async () => {
      const updateData = {
        name: "Aarav Sharma Updated",
        email: "aarav.sharma@example.com", // Retaining own email is allowed
        course: "Data Science",
        semester: "4th Year (Sem 7)",
        enrollmentDate: "2024-08-15"
      };

      const res = await request(app)
        .put("/api/students/1")
        .send(updateData);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.id, 1);
      assert.strictEqual(res.body.name, "Aarav Sharma Updated");
      assert.strictEqual(res.body.course, "Data Science");
      assert.strictEqual(res.body.semester, "4th Year (Sem 7)");
    });

    it("should reject update if email is taken by another student", async () => {
      const res = await request(app)
        .put("/api/students/1")
        .send({
          name: "Aarav Sharma",
          email: "priya.singh@example.com", // Priya's email (ID 2)
          course: "Computer Science",
          semester: "3rd Year (Sem 5)",
          enrollmentDate: "2024-08-15"
        });

      assert.strictEqual(res.status, 400);
      assert.ok(res.body.error.includes("already exists"));
    });

    it("should return 404 when updating a nonexistent student", async () => {
      const res = await request(app)
        .put("/api/students/999")
        .send({
          name: "Ghost Student",
          email: "ghost@example.com",
          course: "Computer Science",
          semester: "1st Year (Sem 1)",
          enrollmentDate: "2026-09-01"
        });

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error, "Student not found.");
    });

    it("should return 400 for malformed ID on update", async () => {
      const res = await request(app)
        .put("/api/students/abc")
        .send({
          name: "Test",
          email: "test@example.com",
          course: "Computer Science",
          semester: "1st Year (Sem 1)",
          enrollmentDate: "2026-09-01"
        });

      assert.strictEqual(res.status, 400);
      assert.ok(res.body.error.includes("Invalid student ID"));
    });
  });

  describe("DELETE /api/students/:id", () => {
    it("should delete an existing student", async () => {
      const res = await request(app).delete("/api/students/2");
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.message, "Student deleted successfully");
      assert.strictEqual(res.body.id, 2);

      // Verify student 2 is no longer found
      const getRes = await request(app).get("/api/students/2");
      assert.strictEqual(getRes.status, 404);

      // Verify list count decreased to 5
      const listRes = await request(app).get("/api/students");
      assert.strictEqual(listRes.body.length, 5);
    });

    it("should return 404 when deleting a nonexistent student", async () => {
      const res = await request(app).delete("/api/students/999");
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error, "Student not found.");
    });

    it("should return 400 for malformed ID on delete", async () => {
      const res = await request(app).delete("/api/students/abc");
      assert.strictEqual(res.status, 400);
      assert.ok(res.body.error.includes("Invalid student ID"));
    });
  });

  describe("Static File Serving", () => {
    it("should serve index.html with HTTP 200 on GET /", async () => {
      const res = await request(app).get("/");
      assert.strictEqual(res.status, 200);
      assert.ok(res.text.includes("StudentHub"));
      assert.ok(res.text.includes("Enrolled Students"));
    });

    it("should serve style.css on GET /style.css", async () => {
      const res = await request(app).get("/style.css");
      assert.strictEqual(res.status, 200);
      assert.ok(res.text.includes("--sidebar-bg"));
    });

    it("should serve app.js on GET /app.js", async () => {
      const res = await request(app).get("/app.js");
      assert.strictEqual(res.status, 200);
      assert.ok(res.text.includes("fetchStudents"));
    });
  });
});

