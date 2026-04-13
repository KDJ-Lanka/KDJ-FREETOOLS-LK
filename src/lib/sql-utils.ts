// sql-utils.ts — sql.js CDN loader, TypeScript types, and sample databases

// ── Minimal TypeScript interfaces for sql.js ─────────────────────────────
export interface SqlDatabase {
  exec(sql: string): { columns: string[]; values: unknown[][] }[];
  run(sql: string): void;
  close(): void;
}

export interface SqlJs {
  Database: new () => SqlDatabase;
}

declare global {
  interface Window {
    initSqlJs: (cfg: {
      locateFile: (file: string) => string;
    }) => Promise<SqlJs>;
  }
}

// ── Singleton loader (CDN, no npm install required) ───────────────────────
let _sqlJs: Promise<SqlJs> | null = null;

export async function getSqlJs(onStatus?: (msg: string) => void): Promise<SqlJs> {
  if (_sqlJs) return _sqlJs;

  _sqlJs = (async () => {
    if (typeof window.initSqlJs === "undefined") {
      onStatus?.("Loading SQL engine…");
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/sql-wasm.js";
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Failed to load SQL engine script."));
        document.head.appendChild(s);
      });
    }
    onStatus?.("Initializing database…");
    return window.initSqlJs({
      locateFile: (f) =>
        `https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/${f}`,
    });
  })();

  return _sqlJs;
}

// ── Sample Databases ──────────────────────────────────────────────────────

export type DbName = "students" | "store" | "library";

export const DB_META: Record<DbName, { label: string; icon: string; description: string }> = {
  students: { label: "Students",  icon: "🎓", description: "Students, courses & enrollment grades" },
  store:    { label: "Store",     icon: "🛒", description: "Products, customers & orders" },
  library:  { label: "Library",   icon: "📚", description: "Books, members & loan history" },
};

