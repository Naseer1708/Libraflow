import { GoogleGenAI } from "@google/genai";
import { db, Book, Author, Category, User, Borrow, Reservation, Fine } from "./db.js";

// Initialize Gemini client safely with standard environment variable
const apiKey = process.env.GEMINI_API_KEY;

let aiClient: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI {
  if (!aiClient) {
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not defined. Luna will operate in fallback mode.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export async function generateLunaResponse(
  userId: string | null,
  message: string,
  history: ChatMessage[] = []
): Promise<string> {
  const ai = getGemini();
  const data = db.get();

  // 1. Gather Context
  const activeUser = userId ? data.users.find((u) => u.id === userId) : null;
  const userBorrows = userId ? data.borrows.filter((b) => b.userId === userId) : [];
  const userReservations = userId ? data.reservations.filter((r) => r.userId === userId) : [];
  const userFines = userId ? data.fines.filter((f) => f.userId === userId && f.status !== "paid") : [];

  // Denormalize some data for easier reasoning
  const booksWithDetails = data.books.map((b) => {
    const author = data.authors.find((a) => a.id === b.authorId)?.name || "Unknown Author";
    const category = data.categories.find((c) => c.id === b.categoryId)?.name || "General";
    return {
      id: b.id,
      title: b.title,
      isbn: b.isbn,
      author,
      category,
      genre: b.genre,
      availableCopies: b.availableCopies,
      totalCopies: b.totalCopies,
      location: b.shelfLocation,
      description: b.description,
    };
  });

  const activeBorrowsDetails = userBorrows.map((b) => {
    const book = data.books.find((bk) => bk.id === b.bookId);
    return {
      title: book?.title || "Unknown Book",
      borrowDate: b.borrowDate,
      dueDate: b.dueDate,
      status: b.status,
    };
  });

  const activeReservationsDetails = userReservations.map((r) => {
    const book = data.books.find((bk) => bk.id === r.bookId);
    return {
      title: book?.title || "Unknown Book",
      reserveDate: r.reserveDate,
      status: r.status,
      queuePosition: r.queuePosition,
    };
  });

  // 2. Build System Instructions
  const systemInstruction = `You are LUNA, the extremely friendly, supportive, and intelligent Library Assistant for LIBRAFLOW.
Your mission is to make members and visitors feel welcomed, supported, and inspired to read.
Keep your tone warm, professional, calm, elegant, and concise. Format your answers in elegant Markdown. Use bold styling, lists, or headers for readability when presenting books or recommendations.

Here is the current, real-time library database state:
- **Available Book Catalog**:
${JSON.stringify(booksWithDetails, null, 2)}

- **Library Rules**:
  * Borrow Limit: ${data.settings.borrowLimit} books per member
  * Borrow Duration: ${data.settings.borrowDurationDays} days
  * Renewals: ${data.settings.allowRenewals ? "Allowed" : "Not allowed"}
  * Overdue Fines: ₹${data.settings.fineRatePerDay} per day after the due date

- **Active Library Branches**:
${JSON.stringify(data.branches, null, 2)}

${
  activeUser
    ? `- **Current Active User**:
  * Name: ${activeUser.name}
  * Email: ${activeUser.email}
  * Role: ${activeUser.role}
  * Membership Type: ${activeUser.membershipType}
  * Active Borrowed Books: ${JSON.stringify(activeBorrowsDetails, null, 2)}
  * Active Reservations: ${JSON.stringify(activeReservationsDetails, null, 2)}
  * Unpaid Fines: Total of ${userFines.length} pending fines, with active fines list: ${JSON.stringify(userFines, null, 2)}`
    : "- **Visitor Context**: Guest / Non-logged in user. If they ask about personal records, kindly ask them to login or register first."
}

### Guidelines for Luna's Behavior:
1. **Library Guidance**: When asked about general procedures (e.g., "How do I borrow a book?", "What is the fine policy?"), explain the step-by-step instructions clearly using bullet points and list current branch locations if relevant.
2. **Book Search**: If the user asks for books (e.g., "Find books about Data Science" or "Machine Learning"), search through the catalog of books details provided above. Recommend real books that match, mention their availability (e.g., "1 of 3 copies available"), and list their physical shelf location so they can find them.
3. **Personalized Recommendations**: If asked for recommendations ("What should I read next?"), analyze their borrow history or state to recommend highly relevant books from the available catalog.
4. **Exam Mode**: If the user says they have upcoming exams (e.g. "I have AI exams next week" or "Help me learn Python"), immediately suggest target revision resources from our catalog (such as "Deep Learning" or "Learning Python") along with a friendly, encouraging message.
5. **Conversational Support**: Respond naturally and professionally to greetings, boredom, or casual queries.

*CRITICAL*: Since you have access to the exact real-time catalog above, do NOT make up books that do not exist in the list. Suggest books from the real list first, and if nothing fits perfectly, mention what matches best and suggest related topics.
If GEMINI_API_KEY is not defined, respond with a helpful local assistance greeting.`;

  // 3. Fallback check
  if (!apiKey) {
    return localLunaFallback(message, booksWithDetails, activeUser, activeBorrowsDetails, userFines);
  }

  // 4. Construct content parts
  const contents = [
    ...history.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    })),
    {
      role: "user",
      parts: [{ text: message }],
    },
  ];

  let attempts = 0;
  const maxAttempts = 2;
  let lastError: any = null;

  while (attempts < maxAttempts) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      return response.text || "I apologize, I could not formulate a response at this moment. Let me know how else I can help.";
    } catch (error: any) {
      lastError = error;
      attempts++;
      console.warn(`Gemini API attempt ${attempts} failed. Error: ${error?.message || error}.`);
      if (attempts < maxAttempts) {
        // Wait a short delay (e.g., 800ms) before retrying
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }
  }

  console.error("All Gemini API attempts failed, using smart local fallback:", lastError);
  return localLunaFallback(message, booksWithDetails, activeUser, activeBorrowsDetails, userFines);
}

