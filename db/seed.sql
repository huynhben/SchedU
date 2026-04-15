USE SCHDB;

-- Note: Users are seeded separately via backend/seed-users.js

-- Course
INSERT INTO Course (courseName, section, semester, startTime, endTime, location) VALUES
('Intro to Java', '001', 'Fall', '9:30 AM', '10:45 AM', 'Goodwin Hall'),
('Intro to C', '002', 'Fall', '11:00 AM', '12:15 PM', 'Lavery Hall'),
('Intro to Python', '003', 'Spring', '12:30 PM', '1:45 PM', 'McBryde Hall'),
('Intro to SQL', '004', 'Spring', '2:00 PM', '3:15 PM', 'Torgerson Hall'),
('Intro to MATLAB', '005', 'Spring', '3:30 PM', '4:45 PM', 'Classroom Building'),
('Data Structures', '001', 'Fall', '10:00 AM', '11:15 AM', 'McBryde Hall'),
('Web Development', '001', 'Spring', '1:00 PM', '2:15 PM', 'Goodwin Hall'),
('Database Systems', '001', 'Spring', '3:00 PM', '4:15 PM', 'Torgerson Hall');

-- CourseDay
INSERT INTO CourseDay (courseID, day) VALUES
(1, 'Monday'),
(1, 'Wednesday'),
(1, 'Friday'),
(2, 'Tuesday'),
(2, 'Thursday'),
(3, 'Monday'),
(3, 'Wednesday'),
(4, 'Tuesday'),
(4, 'Thursday'),
(5, 'Friday');

-- Enrollment
INSERT INTO Enrollment (userID, courseID, enrollmentDate, status) VALUES
(1, 1, '2026-03-20', 'Enrolled'),
(2, 2, '2026-03-21', 'Enrolled'),
(3, 3, '2026-03-22', 'Enrolled'),
(4, 4, '2026-03-23', 'Enrolled'),
(5, 5, '2026-03-24', 'Enrolled'),
(6, 6, '2026-03-25', 'Enrolled'),
(7, 7, '2026-03-25', 'Enrolled'),
(8, 8, '2026-03-26', 'Enrolled'),
(1, 3, '2026-03-20', 'Enrolled'),
(2, 6, '2026-03-21', 'Dropped');

-- Assignment
INSERT INTO Assignment (courseID, userID, title, description, estimatedTime, priority, grade, status) VALUES
(1, 1, 'Silly Billy Quiz', '5 Question Quiz', 4, 'High', 'A', 'Done'),
(2, 2, 'Homework', 'Answer the questions', 3, 'Medium', 'B', 'Not Started'),
(3, 3, 'Online Quiz', 'RTesting your knowledge', 2, 'Low', 'C', 'In Progress'),
(4, 4, 'Project Proposal', 'Just a Draft', 1, 'High', 'A', 'Done'),
(5, 5, 'CodeWorkout', 'Some Coding practice', 4, 'Medium', 'B', 'Not Started'),
(6, 6, 'Linked List Lab', 'Implement a linked list', 3, 'High', 'A', 'In Progress'),
(7, 7, 'React Portfolio', 'Build a personal site', 5, 'Medium', NULL, 'Not Started'),
(8, 8, 'ER Diagram', 'Design database schema', 2, 'High', 'A', 'Done'),
(3, 1, 'Python Functions HW', 'Write 10 functions', 3, 'Medium', 'B', 'In Progress');

-- TimeLog
INSERT INTO TimeLog (userID, assignmentID, startTime, endTime) VALUES
(1, 1, '2026-03-20 18:00:00', '2026-03-20 19:00:00'),
(2, 3, '2026-03-21 19:00:00', '2026-03-21 20:00:00'),
(3, 4, '2026-03-22 20:00:00', '2026-03-22 21:00:00'),
(4, 5, '2026-03-23 21:00:00', '2026-03-23 22:00:00'),
(5, 6, '2026-03-24 22:00:00', '2026-03-24 23:00:00'),
(6, 7, '2026-03-25 14:00:00', '2026-03-25 16:30:00'),
(7, 8, '2026-03-25 10:00:00', '2026-03-25 12:00:00'),
(1, 1, '2026-03-21 17:00:00', '2026-03-21 18:30:00');

