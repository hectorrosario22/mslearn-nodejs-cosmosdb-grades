//@ts-check
var question = require('readline-sync').question;

class Student {
  constructor(id, studentNumber, forename, lastname) {
    this.id = id;
    this.StudentNumber = studentNumber;
    this.Forename = forename;
    this.Lastname = lastname;
    this.CourseGrades = [];

    this.addGrade = function(courseName, grade) {
      this.CourseGrades.push({
        Course: courseName,
        Grade: grade
      });
    };

    this.toString = function() {
      return `${this.StudentNumber}: ${this.Forename}, ${this.Lastname}\n`;
    };

    this.getGrades = function() {
      let grades = "";
      
      this.CourseGrades.forEach(function(courseGrade) {
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

function test() {
  let student1 = getStudentData();
  student1.addGrade("Computer Science", "A");
  student1.addGrade("Applied Mathematics", "C");

  process.stdout.write(student1.toString());
  process.stdout.write(student1.getGrades());

  let student2 = getStudentData();
  student2.addGrade("Computer Science", "A");

  process.stdout.write(student2.toString());
  process.stdout.write(student2.getGrades());
}

test();