export const DB_SEED: Record<DbName, string> = {
// ────────────────────────────────────────────────────────────────────────
students: `
CREATE TABLE students (
  id      INTEGER PRIMARY KEY,
  name    TEXT    NOT NULL,
  age     INTEGER,
  major   TEXT,
  year    INTEGER,
  gpa     REAL
);
CREATE TABLE courses (
  id          INTEGER PRIMARY KEY,
  code        TEXT NOT NULL,
  name        TEXT NOT NULL,
  credits     INTEGER,
  instructor  TEXT,
  department  TEXT
);
CREATE TABLE enrollments (
  id          INTEGER PRIMARY KEY,
  student_id  INTEGER REFERENCES students(id),
  course_id   INTEGER REFERENCES courses(id),
  semester    TEXT,
  score       REAL,
  grade       TEXT
);

INSERT INTO students VALUES
 (1,'Alice Johnson',20,'Computer Science',2,3.8),
 (2,'Bob Smith',22,'Mathematics',4,3.2),
 (3,'Carol White',19,'Computer Science',1,3.9),
 (4,'David Brown',21,'Physics',3,3.5),
 (5,'Emma Davis',23,'Mathematics',4,3.1),
 (6,'Frank Wilson',20,'Computer Science',2,2.9),
 (7,'Grace Lee',22,'Biology',3,3.7),
 (8,'Henry Taylor',21,'Physics',3,3.0),
 (9,'Iris Martinez',19,'Computer Science',1,4.0),
(10,'Jack Anderson',24,'Mathematics',4,2.8),
(11,'Kate Thomas',20,'Biology',2,3.6),
(12,'Leo Jackson',21,'Computer Science',3,3.4),
(13,'Mia White',22,'Physics',4,3.3),
(14,'Noah Harris',19,'Mathematics',1,3.7),
(15,'Olivia Clark',23,'Biology',4,3.9);

INSERT INTO courses VALUES
(1,'CS101','Intro to Programming',3,'Dr. Adams','Computer Science'),
(2,'CS201','Data Structures',4,'Dr. Adams','Computer Science'),
(3,'CS301','Algorithms',3,'Dr. Chen','Computer Science'),
(4,'MATH101','Calculus I',4,'Dr. Brown','Mathematics'),
(5,'MATH201','Linear Algebra',3,'Dr. Brown','Mathematics'),
(6,'PHYS101','Physics I',4,'Dr. Evans','Physics'),
(7,'BIO101','Intro to Biology',3,'Dr. Foster','Biology'),
(8,'CS401','Database Systems',3,'Dr. Chen','Computer Science');

INSERT INTO enrollments VALUES
 (1,1,1,'Fall 2023',92,'A'), (2,1,2,'Fall 2023',88,'B'),
 (3,1,8,'Spring 2024',95,'A'),(4,2,4,'Fall 2023',78,'C'),
 (5,2,5,'Spring 2024',82,'B'),(6,3,1,'Fall 2023',98,'A'),
 (7,3,2,'Spring 2024',94,'A'),(8,4,6,'Fall 2023',85,'B'),
 (9,4,4,'Fall 2023',80,'B'),(10,5,4,'Spring 2024',75,'C'),
(11,5,5,'Fall 2023',70,'C'),(12,6,1,'Fall 2023',65,'D'),
(13,6,2,'Spring 2024',72,'C'),(14,7,7,'Fall 2023',91,'A'),
(15,8,6,'Fall 2023',77,'C'),(16,9,1,'Spring 2024',100,'A'),
(17,9,8,'Spring 2024',97,'A'),(18,10,4,'Fall 2023',60,'D'),
(19,11,7,'Fall 2023',88,'B'),(20,12,2,'Fall 2023',83,'B'),
(21,12,3,'Spring 2024',86,'B'),(22,12,8,'Spring 2024',90,'A'),
(23,13,6,'Fall 2023',79,'C'),(24,14,4,'Fall 2023',93,'A'),
(25,15,7,'Fall 2023',96,'A');
`,
// ────────────────────────────────────────────────────────────────────────
store: `
CREATE TABLE categories (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE products (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  price       REAL NOT NULL,
  stock       INTEGER DEFAULT 0
);
CREATE TABLE customers (
  id      INTEGER PRIMARY KEY,
  name    TEXT NOT NULL,
  email   TEXT,
  city    TEXT,
  country TEXT
);
CREATE TABLE orders (
  id          INTEGER PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  order_date  TEXT,
  status      TEXT,
  total       REAL
);
CREATE TABLE order_items (
  id          INTEGER PRIMARY KEY,
  order_id    INTEGER REFERENCES orders(id),
  product_id  INTEGER REFERENCES products(id),
  quantity    INTEGER,
  unit_price  REAL
);

INSERT INTO categories VALUES
(1,'Electronics'),(2,'Books'),(3,'Clothing'),(4,'Home & Garden');

INSERT INTO products VALUES
 (1,'Wireless Headphones',1,79.99,150),
 (2,'Python Programming Book',2,39.99,80),
 (3,'SQL for Beginners',2,29.99,120),
 (4,'Running Shoes',3,89.99,60),
 (5,'Smart Watch',1,199.99,45),
 (6,'T-Shirt',3,19.99,200),
 (7,'Coffee Maker',4,59.99,35),
 (8,'Data Science Handbook',2,49.99,95),
 (9,'Laptop Stand',4,34.99,70),
(10,'Bluetooth Speaker',1,49.99,85);

INSERT INTO customers VALUES
 (1,'Alice Brown','alice@email.com','New York','USA'),
 (2,'Bob Green','bob@email.com','London','UK'),
 (3,'Carol White','carol@email.com','Sydney','Australia'),
 (4,'David Black','david@email.com','Toronto','Canada'),
 (5,'Emma Wilson','emma@email.com','New York','USA'),
 (6,'Frank Miller','frank@email.com','London','UK'),
 (7,'Grace Lee','grace@email.com','Singapore','Singapore'),
 (8,'Henry Park','henry@email.com','Seoul','South Korea'),
 (9,'Iris Chen','iris@email.com','Shanghai','China'),
(10,'Jack Taylor','jack@email.com','Sydney','Australia');

INSERT INTO orders VALUES
 (1,1,'2024-01-15','Delivered',129.98),
 (2,2,'2024-01-18','Delivered',39.99),
 (3,3,'2024-02-01','Delivered',199.99),
 (4,4,'2024-02-14','Shipped',109.97),
 (5,1,'2024-02-20','Delivered',49.99),
 (6,5,'2024-03-01','Delivered',209.98),
 (7,6,'2024-03-10','Processing',79.99),
 (8,7,'2024-03-15','Delivered',84.98),
 (9,8,'2024-03-20','Delivered',59.99),
(10,9,'2024-04-01','Shipped',149.97),
(11,10,'2024-04-05','Delivered',29.99),
(12,2,'2024-04-10','Delivered',89.99);

INSERT INTO order_items VALUES
 (1,1,1,1,79.99),(2,1,2,1,39.99),(3,2,2,1,39.99),
 (4,3,5,1,199.99),(5,4,4,1,89.99),(6,4,6,1,19.99),
 (7,5,10,1,49.99),(8,6,5,1,199.99),(9,6,3,1,29.99),
(10,6,6,1,19.99),(11,7,1,1,79.99),(12,8,9,1,34.99),
(13,8,3,1,29.99),(14,8,6,1,19.99),(15,9,7,1,59.99),
(16,10,2,1,39.99),(17,10,8,1,49.99),(18,10,3,1,29.99),
(19,11,3,1,29.99),(20,12,4,1,89.99);
`,
// ────────────────────────────────────────────────────────────────────────
library: `
CREATE TABLE books (
  id        INTEGER PRIMARY KEY,
  title     TEXT NOT NULL,
  author    TEXT NOT NULL,
  genre     TEXT,
  year      INTEGER,
  available INTEGER DEFAULT 1
);
CREATE TABLE members (
  id              INTEGER PRIMARY KEY,
  name            TEXT NOT NULL,
  email           TEXT,
  joined_date     TEXT,
  membership_type TEXT
);
CREATE TABLE loans (
  id          INTEGER PRIMARY KEY,
  book_id     INTEGER REFERENCES books(id),
  member_id   INTEGER REFERENCES members(id),
  loan_date   TEXT,
  due_date    TEXT,
  return_date TEXT
);

INSERT INTO books VALUES
 (1,'The Great Gatsby','F. Scott Fitzgerald','Fiction',1925,1),
 (2,'To Kill a Mockingbird','Harper Lee','Fiction',1960,0),
 (3,'1984','George Orwell','Dystopia',1949,1),
 (4,'Pride and Prejudice','Jane Austen','Romance',1813,1),
 (5,'The Catcher in the Rye','J.D. Salinger','Fiction',1951,0),
 (6,'Brave New World','Aldous Huxley','Dystopia',1932,1),
 (7,'The Hobbit','J.R.R. Tolkien','Fantasy',1937,1),
 (8,'Fahrenheit 451','Ray Bradbury','Dystopia',1953,0),
 (9,'Animal Farm','George Orwell','Political Satire',1945,1),
(10,'The Lord of the Rings','J.R.R. Tolkien','Fantasy',1954,1),
(11,'Dune','Frank Herbert','Science Fiction',1965,1),
(12,'Foundation','Isaac Asimov','Science Fiction',1951,0),
(13,'Harry Potter','J.K. Rowling','Fantasy',1997,1),
(14,'The Alchemist','Paulo Coelho','Fiction',1988,1),
(15,'Clean Code','Robert C. Martin','Technology',2008,1),
(16,'The Pragmatic Programmer','David Thomas','Technology',1999,0),
(17,'Introduction to Algorithms','T.H. Cormen','Technology',2001,1),
(18,'Design Patterns','Gang of Four','Technology',1994,1);

INSERT INTO members VALUES
(1,'Alice Johnson','alice@email.com','2022-01-15','Premium'),
(2,'Bob Smith','bob@email.com','2022-03-20','Standard'),
(3,'Carol Davis','carol@email.com','2022-06-10','Premium'),
(4,'David Brown','david@email.com','2023-01-05','Standard'),
(5,'Emma Wilson','emma@email.com','2023-02-14','Premium'),
(6,'Frank Taylor','frank@email.com','2023-05-20','Standard'),
(7,'Grace Lee','grace@email.com','2023-08-01','Standard'),
(8,'Henry Clark','henry@email.com','2023-09-15','Premium');

INSERT INTO loans VALUES
 (1,2,1,'2024-01-10','2024-01-24','2024-01-22'),
 (2,5,2,'2024-01-15','2024-01-29',NULL),
 (3,8,3,'2024-02-01','2024-02-15','2024-02-10'),
 (4,12,4,'2024-02-20','2024-03-05',NULL),
 (5,16,5,'2024-03-01','2024-03-15','2024-03-12'),
 (6,2,6,'2024-03-10','2024-03-24','2024-03-20'),
 (7,5,1,'2024-03-15','2024-03-29',NULL),
 (8,8,7,'2024-04-01','2024-04-15',NULL),
 (9,12,2,'2024-04-05','2024-04-19',NULL),
(10,16,8,'2024-04-10','2024-04-24','2024-04-20');
`,
};

