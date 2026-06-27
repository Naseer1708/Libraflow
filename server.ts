import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { db, Book, User, Borrow, Reservation, Fine, Notification, AuditLog, Category, Author } from "./server/db.js";
import { generateLunaResponse } from "./server/gemini.js";

const app = express();
app.use(express.json());

// PORT constraint: must run on port 3000
const PORT = 3000;

// Simple logger middleware
function logAction(userId: string, action: string, details: string) {
  db.transaction((data) => {
    const log: AuditLog = {
      id: "LOG" + Date.now() + Math.random().toString(36).substr(2, 4),
      userId,
      action,
      details,
      createdDate: new Date().toISOString(),
    };
    data.auditLogs.unshift(log); // Keep most recent at top
  });
}

// System-wide fine updating logic on start or requests
function calculateAndUpdateOverdueFines() {
  const today = new Date();
  db.transaction((data) => {
    data.borrows.forEach((borrow) => {
      if (borrow.status === "active" || borrow.status === "overdue") {
        const dueDate = new Date(borrow.dueDate);
        if (today > dueDate) {
          // Update status to overdue
          borrow.status = "overdue";
          
          // Calculate days overdue
          const diffTime = Math.abs(today.getTime() - dueDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const fineAmount = diffDays * data.settings.fineRatePerDay;

          // Check if fine already exists for this borrow
          const existingFine = data.fines.find((f) => f.borrowId === borrow.id);
          if (existingFine) {
            if (existingFine.status !== "paid") {
              existingFine.amount = fineAmount;
            }
          } else {
            // Generate fine
            const newFine: Fine = {
              id: "FN" + Date.now() + Math.random().toString(36).substr(2, 4),
              userId: borrow.userId,
              borrowId: borrow.id,
              amount: fineAmount,
              status: "pending",
              createdDate: new Date().toISOString().split("T")[0],
              paidDate: null,
            };
            data.fines.push(newFine);

            // Add Notification
            const bookTitle = data.books.find((b) => b.id === borrow.id)?.title || "a borrowed book";
            const notification: Notification = {
              id: "NT" + Date.now() + Math.random().toString(36).substr(2, 4),
              userId: borrow.userId,
              title: "Overdue Book Fine Generated",
              message: `Your borrowed book "${bookTitle}" is overdue by ${diffDays} days. A fine of ₹${fineAmount} has been generated.`,
              type: "fine_generated",
              isRead: false,
              createdDate: new Date().toISOString().split("T")[0],
            };
            data.notifications.unshift(notification);
          }
        }
      }
    });
  });
}

// Run fine update
calculateAndUpdateOverdueFines();

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// In-memory Captcha Store
const activeCaptchas = new Map<string, { answer: string; expires: number }>();

// Clean up expired captchas periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, value] of activeCaptchas.entries()) {
    if (now > value.expires) {
      activeCaptchas.delete(id);
    }
  }
}, 60000);

// Endpoint to generate a new Captcha
app.get("/api/auth/captcha", (req: Request, res: Response) => {
  const id = "CAP" + Math.random().toString(36).substring(2, 10).toUpperCase();
  // Generate random 5-character alphanumeric captcha, excluding confusing ones (O, 0, I, 1)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  activeCaptchas.set(id, {
    answer: code,
    expires: Date.now() + 5 * 60 * 1000, // 5 minutes expiration
  });
  
  res.json({ id, code });
});

app.post("/api/auth/register", (req: Request, res: Response) => {
  const { name, email, password, role, phone, address, membershipType, captchaId, captchaValue } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }

  if (!captchaId || !captchaValue) {
    return res.status(400).json({ error: "Captcha verification is required." });
  }

  const stored = activeCaptchas.get(captchaId);
  if (!stored || Date.now() > stored.expires) {
    return res.status(400).json({ error: "Captcha has expired. Please refresh the captcha and try again." });
  }

  if (stored.answer.toLowerCase() !== captchaValue.trim().toLowerCase()) {
    return res.status(400).json({ error: "Incorrect Captcha. Please check the code and try again." });
  }

  // Delete captcha to prevent reuse
  activeCaptchas.delete(captchaId);

  const data = db.get();
  const existingUser = data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: "Email already registered." });
  }

  const newUser: User = {
    id: "U" + (data.users.length + 1).toString().padStart(3, "0"),
    name,
    email,
    passwordHash: password, // For simulation simplicity
    role: role || "member",
    phone: phone || "+91 99999 99999",
    address: address || "Not Provided",
    membershipType: membershipType || "basic",
    status: "active",
    joinDate: new Date().toISOString().split("T")[0],
  };

  db.transaction((d) => {
    d.users.push(newUser);
  });

  logAction(newUser.id, "User Registered", `Registered with email: ${email} and role: ${newUser.role}`);

  res.status(201).json({ message: "Registration successful!", user: newUser });
});

