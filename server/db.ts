import fs from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "server", "data", "db.json");

// Core DB interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "member" | "librarian" | "admin";
  phone: string;
  address: string;
  membershipType: "basic" | "premium" | "student";
  status: "active" | "suspended";
  joinDate: string;
  avatar?: string;
}

export interface Author {
  id: string;
  name: string;
  bio: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Book {
  id: string;
  isbn: string;
  title: string;
  authorId: string;
  publisher: string;
  edition: string;
  categoryId: string;
  genre: string;
  language: string;
  description: string;
  coverImage: string;
  totalCopies: number;
  availableCopies: number;
  shelfLocation: string;
}

export interface Borrow {
  id: string;
  userId: string;
  bookId: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  status: "active" | "returned" | "overdue";
}

export interface Reservation {
  id: string;
  userId: string;
  bookId: string;
  reserveDate: string;
  status: "pending" | "ready" | "cancelled" | "fulfilled";
  queuePosition: number;
}

export interface Fine {
  id: string;
  userId: string;
  borrowId: string;
  amount: number;
  status: "paid" | "pending" | "partial";
  createdDate: string;
  paidDate: string | null;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "due_reminder" | "reservation_ready" | "fine_generated" | "book_returned" | "system";
  isRead: boolean;
  createdDate: string;
}

export interface Rating {
  id: string;
  userId: string;
  bookId: string;
  rating: number; // 1-5
  comment: string;
  createdDate: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  favoriteGenres: string[];
  favoriteAuthors: string[];
  preferredLanguage: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  sender: "user" | "luna";
  createdDate: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  createdDate: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
}

export interface Settings {
  borrowLimit: number;
  borrowDurationDays: number;
  fineRatePerDay: number;
  allowRenewals: boolean;
}

export interface DBStructure {
  users: User[];
  authors: Author[];
  categories: Category[];
  books: Book[];
  borrows: Borrow[];
  reservations: Reservation[];
  fines: Fine[];
  notifications: Notification[];
  ratings: Rating[];
  userPreferences: UserPreferences[];
  chatHistory: ChatMessage[];
  auditLogs: AuditLog[];
  settings: Settings;
  branches: Branch[];
}

const DEFAULT_SETTINGS: Settings = {
  borrowLimit: 5,
  borrowDurationDays: 14,
  fineRatePerDay: 5, // ₹5 per day
  allowRenewals: true,
};

const INITIAL_DATA: DBStructure = {
  users: [
    {
      id: "U001",
      name: "Admin User",
      email: "admin@libraflow.com",
      passwordHash: "admin123", // Simple hash for demo
      role: "admin",
      phone: "+91 98765 43210",
      address: "Admin Residence, Tech City, Karnataka",
      membershipType: "premium",
      status: "active",
      joinDate: "2026-01-01",
    },
    {
      id: "U002",
      name: "Librarian Sarah",
      email: "sarah@libraflow.com",
      passwordHash: "librarian123",
      role: "librarian",
      phone: "+91 87654 32109",
      address: "Library Quarters, Central Wing",
      membershipType: "basic",
      status: "active",
      joinDate: "2026-01-10",
    },
    {
      id: "U003",
      name: "Md Naseer",
      email: "md.naseer1708@gmail.com",
      passwordHash: "member123",
      role: "member",
      phone: "+91 76543 21098",
      address: "Electronics Enclave, Bangalore",
      membershipType: "premium",
      status: "active",
      joinDate: "2026-02-15",
    },
    {
      id: "U004",
      name: "Aarav Sharma",
      email: "aarav@gmail.com",
      passwordHash: "member123",
      role: "member",
      phone: "+91 91122 33445",
      address: "Jayanagar 4th Block, Bangalore",
      membershipType: "student",
      status: "active",
      joinDate: "2026-03-01",
    }
  ],
  authors: [
    { id: "A001", name: "Andrew Hunt", bio: "Co-author of The Pragmatic Programmer and Agile Manifesto co-founder." },
    { id: "A002", name: "Ian Goodfellow", bio: "Pioneering AI researcher who invented Generative Adversarial Networks (GANs)." },
    { id: "A003", name: "Robert C. Martin", bio: "Legendary programmer, author of Clean Code and agile movement leader." },
    { id: "A004", name: "Frank Herbert", bio: "Acclaimed science fiction author, creator of the epic Dune universe." },
    { id: "A005", name: "James Clear", bio: "Author and speaker focused on habits, decision-making, and continuous improvement." },
    { id: "A006", name: "Guido van Rossum", bio: "Dutch programmer, creator of the Python programming language." }
  ],
  categories: [
    { id: "C001", name: "Computer Science", description: "Programming, software design, and engineering algorithms." },
    { id: "C002", name: "Artificial Intelligence", description: "Machine learning, neural networks, and prompt engineering." },
    { id: "C003", name: "Fiction & Sci-Fi", description: "Imaginative futures and narrative fiction worlds." },
    { id: "C004", name: "Self-Help", description: "Personal development, productivity, and habit creation." }
  ],
  books: [
    {
      id: "B001",
      isbn: "978-0135957059",
      title: "The Pragmatic Programmer",
      authorId: "A001",
      publisher: "Addison-Wesley",
      edition: "20th Anniversary Edition",
      categoryId: "C001",
      genre: "Software Engineering",
      language: "English",
      description: "One of the most significant books on software development, helping readers become better programmers.",
      coverImage: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400",
      totalCopies: 5,
      availableCopies: 3,
      shelfLocation: "Aisle A, Shelf 3"
    },
    {
      id: "B002",
      isbn: "978-0262035613",
      title: "Deep Learning",
      authorId: "A002",
      publisher: "MIT Press",
      edition: "1st Edition",
      categoryId: "C002",
      genre: "Artificial Intelligence",
      language: "English",
      description: "The definitive guide to Deep Learning, introducing neural networks, optimizer algorithms, and generative models.",
      coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=400",
      totalCopies: 3,
      availableCopies: 1,
      shelfLocation: "Aisle B, Shelf 1"
    },
    {
      id: "B003",
      isbn: "978-0132350884",
      title: "Clean Code",
      authorId: "A003",
      publisher: "Prentice Hall",
      edition: "1st Edition",
      categoryId: "C001",
      genre: "Software Development",
      language: "English",
      description: "A handbook of agile software craftsmanship that guides you on writing clean, maintainable, and readable code.",
      coverImage: "https://images.unsplash.com/photo-1516116211223-5c359a36298a?auto=format&fit=crop&q=80&w=400",
      totalCopies: 6,
      availableCopies: 6,
      shelfLocation: "Aisle A, Shelf 4"
    },
    {
      id: "B004",
      isbn: "978-0441172719",
      title: "Dune",
      authorId: "A004",
      publisher: "Chilton Books",
      edition: "Deluxe Edition",
      categoryId: "C003",
      genre: "Science Fiction",
      language: "English",
      description: "The sweeping space opera about the desert planet Arrakis, spice melange, and the rise of Paul Atreides.",
      coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400",
      totalCopies: 4,
      availableCopies: 3,
      shelfLocation: "Aisle C, Shelf 2"
    },
    {
      id: "B005",
      isbn: "978-1847941831",
      title: "Atomic Habits",
      authorId: "A005",
      publisher: "Penguin Random House",
      edition: "Standard Edition",
      categoryId: "C004",
      genre: "Personal Development",
      language: "English",
      description: "An easy and proven way to build good habits and break bad ones through tiny 1% daily increments.",
      coverImage: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400",
      totalCopies: 8,
      availableCopies: 7,
      shelfLocation: "Aisle D, Shelf 1"
    },
    {
      id: "B006",
      isbn: "978-1491912058",
      title: "Learning Python",
      authorId: "A006",
      publisher: "O'Reilly Media",
      edition: "5th Edition",
      categoryId: "C001",
      genre: "Programming Languages",
      language: "English",
      description: "Get a comprehensive, in-depth introduction to the core Python language with hands-on tutorials.",
      coverImage: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&q=80&w=400",
      totalCopies: 5,
      availableCopies: 5,
      shelfLocation: "Aisle A, Shelf 5"
    }
  ],
  borrows: [
    {
      id: "BRW001",
      userId: "U003",
      bookId: "B001",
      borrowDate: "2026-06-15",
      dueDate: "2026-06-29",
      returnDate: null,
      status: "active"
    },
    {
      id: "BRW002",
      userId: "U003",
      bookId: "B002",
      borrowDate: "2026-05-10",
      dueDate: "2026-05-24",
      returnDate: "2026-05-22",
      status: "returned"
    },
    {
      id: "BRW003",
      userId: "U004",
      bookId: "B002",
      borrowDate: "2026-06-01",
      dueDate: "2026-06-15",
      returnDate: null,
      status: "overdue"
    }
  ],
  reservations: [
    {
      id: "RES001",
      userId: "U003",
      bookId: "B004",
      reserveDate: "2026-06-25",
      status: "pending",
      queuePosition: 1
    }
  ],
  fines: [
    {
      id: "FN001",
      userId: "U004",
      borrowId: "BRW003",
      amount: 55, // 11 days overdue * ₹5
      status: "pending",
      createdDate: "2026-06-16",
      paidDate: null
    }
  ],
  notifications: [
    {
      id: "NT001",
      userId: "U003",
      title: "Book Borrowed Successfully",
      message: "You have borrowed 'The Pragmatic Programmer'. Due date is June 29, 2026.",
      type: "system",
      isRead: false,
      createdDate: "2026-06-15"
    },
    {
      id: "NT002",
      userId: "U004",
      title: "Overdue Notice",
      message: "Your borrow for 'Deep Learning' is overdue. Fine accumulated is ₹55.",
      type: "due_reminder",
      isRead: false,
      createdDate: "2026-06-16"
    }
  ],
  ratings: [
    {
      id: "RT001",
      userId: "U003",
      bookId: "B001",
      rating: 5,
      comment: "Absolutely essential reading for every modern programmer. Beautifully written.",
      createdDate: "2026-05-01"
    },
    {
      id: "RT002",
      userId: "U003",
      bookId: "B002",
      rating: 4,
      comment: "Very comprehensive, but mathematical rigor makes it tough for absolute beginners.",
      createdDate: "2026-05-23"
    }
  ],
  userPreferences: [
    {
      id: "UP001",
      userId: "U003",
      favoriteGenres: ["Software Engineering", "Artificial Intelligence", "Science Fiction"],
      favoriteAuthors: ["Andrew Hunt", "Ian Goodfellow"],
      preferredLanguage: "English"
    }
  ],
  chatHistory: [],
  auditLogs: [
    {
      id: "LOG001",
      userId: "U001",
      action: "System Initialized",
      details: "Seed data populated successfully",
      createdDate: "2026-06-26T23:15:00"
    }
  ],
  settings: DEFAULT_SETTINGS,
  branches: [
    { id: "BR001", name: "Central Library Hub", address: "MG Road, Landmark Tower, Bangalore", phone: "+91 80 1234 5678" },
    { id: "BR002", name: "Silicon Enclave Branch", address: "Whitefield Main Rd, Bangalore", phone: "+91 80 8765 4321" }
  ]
};

class FileDB {
  private cache: DBStructure | null = null;

  constructor() {
    this.init();
  }

  private init() {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), "utf-8");
    }
  }

  public get(): DBStructure {
    if (this.cache) return this.cache;
    try {
      this.init();
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      this.cache = JSON.parse(raw);
      return this.cache!;
    } catch (e) {
      console.error("Error reading database file, returning default", e);
      return INITIAL_DATA;
    }
  }

  public save(data: DBStructure) {
    this.cache = data;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing to database file", e);
    }
  }

  // Helper transaction wrapper
  public transaction<T>(fn: (db: DBStructure) => T): T {
    const db = this.get();
    const result = fn(db);
    this.save(db);
    return result;
  }
}

export const db = new FileDB();