-- Notification
INSERT INTO Notification (userID, message, type, sendTime, readStatus) VALUES
(1, 'Assignment due tomorrow', 'Reminder', '2026-03-20 09:00:00', 'Unread'),
(2, 'Course registration opens soon', 'Alert', '2026-03-20 10:00:00', 'Read'),
(3, 'Organization meeting tonight', 'Event', '2026-03-20 11:00:00', 'Unread'),
(4, 'Assignment graded', 'Update', '2026-03-20 12:00:00', 'Read'),
(5, 'New campus event posted', 'Announcement', '2026-03-20 01:00:00', 'Unread'),
(6, 'Linked List Lab due in 3 days', 'Reminder', '2026-03-25 08:00:00', 'Unread'),
(7, 'Welcome to Web Development', 'Alert', '2026-03-25 09:00:00', 'Read'),
(8, 'ER Diagram graded: A', 'Update', '2026-03-26 14:00:00', 'Unread');

-- Organization
INSERT INTO Organization (organizationName, description) VALUES
('Cassell Guard', 'Basketball Student Section'),
('Game Dev Club', 'Game Dev and Game Jams'),
('Math Club', 'Club for math students'),
('CS Club', 'Club for cs students'),
('CMDA Club', 'Club for cmda Students'),
('ACM Chapter', 'Association for Computing Machinery'),
('Robotics Club', 'Building and programming robots');

-- OrganizationMembership
INSERT INTO OrganizationMembership (userID, organizationID, role) VALUES
(1, 1, 'Member'),
(2, 2, 'Treasurer'),
(3, 3, 'Member'),
(4, 4, 'President'),
(5, 5, 'Member'),
(6, 6, 'President'),
(7, 6, 'Member'),
(8, 7, 'Vice President'),
(1, 4, 'Member'),
(2, 6, 'Secretary');

-- Event
INSERT INTO Event (userID, organizationID, title, description, startTime, endTime, location, isRecurring) VALUES
(1, 1, 'Game Day', 'Basketball game', '2026-03-22 07:00:00', '2026-03-22 08:00:00', 'Cassell Coliseum', 'Yes'),
(2, 2, 'Game Jam', 'Creating games', '2026-03-23 06:00:00', '2026-03-23 07:30:00', 'Goodwin Hall', 'No'),
(3, 3, 'Matrix Night', 'Complex Matrix', '2026-03-24 05:00:00', '2026-03-24 06:30:00', 'McBryde 210', 'Yes'),
(4, 4, 'Hackathon', 'Test Your Hacking Skills', '2026-03-25 04:00:00', '2026-03-25 05:30:00', 'Pamplin 101', 'No'),
(5, 5, 'Office hours', 'Work on Homework together', '2026-03-26 03:00:00', '2026-03-26 04:00:00', 'Torgersen Hall', 'No'),
(6, 6, 'ACM Tech Talk', 'Industry speaker on AI', '2026-03-27 17:00:00', '2026-03-27 18:30:00', 'Goodwin Hall', 'No'),
(7, 7, 'Robot Demo Day', 'Showcase semester projects', '2026-03-28 13:00:00', '2026-03-28 16:00:00', 'Randolph Hall', 'No'),
(8, 4, 'CS Resume Workshop', 'Get resume feedback', '2026-03-29 14:00:00', '2026-03-29 15:30:00', 'Torgerson Hall', 'Yes');

-- EventDay
INSERT INTO EventDay (eventID, day) VALUES
(1, 'Monday'),
(2, 'Tuesday'),
(3, 'Wednesday'),
(4, 'Thursday'),
(5, 'Friday'),
(6, 'Thursday'),
(7, 'Saturday'),
(8, 'Monday'),
(8, 'Wednesday');