app.post("/api/auth/login", (req: Request, res: Response) => {
  const { email, password, captchaId, captchaValue, isDemoBypass } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  // Allow bypass for system demo buttons
  if (!isDemoBypass && captchaValue !== "DEMO_BYPASS") {
    if (!captchaId || !captchaValue) {
      return res.status(400).json({ error: "Captcha verification is required." });
    }

    const stored = activeCaptchas.get(captchaId);
    if (!stored || Date.now() > stored.expires) {
      return res.status(400).json({ error: "Captcha has expired. Please refresh the captcha and try again." });
    }

    if (stored.answer.toLowerCase() !== captchaValue.trim().toLowerCase()) {
      return res.status(400).json({ error: "Incorrect Captcha. Please check the code and try again." });
    }

    // Delete captcha to prevent reuse
    activeCaptchas.delete(captchaId);
  }

  const data = db.get();
  const user = data.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === password
  );

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  if (user.status === "suspended") {
    return res.status(403).json({ error: "Your account has been suspended. Contact librarian." });
  }

  logAction(user.id, "User Logged In", `Successful login via email: ${email}`);

  res.json({
    message: "Login successful",
    token: `mock-jwt-token-for-${user.id}`,
    user,
  });
});

app.post("/api/auth/forgot-password", (req: Request, res: Response) => {
  const { email } = req.body;
  const data = db.get();
  const user = data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "User with this email not found." });
  }

  res.json({ message: "Password recovery link sent successfully (Simulated Email)." });
});

app.post("/api/auth/reset-password", (req: Request, res: Response) => {
  const { userId, newPassword } = req.body;
  if (!userId || !newPassword) {
    return res.status(400).json({ error: "User ID and new password are required." });
  }

  db.transaction((data) => {
    const user = data.users.find((u) => u.id === userId);
    if (user) {
      user.passwordHash = newPassword;
    }
  });

  logAction(userId, "Password Reset", `Password reset successful`);
  res.json({ message: "Password reset successful." });
});

// ==========================================
// BOOK MANAGEMENT ENDPOINTS
// ==========================================

app.get("/api/books", (req: Request, res: Response) => {
  const data = db.get();
  // Return book details with authors and categories populated
  const responseBooks = data.books.map((b) => {
    const author = data.authors.find((a) => a.id === b.authorId);
    const category = data.categories.find((c) => c.id === b.categoryId);
    return {
      ...b,
      authorName: author ? author.name : "Unknown Author",
      categoryName: category ? category.name : "Uncategorized",
    };
  });
  res.json(responseBooks);
});

app.post("/api/books", (req: Request, res: Response) => {
  const {
    isbn, title, authorName, publisher, edition, categoryName, genre,
    language, description, coverImage, totalCopies, shelfLocation, userId
  } = req.body;

  if (!isbn || !title || !authorName || !categoryName) {
    return res.status(400).json({ error: "ISBN, Title, Author, and Category are required." });
  }

  db.transaction((data) => {
    // 1. Resolve or create author
    let author = data.authors.find((a) => a.name.toLowerCase() === authorName.toLowerCase());
    if (!author) {
      author = {
        id: "A" + (data.authors.length + 1).toString().padStart(3, "0"),
        name: authorName,
        bio: `${authorName} is an accomplished author at our library.`,
      };
      data.authors.push(author);
    }

    // 2. Resolve or create category
    let category = data.categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
    if (!category) {
      category = {
        id: "C" + (data.categories.length + 1).toString().padStart(3, "0"),
        name: categoryName,
        description: `Books in ${categoryName} category.`,
      };
      data.categories.push(category);
    }

    const newBook: Book = {
      id: "B" + (data.books.length + 1).toString().padStart(3, "0"),
      isbn,
      title,
      authorId: author.id,
      publisher: publisher || "Default Publisher",
      edition: edition || "1st Edition",
      categoryId: category.id,
      genre: genre || "General",
      language: language || "English",
      description: description || "",
      coverImage: coverImage || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400",
      totalCopies: parseInt(totalCopies) || 3,
      availableCopies: parseInt(totalCopies) || 3,
      shelfLocation: shelfLocation || "Unassigned Shelf",
    };

    data.books.push(newBook);
    logAction(userId || "System", "Add Book", `Added book: ${title} (${isbn})`);
    res.status(201).json(newBook);
  });
});

