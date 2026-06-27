/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Users,
  Calendar,
  AlertTriangle,
  Search,
  Plus,
  ArrowRightLeft,
  Settings,
  Bot,
  TrendingUp,
  Award,
  Bell,
  LogOut,
  Sliders,
  DollarSign,
  QrCode,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  Layers,
  MapPin,
  Clock,
  CheckCircle2,
  Bookmark,
  FileSpreadsheet,
  Trash2,
  X,
  Send,
  Loader2,
  PlusCircle,
  HelpCircle,
  Eye,
  EyeOff
} from "lucide-react";

// Types corresponding to server structures
interface Book {
  id: string;
  isbn: string;
  title: string;
  authorId: string;
  authorName: string;
  publisher: string;
  edition: string;
  categoryId: string;
  categoryName: string;
  genre: string;
  language: string;
  description: string;
  coverImage: string;
  totalCopies: number;
  availableCopies: number;
  shelfLocation: string;
  matchPercentage?: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "member" | "librarian" | "admin";
  phone: string;
  address: string;
  membershipType: "basic" | "premium" | "student";
  status: "active" | "suspended";
  joinDate: string;
}

interface Borrow {
  id: string;
  userId: string;
  bookId: string;
  bookTitle: string;
  bookIsbn: string;
  memberName: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  status: "active" | "returned" | "overdue";
}

interface Reservation {
  id: string;
  userId: string;
  bookId: string;
  bookTitle: string;
  memberName: string;
  reserveDate: string;
  status: "pending" | "ready" | "cancelled" | "fulfilled";
  queuePosition: number;
}

interface Fine {
  id: string;
  userId: string;
  borrowId: string;
  bookTitle: string;
  memberName: string;
  amount: number;
  status: "paid" | "pending" | "partial";
  createdDate: string;
  paidDate: string | null;
}

interface LibraryNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "due_reminder" | "reservation_ready" | "fine_generated" | "book_returned" | "system";
  isRead: boolean;
  createdDate: string;
}

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  details: string;
  createdDate: string;
}

interface LibrarySettings {
  borrowLimit: number;
  borrowDurationDays: number;
  fineRatePerDay: number;
  allowRenewals: boolean;
}

interface DashboardMetrics {
  totalBooks: number;
  totalBookTitles: number;
  activeMembers: number;
  issuedToday: number;
  activeBorrowsCount: number;
  overdueCount: number;
  fineCollected: number;
  pendingFines: number;
  branchesCount: number;
  librariansCount: number;
}

interface DashboardData {
  metrics: DashboardMetrics;
  popularBooks: { title: string; author: string; borrowCount: number }[];
  categoryDistribution: { name: string; value: number }[];
  monthlyTransactions: { month: string; borrowed: number; returned: number }[];
}

// CAPTCHA Drawing Component
const CaptchaCanvas = ({ code, onClick }: { code: string; onClick: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill background with a modern grid pattern
    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw some random background circles
    for (let i = 0; i < 15; i++) {
      ctx.fillStyle = `rgba(${Math.floor(Math.random() * 150) + 100}, ${Math.floor(Math.random() * 150) + 100}, ${Math.floor(Math.random() * 150) + 100}, 0.12)`;
      ctx.beginPath();
      ctx.arc(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 12 + 4,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Draw some noisy wavy background lines
    ctx.strokeStyle = "rgba(100, 116, 139, 0.25)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, Math.random() * canvas.height);
      ctx.bezierCurveTo(
        canvas.width / 3, Math.random() * canvas.height,
        (canvas.width * 2) / 3, Math.random() * canvas.height,
        canvas.width, Math.random() * canvas.height
      );
      ctx.stroke();
    }

    // Draw the code characters with random rotation, color, and vertical offset
    ctx.textBaseline = "middle";
    const charWidth = canvas.width / (code.length + 1);
    
    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      // Randomize color per letter
      const colors = ["#2563EB", "#1D4ED8", "#4F46E5", "#059669", "#DC2626", "#7C3AED", "#0891B2"];
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      
      // Randomize font size slightly
      const fontSize = Math.floor(Math.random() * 5) + 20; // 20-25px
      ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;

      // Position
      const x = (i + 0.65) * charWidth;
      const y = canvas.height / 2 + (Math.random() * 8 - 4);

      // Save context state, translate, rotate, and restore
      ctx.save();
      ctx.translate(x, y);
      const angle = (Math.random() * 30 - 15) * (Math.PI / 180); // -15 to 15 degrees
      ctx.rotate(angle);
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }

    // Add extra tiny noise dots
    for (let i = 0; i < 35; i++) {
      ctx.fillStyle = "rgba(148, 163, 184, 0.4)";
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }
  }, [code]);

  return (
    <canvas
      ref={canvasRef}
      width={150}
      height={44}
      onClick={onClick}
      className="border border-[#CBD5E1] rounded-xl overflow-hidden shadow-xs cursor-pointer hover:border-blue-400 transition-all"
      title="Click to refresh security code"
    />
  );
};

