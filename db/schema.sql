CREATE DATABASE IF NOT EXISTS SCHDB;
USE SCHDB;

-- User
CREATE TABLE IF NOT EXISTS `User` (
  userID INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  isAdmin TINYINT(1) NOT NULL DEFAULT 0
);

-- Course
CREATE TABLE IF NOT EXISTS Course (
  courseID INT AUTO_INCREMENT PRIMARY KEY,
  courseName VARCHAR(100) NOT NULL,
  section VARCHAR(10),
  semester VARCHAR(20),
  startTime VARCHAR(20),
  endTime VARCHAR(20),
  location VARCHAR(100)
);

-- CourseDay
CREATE TABLE IF NOT EXISTS CourseDay (
  courseID INT NOT NULL,
  day VARCHAR(20) NOT NULL,
  PRIMARY KEY (courseID, day),
  FOREIGN KEY (courseID) REFERENCES Course(courseID) ON DELETE CASCADE
);

-- Enrollment
CREATE TABLE IF NOT EXISTS Enrollment (
  enrollmentID INT AUTO_INCREMENT PRIMARY KEY,
  userID INT NOT NULL,
  courseID INT NOT NULL,
  enrollmentDate DATETIME,
  status VARCHAR(20),
  FOREIGN KEY (userID) REFERENCES `User`(userID) ON DELETE CASCADE,
  FOREIGN KEY (courseID) REFERENCES Course(courseID) ON DELETE CASCADE
);

-- Assignment
CREATE TABLE IF NOT EXISTS Assignment (
  assignmentID INT AUTO_INCREMENT PRIMARY KEY,
  courseID INT NOT NULL,
  userID INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  estimatedTime INT,
  priority VARCHAR(20),
  grade VARCHAR(5),
  status VARCHAR(20),
  FOREIGN KEY (courseID) REFERENCES Course(courseID) ON DELETE CASCADE,
  FOREIGN KEY (userID) REFERENCES `User`(userID) ON DELETE CASCADE
);

-- TimeLog
CREATE TABLE IF NOT EXISTS TimeLog (
  logID INT AUTO_INCREMENT PRIMARY KEY,
  userID INT NOT NULL,
  assignmentID INT NOT NULL,
  startTime DATETIME,
  endTime DATETIME,
  FOREIGN KEY (userID) REFERENCES `User`(userID) ON DELETE CASCADE,
  FOREIGN KEY (assignmentID) REFERENCES Assignment(assignmentID) ON DELETE CASCADE
);

-- Notification
CREATE TABLE IF NOT EXISTS Notification (
  notificationID INT AUTO_INCREMENT PRIMARY KEY,
  userID INT NOT NULL,
  message TEXT,
  type VARCHAR(50),
  sendTime DATETIME,
  readStatus VARCHAR(20),
  FOREIGN KEY (userID) REFERENCES `User`(userID) ON DELETE CASCADE
);

-- Organization
CREATE TABLE IF NOT EXISTS Organization (
  organizationID INT AUTO_INCREMENT PRIMARY KEY,
  organizationName VARCHAR(100) NOT NULL,
  description TEXT
);

-- OrganizationMembership
CREATE TABLE IF NOT EXISTS OrganizationMembership (
  membershipID INT AUTO_INCREMENT PRIMARY KEY,
  userID INT NOT NULL,
  organizationID INT NOT NULL,
  role VARCHAR(50),
  FOREIGN KEY (userID) REFERENCES `User`(userID) ON DELETE CASCADE,
  FOREIGN KEY (organizationID) REFERENCES Organization(organizationID) ON DELETE CASCADE
);

-- Event
CREATE TABLE IF NOT EXISTS Event (
  eventID INT AUTO_INCREMENT PRIMARY KEY,
  userID INT NOT NULL,
  organizationID INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  startTime DATETIME,
  endTime DATETIME,
  location VARCHAR(200),
  isRecurring VARCHAR(5),
  FOREIGN KEY (userID) REFERENCES `User`(userID) ON DELETE CASCADE,
  FOREIGN KEY (organizationID) REFERENCES Organization(organizationID) ON DELETE CASCADE
);

-- EventDay
CREATE TABLE IF NOT EXISTS EventDay (
  eventID INT NOT NULL,
  day VARCHAR(20) NOT NULL,
  PRIMARY KEY (eventID, day),
  FOREIGN KEY (eventID) REFERENCES Event(eventID) ON DELETE CASCADE
);