app.put("/api/books/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    isbn, title, authorName, publisher, edition, categoryName, genre,
    language, description, coverImage, totalCopies, shelfLocation, userId
  } = req.body;

  db.transaction((data) => {
    const book = data.books.find((b) => b.id === id);
    if (!book) {
      return res.status(404).json({ error: "Book not found." });
    }

    // Resolve or create author
    if (authorName) {
      let author = data.authors.find((a) => a.name.toLowerCase() === authorName.toLowerCase());
      if (!author) {
        author = {
          id: "A" + (data.authors.length + 1).toString().padStart(3, "0"),
          name: authorName,
          bio: "",
        };
        data.authors.push(author);
      }
      book.authorId = author.id;
    }

    // Resolve or create category
    if (categoryName) {
      let category = data.categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
      if (!category) {
        category = {
          id: "C" + (data.categories.length + 1).toString().padStart(3, "0"),
          name: categoryName,
          description: "",
        };
        data.categories.push(category);
      }
      book.categoryId = category.id;
    }

    if (isbn) book.isbn = isbn;
    if (title) book.title = title;
    if (publisher) book.publisher = publisher;
    if (edition) book.edition = edition;
    if (genre) book.genre = genre;
    if (language) book.language = language;
    if (description) book.description = description;
    if (coverImage) book.coverImage = coverImage;
    if (shelfLocation) book.shelfLocation = shelfLocation;

    if (totalCopies !== undefined) {
      const diff = parseInt(totalCopies) - book.totalCopies;
      book.totalCopies = parseInt(totalCopies);
      book.availableCopies = Math.max(0, book.availableCopies + diff);
    }

    logAction(userId || "System", "Update Book", `Updated book: ${book.title}`);
    res.json(book);
  });
});

app.delete("/api/books/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.query;

  db.transaction((data) => {
    const index = data.books.findIndex((b) => b.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Book not found" });
    }
    const title = data.books[index].title;
    data.books.splice(index, 1);
    logAction((userId as string) || "System", "Delete Book", `Deleted book: ${title}`);
    res.json({ message: "Book deleted successfully." });
  });
});

// CSV Import & Export for books
app.post("/api/books/import-csv", (req: Request, res: Response) => {
  const { csvContent, userId } = req.body;
  if (!csvContent) {
    return res.status(400).json({ error: "CSV content is required." });
  }

  try {
    const lines = csvContent.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 0);
    if (lines.length < 2) {
      return res.status(400).json({ error: "CSV has no data rows." });
    }

    // Simple parse header
    const headers = lines[0].split(",").map((h: string) => h.trim().toLowerCase());
    const booksAdded: Book[] = [];

    db.transaction((data) => {
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v: string) => v.trim());
        const row: any = {};
        headers.forEach((header: string, index: number) => {
          row[header] = values[index] || "";
        });

        if (!row.title || !row.isbn) continue;

        // Author
        let authorName = row.author || "Unknown Author";
        let author = data.authors.find((a) => a.name.toLowerCase() === authorName.toLowerCase());
        if (!author) {
          author = {
            id: "A" + (data.authors.length + 1).toString().padStart(3, "0"),
            name: authorName,
            bio: "",
          };
          data.authors.push(author);
        }

        // Category
        let categoryName = row.category || "General";
        let category = data.categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
        if (!category) {
          category = {
            id: "C" + (data.categories.length + 1).toString().padStart(3, "0"),
            name: categoryName,
            description: "",
          };
          data.categories.push(category);
        }

        const copies = parseInt(row.copies) || 3;
        const newBook: Book = {
          id: "B" + (data.books.length + 1).toString().padStart(3, "0"),
          isbn: row.isbn,
          title: row.title,
          authorId: author.id,
          publisher: row.publisher || "Publisher",
          edition: row.edition || "1st Edition",
          categoryId: category.id,
          genre: row.genre || "General",
          language: row.language || "English",
          description: row.description || "",
          coverImage: row.coverimage || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400",
          totalCopies: copies,
          availableCopies: copies,
          shelfLocation: row.shelf || "Aisle A",
        };
        data.books.push(newBook);
        booksAdded.push(newBook);
      }
    });

    logAction(userId || "System", "Import CSV", `Imported ${booksAdded.length} books via CSV.`);
    res.json({ message: `Successfully imported ${booksAdded.length} books.`, books: booksAdded });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to parse CSV. Make sure formatting is correct." });
  }
});

// ==========================================
// MEMBER MANAGEMENT ENDPOINTS
// ==========================================

app.get("/api/members", (req: Request, res: Response) => {
  const data = db.get();
  // Filter for roles that represent members or librarians
  res.json(data.users.filter((u) => u.role !== "admin"));
});

app.post("/api/members", (req: Request, res: Response) => {
  const { name, email, phone, address, membershipType, role, password, userId } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required." });
  }

  db.transaction((data) => {
    const exists = data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const newMember: User = {
      id: "U" + (data.users.length + 1).toString().padStart(3, "0"),
      name,
      email,
      passwordHash: password || "member123",
      role: role || "member",
      phone: phone || "+91 99999 99999",
      address: address || "Not Provided",
      membershipType: membershipType || "basic",
      status: "active",
      joinDate: new Date().toISOString().split("T")[0],
    };

    data.users.push(newMember);
    logAction(userId || "System", "Create User", `Created user ${name} with role ${role}`);
    res.status(201).json(newMember);
  });
});