// Highly responsive local fallback rule engine if API key is missing or calls fail
function localLunaFallback(
  message: string,
  books: any[],
  user: any,
  borrows: any[],
  fines: any[]
): string {
  const msg = message.toLowerCase();

  let intro = `### **LUNA** ✧ Local Assistant mode\n\n`;

  if (msg.includes("hello") || msg.includes("hi ") || msg.includes("good morning") || msg.includes("good afternoon")) {
    return `${intro}Hello! I'm **Luna**, your Libraflow assistant. How can I brighten your reading journey today? 📚`;
  }

  if (msg.includes("how to borrow") || msg.includes("how do i borrow") || msg.includes("borrow a book")) {
    return `${intro}Borrowing a book at **Libraflow** is very simple:
1. Browse our catalog and locate your preferred book.
2. Click **Borrow** or visit the physical shelf listed in the details.
3. Bring the book to Librarian Sarah (or use your QR Code) to quickly check out.
4. You can borrow up to **5 books** for **14 days**. Overdue fines are ₹5/day.`;
  }

  if (msg.includes("find") || msg.includes("search") || msg.includes("book") || msg.includes("data science") || msg.includes("python") || msg.includes("ai") || msg.includes("learning")) {
    const matches = books.filter(b => 
      msg.includes(b.title.toLowerCase()) || 
      msg.includes(b.genre.toLowerCase()) || 
      msg.includes(b.category.toLowerCase()) ||
      (msg.includes("ai") && b.category === "Artificial Intelligence") ||
      (msg.includes("python") && b.title.includes("Python")) ||
      (msg.includes("learning") && b.title.toLowerCase().includes("learning"))
    );

    if (matches.length > 0) {
      let resp = `${intro}I found some wonderful matches for you in our catalog:\n\n`;
      matches.forEach(b => {
        resp += `- **${b.title}** by *${b.author}* (${b.genre})\n  * *Location*: ${b.location}\n  * *Availability*: ${b.availableCopies} of ${b.totalCopies} copies available\n  * *Description*: ${b.description}\n\n`;
      });
      return resp;
    } else {
      return `${intro}I couldn't find a direct match for that specific search, but here are our featured titles in Computer Science & AI:
- **Deep Learning** by *Ian Goodfellow* (Shelf: Aisle B, Shelf 1)
- **The Pragmatic Programmer** by *Andrew Hunt* (Shelf: Aisle A, Shelf 3)
- **Learning Python** by *Guido van Rossum* (Shelf: Aisle A, Shelf 5)`;
    }
  }

  if (msg.includes("recommend") || msg.includes("read next") || msg.includes("suggest") || msg.includes("bored")) {
    return `${intro}Here are some personalized suggestions based on your profile:
1. **Atomic Habits** by *James Clear* (Self-Help) — Build daily micro-habits. Highly recommended for a positive routine!
2. **The Pragmatic Programmer** by *Andrew Hunt* — Outstanding guidance on software engineering.
3. **Dune** by *Frank Herbert* — If you are in the mood for an epic space journey across desert sands.`;
  }

  if (msg.includes("exam") || msg.includes("test")) {
    return `${intro}Wishing you the absolute best on your upcoming exams! 🌟 Here are highly recommended revision resources:
- **Deep Learning** by *Ian Goodfellow* — Essential for AI and neural network exams.
- **Learning Python** by *Guido van Rossum* — Perfect for code syntax and programming logic revision.
- *Tip*: You can review them in the quiet study wing located in our **Central Library Hub**.`;
  }

  if (msg.includes("my borrow") || msg.includes("what did i") || msg.includes("borrowed") || msg.includes("fines") || msg.includes("fine")) {
    if (!user) {
      return `${intro}Please login to view your active borrowed books, reservation queues, and pending fine logs.`;
    }
    let res = `${intro}Here is your current library standing, **${user.name}**:\n\n`;
    if (borrows.length === 0) {
      res += `- You currently have no books borrowed.\n`;
    } else {
      res += `**Active Borrows**:\n`;
      borrows.forEach(b => {
        res += `- **${b.title}** (Due on: ${b.dueDate}) [Status: ${b.status}]\n`;
      });
    }
    if (fines.length > 0) {
      const sum = fines.reduce((acc, curr) => acc + curr.amount, 0);
      res += `\n⚠️ **Pending Fines**: ₹${sum} from overdue items.`;
    } else {
      res += `\n✓ You have no pending fines. Excellent job returning your books on time!`;
    }
    return res;
  }

  return `${intro}I am here to guide you through **Libraflow**. I can recommend books, search our catalog, look up your current checkouts, or help you prepare for exams. What would you like to explore?`;
}
