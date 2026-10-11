/**
 * StudentHub - Application Logic
 * Pure vanilla JavaScript with safe DOM rendering and no build steps.
 */

(() => {
  "use strict";

  // Application State
  const state = {
    students: [],
    courses: [],
    semesters: [],
    stats: {
      totalStudents: 0,
      totalCourses: 0,
      recentlyAdded: 0,
      addedToday: 0
    },
    filterCourse: "All",
    searchQuery: "",
    sortBy: "id_asc",
    activeStudentForDelete: null,
    activeStudentForView: null,
    isSubmitting: false
  };

  // DOM Elements Cache
  const elements = {
    // Stats
    statTotalStudents: document.getElementById("statTotalStudents"),
    statTotalCourses: document.getElementById("statTotalCourses"),
    statRecentlyAdded: document.getElementById("statRecentlyAdded"),
    statAddedToday: document.getElementById("statAddedToday"),

    // Table & Filters
    searchInput: document.getElementById("searchInput"),
    courseFilterSelect: document.getElementById("courseFilterSelect"),
    sortBySelect: document.getElementById("sortBySelect"),
    clearFilterBtn: document.getElementById("clearFilterBtn"),
    refreshTableBtn: document.getElementById("refreshTableBtn"),
    resultsCountBadge: document.getElementById("resultsCountBadge"),
    studentsTable: document.getElementById("studentsTable"),
    studentsTableBody: document.getElementById("studentsTableBody"),
    tableStateContainer: document.getElementById("tableStateContainer"),
    stateIcon: document.getElementById("stateIcon"),
    stateTitle: document.getElementById("stateTitle"),
    stateDesc: document.getElementById("stateDesc"),
    stateActionWrap: document.getElementById("stateActionWrap"),

    // Add / Edit Modal & Form
    studentFormModalEl: document.getElementById("studentFormModal"),
    studentModalTitle: document.getElementById("studentModalTitle"),
    studentForm: document.getElementById("studentForm"),
    studentFormId: document.getElementById("studentFormId"),
    studentNameInput: document.getElementById("studentNameInput"),
    studentEmailInput: document.getElementById("studentEmailInput"),
    studentCourseSelect: document.getElementById("studentCourseSelect"),
    studentSemesterSelect: document.getElementById("studentSemesterSelect"),
    studentDateInput: document.getElementById("studentDateInput"),
    formErrorAlert: document.getElementById("formErrorAlert"),
    saveStudentSubmitBtn: document.getElementById("saveStudentSubmitBtn"),
    saveBtnSpinner: document.getElementById("saveBtnSpinner"),
    saveBtnText: document.getElementById("saveBtnText"),
    openAddStudentModalBtn: document.getElementById("openAddStudentModalBtn"),

    // View Modal
    viewStudentModalEl: document.getElementById("viewStudentModal"),
    viewStudentId: document.getElementById("viewStudentId"),
    viewStudentName: document.getElementById("viewStudentName"),
    viewStudentEmail: document.getElementById("viewStudentEmail"),
    viewStudentCourse: document.getElementById("viewStudentCourse"),
    viewStudentSemester: document.getElementById("viewStudentSemester"),
    viewStudentEnrollment: document.getElementById("viewStudentEnrollment"),
    viewStudentCreatedAt: document.getElementById("viewStudentCreatedAt"),
    viewEditStudentBtn: document.getElementById("viewEditStudentBtn"),

    // Delete Modal
    deleteConfirmModalEl: document.getElementById("deleteConfirmModal"),
    deleteConfirmStudentName: document.getElementById("deleteConfirmStudentName"),
    deleteConfirmStudentID: document.getElementById("deleteConfirmStudentID"),
    deleteConfirmStudentEmail: document.getElementById("deleteConfirmStudentEmail"),
    confirmDeleteSubmitBtn: document.getElementById("confirmDeleteSubmitBtn"),
    deleteBtnSpinner: document.getElementById("deleteBtnSpinner"),
    deleteBtnText: document.getElementById("deleteBtnText"),

    // Sidebar & Navigation
    appSidebar: document.getElementById("appSidebar"),
    sidebarToggleBtn: document.getElementById("sidebarToggleBtn"),
    sidebarBackdrop: document.getElementById("sidebarBackdrop"),
    navDashboard: document.getElementById("navDashboard"),
    navStudents: document.getElementById("navStudents"),
    toastContainer: document.getElementById("toastContainer")
  };

  // Bootstrap Modal Instances (with fallback if CDN fails)
  let studentFormModalInstance = null;
  let viewStudentModalInstance = null;
  let deleteConfirmModalInstance = null;

  function initBootstrapModals() {
    if (typeof bootstrap !== "undefined" && bootstrap.Modal) {
      studentFormModalInstance = new bootstrap.Modal(elements.studentFormModalEl);
      viewStudentModalInstance = new bootstrap.Modal(elements.viewStudentModalEl);
      deleteConfirmModalInstance = new bootstrap.Modal(elements.deleteConfirmModalEl);
    }
  }

  function showModal(instance, el) {
    if (instance) {
      instance.show();
    } else if (el) {
      el.classList.add("show");
      el.style.display = "block";
    }
  }

  function hideModal(instance, el) {
    if (instance) {
      instance.hide();
    } else if (el) {
      el.classList.remove("show");
      el.style.display = "none";
    }
  }

  // -------------------------------------------------------------------------
  // Notifications & Alerts
  // -------------------------------------------------------------------------
  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `admin-toast ${type === "error" ? "toast-error" : type === "success" ? "toast-success" : ""}`;

    const iconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    iconSvg.setAttribute("width", "16");
    iconSvg.setAttribute("height", "16");
    iconSvg.setAttribute("viewBox", "0 0 24 24");
    iconSvg.setAttribute("fill", "none");
    iconSvg.setAttribute("stroke", "currentColor");
    iconSvg.setAttribute("stroke-width", "2");

    if (type === "success") {
      const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      polyline.setAttribute("points", "20 6 9 17 4 12");
      iconSvg.appendChild(polyline);
    } else if (type === "error") {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", "12");
      circle.setAttribute("cy", "12");
      circle.setAttribute("r", "10");
      const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line1.setAttribute("x1", "12");
      line1.setAttribute("y1", "8");
      line1.setAttribute("x2", "12");
      line1.setAttribute("y2", "12");
      const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line2.setAttribute("x1", "12");
      line2.setAttribute("y1", "16");
      line2.setAttribute("x2", "12.01");
      line2.setAttribute("y2", "16");
      iconSvg.appendChild(circle);
      iconSvg.appendChild(line1);
      iconSvg.appendChild(line2);
    } else {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", "12");
      circle.setAttribute("cy", "12");
      circle.setAttribute("r", "10");
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", "12");
      line.setAttribute("y1", "16");
      line.setAttribute("x2", "12");
      line.setAttribute("y2", "12");
      iconSvg.appendChild(circle);
      iconSvg.appendChild(line);
    }

    const textSpan = document.createElement("span");
    textSpan.textContent = message;

    toast.appendChild(iconSvg);
    toast.appendChild(textSpan);
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // -------------------------------------------------------------------------
  // Data Fetching (Relative URLs)
  // -------------------------------------------------------------------------
  async function fetchConfig() {
    try {
      const res = await fetch("/api/config");
      if (!res.ok) throw new Error("Could not load system options.");
      const data = await res.json();
      state.courses = data.courses || [];
      state.semesters = data.semesters || [];
      populateDropdownOptions();
    } catch (err) {
      console.error("Config fetch error:", err);
    }
  }

  async function fetchStats() {
    try {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("Could not fetch metrics.");
      const data = await res.json();
      state.stats = data;
      renderStats();
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  }

  async function fetchStudents() {
    try {
      showLoadingState();
      const res = await fetch("/api/students");
      if (!res.ok) throw new Error("Could not load student records.");
      const data = await res.json();
      state.students = data;
      renderTable();
      await fetchStats();
    } catch (err) {
      console.error("Students fetch error:", err);
      showErrorState("Unable to load student records", "Please check your network connection or ensure the server is running.");
    }
  }

  // -------------------------------------------------------------------------
  // UI Rendering & Safe DOM Manipulation
  // -------------------------------------------------------------------------
  function populateDropdownOptions() {
    // Populate Course Filter in toolbar
    elements.courseFilterSelect.innerHTML = "";
    const allOption = document.createElement("option");
    allOption.value = "All";
    allOption.textContent = "All Courses";
    elements.courseFilterSelect.appendChild(allOption);

    state.courses.forEach(course => {
      const opt = document.createElement("option");
      opt.value = course;
      opt.textContent = course;
      elements.courseFilterSelect.appendChild(opt);
    });

    // Populate Modal Form Course Select
    elements.studentCourseSelect.innerHTML = "";
    const placeholderCourse = document.createElement("option");
    placeholderCourse.value = "";
    placeholderCourse.textContent = "Select a course...";
    elements.studentCourseSelect.appendChild(placeholderCourse);

    state.courses.forEach(course => {
      const opt = document.createElement("option");
      opt.value = course;
      opt.textContent = course;
      elements.studentCourseSelect.appendChild(opt);
    });

    // Populate Modal Form Semester Select
    elements.studentSemesterSelect.innerHTML = "";
    const placeholderSem = document.createElement("option");
    placeholderSem.value = "";
    placeholderSem.textContent = "Select year / semester...";
    elements.studentSemesterSelect.appendChild(placeholderSem);

    state.semesters.forEach(sem => {
      const opt = document.createElement("option");
      opt.value = sem;
      opt.textContent = sem;
      elements.studentSemesterSelect.appendChild(opt);
    });
  }

  function renderStats() {
    elements.statTotalStudents.textContent = String(state.stats.totalStudents);
    elements.statTotalCourses.textContent = String(state.stats.totalCourses);
    elements.statRecentlyAdded.textContent = String(state.stats.recentlyAdded);
    elements.statAddedToday.textContent = String(state.stats.addedToday);
  }

  function filterAndSortStudents() {
    let list = [...state.students];

    // Filter by Search Query
    if (state.searchQuery.trim() !== "") {
      const q = state.searchQuery.trim().toLowerCase();
      list = list.filter(s =>
        String(s.id).toLowerCase().includes(q) ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.course && s.course.toLowerCase().includes(q))
      );
    }

    // Filter by Course
    if (state.filterCourse !== "All") {
      list = list.filter(s => s.course === state.filterCourse);
    }

    // Sort
    const [field, order] = state.sortBy.split("_");
    const isAsc = order === "asc";

    list.sort((a, b) => {
      if (field === "id") {
        return isAsc ? a.id - b.id : b.id - a.id;
      }
      if (field === "name") {
        return isAsc
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      if (field === "date") {
        const dateA = new Date(a.enrollmentDate).getTime();
        const dateB = new Date(b.enrollmentDate).getTime();
        return isAsc ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });

    return list;
  }

  function renderTable() {
    const filteredList = filterAndSortStudents();
    const totalCount = state.students.length;
    const matchCount = filteredList.length;

    // Clear previous rows
    elements.studentsTableBody.innerHTML = "";

    // Result count badge
    if (totalCount === 0) {
      elements.resultsCountBadge.textContent = "0 students registered";
    } else if (matchCount === totalCount) {
      elements.resultsCountBadge.textContent = `Showing all ${totalCount} students`;
    } else {
      elements.resultsCountBadge.textContent = `Showing ${matchCount} of ${totalCount} students`;
    }

    // Handle Empty States
    if (totalCount === 0) {
      elements.studentsTable.classList.add("d-none");
      elements.tableStateContainer.classList.remove("d-none");
      showEmptySystemState();
      return;
    }

    if (matchCount === 0) {
      elements.studentsTable.classList.add("d-none");
      elements.tableStateContainer.classList.remove("d-none");
      showEmptyFilterState();
      return;
    }

    // Records exist and match: render table rows securely
    elements.studentsTable.classList.remove("d-none");
    elements.tableStateContainer.classList.add("d-none");

    const fragment = document.createDocumentFragment();

    filteredList.forEach(student => {
      const tr = document.createElement("tr");

      // Column 1: ID
      const tdId = document.createElement("td");
      const idBadge = document.createElement("span");
      idBadge.className = "student-id-badge";
      idBadge.textContent = `#${student.id}`;
      tdId.appendChild(idBadge);
      tr.appendChild(tdId);

      // Column 2: Name
      const tdName = document.createElement("td");
      tdName.className = "student-name-cell";
      tdName.textContent = student.name;
      tr.appendChild(tdName);

      // Column 3: Email
      const tdEmail = document.createElement("td");
      tdEmail.textContent = student.email;
      tr.appendChild(tdEmail);

      // Column 4: Course
      const tdCourse = document.createElement("td");
      const coursePill = document.createElement("span");
      coursePill.className = "course-pill";
      coursePill.textContent = student.course;
      tdCourse.appendChild(coursePill);
      tr.appendChild(tdCourse);

      // Column 5: Year / Semester
      const tdSemester = document.createElement("td");
      tdSemester.textContent = student.semester;
      tr.appendChild(tdSemester);

      // Column 6: Enrollment Date
      const tdDate = document.createElement("td");
      tdDate.textContent = student.enrollmentDate;
      tr.appendChild(tdDate);

      // Column 7: Actions
      const tdActions = document.createElement("td");
      tdActions.style.textAlign = "right";

      const actionsWrap = document.createElement("div");
      actionsWrap.className = "table-actions";
      actionsWrap.style.justifyContent = "flex-end";

      // View Button
      const viewBtn = document.createElement("button");
      viewBtn.type = "button";
      viewBtn.className = "btn-action btn-action-view";
      viewBtn.title = "View student profile";
      viewBtn.setAttribute("aria-label", `View details for ${student.name}`);
      viewBtn.textContent = "View";
      viewBtn.dataset.action = "view";
      viewBtn.dataset.id = String(student.id);

      // Edit Button
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn-action";
      editBtn.title = "Edit student details";
      editBtn.setAttribute("aria-label", `Edit ${student.name}`);
      editBtn.textContent = "Edit";
      editBtn.dataset.action = "edit";
      editBtn.dataset.id = String(student.id);

      // Delete Button
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn-action btn-action-delete";
      deleteBtn.title = "Delete student record";
      deleteBtn.setAttribute("aria-label", `Delete ${student.name}`);
      deleteBtn.textContent = "Delete";
      deleteBtn.dataset.action = "delete";
      deleteBtn.dataset.id = String(student.id);

      actionsWrap.appendChild(viewBtn);
      actionsWrap.appendChild(editBtn);
      actionsWrap.appendChild(deleteBtn);
      tdActions.appendChild(actionsWrap);
      tr.appendChild(tdActions);

      fragment.appendChild(tr);
    });

    elements.studentsTableBody.appendChild(fragment);
  }

  function showLoadingState() {
    elements.resultsCountBadge.textContent = "Fetching records...";
  }

  function showEmptyFilterState() {
    elements.stateIcon.innerHTML = `
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        <line x1="8" y1="11" x2="14" y2="11"></line>
      </svg>`;
    elements.stateTitle.textContent = "No matching students found";
    elements.stateDesc.textContent = "No student records match the active search query or filter selection.";
    elements.stateActionWrap.innerHTML = "";

    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "btn-secondary-admin";
    resetBtn.textContent = "Clear Search & Filters";
    resetBtn.addEventListener("click", resetFilters);
    elements.stateActionWrap.appendChild(resetBtn);
  }

  function showEmptySystemState() {
    elements.stateIcon.innerHTML = `
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
      </svg>`;
    elements.stateTitle.textContent = "No students enrolled";
    elements.stateDesc.textContent = "There are currently no student records in the administration database.";
    elements.stateActionWrap.innerHTML = "";

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn-primary-admin";
    addBtn.textContent = "Add First Student";
    addBtn.addEventListener("click", openAddModal);
    elements.stateActionWrap.appendChild(addBtn);
  }

  function showErrorState(title, message) {
    elements.studentsTable.classList.add("d-none");
    elements.tableStateContainer.classList.remove("d-none");
    elements.stateIcon.innerHTML = `
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>`;
    elements.stateTitle.textContent = title;
    elements.stateDesc.textContent = message;
    elements.stateActionWrap.innerHTML = "";

    const retryBtn = document.createElement("button");
    retryBtn.type = "button";
    retryBtn.className = "btn-secondary-admin";
    retryBtn.textContent = "Retry Connection";
    retryBtn.addEventListener("click", () => fetchStudents());
    elements.stateActionWrap.appendChild(retryBtn);
  }

  function resetFilters() {
    state.searchQuery = "";
    state.filterCourse = "All";
    state.sortBy = "id_asc";

    elements.searchInput.value = "";
    elements.courseFilterSelect.value = "All";
    elements.sortBySelect.value = "id_asc";

    renderTable();
  }

  // -------------------------------------------------------------------------
  // Modal Actions: Add & Edit
  // -------------------------------------------------------------------------
  function openAddModal() {
    elements.studentModalTitle.textContent = "Add New Student";
    elements.studentFormId.value = "";
    elements.studentForm.reset();
    elements.formErrorAlert.classList.add("d-none");
    elements.formErrorAlert.textContent = "";

    // Set today's date as default
    const today = new Date().toISOString().split("T")[0];
    elements.studentDateInput.value = today;

    elements.saveBtnText.textContent = "Save Student";
    clearValidationStyles();
    showModal(studentFormModalInstance, elements.studentFormModalEl);
    setTimeout(() => elements.studentNameInput.focus(), 150);
  }

  function openEditModal(student) {
    elements.studentModalTitle.textContent = "Edit Student Record";
    elements.studentFormId.value = String(student.id);
    elements.studentNameInput.value = student.name;
    elements.studentEmailInput.value = student.email;
    elements.studentCourseSelect.value = student.course;
    elements.studentSemesterSelect.value = student.semester;
    elements.studentDateInput.value = student.enrollmentDate;

    elements.formErrorAlert.classList.add("d-none");
    elements.formErrorAlert.textContent = "";
    elements.saveBtnText.textContent = "Update Student";

    clearValidationStyles();
    showModal(studentFormModalInstance, elements.studentFormModalEl);
    setTimeout(() => elements.studentNameInput.focus(), 150);
  }

  function openViewModal(student) {
    state.activeStudentForView = student;
    elements.viewStudentId.textContent = `#${student.id}`;
    elements.viewStudentName.textContent = student.name;
    elements.viewStudentEmail.textContent = student.email;
    elements.viewStudentCourse.textContent = student.course;
    elements.viewStudentSemester.textContent = student.semester;
    elements.viewStudentEnrollment.textContent = student.enrollmentDate;

    if (student.createdAt) {
      const dateObj = new Date(student.createdAt);
      elements.viewStudentCreatedAt.textContent = dateObj.toLocaleString();
    } else {
      elements.viewStudentCreatedAt.textContent = "N/A";
    }

    showModal(viewStudentModalInstance, elements.viewStudentModalEl);
  }

  function openDeleteModal(student) {
    state.activeStudentForDelete = student;
    elements.deleteConfirmStudentName.textContent = student.name;
    elements.deleteConfirmStudentID.textContent = `#${student.id}`;
    elements.deleteConfirmStudentEmail.textContent = student.email;
    showModal(deleteConfirmModalInstance, elements.deleteConfirmModalEl);
  }

  function clearValidationStyles() {
    [
      elements.studentNameInput,
      elements.studentEmailInput,
      elements.studentCourseSelect,
      elements.studentSemesterSelect,
      elements.studentDateInput
    ].forEach(input => input.classList.remove("is-invalid"));
  }

  // -------------------------------------------------------------------------
  // Form Submission Handling
  // -------------------------------------------------------------------------
  async function handleStudentFormSubmit(e) {
    e.preventDefault();
    if (state.isSubmitting) return;

    clearValidationStyles();
    elements.formErrorAlert.classList.add("d-none");

    const id = elements.studentFormId.value;
    const name = elements.studentNameInput.value.trim();
    const email = elements.studentEmailInput.value.trim();
    const course = elements.studentCourseSelect.value;
    const semester = elements.studentSemesterSelect.value;
    const enrollmentDate = elements.studentDateInput.value;

    let hasValidationError = false;

    if (!name) {
      elements.studentNameInput.classList.add("is-invalid");
      hasValidationError = true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      elements.studentEmailInput.classList.add("is-invalid");
      hasValidationError = true;
    }

    if (!course) {
      elements.studentCourseSelect.classList.add("is-invalid");
      hasValidationError = true;
    }

    if (!semester) {
      elements.studentSemesterSelect.classList.add("is-invalid");
      hasValidationError = true;
    }

    if (!enrollmentDate) {
      elements.studentDateInput.classList.add("is-invalid");
      hasValidationError = true;
    }

    if (hasValidationError) {
      return;
    }

    const payload = { name, email, course, semester, enrollmentDate };

    // Set UI to loading state to prevent double submission
    setSubmitLoading(true);

    try {
      const isEdit = Boolean(id);
      const url = isEdit ? `/api/students/${id}` : "/api/students";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "An error occurred while saving the student record.");
      }

      hideModal(studentFormModalInstance, elements.studentFormModalEl);
      showToast(isEdit ? "Student details updated successfully." : "Student registered successfully.", "success");

      // Refresh list and statistics
      await fetchStudents();
    } catch (err) {
      elements.formErrorAlert.textContent = err.message;
      elements.formErrorAlert.classList.remove("d-none");
    } finally {
      setSubmitLoading(false);
    }
  }

  function setSubmitLoading(loading) {
    state.isSubmitting = loading;
    elements.saveStudentSubmitBtn.disabled = loading;
    if (loading) {
      elements.saveBtnSpinner.classList.remove("d-none");
      elements.saveBtnText.textContent = "Processing...";
    } else {
      elements.saveBtnSpinner.classList.add("d-none");
      elements.saveBtnText.textContent = elements.studentFormId.value ? "Update Student" : "Save Student";
    }
  }

  async function handleConfirmDelete() {
    if (!state.activeStudentForDelete || state.isSubmitting) return;

    const student = state.activeStudentForDelete;
    state.isSubmitting = true;
    elements.confirmDeleteSubmitBtn.disabled = true;
    elements.deleteBtnSpinner.classList.remove("d-none");
    elements.deleteBtnText.textContent = "Deleting...";

    try {
      const res = await fetch(`/api/students/${student.id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete student record.");
      }

      hideModal(deleteConfirmModalInstance, elements.deleteConfirmModalEl);
      showToast(`Student #${student.id} (${student.name}) deleted successfully.`, "success");
      state.activeStudentForDelete = null;

      await fetchStudents();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      state.isSubmitting = false;
      elements.confirmDeleteSubmitBtn.disabled = false;
      elements.deleteBtnSpinner.classList.add("d-none");
      elements.deleteBtnText.textContent = "Delete Student";
    }
  }

  // -------------------------------------------------------------------------
  // Event Delegation & Setup
  // -------------------------------------------------------------------------
  function setupEventListeners() {
    // Open Add Modal
    elements.openAddStudentModalBtn.addEventListener("click", openAddModal);

    // Form Submit
    elements.studentForm.addEventListener("submit", handleStudentFormSubmit);

    // Confirm Delete Click
    elements.confirmDeleteSubmitBtn.addEventListener("click", handleConfirmDelete);

    // View Modal Edit button
    elements.viewEditStudentBtn.addEventListener("click", () => {
      if (state.activeStudentForView) {
        hideModal(viewStudentModalInstance, elements.viewStudentModalEl);
        openEditModal(state.activeStudentForView);
      }
    });

    // Table Actions Event Delegation (View, Edit, Delete)
    elements.studentsTableBody.addEventListener("click", (e) => {
      const button = e.target.closest("button[data-action]");
      if (!button) return;

      const action = button.dataset.action;
      const id = Number(button.dataset.id);
      const student = state.students.find(s => s.id === id);

      if (!student) {
        showToast("Student record not found.", "error");
        return;
      }

      if (action === "view") {
        openViewModal(student);
      } else if (action === "edit") {
        openEditModal(student);
      } else if (action === "delete") {
        openDeleteModal(student);
      }
    });

    // Search Input (debounced / on input)
    elements.searchInput.addEventListener("input", (e) => {
      state.searchQuery = e.target.value;
      renderTable();
    });

    // Course Filter
    elements.courseFilterSelect.addEventListener("change", (e) => {
      state.filterCourse = e.target.value;
      renderTable();
    });

    // Sort Selection
    elements.sortBySelect.addEventListener("change", (e) => {
      state.sortBy = e.target.value;
      renderTable();
    });

    // Clear Filters
    elements.clearFilterBtn.addEventListener("click", resetFilters);

    // Refresh Table
    elements.refreshTableBtn.addEventListener("click", async () => {
      showToast("Refreshing student data...", "info");
      await fetchStudents();
    });

    // Mobile Sidebar Toggle
    if (elements.sidebarToggleBtn) {
      elements.sidebarToggleBtn.addEventListener("click", () => {
        elements.appSidebar.classList.toggle("sidebar-open");
        elements.sidebarBackdrop.classList.toggle("active");
      });
    }

    if (elements.sidebarBackdrop) {
      elements.sidebarBackdrop.addEventListener("click", () => {
        elements.appSidebar.classList.remove("sidebar-open");
        elements.sidebarBackdrop.classList.remove("active");
      });
    }

    // Navigation active link highlights
    const navLinks = [elements.navDashboard, elements.navStudents];
    navLinks.forEach(link => {
      if (!link) return;
      link.addEventListener("click", (e) => {
        navLinks.forEach(l => l && l.classList.remove("active"));
        link.classList.add("active");
        if (elements.appSidebar.classList.contains("sidebar-open")) {
          elements.appSidebar.classList.remove("sidebar-open");
          elements.sidebarBackdrop.classList.remove("active");
        }
      });
    });
  }

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------
  async function init() {
    initBootstrapModals();
    setupEventListeners();
    await fetchConfig();
    await fetchStudents();
  }

  // Run on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