app.put("/api/members/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, phone, address, membershipType, status, role, userId } = req.body;

  db.transaction((data) => {
    const member = data.users.find((u) => u.id === id);
    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    if (name) member.name = name;
    if (email) member.email = email;
    if (phone) member.phone = phone;
    if (address) member.address = address;
    if (membershipType) member.membershipType = membershipType;
    if (status) member.status = status;
    if (role) member.role = role;

    logAction(userId || "System", "Update User", `Updated user: ${member.name}`);
    res.json(member);
  });
});

app.delete("/api/members/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.query;

  db.transaction((data) => {
    const idx = data.users.findIndex((u) => u.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Member not found" });
    }
    const name = data.users[idx].name;
    data.users.splice(idx, 1);
    logAction((userId as string) || "System", "Delete User", `Deleted user: ${name}`);
    res.json({ message: "Member deleted successfully." });
  });
});

// ==========================================
// BORROWING & RESERVATION SYSTEM
// ==========================================

app.get("/api/borrows", (req: Request, res: Response) => {
  const { userId } = req.query;
  const data = db.get();

  let list = data.borrows;
  if (userId) {
    list = list.filter((b) => b.userId === userId);
  }

  const result = list.map((b) => {
    const book = data.books.find((bk) => bk.id === b.bookId);
    const user = data.users.find((u) => u.id === b.userId);
    return {
      ...b,
      bookTitle: book ? book.title : "Unknown Book",
      bookIsbn: book ? book.isbn : "",
      memberName: user ? user.name : "Unknown Member",
    };
  });

  res.json(result);
});

// Issue Book
app.post("/api/borrows/issue", (req: Request, res: Response) => {
  const { userId, bookId, librarianId } = req.body;

  if (!userId || !bookId) {
    return res.status(400).json({ error: "User ID and Book ID are required." });
  }

  db.transaction((data) => {
    const user = data.users.find((u) => u.id === userId);
    const book = data.books.find((b) => b.id === bookId);

    if (!user) return res.status(404).json({ error: "User not found." });
    if (!book) return res.status(404).json({ error: "Book not found." });

    if (user.status === "suspended") {
      return res.status(400).json({ error: "Member is currently suspended." });
    }

    // Check active borrow count
    const activeBorrows = data.borrows.filter((b) => b.userId === userId && b.status !== "returned");
    if (activeBorrows.length >= data.settings.borrowLimit) {
      return res.status(400).json({ error: `Member has reached their limit of ${data.settings.borrowLimit} books.` });
    }

    if (book.availableCopies <= 0) {
      return res.status(400).json({ error: "No physical copies of this book are currently available." });
    }

    // Deduct copy and save borrow
    book.availableCopies -= 1;

    const borrowDate = new Date().toISOString().split("T")[0];
    const due = new Date();
    due.setDate(due.getDate() + data.settings.borrowDurationDays);
    const dueDate = due.toISOString().split("T")[0];

    const newBorrow: Borrow = {
      id: "BRW" + Date.now().toString().substr(-6),
      userId,
      bookId,
      borrowDate,
      dueDate,
      returnDate: null,
      status: "active",
    };

    data.borrows.push(newBorrow);

    // Auto-fulfill any pending reservation of this book for this member
    const pendingRes = data.reservations.find(
      (r) => r.userId === userId && r.bookId === bookId && r.status === "pending"
    );
    if (pendingRes) {
      pendingRes.status = "fulfilled";
    }

    // In-app Notification
    const notification: Notification = {
      id: "NT" + Date.now().toString().substr(-6),
      userId,
      title: "Book Issued Successfully",
      message: `You have successfully borrowed "${book.title}". Please return it by ${dueDate}.`,
      type: "system",
      isRead: false,
      createdDate: borrowDate,
    };
    data.notifications.unshift(notification);

    logAction(librarianId || userId, "Issue Book", `Issued book "${book.title}" to member "${user.name}"`);
    res.status(201).json(newBorrow);
  });
});

