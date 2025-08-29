-- Skill Assessment Database Schema

CREATE DATABASE IF NOT EXISTS skill_assessment;
USE skill_assessment;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Skills table
CREATE TABLE skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions table
CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    skill_id INT NOT NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option ENUM('A', 'B', 'C', 'D') NOT NULL,
    difficulty ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- Quiz attempts table
CREATE TABLE quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    skill_id INT NOT NULL,
    score INT NOT NULL,
    total_questions INT NOT NULL,
    time_taken_seconds INT,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- Quiz answers table (for detailed analysis)
CREATE TABLE quiz_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option ENUM('A', 'B', 'C', 'D'),
    is_correct BOOLEAN NOT NULL,
    time_taken_seconds INT,
    FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_skill_id ON quiz_attempts(skill_id);
CREATE INDEX idx_quiz_answers_attempt_id ON quiz_answers(attempt_id);
CREATE INDEX idx_questions_skill_id ON questions(skill_id);

-- Insert sample data
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@quiz.com', '$2a$10$example.hash.for.admin', 'admin'),
('student', 'student@quiz.com', '$2a$10$example.hash.for.student', 'user');

INSERT INTO skills (name, description) VALUES
('JavaScript', 'JavaScript programming language'),
('CSS', 'Cascading Style Sheets'),
('HTML', 'HyperText Markup Language'),
('React', 'React JavaScript library');

INSERT INTO questions (skill_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty) VALUES
(1, 'What is a closure?', 'A function', 'A variable', 'A scope concept', 'An object', 'C', 'Medium'),
(1, 'Which method adds an element to an array?', 'push()', 'add()', 'insert()', 'append()', 'A', 'Easy'),
(2, 'What does "flex" display do?', 'Creates grid', 'Creates flexbox', 'Hides element', 'Makes inline', 'B', 'Easy'),
(3, 'Which tag creates a hyperlink?', '<link>', '<a>', '<href>', '<url>', 'B', 'Easy');