// ── Example queries per database ─────────────────────────────────────────
export type ExampleQuery = { label: string; category: string; sql: string };

export const DB_EXAMPLES: Record<DbName, ExampleQuery[]> = {
  students: [
    { category: "Basics",        label: "All students",              sql: "SELECT * FROM students;" },
    { category: "Basics",        label: "Top GPAs",                  sql: "SELECT name, major, gpa\nFROM students\nORDER BY gpa DESC\nLIMIT 5;" },
    { category: "Basics",        label: "CS students only",          sql: "SELECT name, year, gpa\nFROM students\nWHERE major = 'Computer Science'\nORDER BY year;" },
    { category: "Aggregation",   label: "Students per major",        sql: "SELECT major, COUNT(*) AS total, ROUND(AVG(gpa),2) AS avg_gpa\nFROM students\nGROUP BY major\nORDER BY avg_gpa DESC;" },
    { category: "Aggregation",   label: "Grade distribution",        sql: "SELECT grade, COUNT(*) AS count\nFROM enrollments\nGROUP BY grade\nORDER BY grade;" },
    { category: "Aggregation",   label: "Courses with avg score",    sql: "SELECT c.code, c.name, ROUND(AVG(e.score),1) AS avg_score\nFROM courses c\nJOIN enrollments e ON c.id = e.course_id\nGROUP BY c.id\nORDER BY avg_score DESC;" },
    { category: "JOIN",          label: "Student enrollments",       sql: "SELECT s.name, c.code, c.name AS course, e.grade\nFROM enrollments e\nJOIN students s ON e.student_id = s.id\nJOIN courses  c ON e.course_id  = c.id\nORDER BY s.name, c.code;" },
    { category: "JOIN",          label: "All courses (incl. empty)", sql: "SELECT c.code, c.name, COUNT(e.id) AS enrolled\nFROM courses c\nLEFT JOIN enrollments e ON c.id = e.course_id\nGROUP BY c.id\nORDER BY enrolled DESC;" },
    { category: "Subquery",      label: "Above-average GPA",         sql: "SELECT name, gpa\nFROM students\nWHERE gpa > (SELECT AVG(gpa) FROM students)\nORDER BY gpa DESC;" },
    { category: "Subquery",      label: "Students with all A grades", sql: "SELECT s.name\nFROM students s\nWHERE s.id IN (\n  SELECT student_id FROM enrollments\n  GROUP BY student_id\n  HAVING MIN(grade) = 'A'\n);" },
  ],
  store: [
    { category: "Basics",        label: "All products",              sql: "SELECT p.name, c.name AS category, p.price, p.stock\nFROM products p\nJOIN categories c ON p.category_id = c.id\nORDER BY p.price;" },
    { category: "Basics",        label: "Low stock alert",           sql: "SELECT name, stock, price\nFROM products\nWHERE stock < 60\nORDER BY stock;" },
    { category: "Aggregation",   label: "Revenue by category",       sql: "SELECT c.name AS category, SUM(oi.quantity * oi.unit_price) AS revenue\nFROM order_items oi\nJOIN products   p ON oi.product_id = p.id\nJOIN categories c ON p.category_id  = c.id\nGROUP BY c.id\nORDER BY revenue DESC;" },
    { category: "Aggregation",   label: "Top customers",             sql: "SELECT cu.name, cu.country, COUNT(o.id) AS orders, ROUND(SUM(o.total),2) AS spent\nFROM customers cu\nJOIN orders o ON cu.id = o.customer_id\nGROUP BY cu.id\nORDER BY spent DESC;" },
    { category: "Aggregation",   label: "Orders by status",          sql: "SELECT status, COUNT(*) AS count, ROUND(SUM(total),2) AS total\nFROM orders\nGROUP BY status;" },
    { category: "JOIN",          label: "Order details",             sql: "SELECT o.id, cu.name, p.name AS product, oi.quantity, oi.unit_price\nFROM orders o\nJOIN customers   cu ON o.customer_id  = cu.id\nJOIN order_items oi ON o.id           = oi.order_id\nJOIN products     p ON oi.product_id  = p.id\nORDER BY o.id;" },
    { category: "JOIN",          label: "Customers who never ordered", sql: "SELECT cu.name, cu.country\nFROM customers cu\nLEFT JOIN orders o ON cu.id = o.customer_id\nWHERE o.id IS NULL;" },
    { category: "Subquery",      label: "Best-selling product",      sql: "SELECT name, price\nFROM products\nWHERE id = (\n  SELECT product_id\n  FROM order_items\n  GROUP BY product_id\n  ORDER BY SUM(quantity) DESC\n  LIMIT 1\n);" },
  ],
  library: [
    { category: "Basics",        label: "Available books",           sql: "SELECT title, author, genre, year\nFROM books\nWHERE available = 1\nORDER BY year DESC;" },
    { category: "Basics",        label: "Books by George Orwell",    sql: "SELECT title, genre, year\nFROM books\nWHERE author = 'George Orwell';" },
    { category: "Aggregation",   label: "Books per genre",           sql: "SELECT genre, COUNT(*) AS total\nFROM books\nGROUP BY genre\nORDER BY total DESC;" },
    { category: "Aggregation",   label: "Most active members",       sql: "SELECT m.name, m.membership_type, COUNT(l.id) AS loans\nFROM members m\nJOIN loans l ON m.id = l.member_id\nGROUP BY m.id\nORDER BY loans DESC;" },
    { category: "JOIN",          label: "Current loans",             sql: "SELECT b.title, b.author, m.name AS borrower, l.loan_date, l.due_date\nFROM loans l\nJOIN books   b ON l.book_id   = b.id\nJOIN members m ON l.member_id = m.id\nWHERE l.return_date IS NULL\nORDER BY l.due_date;" },
    { category: "JOIN",          label: "Full loan history",         sql: "SELECT b.title, m.name, l.loan_date, l.return_date,\n       CASE WHEN l.return_date IS NULL THEN 'Active' ELSE 'Returned' END AS status\nFROM loans l\nJOIN books   b ON l.book_id   = b.id\nJOIN members m ON l.member_id = m.id\nORDER BY l.loan_date DESC;" },
    { category: "JOIN",          label: "Members with no loans",     sql: "SELECT m.name, m.membership_type, m.joined_date\nFROM members m\nLEFT JOIN loans l ON m.id = l.member_id\nWHERE l.id IS NULL;" },
    { category: "Subquery",      label: "Most borrowed book",        sql: "SELECT title, author\nFROM books\nWHERE id = (\n  SELECT book_id\n  FROM loans\n  GROUP BY book_id\n  ORDER BY COUNT(*) DESC\n  LIMIT 1\n);" },
  ],
};