// Return Book
app.post("/api/borrows/return", (req: Request, res: Response) => {
  const { borrowId, librarianId } = req.body;

  if (!borrowId) {
    return res.status(400).json({ error: "Borrow ID is required." });
  }

  db.transaction((data) => {
    const borrow = data.borrows.find((b) => b.id === borrowId);
    if (!borrow) return res.status(404).json({ error: "Borrow record not found." });
    if (borrow.status === "returned") return res.status(400).json({ error: "Book already returned." });

    const book = data.books.find((b) => b.id === borrow.bookId);
    if (book) {
      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
    }

    const returnDate = new Date().toISOString().split("T")[0];
    borrow.returnDate = returnDate;
    borrow.status = "returned";

    // Update Fine if paid or pending
    const fine = data.fines.find((f) => f.borrowId === borrowId);
    if (fine && fine.status !== "paid") {
      fine.status = "pending"; // Keeps status as pending fine
    }

    // Add notification
    const notification: Notification = {
      id: "NT" + Date.now().toString().substr(-6),
      userId: borrow.userId,
      title: "Book Returned Successfully",
      message: `Your return for "${book?.title || 'a book'}" has been processed. Thank you!`,
      type: "book_returned",
      isRead: false,
      createdDate: returnDate,
    };
    data.notifications.unshift(notification);

    // If reservation exists, fulfill next
    const activeRes = data.reservations.find((r) => r.bookId === borrow.bookId && r.status === "pending");
    if (activeRes) {
      activeRes.status = "ready";
      // Notify reservation owner
      const resNotification: Notification = {
        id: "NT" + Date.now().toString().substr(-6),
        userId: activeRes.userId,
        title: "Reserved Book Ready for Pick-up",
        message: `The book you reserved, "${book?.title || 'Book'}", is now ready for collection!`,
        type: "reservation_ready",
        isRead: false,
        createdDate: returnDate,
      };
      data.notifications.unshift(resNotification);
    }

    logAction(librarianId || borrow.userId, "Return Book", `Returned book "${book?.title}"`);
    res.json({ message: "Book returned successfully.", borrow });
  });
});

// Renew Book
app.post("/api/borrows/renew", (req: Request, res: Response) => {
  const { borrowId } = req.body;

  db.transaction((data) => {
    if (!data.settings.allowRenewals) {
      return res.status(400).json({ error: "Renewals are disabled in library settings." });
    }

    const borrow = data.borrows.find((b) => b.id === borrowId);
    if (!borrow) return res.status(404).json({ error: "Borrow record not found." });
    if (borrow.status === "returned") return res.status(400).json({ error: "Cannot renew a returned book." });

    // Extend due date by standard duration
    const currentDue = new Date(borrow.dueDate);
    currentDue.setDate(currentDue.getDate() + data.settings.borrowDurationDays);
    borrow.dueDate = currentDue.toISOString().split("T")[0];
    borrow.status = "active"; // clear overdue if renewed prior or as correction

    logAction(borrow.userId, "Renew Book", `Renewed borrow record ${borrowId}`);
    res.json({ message: "Book renewed successfully.", borrow });
  });
});

// Reservations API
app.get("/api/reservations", (req: Request, res: Response) => {
  const { userId } = req.query;
  const data = db.get();

  let list = data.reservations;
  if (userId) {
    list = list.filter((r) => r.userId === userId);
  }

  const result = list.map((r) => {
    const book = data.books.find((b) => b.id === r.bookId);
    const user = data.users.find((u) => u.id === r.userId);
    return {
      ...r,
      bookTitle: book ? book.title : "Unknown Book",
      memberName: user ? user.name : "Unknown Member",
    };
  });
  res.json(result);
});

app.post("/api/reservations", (req: Request, res: Response) => {
  const { userId, bookId } = req.body;

  if (!userId || !bookId) {
    return res.status(400).json({ error: "User ID and Book ID are required." });
  }

  db.transaction((data) => {
    const existingQueueCount = data.reservations.filter((r) => r.bookId === bookId && r.status === "pending").length;

    const newRes: Reservation = {
      id: "RES" + Date.now().toString().substr(-6),
      userId,
      bookId,
      reserveDate: new Date().toISOString().split("T")[0],
      status: "pending",
      queuePosition: existingQueueCount + 1,
    };

    data.reservations.push(newRes);
    logAction(userId, "Reserve Book", `Reserved/Requested book ID: ${bookId}`);

    const book = data.books.find((b) => b.id === bookId);
    const member = data.users.find((u) => u.id === userId);

    // Create a notification for the member
    const memberNotif: Notification = {
      id: "NT" + Date.now().toString().substr(-6) + "M",
      userId,
      title: "Borrow Request Submitted",
      message: `Your borrow request for "${book ? book.title : "Unknown Book"}" has been sent to the Librarian. It is pending approval.`,
      type: "system",
      isRead: false,
      createdDate: new Date().toISOString().split("T")[0]
    };
    data.notifications.unshift(memberNotif);

    // Create notification for ALL librarians/admins!
    const staffUsers = data.users.filter((u) => u.role === "librarian" || u.role === "admin");
    staffUsers.forEach((staff) => {
      const staffNotif: Notification = {
        id: "NT" + (Date.now() + Math.floor(Math.random() * 1000)).toString().substr(-6) + "S",
        userId: staff.id,
        title: "New Borrow Request",
        message: `Member ${member ? member.name : "Unknown"} wants to borrow "${book ? book.title : "Unknown Book"}" (Request ${newRes.id}).`,
        type: "system",
        isRead: false,
        createdDate: new Date().toISOString().split("T")[0]
      };
      data.notifications.unshift(staffNotif);
    });

    res.status(201).json(newRes);
  });
});

