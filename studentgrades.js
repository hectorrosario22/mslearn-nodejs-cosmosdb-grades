//@ts-check
var question = require('readline-sync').question;
var cosmos = require('@azure/cosmos');
const config = require('./config.json');

const client = new cosmos.CosmosClient(config.connectionString);
const databaseId = config.database;
const containerId = config.container;
const containerRef = client.database(databaseId).container(containerId);
const containerData = containerRef.items;

function isOk(statucCode) {
  return statucCode >= 200 && statucCode <= 299;
}

async function addStudent(student) {
  const { item, statusCode } = await containerData.create(student).catch();
  isOk(statusCode) && process.stdout.write(`Added student with id: ${item.id}\n`);
}

async function updateStudent(student) {
  const { item, statusCode } = await containerData.upsert(student).catch();
  isOk(statusCode) && process.stdout.write(`Updated student with id: ${item.id}\n`);
}

async function deleteStudent(student) {
  const { item, statusCode } = await containerRef.item(student.id, student.StudentNumber).delete().catch();
  isOk(statusCode) && process.stdout.write(`Deleted student with id: ${item.id}\n`);
}

async function getStudent(id, studentNumber) {
  const { resource, statusCode } = await containerRef.item(id, studentNumber).read().catch();

  if (isOk(statusCode)) {
    process.stdout.write(`Student data: ${resource.StudentNumber}: ${resource.Forename}, ${resource.Lastname}\n`);
    resource.CourseGrades.forEach(function (courseGrade) {
      process.stdout.write(`${courseGrade.Course}:${courseGrade.Grade}\n`);
    });
    return new Student(resource.id, resource.StudentNumber, resource.Forename, resource.Lastname);
  }

  return null;
}

async function queryStudents(courseName) {
  const studentQuery = {
    query: "SELECT s.StudentNumber, s.Forename, s.Lastname, c.Course, c.Grade \
            FROM students s JOIN c IN s.CourseGrades \
            WHERE c.Course = @courseName",
    parameters: [
      {
        name: "@courseName",
        value: courseName
      }
    ]
  };

  const { resources } = await containerData.query(studentQuery).fetchAll();
  for (let queryResult of resources) {
    let resultString = JSON.stringify(queryResult);
    process.stdout.write(`\nQuery returned ${resultString}\n`);
  }
}

class Student {
  constructor(id, studentNumber, forename, lastname) {
    this.id = id;
    this.StudentNumber = studentNumber;
    this.Forename = forename;
    this.Lastname = lastname;
    this.CourseGrades = [];

    this.addGrade = function (courseName, grade) {
      this.CourseGrades.push({
        Course: courseName,
        Grade: grade
      });
    };

    this.toString = function () {
      return `${this.StudentNumber}: ${this.Forename}, ${this.Lastname}\n`;
    };

    this.getGrades = function () {
      let grades = "";

      this.CourseGrades.forEach(function (courseGrade) {
        grades = `${grades}${courseGrade.Course}:${courseGrade.Grade}\n`;
      });

      return grades;
    };
  }
}

function getStudentData() {
  let id = question("Please enter the student's document ID: ");
  let studentNumber = question("Please enter the student's number: ");
  let forename = question("Please enter the student's forename: ");
  let lastname = question("Please enter the student's lastname: ");

  let student = new Student(id, studentNumber, forename, lastname);
  return student;
}

async function test() {
  process.stdout.write("\n\nTesting addStudent and getStudent\n\n");

  // Create a new student
  let student1 = getStudentData();
  await addStudent(student1).then(
    () => getStudent(student1.id, student1.StudentNumber)
  );

  process.stdout.write("\n\n");

  // Create another student
  let student2 = getStudentData();
  await addStudent(student2).then(
    () => getStudent(student2.id, student2.StudentNumber)
  );

  process.stdout.write("\n\n");

  // The first student got an A in Physics and a C in Chemistry
  process.stdout.write("\n\nTesting updateStudent\n\n");
  student1.addGrade("Physics", "A");
  student1.addGrade("Chemistry", "C");
  await updateStudent(student1).then(
    () => getStudent(student1.id, student1.StudentNumber)
  );

  process.stdout.write("\n");

  // The second student got a B in Physics and a D in Mathematics
  student2.addGrade("Physics", "B");
  student2.addGrade("Mathematics", "D");
  await updateStudent(student2).then(
    () => getStudent(student2.id, student2.StudentNumber)
  );

  process.stdout.write("\n\n");

  // Find all students that have taken Physics
  process.stdout.write("\n\nTesting queryStudents\n\n");
  process.stdout.write("Students who have taken Physics\n");
  await queryStudents("Physics");

  // Find all students that have taken Computer Science
  process.stdout.write("\n\nStudents who have taken Computer Science\n");
  await queryStudents("Computer Science");

  // Delete the students created in the first exercise
  process.stdout.write("\n\nTesting deleteStudent\n\n");
  let oldStudent = await getStudent("S101", "101");
  if (oldStudent) {
    await deleteStudent(oldStudent).then(
      () => getStudent(oldStudent.id, oldStudent.StudentNumber)
    );
  }

  process.stdout.write("\n");

  oldStudent = await getStudent("S102", "102");
  if (oldStudent) {
    await deleteStudent(oldStudent).then(
      () => getStudent(oldStudent.id, oldStudent.StudentNumber)
    );
  }

  process.stdout.write("\n\nDone\n");
}

test();