async function fetchStudents() {
  const container = document.getElementById("student-list");

  try {
    const response = await fetch("./students.json");

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const students = await response.json();
    container.innerHTML = "";

    students.forEach((student) => {
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        <h2>${student.first_name} ${student.last_name}</h2>
        <p><strong>Major:</strong> ${student.major}</p>
        <p><strong>GPA:</strong> ${student.gpa}</p>
        <p><strong>Email:</strong> ${student.email}</p>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    container.innerHTML = `<p class="error">${error.message}</p>`;
  }
}

fetchStudents();