app.post("/api/reservations/cancel", (req: Request, res: Response) => {
  const { reservationId } = req.body;

  db.transaction((data) => {
    const reservation = data.reservations.find((r) => r.id === reservationId);
    if (!reservation) return res.status(404).json({ error: "Reservation not found." });

    reservation.status = "cancelled";
    logAction(reservation.userId, "Cancel Reservation", `Cancelled reservation ID: ${reservationId}`);

    const book = data.books.find((b) => b.id === reservation.bookId);

    // Create a notification for the member
    const memberNotif: Notification = {
      id: "NT" + Date.now().toString().substr(-6) + "C",
      userId: reservation.userId,
      title: "Borrow Request Cancelled / Declined",
      message: `Your request/hold for "${book ? book.title : "Unknown Book"}" has been cancelled or declined.`,
      type: "system",
      isRead: false,
      createdDate: new Date().toISOString().split("T")[0]
    };
    data.notifications.unshift(memberNotif);

    res.json({ message: "Reservation cancelled.", reservation });
  });
});

// ==========================================
// FINE MANAGEMENT ENDPOINTS
// ==========================================

app.get("/api/fines", (req: Request, res: Response) => {
  const { userId } = req.query;
  const data = db.get();

  let list = data.fines;
  if (userId) {
    list = list.filter((f) => f.userId === userId);
  }

  const result = list.map((f) => {
    const user = data.users.find((u) => u.id === f.userId);
    const borrow = data.borrows.find((b) => b.id === f.borrowId);
    const book = borrow ? data.books.find((bk) => bk.id === borrow.bookId) : null;
    return {
      ...f,
      memberName: user ? user.name : "Unknown Member",
      bookTitle: book ? book.title : "Unknown Book",
    };
  });

  res.json(result);
});

app.post("/api/fines/pay", (req: Request, res: Response) => {
  const { fineId, amountPaid, userId } = req.body;

  db.transaction((data) => {
    const fine = data.fines.find((f) => f.id === fineId);
    if (!fine) return res.status(404).json({ error: "Fine record not found." });

    if (fine.status === "paid") {
      return res.status(400).json({ error: "Fine is already paid." });
    }

    const payAmt = parseFloat(amountPaid) || fine.amount;
    if (payAmt >= fine.amount) {
      fine.status = "paid";
      fine.paidDate = new Date().toISOString().split("T")[0];
    } else {
      fine.status = "partial";
      fine.amount = Math.max(0, fine.amount - payAmt);
    }

    logAction(userId || fine.userId, "Pay Fine", `Processed payment of ₹${payAmt} for fine ID ${fineId}`);
    res.json({ message: "Fine payment successfully recorded.", fine });
  });
});

app.post("/api/fines/sweep", (req: Request, res: Response) => {
  try {
    calculateAndUpdateOverdueFines();
    res.json({ success: true, message: "System-wide overdue scan and fine calculations completed successfully." });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to run fine calculations sweep", details: error?.message });
  }
});

// ==========================================
// AI CHATBOT (LUNA) ENDPOINT
// ==========================================

app.post("/api/chatbot/chat", async (req: Request, res: Response) => {
  const { userId, message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message content is required." });
  }

  // Ensure userId is strictly a valid string and not "undefined" / "null"
  const isValidUser = userId && userId !== "undefined" && userId !== "null" && String(userId).trim() !== "";

  try {
    const responseText = await generateLunaResponse(isValidUser ? String(userId) : null, message, history || []);

    // Save message to chat history in database if valid userId provided
    if (isValidUser) {
      db.transaction((data) => {
        const userMsg = {
          id: "MSG" + Date.now() + "U",
          userId: String(userId),
          message,
          sender: "user" as const,
          createdDate: new Date().toISOString(),
        };
        const lunaMsg = {
          id: "MSG" + (Date.now() + 1) + "L",
          userId: String(userId),
          message: responseText,
          sender: "luna" as const,
          createdDate: new Date().toISOString(),
        };
        data.chatHistory.push(userMsg, lunaMsg);
      });
    }

    res.json({ reply: responseText });
  } catch (error: any) {
    res.status(500).json({ error: "An error occurred with Luna chatbot", details: error?.message });
  }
});