export default function App() {
  // Authentication & Session
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("libraflow_user");
    return saved ? JSON.parse(saved) : null;
  });

  // UI Navigation Tabs
  // "catalog" | "luna" | "my-loans" | "librarian-panel" | "admin-panel" | "reports"
  const [activeTab, setActiveTab] = useState<string>("catalog");

  // Auth Forms
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [forgotEmail, setForgotEmail] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const [authSuccess, setAuthSuccess] = useState<string>("");

  // Show/Hide Password states
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);

  // Captcha authentication state
  const [captchaId, setCaptchaId] = useState<string>("");
  const [captchaCode, setCaptchaCode] = useState<string>("");
  const [captchaInput, setCaptchaInput] = useState<string>("");

  // Register Form
  const [regName, setRegName] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regPassword, setRegPassword] = useState<string>("");
  const [regPhone, setRegPhone] = useState<string>("");
  const [regAddress, setRegAddress] = useState<string>("");
  const [regRole, setRegRole] = useState<"member" | "librarian">("member");
  const [regMembership, setRegMembership] = useState<"basic" | "premium" | "student">("basic");

  // Application Data States
  const [books, setBooks] = useState<Book[]>([]);
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [borrows, setBorrows] = useState<Borrow[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [userReservations, setUserReservations] = useState<Reservation[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [notifications, setNotifications] = useState<LibraryNotification[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<LibrarySettings | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  // Search, Filtering & Selection states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Luna Chatbot states
  const [chatInput, setChatInput] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<{ sender: "user" | "luna"; text: string }[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [isLunaExpanded, setIsLunaExpanded] = useState<boolean>(false);

  // Notifications state
  const [showNotificationDropdown, setShowNotificationDropdown] = useState<boolean>(false);

  // Custom Toast/Notification and Modal prompt overlays
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  } | null>(null);
  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    placeholder?: string;
    onConfirm: (val: string) => void;
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void, confirmText = "Confirm", cancelText = "Cancel") => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(null);
      }
    });
  };

  const showPrompt = (title: string, message: string, placeholder: string, onConfirm: (val: string) => void) => {
    setPromptModal({
      isOpen: true,
      title,
      message,
      placeholder,
      onConfirm: (val) => {
        onConfirm(val);
        setPromptModal(null);
      }
    });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Modal / Form trigger states
  const [showAddBookModal, setShowAddBookModal] = useState<boolean>(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [showIssueModal, setShowIssueModal] = useState<boolean>(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<User | null>(null);

  // Form Field states for Add/Edit Book
  const [bookForm, setBookForm] = useState({
    isbn: "", title: "", authorName: "", publisher: "", edition: "",
    categoryName: "Computer Science", genre: "", language: "English",
    description: "", coverImage: "", totalCopies: "3", shelfLocation: ""
  });

  // CSV Import State
  const [csvContent, setCsvContent] = useState<string>("");
  const [showCsvImport, setShowCsvImport] = useState<boolean>(false);

  // User Self Profile & Password modal states
  const [showSelfSettingsModal, setShowSelfSettingsModal] = useState<boolean>(false);
  const [selfSettingsTab, setSelfSettingsTab] = useState<"profile" | "password">("profile");
  const [selfProfileForm, setSelfProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });
  const [selfPasswordForm, setSelfPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: ""
  });

  // Issue Form fields
  const [issueUserId, setIssueUserId] = useState<string>("");
  const [issueBookId, setIssueBookId] = useState<string>("");

  // Member Form fields
  const [memberForm, setMemberForm] = useState({
    name: "", email: "", phone: "", address: "", membershipType: "basic" as "basic" | "premium" | "student",
    role: "member" as "member" | "librarian", password: "member123"
  });

  // Settings Edit values
  const [settingsForm, setSettingsForm] = useState({
    borrowLimit: 5, borrowDurationDays: 14, fineRatePerDay: 5, allowRenewals: true
  });

  // Load Initial Core Application Data
  useEffect(() => {
    // Clear any previous user-specific state to prevent cross-account data bleeding
    setChatHistory([]);
    setBorrows([]);
    setFines([]);
    setReservations([]);
    setUserReservations([]);
    setRecommendations([]);

    fetchBooks();
    fetchNotifications();
    if (currentUser) {
      fetchRecommendations();
      fetchUserLoans();
      fetchDashboardMetrics();
      fetchSystemSettings();
      fetchChatHistory();
      if (currentUser.role === "librarian" || currentUser.role === "admin") {
        fetchMembers();
        fetchAllLoans();
        fetchFines();
        fetchReservations();
      }
      if (currentUser.role === "admin") {
        fetchAuditLogs();
      }
    } else {
      fetchCaptcha();
    }
  }, [currentUser]);

  // Dynamic calculations
  const genres = Array.from(new Set(books.map((b) => b.genre))).filter(Boolean);
  const categories = Array.from(new Set(books.map((b) => b.categoryName))).filter(Boolean);

  const filteredBooks = books.filter((b) => {
    const s = searchQuery.toLowerCase();
    const matchesSearch =
      b.title.toLowerCase().includes(s) ||
      b.authorName.toLowerCase().includes(s) ||
      b.isbn.toLowerCase().includes(s) ||
      b.genre.toLowerCase().includes(s) ||
      b.categoryName.toLowerCase().includes(s);

    const matchesGenre = selectedGenre ? b.genre === selectedGenre : true;
    const matchesCategory = selectedCategory ? b.categoryName === selectedCategory : true;
    const matchesAvailable = onlyAvailable ? b.availableCopies > 0 : true;

    return matchesSearch && matchesGenre && matchesCategory && matchesAvailable;
  });

  // API Call Helpers
  const fetchBooks = async () => {
    try {
      const res = await fetch("/api/books");
      if (res.ok) {
        const data = await res.json();
        setBooks(data);
      }
    } catch (e) {
      console.error("Failed to load books", e);
    }
  };

  const fetchRecommendations = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/recommendations?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data);
      }
    } catch (e) {
      console.error("Failed to load recommendations", e);
    }
  };

  const fetchChatHistory = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/chatbot/history?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((msg: any) => ({
          sender: msg.sender,
          text: msg.message,
        }));
        setChatHistory(mapped);
      }
    } catch (e) {
      console.error("Failed to load chat history", e);
    }
  };

  const fetchUserLoans = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/borrows?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setBorrows(data);
      }
      const resRes = await fetch(`/api/reservations?userId=${currentUser.id}`);
      if (resRes.ok) {
        const data = await resRes.json();
        setUserReservations(data);
      }
      const resFine = await fetch(`/api/fines?userId=${currentUser.id}`);
      if (resFine.ok) {
        const data = await resFine.json();
        setFines(data);
      }
    } catch (e) {
      console.error("Failed to load user loans", e);
    }
  };

  const fetchAllLoans = async () => {
    try {
      const res = await fetch("/api/borrows");
      if (res.ok) {
        const data = await res.json();
        setBorrows(data);
      }
    } catch (e) {
      console.error("Failed to fetch all borrows", e);
    }
  };

  const fetchFines = async () => {
    try {
      const res = await fetch("/api/fines");
      if (res.ok) {
        const data = await res.json();
        setFines(data);
      }
    } catch (e) {
      console.error("Failed to fetch fines", e);
    }
  };

  const fetchReservations = async () => {
    try {
      const res = await fetch("/api/reservations");
      if (res.ok) {
        const data = await res.json();
        setReservations(data);
      }
    } catch (e) {
      console.error("Failed to fetch reservations", e);
    }
  };

  const fetchNotifications = async () => {
    const url = currentUser ? `/api/notifications?userId=${currentUser.id}` : "/api/notifications";
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/members");
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (e) {
      console.error("Failed to load members", e);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch("/api/audit-logs");
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (e) {
      console.error("Failed to load audit logs", e);
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setSettingsForm({
          borrowLimit: data.borrowLimit,
          borrowDurationDays: data.borrowDurationDays,
          fineRatePerDay: data.fineRatePerDay,
          allowRenewals: data.allowRenewals,
        });
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  };

  const fetchDashboardMetrics = async () => {
    try {
      const res = await fetch("/api/reports/summary");
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
      }
    } catch (e) {
      console.error("Failed to load dashboard metrics", e);
    }
  };

  // Fetch active CAPTCHA challenge
  const fetchCaptcha = async () => {
    try {
      const res = await fetch("/api/auth/captcha");
      if (res.ok) {
        const data = await res.json();
        setCaptchaId(data.id);
        setCaptchaCode(data.code);
        setCaptchaInput("");
      }
    } catch (e) {
      console.error("Failed to fetch captcha", e);
    }
  };

  // Demo account quick login
  const handleQuickLogin = async (role: "admin" | "librarian" | "member" | "member2") => {
    setAuthError("");
    setAuthSuccess("");
    let email = "admin@libraflow.com";
    let password = "admin123";

    if (role === "librarian") {
      email = "sarah@libraflow.com";
      password = "librarian123";
    } else if (role === "member") {
      email = "md.naseer1708@gmail.com";
      password = "member123";
    } else if (role === "member2") {
      email = "aarav@gmail.com";
      password = "member123";
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, isDemoBypass: true }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("libraflow_user", JSON.stringify(data.user));
        setCurrentUser(data.user);
        setActiveTab("catalog");
        setAuthSuccess(`Welcome back, ${data.user.name}!`);
      } else {
        setAuthError(data.error || "Login failed.");
      }
    } catch (err) {
      setAuthError("Failed to connect to authentication server.");
    }
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!loginEmail || !loginPassword) {
      setAuthError("Please fill in all credentials.");
      return;
    }

    if (!captchaInput) {
      setAuthError("Please verify the Captcha security code.");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
          captchaId,
          captchaValue: captchaInput
        }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("libraflow_user", JSON.stringify(data.user));
        setCurrentUser(data.user);
        setActiveTab("catalog");
        setAuthSuccess(`Success! Welcome, ${data.user.name}.`);
      } else {
        setAuthError(data.error || "Invalid credentials.");
        fetchCaptcha(); // Refresh captcha on failure
      }
    } catch (err) {
      setAuthError("Server communication issue.");
      fetchCaptcha();
    }
  };

  // Register Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!regName || !regEmail || !regPassword) {
      setAuthError("Name, Email, and Password are required.");
      return;
    }

    if (!captchaInput) {
      setAuthError("Please verify the Captcha security code.");
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          phone: regPhone,
          address: regAddress,
          role: regRole,
          membershipType: regMembership,
          captchaId,
          captchaValue: captchaInput
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAuthSuccess("Registration completed! Please log in.");
        setIsRegistering(false);
        setLoginEmail(regEmail);
        fetchCaptcha(); // Refresh for login screen
      } else {
        setAuthError(data.error || "Registration issue.");
        fetchCaptcha();
      }
    } catch (err) {
      setAuthError("Server communication issue during registration.");
      fetchCaptcha();
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("libraflow_user");
    setCurrentUser(null);
    setActiveTab("catalog");
    setBooks([]);
    setBorrows([]);
    setFines([]);
    setReservations([]);
    setUserReservations([]);
    setChatHistory([]);
    setChatInput("");
  };

  // Book Add or Edit
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = editingBook ? `/api/books/${editingBook.id}` : "/api/books";
    const method = editingBook ? "PUT" : "POST";

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...bookForm, userId: currentUser?.id }),
      });

      if (res.ok) {
        setShowAddBookModal(false);
        setEditingBook(null);
        setBookForm({
          isbn: "", title: "", authorName: "", publisher: "", edition: "",
          categoryName: "Computer Science", genre: "", language: "English",
          description: "", coverImage: "", totalCopies: "3", shelfLocation: ""
        });
        fetchBooks();
        fetchDashboardMetrics();
        showToast("Book saved successfully!", "success");
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to save book.", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Book Delete
  const handleDeleteBook = async (id: string) => {
    showConfirm(
      "Delete Book",
      "Are you sure you want to delete this book from catalog?",
      async () => {
        try {
          const res = await fetch(`/api/books/${id}?userId=${currentUser?.id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            fetchBooks();
            fetchDashboardMetrics();
            showToast("Book successfully deleted from catalog.", "success");
          }
        } catch (e) {
          console.error(e);
        }
      }
    );
  };

  // Edit Book modal setup
  const openEditBookModal = (b: Book) => {
    setEditingBook(b);
    setBookForm({
      isbn: b.isbn,
      title: b.title,
      authorName: b.authorName,
      publisher: b.publisher,
      edition: b.edition,
      categoryName: b.categoryName,
      genre: b.genre,
      language: b.language,
      description: b.description,
      coverImage: b.coverImage,
      totalCopies: b.totalCopies.toString(),
      shelfLocation: b.shelfLocation,
    });
    setShowAddBookModal(true);
  };

  // CSV Book import
  const handleImportCsv = async () => {
    if (!csvContent) return;
    try {
      const res = await fetch("/api/books/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvContent, userId: currentUser?.id }),
      });
      if (res.ok) {
        const data = await res.json();
        showToast(data.message, "success");
        setCsvContent("");
        setShowCsvImport(false);
        fetchBooks();
        fetchDashboardMetrics();
      } else {
        const data = await res.json();
        showToast(data.error, "error");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save/Edit Member
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = editingMember ? `/api/members/${editingMember.id}` : "/api/members";
    const method = editingMember ? "PUT" : "POST";

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...memberForm, userId: currentUser?.id }),
      });

      if (res.ok) {
        setShowAddMemberModal(false);
        setEditingMember(null);
        setMemberForm({
          name: "", email: "", phone: "", address: "", membershipType: "basic", role: "member", password: "member123"
        });
        fetchMembers();
        fetchDashboardMetrics();
        showToast("Member saved successfully!", "success");
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to process member.", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Member setup
  const openEditMemberModal = (m: User) => {
    setEditingMember(m);
    setMemberForm({
      name: m.name,
      email: m.email,
      phone: m.phone,
      address: m.address,
      membershipType: m.membershipType,
      role: m.role as "member" | "librarian",
      password: "same",
    });
    setShowAddMemberModal(true);
  };

  // Suspend Member Toggle
  const toggleMemberStatus = async (m: User) => {
    const nextStatus = m.status === "active" ? "suspended" : "active";
    try {
      const res = await fetch(`/api/members/${m.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, userId: currentUser?.id }),
      });
      if (res.ok) {
        fetchMembers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Issue Book Submit
  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueUserId || !issueBookId) return;

    try {
      const res = await fetch("/api/borrows/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: issueUserId,
          bookId: issueBookId,
          librarianId: currentUser?.id,
        }),
      });

      if (res.ok) {
        setShowIssueModal(false);
        setIssueUserId("");
        setIssueBookId("");
        fetchAllLoans();
        fetchBooks();
        fetchDashboardMetrics();
        showToast("Book successfully issued to member!", "success");
      } else {
        const err = await res.json();
        showToast(err.error || "Could not issue book.", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Approve Borrow or Hold Request by Librarian
  const handleApproveRequest = async (resId: string, userId: string, bookId: string) => {
    try {
      const res = await fetch("/api/borrows/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          bookId,
          librarianId: currentUser?.id,
        }),
      });

      if (res.ok) {
        fetchReservations();
        fetchAllLoans();
        fetchBooks();
        fetchDashboardMetrics();
        showToast("Borrow request approved successfully! Book is now checked out to the member.", "success");
      } else {
        const err = await res.json();
        showToast(err.error || "Could not approve and issue this book.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error approving request.", "error");
    }
  };

  // Decline / Cancel Request by Librarian
  const handleDeclineRequest = async (resId: string) => {
    showConfirm(
      "Decline Request",
      "Are you sure you want to decline this borrow request?",
      async () => {
        try {
          const res = await fetch("/api/reservations/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reservationId: resId }),
          });
          if (res.ok) {
            fetchReservations();
            fetchDashboardMetrics();
            showToast("Request declined / cancelled successfully.", "success");
          }
        } catch (e) {
          console.error(e);
        }
      }
    );
  };

  // Direct Book Borrow Request by Member
  const handleBorrowBookDirect = async (bookId: string) => {
    if (!currentUser) {
      showToast("Please sign in first.", "error");
      return;
    }

    const targetBook = books.find(b => b.id === bookId);
    showConfirm(
      "Confirm Borrow Request",
      `Are you sure you want to request to borrow "${targetBook ? targetBook.title : 'this book'}"? Once approved by Librarian, it will be checked out to your account for 14 days.`,
      async () => {
        try {
          const res = await fetch("/api/reservations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: currentUser.id,
              bookId: bookId,
            }),
          });

          if (res.ok) {
            fetchUserLoans();
            fetchReservations();
            fetchNotifications();
            fetchDashboardMetrics();
            showToast("Success! Your borrow request has been sent to the Librarian. You will be notified as soon as it is approved!", "success");
          } else {
            const err = await res.json();
            showToast(err.error || "Could not complete this borrow request.", "error");
          }
        } catch (e) {
          console.error(e);
          showToast("Error contacting the server.", "error");
        }
      }
    );
  };

  // Return Book
  const handleReturnBook = async (borrowId: string) => {
    try {
      const res = await fetch("/api/borrows/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ borrowId, librarianId: currentUser?.id }),
      });
      if (res.ok) {
        fetchAllLoans();
        fetchBooks();
        fetchFines();
        fetchReservations();
        fetchDashboardMetrics();
        showToast("Book returned successfully!", "success");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Renew Book
  const handleRenewBook = async (borrowId: string) => {
    try {
      const res = await fetch("/api/borrows/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ borrowId }),
      });
      if (res.ok) {
        fetchUserLoans();
        fetchAllLoans();
        showToast("Book due date successfully renewed!", "success");
      } else {
        const data = await res.json();
        showToast(data.error, "error");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Reserve Book Self-Service
  const handleReserveBook = async (bookId: string) => {
    if (!currentUser) {
      showToast("Please login first to reserve books.", "error");
      return;
    }
    const targetBook = books.find(b => b.id === bookId);
    showConfirm(
      "Confirm Queue / Hold Request",
      `Are you sure you want to request to be placed in the reservation queue for "${targetBook ? targetBook.title : 'this book'}"?`,
      async () => {
        try {
          const res = await fetch("/api/reservations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUser.id, bookId }),
          });
          if (res.ok) {
            fetchUserLoans();
            fetchReservations();
            showToast("Book reserved! You are placed in the queue.", "success");
          }
        } catch (e) {
          console.error(e);
        }
      }
    );
  };

  // Cancel Reservation
  const handleCancelReservation = async (resId: string) => {
    try {
      const res = await fetch("/api/reservations/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId: resId }),
      });
      if (res.ok) {
        fetchUserLoans();
        fetchReservations();
        showToast("Reservation cancelled successfully.", "success");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Pay Overdue Fine
  const handlePayFine = async (fineId: string) => {
    showPrompt(
      "Record Fine Payment",
      "Enter payment amount in ₹:",
      "10.00",
      async (amt) => {
        if (!amt) return;
        try {
          const res = await fetch("/api/fines/pay", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fineId, amountPaid: amt, userId: currentUser?.id }),
          });
          if (res.ok) {
            fetchUserLoans();
            fetchFines();
            fetchDashboardMetrics();
            showToast("Payment recorded! Updated status saved.", "success");
          }
        } catch (e) {
          console.error(e);
        }
      }
    );
  };

  // Luna AI Assistant Message Send
  const handleSendToLuna = async (textToSend?: string) => {
    const msg = textToSend || chatInput;
    if (!msg.trim()) return;

    const userMessage = { sender: "user" as const, text: msg };
    setChatHistory((prev) => [...prev, userMessage]);
    if (!textToSend) setChatInput("");
    setIsChatLoading(true);

    try {
      const formattedHistory = chatHistory.map((m) => ({
        role: m.sender === "user" ? ("user" as const) : ("model" as const),
        text: m.text,
      }));

      const res = await fetch("/api/chatbot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id,
          message: msg,
          history: formattedHistory,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatHistory((prev) => [...prev, { sender: "luna", text: data.reply }]);
      } else {
        setChatHistory((prev) => [...prev, { sender: "luna", text: "I had trouble talking to the cloud right now. But here is local Luna: Let me help search our books!" }]);
      }
    } catch (e) {
      setChatHistory((prev) => [...prev, { sender: "luna", text: "Let me assist locally: You can borrow 5 books for 14 days!" }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Update Settings from Admin Panel
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settingsForm, userId: currentUser?.id }),
      });
      if (res.ok) {
        showToast("Library configuration updated successfully!", "success");
        fetchSystemSettings();
        fetchDashboardMetrics();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Clear Notifications
  const handleClearNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // User profile & settings self update
  const openSelfSettings = () => {
    if (!currentUser) return;
    setSelfProfileForm({
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone || "",
      address: currentUser.address || ""
    });
    setSelfPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: ""
    });
    setSelfSettingsTab("profile");
    setShowSelfSettingsModal(true);
  };

  const handleUpdateSelfProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const res = await fetch("/api/users/self/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          ...selfProfileForm
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setCurrentUser(result.user);
        const stored = localStorage.getItem("libraflow_user");
        if (stored) {
          localStorage.setItem("libraflow_user", JSON.stringify(result.user));
        }
        showToast("Profile updated successfully!", "success");
        setShowSelfSettingsModal(false);
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to update profile.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating profile.", "error");
    }
  };

  const handleUpdateSelfPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (selfPasswordForm.newPassword !== selfPasswordForm.confirmNewPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }
    if (!selfPasswordForm.currentPassword || !selfPasswordForm.newPassword) {
      showToast("Please fill all password fields.", "error");
      return;
    }
    try {
      const res = await fetch("/api/users/self/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          currentPassword: selfPasswordForm.currentPassword,
          newPassword: selfPasswordForm.newPassword
        }),
      });
      if (res.ok) {
        showToast("Password updated successfully!", "success");
        setSelfPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: ""
        });
        setShowSelfSettingsModal(false);
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to update password.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating password.", "error");
    }
  };

  const handleDeleteSelfAccount = () => {
    if (!currentUser) return;
    showConfirm(
      "Delete Account Permanently",
      "Are you sure you want to permanently delete your account? This action cannot be undone and you will be immediately logged out.",
      async () => {
        try {
          const res = await fetch("/api/users/self", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUser.id })
          });
          if (res.ok) {
            showToast("Your account has been deleted.", "info");
            setCurrentUser(null);
            localStorage.removeItem("libraflow_user");
            setActiveTab("catalog");
            setShowSelfSettingsModal(false);
          } else {
            const err = await res.json();
            showToast(err.error || "Failed to delete account.", "error");
          }
        } catch (err) {
          console.error(err);
          showToast("Error deleting account.", "error");
        }
      },
      "Delete Forever",
      "Keep My Account"
    );
  };

  const handleDeleteMember = (memberId: string) => {
    showConfirm(
      "Delete User Account",
      `Are you sure you want to delete member ${memberId}? This will remove them permanently from the library registry.`,
      async () => {
        try {
          const res = await fetch(`/api/members/${memberId}?userId=${currentUser?.id}`, {
            method: "DELETE"
          });
          if (res.ok) {
            showToast("Member account deleted successfully.", "success");
            fetchMembers();
            fetchDashboardMetrics();
          } else {
            const err = await res.json();
            showToast(err.error || "Failed to delete member.", "error");
          }
        } catch (err) {
          console.error(err);
          showToast("Error deleting member.", "error");
        }
      }
    );
  };

  // Setup sample book gradient generators
  const getBookGradient = (title: string) => {
    const gradients = [
      "from-blue-600 to-indigo-900",
      "from-emerald-600 to-teal-900",
      "from-rose-600 to-amber-900",
      "from-violet-600 to-purple-900",
      "from-neutral-600 to-neutral-900",
      "from-cyan-600 to-blue-900",
    ];
    let sum = 0;
    for (let i = 0; i < title.length; i++) sum += title.charCodeAt(i);
    return gradients[sum % gradients.length];
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 selection:bg-blue-100 selection:text-blue-900">
        <div className="w-full max-w-md space-y-8">
          
          {/* Logo / Title Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto bg-blue-600 text-white w-14 h-14 rounded-2xl shadow-xl shadow-blue-100 flex items-center justify-center">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-extrabold text-3xl tracking-tight text-[#0F172A] flex items-center justify-center gap-2">
                LIBRAFLOW
              </h1>
              <p className="text-xs text-slate-500 mt-1">Automated Library Management System</p>
            </div>
          </div>

          {/* Card containing Login / Register */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-100 overflow-hidden">
            
            {/* Tab switchers */}
            <div className="flex border-b border-slate-100 bg-slate-50/50">
              <button
                onClick={() => {
                  setIsRegistering(false);
                  setAuthError("");
                  setAuthSuccess("");
                  fetchCaptcha();
                }}
                className={`flex-1 text-center py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                  !isRegistering
                    ? "border-b-2 border-blue-600 text-blue-600 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                🔐 Member Log In
              </button>
              <button
                onClick={() => {
                  setIsRegistering(true);
                  setAuthError("");
                  setAuthSuccess("");
                  fetchCaptcha();
                }}
                className={`flex-1 text-center py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                  isRegistering
                    ? "border-b-2 border-blue-600 text-blue-600 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                📝 Register Account
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Alert messages */}
              {authError && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-start gap-2.5">
                  <span className="text-base">⚠️</span>
                  <div>
                    <p className="font-semibold text-rose-800">Verification Problem</p>
                    <p className="text-[11px] leading-relaxed text-rose-600/90 mt-0.5">{authError}</p>
                  </div>
                </div>
              )}

              {authSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-xl flex items-start gap-2.5">
                  <span className="text-base">✅</span>
                  <div>
                    <p className="font-semibold text-emerald-800">Success!</p>
                    <p className="text-[11px] leading-relaxed text-emerald-600/90 mt-0.5">{authSuccess}</p>
                  </div>
                </div>
              )}

              {!isRegistering ? (
                /* LOGIN FORM */
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Email Address</label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="naseer@gmail.com"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Security Password</label>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-11 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                        title={showLoginPassword ? "Hide password" : "Show password"}
                      >
                        {showLoginPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* CAPTCHA SECTION */}
                  <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl space-y-3.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        🛡️ Captcha Verification
                      </label>
                      <button
                        type="button"
                        onClick={fetchCaptcha}
                        className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                        title="Generate new captcha image"
                      >
                        🔄 Refresh Code
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Interactive dynamic canvas */}
                      <CaptchaCanvas code={captchaCode} onClick={fetchCaptcha} />
                      
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          value={captchaInput}
                          onChange={(e) => setCaptchaInput(e.target.value)}
                          placeholder="Type security code"
                          maxLength={5}
                          className="w-full text-center tracking-widest font-mono font-bold text-sm uppercase bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-xs"
                          required
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                      Enter the distorted 5-letter alphanumeric code displayed on the safety panel.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-lg shadow-blue-100 cursor-pointer flex items-center justify-center gap-2"
                  >
                    🔐 Unlock LibraFlow Desk
                  </button>
                </form>
              ) : (
                /* REGISTER FORM */
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Full Name</label>
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Md Naseer"
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Email Address</label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="naseer@gmail.com"
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Password</label>
                      <div className="relative">
                        <input
                          type={showRegPassword ? "text" : "password"}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-11 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                          title={showRegPassword ? "Hide password" : "Show password"}
                        >
                          {showRegPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Contact Phone</label>
                      <input
                        type="text"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+91 99999 99999"
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Mailing Address</label>
                    <input
                      type="text"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      placeholder="Electronics Enclave, Bangalore"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">System Role</label>
                      <select
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value as "member" | "librarian")}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      >
                        <option value="member">👤 Member Patron</option>
                        <option value="librarian">📚 Staff Librarian</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Membership tier</label>
                      <select
                        value={regMembership}
                        onChange={(e) => setRegMembership(e.target.value as "basic" | "premium" | "student")}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      >
                        <option value="basic">Standard Basic</option>
                        <option value="student">Academic Student</option>
                        <option value="premium">Enterprise Premium</option>
                      </select>
                    </div>
                  </div>

                  {/* CAPTCHA SECTION */}
                  <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl space-y-3.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        🛡️ Captcha Verification
                      </label>
                      <button
                        type="button"
                        onClick={fetchCaptcha}
                        className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        🔄 Refresh Code
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Interactive dynamic canvas */}
                      <CaptchaCanvas code={captchaCode} onClick={fetchCaptcha} />
                      
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          value={captchaInput}
                          onChange={(e) => setCaptchaInput(e.target.value)}
                          placeholder="Type security code"
                          maxLength={5}
                          className="w-full text-center tracking-widest font-mono font-bold text-sm uppercase bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-xs"
                          required
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                      Verify security settings to create your automated library credentials.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-lg shadow-slate-100 cursor-pointer flex items-center justify-center gap-2"
                  >
                    📝 Create New Account
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* SDB Sandbox Quick-Access credentials widget */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                💡 Sandbox Developer Profiles
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                1-Click Autofill
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Autofill official test profiles and log in immediately. The server-side captcha checks are automatically handled with demo bypass tokens.
            </p>
            <div className="grid grid-cols-2 gap-2.5 pt-1.5">
              <button
                type="button"
                onClick={() => {
                  setLoginEmail("admin@libraflow.com");
                  setLoginPassword("admin123");
                  setCaptchaInput("DEMO_BYPASS");
                  handleQuickLogin("admin");
                }}
                className="bg-slate-50 border border-slate-200 hover:border-slate-400 text-slate-700 text-xs py-2.5 px-3 rounded-xl font-medium transition-all text-left flex items-center justify-between"
              >
                <span>🔐 Admin Portal</span>
                <span className="text-[9px] text-slate-400">admin</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginEmail("sarah@libraflow.com");
                  setLoginPassword("librarian123");
                  setCaptchaInput("DEMO_BYPASS");
                  handleQuickLogin("librarian");
                }}
                className="bg-slate-50 border border-slate-200 hover:border-slate-400 text-slate-700 text-xs py-2.5 px-3 rounded-xl font-medium transition-all text-left flex items-center justify-between"
              >
                <span>📚 Librarian</span>
                <span className="text-[9px] text-slate-400">sarah</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginEmail("md.naseer1708@gmail.com");
                  setLoginPassword("member123");
                  setCaptchaInput("DEMO_BYPASS");
                  handleQuickLogin("member");
                }}
                className="bg-slate-50 border border-slate-200 hover:border-slate-400 text-slate-700 text-xs py-2.5 px-3 rounded-xl font-medium transition-all text-left flex items-center justify-between"
              >
                <span>👤 Naseer (Premium)</span>
                <span className="text-[9px] text-slate-400">member</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginEmail("aarav@gmail.com");
                  setLoginPassword("member123");
                  setCaptchaInput("DEMO_BYPASS");
                  handleQuickLogin("member2");
                }}
                className="bg-slate-50 border border-slate-200 hover:border-slate-400 text-slate-700 text-xs py-2.5 px-3 rounded-xl font-medium transition-all text-left flex items-center justify-between"
              >
                <span>🎓 Aarav (Student)</span>
                <span className="text-[9px] text-slate-400">aarav</span>
              </button>
            </div>
          </div>

        </div>

        {/* Toast Alert */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border ${
              toast.type === "success" 
                ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                : toast.type === "error"
                ? "bg-rose-50 border-rose-100 text-rose-800"
                : "bg-blue-50 border-blue-100 text-blue-800"
            }`}>
              <span className="text-xs font-semibold">{toast.message}</span>
              <button 
                onClick={() => setToast(null)}
                className="text-xs font-bold hover:opacity-70 px-1 ml-2"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Confirm Modal */}
        {confirmModal && confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100">
              <h3 className="font-bold text-base text-[#0F172A] mb-2">{confirmModal.title}</h3>
              <p className="text-xs text-[#64748B] leading-relaxed mb-6">{confirmModal.message}</p>
              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  {confirmModal.cancelText || "Cancel"}
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  {confirmModal.confirmText || "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Prompt Modal */}
        {promptModal && promptModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100">
              <h3 className="font-bold text-base text-[#0F172A] mb-2">{promptModal.title}</h3>
              <p className="text-xs text-[#64748B] leading-relaxed mb-4">{promptModal.message}</p>
              
              <input
                id="prompt-input-login"
                type="text"
                defaultValue={promptModal.placeholder || ""}
                placeholder="Type your response here..."
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-[#0F172A] text-xs mb-6 focus:ring-2 focus:ring-blue-500 outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    promptModal.onConfirm((e.currentTarget as HTMLInputElement).value);
                  }
                }}
              />
              
              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => setPromptModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const input = document.getElementById("prompt-input-login") as HTMLInputElement;
                    promptModal.onConfirm(input?.value || "");
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-blue-100 selection:text-blue-900 flex flex-col">
      
      {/* Top Navbar Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0] px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-md shadow-blue-100 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-[#0F172A] flex items-center gap-1.5">
              LIBRAFLOW
            </h1>
            <p className="text-xs text-[#64748B]">Automated Library Ecosystem</p>
          </div>
        </div>

        {/* Search Input Quick Assist */}
        <div className="hidden md:flex items-center gap-2 max-w-md w-full mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-2.5 w-4.5 h-4.5 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search books, authors, categories or ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#F1F5F9] border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-[#0F172A]"
            />
          </div>
        </div>

        {/* User profile & Notifications widget */}
        <div className="flex items-center gap-4">
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotificationDropdown(!showNotificationDropdown);
                  if (!showNotificationDropdown) fetchNotifications();
                }}
                className="relative p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-xl transition-all"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {notifications.filter((n) => !n.isRead).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
                )}
              </button>

              {/* Notification dropdown */}
              {showNotificationDropdown && (
                <div className="absolute right-0 mt-3.5 w-80 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl z-50 p-4">
                  <div className="flex items-center justify-between mb-3 border-b border-[#F1F5F9] pb-2">
                    <span className="font-semibold text-sm text-[#0F172A]">Notifications</span>
                    <button
                      onClick={handleClearNotifications}
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-[#64748B] text-center py-4">No new notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className={`p-2.5 rounded-xl text-xs transition-all ${n.isRead ? 'bg-transparent' : 'bg-[#F8FAFC]'}`}>
                          <div className="font-semibold text-[#0F172A] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block"></span>
                            {n.title}
                          </div>
                          <p className="text-[#64748B] mt-0.5 leading-relaxed">{n.message}</p>
                          <span className="text-[10px] text-[#94A3B8] block mt-1">{n.createdDate}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentUser ? (
            <div className="flex items-center gap-3 bg-[#F1F5F9] pl-3.5 pr-2.5 py-1.5 rounded-xl border border-[#E2E8F0]">
              <div className="text-right">
                <p className="text-xs font-semibold text-[#0F172A] leading-tight">{currentUser.name}</p>
                <span className="text-[10px] uppercase tracking-wider text-blue-600 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100 inline-block mt-0.5">
                  {currentUser.role}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={openSelfSettings}
                  className="p-1.5 text-[#64748B] hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                  title="Profile & Settings"
                >
                  <Settings className="w-4 h-4 animate-hover-spin" />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <span className="text-xs font-semibold text-[#64748B] bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              Visitor View Mode
            </span>
          )}
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* Left Sidebar Navigation */}
        <aside className="w-full lg:w-64 bg-white border-r border-[#E2E8F0] p-5 space-y-7 flex-shrink-0">
          
          {/* Active Status Board */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-inner uppercase">
              {currentUser.name.substr(0, 2)}
            </div>
            <div>
              <p className="text-xs font-bold text-[#0F172A] truncate w-36">{currentUser.name}</p>
              <p className="text-[10px] text-[#64748B] font-mono tracking-tight">{currentUser.id}</p>
            </div>
          </div>

          {/* Navigation Links Group */}
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-widest pl-2.5 mb-2.5">
              General
            </p>
            <button
              onClick={() => setActiveTab("catalog")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "catalog"
                  ? "bg-blue-50 text-blue-600 border border-blue-100"
                  : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Book Catalog
            </button>

            <button
              onClick={() => setActiveTab("luna")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "luna"
                  ? "bg-blue-50 text-blue-600 border border-blue-100"
                  : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
              }`}
            >
              <Bot className="w-4 h-4 text-indigo-500" />
              Luna Assistant
              <span className="ml-auto w-1.5 h-1.5 bg-indigo-500 rounded-full ring-2 ring-indigo-100 animate-pulse"></span>
            </button>

            {currentUser && (
              <button
                onClick={() => setActiveTab("my-loans")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "my-loans"
                    ? "bg-blue-50 text-blue-600 border border-blue-100"
                    : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                }`}
              >
                <Bookmark className="w-4 h-4" />
                My Reading Hub
              </button>
            )}

            {/* Librarian Controls tab */}
            {currentUser && (currentUser.role === "librarian" || currentUser.role === "admin") && (
              <>
                <p className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-widest pl-2.5 mt-5 mb-2.5">
                  Librarian Desk
                </p>
                <button
                  onClick={() => setActiveTab("librarian-panel")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === "librarian-panel"
                      ? "bg-blue-50 text-blue-600 border border-blue-100"
                      : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <ArrowRightLeft className="w-4 h-4 text-emerald-500" />
                  Circulation Desk
                </button>
                <button
                  onClick={() => setActiveTab("reports")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === "reports"
                      ? "bg-blue-50 text-blue-600 border border-blue-100"
                      : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  Reports & Analytics
                </button>
              </>
            )}

            {/* Admin Controls tab */}
            {currentUser && currentUser.role === "admin" && (
              <>
                <p className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-widest pl-2.5 mt-5 mb-2.5">
                  System Settings
                </p>
                <button
                  onClick={() => setActiveTab("admin-panel")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === "admin-panel"
                      ? "bg-blue-50 text-blue-600 border border-blue-100"
                      : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Admin Control Panel
                </button>
              </>
            )}
          </div>

          {/* Quick Stats sidebar widget */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 space-y-3.5">
            <span className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider block">System Health</span>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#64748B]">Database:</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Active
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#64748B]">Storage:</span>
              <span className="text-[#0F172A]">84.2 MB / 5 GB</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#64748B]">API Status:</span>
              <span className="text-[#0F172A]">Good</span>
            </div>
          </div>
        </aside>

        {/* Dynamic Center Work Area */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          
          {/* TAB 1: BOOK CATALOG */}
          {activeTab === "catalog" && (
            <div className="space-y-6">
              
              {/* Header / Intro section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E8F0]">
                <div>
                  <h2 className="text-xl font-bold text-[#0F172A]">Core Book Inventory</h2>
                  <p className="text-xs text-[#64748B] mt-0.5">Browse physical shelves, check availability, and hold copies.</p>
                </div>
                
                {currentUser && (currentUser.role === "librarian" || currentUser.role === "admin") && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAddBookModal(true)}
                      className="bg-blue-600 text-white hover:bg-blue-700 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-blue-100 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add New Book
                    </button>
                    <button
                      onClick={() => setShowCsvImport(!showCsvImport)}
                      className="bg-slate-900 text-white hover:bg-black font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Import CSV
                    </button>
                  </div>
                )}
              </div>

              {/* CSV Import Panel if active */}
              {showCsvImport && (
                <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl space-y-3.5 shadow-md">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-[#0F172A]">Batch Upload CSV</h3>
                    <button onClick={() => setShowCsvImport(false)} className="text-[#64748B] hover:text-[#0F172A]">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-[#64748B]">Paste comma-separated rows. Required Headers: <code>title,isbn,author,category,genre,copies</code></p>
                  <textarea
                    placeholder="title,isbn,author,category,genre,copies&#10;Hands-On Machine Learning,978-1492032649,Aurélien Géron,Artificial Intelligence,AI,5&#10;Database Design,978-1484211921,John Doe,Computer Science,Database,2"
                    rows={4}
                    value={csvContent}
                    onChange={(e) => setCsvContent(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={handleImportCsv}
                    className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-all cursor-pointer"
                  >
                    Confirm Import
                  </button>
                </div>
              )}

              {/* Filters & search controls */}
              <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                
                {/* Genre Selector */}
                <div>
                  <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">Filter by Genre</label>
                  <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="w-full text-xs font-medium bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Genres</option>
                    {genres.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {/* Category Selector */}
                <div>
                  <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">Filter by Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full text-xs font-medium bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Availability Filter Toggle */}
                <div className="flex items-center gap-2.5 pt-6">
                  <input
                    type="checkbox"
                    id="onlyAvail"
                    checked={onlyAvailable}
                    onChange={(e) => setOnlyAvailable(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <label htmlFor="onlyAvail" className="text-xs font-medium text-[#64748B] cursor-pointer">
                    Only Show Available Copies
                  </label>
                </div>

                {/* Status Indicator counter */}
                <div className="flex items-center justify-end text-xs font-semibold text-[#64748B] pt-6 pr-2">
                  Showing {filteredBooks.length} of {books.length} Books
                </div>
              </div>

              {/* Book Catalog Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredBooks.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all flex flex-col group"
                  >
                    {/* Visual Spine / Cover */}
                    <div className={`h-40 bg-gradient-to-tr ${getBookGradient(b.title)} p-5 flex flex-col justify-between relative text-white overflow-hidden`}>
                      <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 backdrop-blur-sm py-1 px-2.5 rounded-full self-start">
                        {b.genre}
                      </span>
                      <div>
                        <h3 className="font-bold text-base leading-snug truncate group-hover:underline">{b.title}</h3>
                        <p className="text-xs text-white/80 mt-0.5 font-medium truncate">by {b.authorName}</p>
                      </div>
                      <span className="absolute bottom-4 right-4 text-[10px] font-mono opacity-40">ISBN: {b.isbn}</span>
                    </div>

                    {/* Book Metadata details */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2.5">
                        <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed h-8">
                          {b.description || "No description provided for this catalog book. Physical volumes ready for circulation."}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs border-t border-[#F1F5F9] pt-2.5">
                          <div>
                            <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Location</span>
                            <span className="text-[#0F172A] font-medium flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-[#64748B]" /> {b.shelfLocation}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Standing</span>
                            <span className={`font-semibold inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] ${
                              b.availableCopies > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                            }`}>
                              {b.availableCopies} of {b.totalCopies} Available
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Controls and buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-[#F1F5F9]">
                        <button
                          onClick={() => setSelectedBook(b)}
                          className="flex-1 bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0] font-semibold py-2 rounded-xl text-xs transition-all cursor-pointer"
                        >
                          Details & QR
                        </button>

                        {currentUser ? (
                          b.availableCopies > 0 ? (
                            <button
                              onClick={() => {
                                // Request check-out directly if librarian/admin, or self-borrow if member
                                if (currentUser.role === "librarian" || currentUser.role === "admin") {
                                  setIssueBookId(b.id);
                                  setShowIssueModal(true);
                                } else {
                                  handleBorrowBookDirect(b.id);
                                }
                              }}
                              className="flex-1 bg-blue-600 text-white hover:bg-blue-700 font-semibold py-2 rounded-xl text-xs transition-all cursor-pointer"
                            >
                              {currentUser.role === "admin" || currentUser.role === "librarian" ? "Issue Now" : "Borrow Book"}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReserveBook(b.id)}
                              className="flex-1 bg-amber-500 text-white hover:bg-amber-600 font-semibold py-2 rounded-xl text-xs transition-all cursor-pointer"
                            >
                              Reserve Book
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => showToast("Please sign in or use quick demo log-in on left side to self-issue or reserve books!", "info")}
                            className="flex-1 bg-blue-50 text-blue-600 font-semibold py-2 rounded-xl text-xs transition-all"
                          >
                            Sign-In To Borrow
                          </button>
                        )}

                        {currentUser && (currentUser.role === "librarian" || currentUser.role === "admin") && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => openEditBookModal(b)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Edit Details"
                            >
                              <Sliders className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBook(b.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Remove Book"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredBooks.length === 0 && (
                  <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-[#E2E8F0]">
                    <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-[#0F172A]">No matching books found</p>
                    <p className="text-xs text-[#64748B] mt-0.5">Try widening your search terms or filters.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LUNA AI ASSISTANT */}
          {activeTab === "luna" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-5xl mx-auto">
              
              {/* Profile Card & Info */}
              <div className="xl:col-span-1 space-y-5">
                <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-indigo-800 shadow-xl space-y-4 relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
                  
                  <div className="bg-indigo-500/20 w-12 h-12 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                    <Bot className="w-6 h-6 text-indigo-300" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold">LUNA Assistant</h3>
                    <p className="text-xs text-indigo-300">Libraflow AI Guide</p>
                  </div>
                  
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Luna is trained on our catalog, branches, library schedules, and lending policies. Speak to her using natural language to search books or check study guides!
                  </p>

                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Capabilities:</p>
                    <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-300">
                      <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Catalog Lookups</span>
                      <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Direct Study Guides</span>
                      <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Overdue Fine Queries</span>
                    </div>
                  </div>
                </div>

                {/* Quick Prompts Panel */}
                <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl space-y-3">
                  <h4 className="font-bold text-xs text-[#0F172A] uppercase tracking-wider">Suggested Prompts</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleSendToLuna("How do I borrow a book?")}
                      className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-[#F8FAFC] text-xs font-medium text-[#64748B] transition-all block"
                    >
                      💡 "How do I borrow a book?"
                    </button>
                    <button
                      onClick={() => handleSendToLuna("Find books about Data Science.")}
                      className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-[#F8FAFC] text-xs font-medium text-[#64748B] transition-all block"
                    >
                      📚 "Find books about Data Science"
                    </button>
                    <button
                      onClick={() => handleSendToLuna("I have AI exams next week.")}
                      className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-[#F8FAFC] text-xs font-medium text-[#64748B] transition-all block"
                    >
                      🎯 "I have AI exams next week"
                    </button>
                    <button
                      onClick={() => handleSendToLuna("Suggest a good self-help book.")}
                      className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-[#F8FAFC] text-xs font-medium text-[#64748B] transition-all block"
                    >
                      🌸 "Suggest a book"
                    </button>
                  </div>
                </div>
              </div>

              {/* Chat Canvas */}
              <div className="xl:col-span-2 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm flex flex-col h-[520px]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                    <h3 className="font-bold text-[#0F172A] text-sm">Luna Live Session</h3>
                  </div>
                  <span className="text-[10px] text-[#64748B] font-mono">Gemini 3.5 Engine</span>
                </div>

                {/* Messages Panel */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {chatHistory.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                      <div className="bg-indigo-50 p-4 rounded-full">
                        <Bot className="w-8 h-8 text-indigo-500 animate-bounce" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#0F172A] text-sm">Welcome to Libraflow Neural Desk</h4>
                        <p className="text-xs text-[#64748B] mt-0.5">I am Luna. How can I brighten your day today?</p>
                      </div>
                    </div>
                  )}

                  {chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} items-start gap-2.5`}
                    >
                      {msg.sender === "luna" && (
                        <div className="bg-indigo-600 text-white w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs">
                          L
                        </div>
                      )}
                      <div
                        className={`p-3.5 rounded-2xl max-w-md text-xs leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-slate-950 text-white rounded-tr-none"
                            : "bg-[#F1F5F9] text-[#0F172A] rounded-tl-none font-medium prose prose-slate"
                        }`}
                      >
                        {msg.text.split("\n").map((para, idx) => (
                          <p key={idx} className="mb-1.5 last:mb-0">{para}</p>
                        ))}
                      </div>
                    </div>
                  ))}

                  {isChatLoading && (
                    <div className="flex justify-start items-center gap-2.5">
                      <div className="bg-indigo-600 text-white w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      </div>
                      <div className="bg-[#F1F5F9] p-3 rounded-2xl text-xs font-semibold text-[#64748B]">
                        Luna is thinking...
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Tray */}
                <div className="p-4 border-t border-[#F1F5F9]">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Ask Luna anything..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendToLuna()}
                      className="flex-1 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => handleSendToLuna()}
                      className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MY READING HUB */}
          {activeTab === "my-loans" && currentUser && (
            <div className="space-y-6 max-w-5xl mx-auto">
              
              {/* Member Overview Panel */}
              <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {currentUser.membershipType} Account Standing
                  </span>
                  <h2 className="text-xl font-bold text-[#0F172A] mt-1.5">{currentUser.name}</h2>
                  <p className="text-xs text-[#64748B] mt-0.5">Member ID: {currentUser.id} • Joined: {currentUser.joinDate}</p>
                </div>
                
                {/* SVG QR Code Simulation */}
                <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] flex items-center gap-4 self-start md:self-auto">
                  <div className="w-16 h-16 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-1.5 shadow-inner">
                    {/* Simulated SVG QR */}
                    <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
                      <rect x="0" y="0" width="25" height="25" fill="currentColor" />
                      <rect x="5" y="5" width="15" height="15" fill="white" />
                      <rect x="75" y="0" width="25" height="25" fill="currentColor" />
                      <rect x="80" y="5" width="15" height="15" fill="white" />
                      <rect x="0" y="75" width="25" height="25" fill="currentColor" />
                      <rect x="5" y="80" width="15" height="15" fill="white" />
                      <rect x="40" y="40" width="20" height="20" fill="currentColor" />
                      <rect x="45" y="45" width="10" height="10" fill="white" />
                      <rect x="10" y="40" width="15" height="10" fill="currentColor" />
                      <rect x="40" y="10" width="10" height="15" fill="currentColor" />
                      <rect x="65" y="55" width="15" height="15" fill="currentColor" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#0F172A]">Digital Membership Card</h4>
                    <p className="text-[10px] text-[#64748B] mt-0.5">Present this code to Librarian for fast issue and verification.</p>
                  </div>
                </div>
              </div>

              {/* Loans and Standing Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Active Borrows */}
                <div className="md:col-span-2 bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4">
                  <h3 className="font-bold text-sm text-[#0F172A] border-b border-[#F1F5F9] pb-2.5">
                    Currently Borrowed Books
                  </h3>
                  <div className="space-y-3">
                    {borrows.filter((b) => b.userId === currentUser.id && b.status !== "returned").length === 0 ? (
                      <p className="text-xs text-[#64748B] py-6 text-center">You have no borrowed items active.</p>
                    ) : (
                      borrows
                        .filter((b) => b.userId === currentUser.id && b.status !== "returned")
                        .map((b) => (
                          <div key={b.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                            <div>
                              <h4 className="font-bold text-xs text-[#0F172A]">{b.bookTitle || books.find(x => x.id === b.bookId)?.title || "Unknown Book"}</h4>
                              <p className="text-[10px] text-[#64748B] mt-0.5">Due: {b.dueDate} • Borrowed: {b.borrowDate}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {b.status === "overdue" && (
                                <span className="bg-rose-50 text-rose-600 font-bold px-2 py-0.5 text-[10px] rounded border border-rose-100">
                                  Overdue
                                </span>
                              )}
                              <button
                                onClick={() => handleRenewBook(b.id)}
                                className="bg-white border border-[#E2E8F0] hover:bg-slate-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                              >
                                Renew Due
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Queue / Reservations & Fine Ledger */}
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-5">
                  
                  {/* Reservation queues */}
                  <div>
                    <h3 className="font-bold text-sm text-[#0F172A] border-b border-[#F1F5F9] pb-2">Active Hold Queues</h3>
                    <div className="space-y-2.5 mt-2.5">
                      {userReservations.filter((r) => r.userId === currentUser.id && r.status === "pending").length === 0 ? (
                        <p className="text-xs text-[#64748B] text-center py-2">No active hold holds</p>
                      ) : (
                        userReservations
                          .filter((r) => r.userId === currentUser.id && r.status === "pending")
                          .map((r) => (
                            <div key={r.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs flex justify-between items-center">
                              <div>
                                <span className="font-semibold text-[#0F172A] block truncate w-32">{r.bookTitle || books.find(x => x.id === r.bookId)?.title || "Unknown Book"}</span>
                                <span className="text-[10px] text-[#64748B]">Queue pos: {r.queuePosition}</span>
                              </div>
                              <button
                                onClick={() => handleCancelReservation(r.id)}
                                className="text-rose-600 font-semibold text-[10px] hover:underline"
                              >
                                Cancel
                              </button>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                  {/* Fine Panel */}
                  <div>
                    <h3 className="font-bold text-sm text-[#0F172A] border-b border-[#F1F5F9] pb-2">Fines & Fees Balance</h3>
                    <div className="space-y-2.5 mt-2.5">
                      {fines.filter((f) => f.userId === currentUser.id && f.status !== "paid").length === 0 ? (
                        <p className="text-xs text-[#64748B] text-center py-2">✓ No outstanding fines balance</p>
                      ) : (
                        fines
                          .filter((f) => f.userId === currentUser.id && f.status !== "paid")
                          .map((f) => (
                            <div key={f.id} className="p-2.5 bg-rose-50/50 rounded-xl border border-rose-100 text-xs flex justify-between items-center">
                              <div>
                                <span className="font-semibold text-[#0F172A] block truncate w-32">{f.bookTitle || books.find(x => x.id === f.borrowId)?.title || "Unknown Book"}</span>
                                <span className="text-[10px] text-rose-600 font-bold">₹{f.amount} Outstanding</span>
                              </div>
                              <button
                                onClick={() => handlePayFine(f.id)}
                                className="bg-rose-600 text-white font-semibold text-[10px] px-2.5 py-1 rounded-md hover:bg-rose-700 transition-all"
                              >
                                Pay Fine
                              </button>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Neural Recommendations Section */}
              <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-bold text-base text-[#0F172A]">AI Match & Recommendations</h3>
                  </div>
                  <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">Hybrid Recommendation Engine</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
                  {recommendations.slice(0, 3).map((r) => (
                    <div key={r.id} className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-[#F8FAFC] flex flex-col justify-between">
                      <div className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] uppercase tracking-wider font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100">
                            {r.matchPercentage}% Match Score
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-[#0F172A] leading-snug line-clamp-1">{r.title}</h4>
                        <p className="text-[10px] text-[#64748B] font-medium">by {r.authorName}</p>
                        <p className="text-[11px] text-[#64748B] line-clamp-2 leading-relaxed">{r.description || "Top match based on borrow trends."}</p>
                      </div>
                      <div className="p-3 bg-white border-t border-[#E2E8F0] flex items-center justify-between">
                        <span className="text-[10px] font-mono text-[#64748B]">{r.shelfLocation}</span>
                        <button
                          onClick={() => handleReserveBook(r.id)}
                          className="text-[11px] text-blue-600 hover:underline font-bold"
                        >
                          Place Hold
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CIRCULATION DESK (Librarian panel) */}
          {activeTab === "librarian-panel" && currentUser && (currentUser.role === "librarian" || currentUser.role === "admin") && (
            <div className="space-y-6">
              
              {/* Circulation controls head */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Fast checkout widget */}
                <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-sm text-[#0F172A]">Circulation Checkout desk</h3>
                  </div>
                  <form onSubmit={handleIssueBook} className="space-y-3.5 pt-1.5">
                    <div>
                      <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">Member ID / Email</label>
                      <select
                        value={issueUserId}
                        onChange={(e) => setIssueUserId(e.target.value)}
                        className="w-full text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Member</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">Book Title / ID</label>
                      <select
                        value={issueBookId}
                        onChange={(e) => setIssueBookId(e.target.value)}
                        className="w-full text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Book</option>
                        {books.map((b) => (
                          <option key={b.id} value={b.id} disabled={b.availableCopies <= 0}>
                            {b.title} ({b.availableCopies} available)
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md shadow-blue-100 cursor-pointer"
                    >
                      Process Checkout Ticket
                    </button>
                  </form>
                </div>

                {/* Overdue/Pending returns KPI trackers */}
                <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm space-y-4">
                  <h3 className="font-bold text-xs text-[#94A3B8] uppercase tracking-wider">Quick Actions Portal</h3>
                  <div className="space-y-3 pt-1">
                    <button
                      onClick={() => {
                        setShowAddMemberModal(true);
                        setEditingMember(null);
                      }}
                      className="w-full bg-[#F1F5F9] hover:bg-[#E2E8F0] font-semibold text-xs py-2.5 rounded-xl transition-all block text-center"
                    >
                      ➕ Create Library Member
                    </button>
                    <button
                      onClick={() => {
                        setSelectedGenre("");
                        setSelectedCategory("");
                        setActiveTab("catalog");
                      }}
                      className="w-full bg-[#F1F5F9] hover:bg-[#E2E8F0] font-semibold text-xs py-2.5 rounded-xl transition-all block text-center"
                    >
                      📖 Manage Catalog Books
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/fines/sweep", { method: "POST" });
                          if (res.ok) {
                            showToast("Forced system-wide sweep! Fines and overdue status tables refreshed.", "success");
                            fetchDashboardMetrics();
                            fetchFines();
                          }
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="w-full bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 font-bold text-xs py-2.5 rounded-xl transition-all block text-center shadow-xs"
                    >
                      🧹 Sweep & Force Fine Updates
                    </button>
                  </div>
                </div>

                {/* Settings Glance */}
                <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm space-y-3.5">
                  <h3 className="font-bold text-xs text-[#94A3B8] uppercase tracking-wider">Active Library Rules</h3>
                  {settings ? (
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between border-b border-slate-50 pb-1.5">
                        <span className="text-[#64748B]">Borrowing Limit:</span>
                        <span className="font-semibold text-[#0F172A]">{settings.borrowLimit} books</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1.5">
                        <span className="text-[#64748B]">Borrow Duration:</span>
                        <span className="font-semibold text-[#0F172A]">{settings.borrowDurationDays} days</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1.5">
                        <span className="text-[#64748B]">Fine rate per day:</span>
                        <span className="font-semibold text-rose-600">₹{settings.fineRatePerDay}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Self Renewals:</span>
                        <span className="font-semibold text-emerald-600">{settings.allowRenewals ? "Enabled" : "Disabled"}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#64748B]">Loading settings...</p>
                  )}
                </div>
              </div>

              {/* NEW SECTION: Pending Hold & Borrow Requests */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-amber-50/40 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <h3 className="font-bold text-sm text-[#0F172A]">Pending Borrow & Hold Requests</h3>
                  </div>
                  <span className="text-xs font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                    {reservations.filter((r) => r.status === "pending").length} Pending Requests
                  </span>
                </div>

                <div className="divide-y divide-[#F1F5F9] max-h-80 overflow-y-auto">
                  {reservations.filter((r) => r.status === "pending").length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#64748B]">
                      <span className="text-xl block mb-1">🎉</span>
                      No pending borrow or hold requests from members at the moment.
                    </div>
                  ) : (
                    reservations
                      .filter((r) => r.status === "pending")
                      .map((r) => (
                        <div key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-all">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                                {r.id}
                              </span>
                              <span className="text-xs font-semibold text-[#0F172A]">
                                {r.memberName || members.find(m => m.id === r.userId)?.name || "Unknown Member"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Requested: {r.reserveDate}
                              </span>
                            </div>
                            <p className="text-xs text-[#0F172A] font-medium">
                              Wants to borrow: <span className="text-blue-600 font-semibold">{r.bookTitle || books.find(x => x.id === r.bookId)?.title || "Unknown Book"}</span>
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApproveRequest(r.id, r.userId, r.bookId)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm transition-all cursor-pointer"
                            >
                              Approve & Issue
                            </button>
                            <button
                              onClick={() => handleDeclineRequest(r.id)}
                              className="bg-white border border-[#E2E8F0] hover:bg-rose-50 text-rose-600 font-bold text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Lists and Records tabs inside librarian panel */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-slate-50 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="font-bold text-sm text-[#0F172A]">Circulation Ledgers & Active Loans</h3>
                  <span className="text-xs font-semibold text-[#64748B]">{borrows.length} Total records</span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/60 border-b border-[#E2E8F0] text-[#64748B] uppercase tracking-wider text-[10px] font-bold">
                        <th className="p-4">Borrow Ticket ID</th>
                        <th className="p-4">Member Info</th>
                        <th className="p-4">Book Title</th>
                        <th className="p-4">Lending Period</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9] font-medium">
                      {borrows.map((b) => (
                        <tr key={b.id} className="hover:bg-[#F8FAFC]">
                          <td className="p-4 font-mono text-[#64748B]">{b.id}</td>
                          <td className="p-4">
                            <span className="text-[#0F172A] block">{b.memberName || members.find(m => m.id === b.userId)?.name || "Unknown Member"}</span>
                            <span className="text-[10px] text-[#64748B] font-mono">{b.userId}</span>
                          </td>
                          <td className="p-4 font-bold text-[#0F172A]">{b.bookTitle || books.find(x => x.id === b.bookId)?.title || "Unknown Book"}</td>
                          <td className="p-4 text-[#64748B]">
                            {b.borrowDate} to {b.dueDate}
                          </td>
                          <td className="p-4">
                            <span className={`inline-block px-2 py-0.5 rounded font-semibold text-[10px] uppercase ${
                              b.status === 'returned'
                                ? 'bg-emerald-50 text-emerald-600'
                                : b.status === 'overdue'
                                ? 'bg-rose-50 text-rose-600'
                                : 'bg-blue-50 text-blue-600'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {b.status !== "returned" && (
                              <button
                                onClick={() => handleReturnBook(b.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-3 rounded-lg text-xs transition-all cursor-pointer"
                              >
                                Process Return
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Members Ledger */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-slate-50 border-b border-[#E2E8F0] flex justify-between items-center">
                  <h3 className="font-bold text-sm text-[#0F172A]">Library Members Registry</h3>
                  <button
                    onClick={() => {
                      setShowAddMemberModal(true);
                      setEditingMember(null);
                    }}
                    className="bg-blue-600 text-white text-xs font-bold py-1.5 px-3 rounded-lg hover:bg-blue-700 cursor-pointer"
                  >
                    + Add Member
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/60 border-b border-[#E2E8F0] text-[#64748B] uppercase tracking-wider text-[10px] font-bold">
                        <th className="p-4">Member ID</th>
                        <th className="p-4">Basic Info</th>
                        <th className="p-4">Membership Class</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9] font-medium">
                      {members.map((m) => (
                        <tr key={m.id} className="hover:bg-[#F8FAFC]">
                          <td className="p-4 font-mono font-bold text-slate-500">{m.id}</td>
                          <td className="p-4">
                            <span className="text-[#0F172A] block">{m.name}</span>
                            <span className="text-[10px] text-[#64748B]">{m.email}</span>
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-blue-600 uppercase text-[10px] bg-blue-50 border border-blue-100 py-0.5 px-2 rounded-full inline-block">
                              {m.membershipType}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-block px-2 py-0.5 rounded font-semibold text-[10px] uppercase ${
                              m.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                            }`}>
                              {m.status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-1.5">
                            <button
                              onClick={() => openEditMemberModal(m)}
                              className="text-blue-600 hover:bg-blue-50 font-semibold px-2 py-1 rounded border border-blue-200 cursor-pointer"
                            >
                              Edit Profile
                            </button>
                            <button
                              onClick={() => toggleMemberStatus(m)}
                              className={`font-semibold px-2 py-1 rounded border cursor-pointer ${
                                m.status === 'active'
                                  ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                                  : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                              }`}
                            >
                              {m.status === 'active' ? "Suspend" : "Activate"}
                            </button>
                            {currentUser?.role === "admin" && (
                              <button
                                onClick={() => handleDeleteMember(m.id)}
                                className="text-rose-600 hover:bg-rose-100/50 font-semibold px-2 py-1 rounded border border-rose-200 cursor-pointer"
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: REPORTS & ANALYTICS */}
          {activeTab === "reports" && currentUser && (currentUser.role === "librarian" || currentUser.role === "admin") && (
            <div className="space-y-6">
              
              {/* Reports Dashboard Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider block">Total Book Stock</span>
                    <h3 className="text-2xl font-bold text-[#0F172A] mt-1">{dashboard?.metrics.totalBooks || 0}</h3>
                    <p className="text-[10px] text-[#64748B] mt-0.5">{dashboard?.metrics.totalBookTitles || 0} Unique Titles</p>
                  </div>
                  <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl">
                    <BookOpen className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider block">Active Circulation</span>
                    <h3 className="text-2xl font-bold text-blue-600 mt-1">{dashboard?.metrics.activeBorrowsCount || 0}</h3>
                    <p className="text-[10px] text-[#64748B] mt-0.5">{dashboard?.metrics.issuedToday || 0} Borrowed Today</p>
                  </div>
                  <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl">
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider block">Fines Collected</span>
                    <h3 className="text-2xl font-bold text-emerald-600 mt-1">₹{dashboard?.metrics.fineCollected || 0}</h3>
                    <p className="text-[10px] text-rose-500 mt-0.5">₹{dashboard?.metrics.pendingFines || 0} Outstanding</p>
                  </div>
                  <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider block">Overdue Warnings</span>
                    <h3 className="text-2xl font-bold text-rose-600 mt-1">{dashboard?.metrics.overdueCount || 0}</h3>
                    <p className="text-[10px] text-[#64748B] mt-0.5">Automated reminders processed</p>
                  </div>
                  <div className="bg-rose-50 text-rose-600 p-3 rounded-2xl">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Dynamic SVG Visual Charts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* SVG Transaction Trends Chart */}
                <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-sm text-[#0F172A]">Borrowing & Returns Activity</h3>
                    <p className="text-xs text-[#64748B]">Circulation trend volume over last 6 months</p>
                  </div>
                  
                  {/* Styled Area/Bar SVG Chart */}
                  <div className="h-56 w-full flex flex-col justify-between pt-2">
                    <div className="flex-1 flex items-end justify-between gap-6 px-4 border-b border-slate-100 pb-2">
                      {dashboard?.monthlyTransactions.map((t, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full flex justify-center gap-1.5 items-end h-36">
                            {/* Borrow bar */}
                            <div
                              style={{ height: `${(t.borrowed / 45) * 100}%` }}
                              className="w-4 bg-blue-600 rounded-t-md transition-all duration-500"
                              title={`Borrowed: ${t.borrowed}`}
                            ></div>
                            {/* Return bar */}
                            <div
                              style={{ height: `${(t.returned / 45) * 100}%` }}
                              className="w-4 bg-emerald-500 rounded-t-md transition-all duration-500"
                              title={`Returned: ${t.returned}`}
                            ></div>
                          </div>
                          <span className="text-[10px] font-mono text-[#64748B] mt-1">{t.month}</span>
                        </div>
                      ))}
                    </div>
                    {/* Legend */}
                    <div className="flex items-center gap-4 text-xs mt-2.5 justify-center">
                      <span className="flex items-center gap-1.5 text-[#64748B] font-medium">
                        <span className="w-2.5 h-2.5 bg-blue-600 rounded"></span> Books Borrowed
                      </span>
                      <span className="flex items-center gap-1.5 text-[#64748B] font-medium">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded"></span> Books Returned
                      </span>
                    </div>
                  </div>
                </div>

                {/* Popular Books Visual list */}
                <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-sm text-[#0F172A]">Most Borrowed Book Titles</h3>
                    <p className="text-xs text-[#64748B]">Highest circulating physical copies</p>
                  </div>

                  <div className="space-y-3.5">
                    {dashboard?.popularBooks.map((pb, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-blue-100 text-blue-700 font-bold text-xs rounded-lg flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-[#0F172A] block">{pb.title}</span>
                            <span className="text-[10px] text-[#64748B]">{pb.author}</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#64748B] font-mono bg-white border px-2.5 py-1 rounded-lg">
                          {pb.borrowCount} issues
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ADMIN CONTROL PANEL */}
          {activeTab === "admin-panel" && currentUser && currentUser.role === "admin" && (
            <div className="space-y-6">
              
              {/* Settings Configuration Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Form layout */}
                <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Sliders className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-sm text-[#0F172A]">Borrowing & Fine Parameters</h3>
                  </div>

                  <form onSubmit={handleUpdateSettings} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">Max Borrow limit</label>
                        <input
                          type="number"
                          value={settingsForm.borrowLimit}
                          onChange={(e) => setSettingsForm({ ...settingsForm, borrowLimit: parseInt(e.target.value) || 5 })}
                          className="w-full text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">Lending Duration (days)</label>
                        <input
                          type="number"
                          value={settingsForm.borrowDurationDays}
                          onChange={(e) => setSettingsForm({ ...settingsForm, borrowDurationDays: parseInt(e.target.value) || 14 })}
                          className="w-full text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">Daily Fine Rate (₹)</label>
                      <input
                        type="number"
                        value={settingsForm.fineRatePerDay}
                        onChange={(e) => setSettingsForm({ ...settingsForm, fineRatePerDay: parseFloat(e.target.value) || 5 })}
                        className="w-full text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                        required
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <input
                        type="checkbox"
                        id="allowRen"
                        checked={settingsForm.allowRenewals}
                        onChange={(e) => setSettingsForm({ ...settingsForm, allowRenewals: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <label htmlFor="allowRen" className="text-xs font-semibold text-[#64748B] cursor-pointer">
                        Allow online renewals on reading hub
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white hover:bg-blue-700 font-semibold py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
                    >
                      Save Configuration Rules
                    </button>
                  </form>
                </div>

                {/* Audit logs at a glance */}
                <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-sm flex flex-col">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                    <ShieldAlert className="w-5 h-5 text-[#EF4444]" />
                    <h3 className="font-bold text-sm text-[#0F172A]">Live System Audit Logs</h3>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-72 space-y-3.5 pr-2">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px]">
                        <div className="flex items-center justify-between font-bold text-[#0F172A]">
                          <span className="text-[#64748B]">{log.action}</span>
                          <span className="text-[9px] font-mono font-medium">{log.id}</span>
                        </div>
                        <p className="text-[#64748B] mt-1 text-xs">{log.details}</p>
                        <div className="flex items-center justify-between text-[10px] text-[#94A3B8] mt-2.5 border-t border-[#F1F5F9] pt-1.5">
                          <span>User: {log.userName}</span>
                          <span>{log.createdDate.split("T")[0]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* FOOTER */}
      <footer className="bg-white border-t border-[#E2E8F0] px-6 py-4 flex flex-col md:flex-row items-center justify-between text-xs text-[#64748B]">
        <p>© 2026 LIBRAFLOW Systems. Purely local cloud runs sandbox. All rights reserved.</p>
        <div className="flex items-center gap-4 mt-2 md:mt-0 font-medium">
          <a href="#" className="hover:text-blue-600">Privacy Rules</a>
          <a href="#" className="hover:text-blue-600">Circulation Terms</a>
          <a href="#" className="hover:text-blue-600">Luna AI FAQ</a>
        </div>
      </footer>

      {/* MODAL 1: ADD / EDIT BOOK */}
      {showAddBookModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
            
            <button
              onClick={() => {
                setShowAddBookModal(false);
                setEditingBook(null);
              }}
              className="absolute right-5 top-5 p-1.5 text-slate-400 hover:text-slate-900 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base text-[#0F172A]">
              {editingBook ? "Edit Book Records" : "Register New Book to Catalog"}
            </h3>

            <form onSubmit={handleSaveBook} className="space-y-3.5 text-xs">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Book Title</label>
                  <input
                    type="text"
                    value={bookForm.title}
                    onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-[#0F172A]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Author Name</label>
                  <input
                    type="text"
                    value={bookForm.authorName}
                    onChange={(e) => setBookForm({ ...bookForm, authorName: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-[#0F172A]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">ISBN Identifier</label>
                  <input
                    type="text"
                    value={bookForm.isbn}
                    onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-[#0F172A]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Category Group</label>
                  <select
                    value={bookForm.categoryName}
                    onChange={(e) => setBookForm({ ...bookForm, categoryName: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-[#0F172A]"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Artificial Intelligence">Artificial Intelligence</option>
                    <option value="Fiction & Sci-Fi">Fiction & Sci-Fi</option>
                    <option value="Self-Help">Self-Help</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Genre</label>
                  <input
                    type="text"
                    value={bookForm.genre}
                    onChange={(e) => setBookForm({ ...bookForm, genre: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F172A]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Total Copies</label>
                  <input
                    type="number"
                    value={bookForm.totalCopies}
                    onChange={(e) => setBookForm({ ...bookForm, totalCopies: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F172A]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Shelf Location</label>
                  <input
                    type="text"
                    value={bookForm.shelfLocation}
                    onChange={(e) => setBookForm({ ...bookForm, shelfLocation: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[#0F172A]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Description</label>
                <textarea
                  value={bookForm.description}
                  onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-[#0F172A]"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white hover:bg-blue-700 font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
              >
                {editingBook ? "Update Book Entry" : "Add to Library Catalog"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DETAIL SHEET & SCAN CARD */}
      {selectedBook && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedBook(null)}
              className="absolute right-5 top-5 p-1.5 text-slate-400 hover:text-slate-900 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex gap-4 items-start">
              <div className={`w-28 h-36 bg-gradient-to-tr ${getBookGradient(selectedBook.title)} rounded-xl flex-shrink-0 flex flex-col justify-end p-3 text-white`}>
                <span className="text-[9px] uppercase tracking-widest font-bold opacity-70 block">{selectedBook.genre}</span>
                <span className="font-bold text-xs line-clamp-2 leading-snug">{selectedBook.title}</span>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">
                  {selectedBook.categoryName}
                </span>
                <h3 className="font-bold text-base text-[#0F172A] leading-tight">{selectedBook.title}</h3>
                <p className="text-xs text-[#64748B] font-semibold">by {selectedBook.authorName}</p>
                <p className="text-[11px] font-mono text-[#64748B]">ISBN Identifier: {selectedBook.isbn}</p>
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed bg-[#F8FAFC] p-3 rounded-xl border border-slate-100">
              {selectedBook.description || "No specific detailed description uploaded. This book is a physical volume inside Libraflow ecosystem and is available for instant checkouts."}
            </p>

            <div className="grid grid-cols-2 gap-4 text-xs font-medium border-t border-b border-slate-100 py-3.5">
              <div>
                <span className="text-[9px] font-bold text-[#94A3B8] uppercase block">Storage Shelf</span>
                <span className="text-[#0F172A] font-bold block mt-0.5">{selectedBook.shelfLocation}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-[#94A3B8] uppercase block">Copies in Stock</span>
                <span className="text-emerald-600 font-bold block mt-0.5">{selectedBook.availableCopies} available</span>
              </div>
            </div>

            {/* Simulated fast check out barcodes */}
            <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] flex items-center gap-4">
              <div className="bg-white p-1.5 rounded-lg border border-slate-200 w-16 h-16 flex-shrink-0">
                {/* Visual barcode indicator */}
                <svg viewBox="0 0 100 100" className="w-full h-full text-slate-800">
                  <rect x="0" y="0" width="100" height="20" fill="currentColor" />
                  <rect x="0" y="30" width="100" height="10" fill="currentColor" />
                  <rect x="0" y="50" width="100" height="15" fill="currentColor" />
                  <rect x="0" y="75" width="100" height="25" fill="currentColor" />
                  <rect x="10" y="10" width="10" height="80" fill="white" />
                  <rect x="35" y="10" width="15" height="80" fill="white" />
                  <rect x="65" y="10" width="8" height="80" fill="white" />
                  <rect x="85" y="10" width="5" height="80" fill="white" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-xs text-[#0F172A]">Intelligent Catalog barcode</h4>
                <p className="text-[10px] text-[#64748B] mt-0.5">Quickly scan at physical self-checkout counters or desks for fast lending audits.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CIRCULATION checkout */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative">
            
            <button
              onClick={() => setShowIssueModal(false)}
              className="absolute right-5 top-5 p-1.5 text-slate-400 hover:text-slate-900 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base text-[#0F172A]">Circulation Desk Issue</h3>
            
            <form onSubmit={handleIssueBook} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">Member Info</label>
                <select
                  value={issueUserId}
                  onChange={(e) => setIssueUserId(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-[#0F172A]"
                  required
                >
                  <option value="">Select Member</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">Book ID</label>
                <input
                  type="text"
                  value={issueBookId}
                  onChange={(e) => setIssueBookId(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-[#0F172A]"
                  placeholder="Enter book ID manually or via QR scanner"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all"
              >
                Process Issue Ticket
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD MEMBER */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            
            <button
              onClick={() => {
                setShowAddMemberModal(false);
                setEditingMember(null);
              }}
              className="absolute right-5 top-5 p-1.5 text-slate-400 hover:text-slate-900 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base text-[#0F172A]">
              {editingMember ? "Update Member Account" : "Register New Library Member"}
            </h3>

            <form onSubmit={handleSaveMember} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Full Name</label>
                <input
                  type="text"
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-[#0F172A]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Email Address</label>
                <input
                  type="email"
                  value={memberForm.email}
                  onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-[#0F172A]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={memberForm.phone}
                    onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Membership Class</label>
                  <select
                    value={memberForm.membershipType}
                    onChange={(e) => setMemberForm({ ...memberForm, membershipType: e.target.value as any })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-[#0F172A]"
                  >
                    <option value="basic">Basic Class</option>
                    <option value="premium">Premium Class</option>
                    <option value="student">Student Class</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">Full Address</label>
                <textarea
                  value={memberForm.address}
                  onChange={(e) => setMemberForm({ ...memberForm, address: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-[#0F172A]"
                  rows={2}
                />
              </div>

              {!editingMember && (
                <div>
                  <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">Access Password</label>
                  <input
                    type="password"
                    value={memberForm.password}
                    onChange={(e) => setMemberForm({ ...memberForm, password: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-[#0F172A]"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 text-white hover:bg-blue-700 font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
              >
                Save Member Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: USER PROFILE & SETTINGS SELF-SERVICE */}
      {showSelfSettingsModal && currentUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowSelfSettingsModal(false)}
              className="absolute right-5 top-5 p-1.5 text-slate-400 hover:text-slate-900 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-bold text-base text-[#0F172A]">Account Settings</h3>
              <p className="text-[11px] text-[#64748B]">Manage your library profile, login credentials, or account deletion.</p>
            </div>

            {/* Tab Switches */}
            <div className="flex border-b border-[#E2E8F0]">
              <button
                onClick={() => setSelfSettingsTab("profile")}
                className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition-all cursor-pointer ${
                  selfSettingsTab === "profile"
                    ? "border-blue-600 text-blue-600 font-bold"
                    : "border-transparent text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Edit Profile
              </button>
              <button
                onClick={() => setSelfSettingsTab("password")}
                className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition-all cursor-pointer ${
                  selfSettingsTab === "password"
                    ? "border-blue-600 text-blue-600 font-bold"
                    : "border-transparent text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Change Password
              </button>
            </div>

            {selfSettingsTab === "profile" ? (
              <form onSubmit={handleUpdateSelfProfile} className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={selfProfileForm.name}
                    onChange={(e) => setSelfProfileForm({ ...selfProfileForm, name: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-[#0F172A] outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={selfProfileForm.email}
                    onChange={(e) => setSelfProfileForm({ ...selfProfileForm, email: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-[#0F172A] outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={selfProfileForm.phone}
                    onChange={(e) => setSelfProfileForm({ ...selfProfileForm, phone: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-[#0F172A] outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Address</label>
                  <textarea
                    value={selfProfileForm.address}
                    onChange={(e) => setSelfProfileForm({ ...selfProfileForm, address: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-[#0F172A] outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>

                <div className="pt-2 flex flex-col gap-3">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    Save Changes
                  </button>

                  <div className="border-t border-[#F1F5F9] pt-3">
                    <button
                      type="button"
                      onClick={handleDeleteSelfAccount}
                      className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-2 rounded-xl text-[11px] transition-all flex items-center justify-center gap-1.5 border border-rose-100 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete My Account
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleUpdateSelfPassword} className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Current Password</label>
                  <input
                    type="password"
                    value={selfPasswordForm.currentPassword}
                    onChange={(e) => setSelfPasswordForm({ ...selfPasswordForm, currentPassword: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-[#0F172A] outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">New Password</label>
                  <input
                    type="password"
                    value={selfPasswordForm.newPassword}
                    onChange={(e) => setSelfPasswordForm({ ...selfPasswordForm, newPassword: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-[#0F172A] outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={selfPasswordForm.confirmNewPassword}
                    onChange={(e) => setSelfPasswordForm({ ...selfPasswordForm, confirmNewPassword: e.target.value })}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-[#0F172A] outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border ${
            toast.type === "success" 
              ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
              : toast.type === "error"
              ? "bg-rose-50 border-rose-100 text-rose-800"
              : "bg-blue-50 border-blue-100 text-blue-800"
          }`}>
            <span className="text-xs font-semibold">{toast.message}</span>
            <button 
              onClick={() => setToast(null)}
              className="text-xs font-bold hover:opacity-70 px-1 ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100">
            <h3 className="font-bold text-base text-[#0F172A] mb-2">{confirmModal.title}</h3>
            <p className="text-xs text-[#64748B] leading-relaxed mb-6">{confirmModal.message}</p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                {confirmModal.cancelText || "Cancel"}
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                {confirmModal.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Modal */}
      {promptModal && promptModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100">
            <h3 className="font-bold text-base text-[#0F172A] mb-2">{promptModal.title}</h3>
            <p className="text-xs text-[#64748B] leading-relaxed mb-4">{promptModal.message}</p>
            
            <input
              id="prompt-input-main"
              type="text"
              defaultValue={promptModal.placeholder || ""}
              placeholder="Type your response here..."
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-[#0F172A] text-xs mb-6 focus:ring-2 focus:ring-blue-500 outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  promptModal.onConfirm((e.currentTarget as HTMLInputElement).value);
                }
              }}
            />
            
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setPromptModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById("prompt-input-main") as HTMLInputElement;
                  promptModal.onConfirm(input?.value || "");
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