app.get("/api/chatbot/history", (req: Request, res: Response) => {
  const { userId } = req.query;
  if (!userId || userId === "undefined" || userId === "null" || String(userId).trim() === "") {
    return res.status(400).json({ error: "A valid User ID is required for chat history." });
  }

  const data = db.get();
  const history = data.chatHistory.filter((msg) => msg.userId === String(userId));
  res.json(history);
});

// ==========================================
// HYBRID RECOMMENDATION SYSTEM
// ==========================================

app.get("/api/recommendations", (req: Request, res: Response) => {
  const { userId } = req.query;
  const data = db.get();

  if (!userId) {
    // Visitor: Return Popularity/New Arrivals (Trending)
    const trends = data.books.slice(0, 4).map((b) => {
      const author = data.authors.find((a) => a.id === b.authorId)?.name || "Author";
      return { ...b, authorName: author, matchPercentage: 90 };
    });
    return res.json(trends);
  }

  // Implementation of: 40% User Interest, 30% Similar Users, 20% Popular Books, 10% New Arrivals
  const user = data.users.find((u) => u.id === userId);
  const preferences = data.userPreferences.find((p) => p.userId === userId);
  const userBorrows = data.borrows.filter((b) => b.userId === userId);

  // Identify genres/authors user has borrowed or selected
  const favoriteGenres = new Set<string>(preferences?.favoriteGenres || []);
  const favoriteAuthors = new Set<string>(preferences?.favoriteAuthors || []);

  userBorrows.forEach((b) => {
    const bk = data.books.find((book) => book.id === b.bookId);
    if (bk) {
      favoriteGenres.add(bk.genre);
      const authorName = data.authors.find((a) => a.id === bk.authorId)?.name;
      if (authorName) favoriteAuthors.add(authorName);
    }
  });

  // Calculate borrow frequencies of all books for "Popularity" (20%)
  const borrowCounts: Record<string, number> = {};
  data.borrows.forEach((b) => {
    borrowCounts[b.bookId] = (borrowCounts[b.bookId] || 0) + 1;
  });
  const maxBorrowCount = Math.max(...Object.values(borrowCounts), 1);

  // Similar Users check (30% Collaborative Filtering)
  const similarUsersBooks = new Set<string>();
  if (userBorrows.length > 0) {
    const userBookIds = new Set(userBorrows.map((ub) => ub.bookId));
    // Find other users who borrowed at least one of these books
    const coBorrowers = new Set<string>();
    data.borrows.forEach((b) => {
      if (b.userId !== userId && userBookIds.has(b.bookId)) {
        coBorrowers.add(b.userId);
      }
    });

    // Collect books borrowed by these co-borrowers
    data.borrows.forEach((b) => {
      if (coBorrowers.has(b.userId) && !userBookIds.has(b.bookId)) {
        similarUsersBooks.add(b.bookId);
      }
    });
  }

  // Calculate score for each book not currently borrowed
  const activeBookIds = new Set(data.borrows.filter((b) => b.userId === userId && b.status !== "returned").map((b) => b.bookId));

  const scoredBooks = data.books
    .filter((b) => !activeBookIds.has(b.id))
    .map((b) => {
      let interestScore = 0; // max 40
      const authorName = data.authors.find((a) => a.id === b.authorId)?.name || "";

      if (favoriteGenres.has(b.genre)) interestScore += 25;
      if (favoriteAuthors.has(authorName)) interestScore += 15;

      let collabScore = similarUsersBooks.has(b.id) ? 30 : 0; // max 30

      const popularityRatio = (borrowCounts[b.id] || 0) / maxBorrowCount;
      let popularityScore = popularityRatio * 20; // max 20

      // New arrivals: simple proxy based on high ID index (max 10)
      const isNewArrival = data.books.slice(-2).some((ab) => ab.id === b.id);
      let recencyScore = isNewArrival ? 10 : 3;

      const totalScore = Math.min(100, Math.round(interestScore + collabScore + popularityScore + recencyScore));

      return {
        ...b,
        authorName,
        categoryName: data.categories.find((c) => c.id === b.categoryId)?.name || "General",
        matchPercentage: totalScore,
      };
    });

  // Sort by highest score
  scoredBooks.sort((a, b) => b.matchPercentage - a.matchPercentage);
  res.json(scoredBooks.slice(0, 6)); // Return top 6 recommendations
});

// ==========================================
// REPORTS & ANALYTICS ENDPOINTS
// ==========================================

app.get("/api/reports/summary", (req: Request, res: Response) => {
  const data = db.get();

  const totalBooks = data.books.reduce((acc, curr) => acc + curr.totalCopies, 0);
  const totalBookTitles = data.books.length;
  const activeMembers = data.users.filter((u) => u.role === "member" && u.status === "active").length;
  const activeBorrows = data.borrows.filter((b) => b.status === "active" || b.status === "overdue");
  const overdueBorrows = data.borrows.filter((b) => b.status === "overdue");

  // Fine collections
  const totalFineCollected = data.fines
    .filter((f) => f.status === "paid")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const pendingFines = data.fines
    .filter((f) => f.status !== "paid")
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Popular books calculation
  const popularBooks = data.books.map((b) => {
    const borrowCount = data.borrows.filter((br) => br.bookId === b.id).length;
    return {
      title: b.title,
      author: data.authors.find((a) => a.id === b.authorId)?.name || "Author",
      borrowCount,
    };
  }).sort((a, b) => b.borrowCount - a.borrowCount).slice(0, 4);

  // Category analytics
  const categoryDistribution = data.categories.map((c) => {
    const count = data.books.filter((b) => b.categoryId === c.id).length;
    return { name: c.name, value: count };
  });

  // Monthly transactions simulation
  const monthlyTransactions = [
    { month: "Jan", borrowed: 12, returned: 8 },
    { month: "Feb", borrowed: 18, returned: 14 },
    { month: "Mar", borrowed: 25, returned: 19 },
    { month: "Apr", borrowed: 32, returned: 28 },
    { month: "May", borrowed: 40, returned: 35 },
    { month: "Jun", borrowed: activeBorrows.length, returned: data.borrows.filter((b) => b.status === "returned").length },
  ];

  res.json({
    metrics: {
      totalBooks,
      totalBookTitles,
      activeMembers,
      issuedToday: activeBorrows.filter((b) => b.borrowDate === new Date().toISOString().split("T")[0]).length,
      activeBorrowsCount: activeBorrows.length,
      overdueCount: overdueBorrows.length,
      fineCollected: totalFineCollected,
      pendingFines,
      branchesCount: data.branches.length,
      librariansCount: data.users.filter((u) => u.role === "librarian").length,
    },
    popularBooks,
    categoryDistribution,
    monthlyTransactions,
  });
});

// ==========================================
// SYSTEM SETTINGS & NOTIFICATIONS
// ==========================================

app.get("/api/settings", (req: Request, res: Response) => {
  res.json(db.get().settings);
});

app.put("/api/settings", (req: Request, res: Response) => {
  const { borrowLimit, borrowDurationDays, fineRatePerDay, allowRenewals, userId } = req.body;

  db.transaction((data) => {
    if (borrowLimit !== undefined) data.settings.borrowLimit = parseInt(borrowLimit);
    if (borrowDurationDays !== undefined) data.settings.borrowDurationDays = parseInt(borrowDurationDays);
    if (fineRatePerDay !== undefined) data.settings.fineRatePerDay = parseFloat(fineRatePerDay);
    if (allowRenewals !== undefined) data.settings.allowRenewals = allowRenewals;

    logAction(userId || "Admin", "Update Settings", "Updated system borrowing and fine rules");
    res.json(data.settings);
  });
});

app.get("/api/notifications", (req: Request, res: Response) => {
  const { userId } = req.query;
  const data = db.get();

  let list = data.notifications;
  if (userId) {
    list = list.filter((n) => n.userId === userId);
  }
  res.json(list);
});

app.post("/api/notifications/read", (req: Request, res: Response) => {
  const { notificationId, userId } = req.body;

  db.transaction((data) => {
    if (notificationId) {
      const notif = data.notifications.find((n) => n.id === notificationId);
      if (notif) notif.isRead = true;
    } else if (userId) {
      data.notifications.filter((n) => n.userId === userId).forEach((n) => (n.isRead = true));
    }
    res.json({ success: true });
  });
});

app.get("/api/audit-logs", (req: Request, res: Response) => {
  const data = db.get();
  const list = data.auditLogs.map((log) => {
    const user = data.users.find((u) => u.id === log.userId);
    return {
      ...log,
      userName: user ? user.name : "System",
      userEmail: user ? user.email : "",
    };
  });
  res.json(list);
});

// ==========================================
// VITE INTEGRATION / STATIC ASSETS
// ==========================================

if (process.env.NODE_ENV === "production") {
  // Serve static UI assets from Vite build output folder 'dist'
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));

  app.get("*", (req: Request, res: Response) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  // Integrate Vite dynamically as dev server middleware
  import("vite").then(async (Vite) => {
    const viteServer = await Vite.createServer({
      server: {
        middlewareMode: true,
        hmr: false, // comply with workspace setting
      },
      appType: "spa",
    });

    app.use(viteServer.middlewares);

    app.get("*", async (req: Request, res: Response, next: NextFunction) => {
      try {
        const indexHtml = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf-8");
        const transformedHtml = await viteServer.transformIndexHtml(req.url, indexHtml);
        res.status(200).set({ "Content-Type": "text/html" }).end(transformedHtml);
      } catch (e) {
        next(e);
      }
    });
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Libraflow server active at http://localhost:${PORT}`);
});
