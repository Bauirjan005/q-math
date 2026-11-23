package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

// ============================================================================
// Q-MATH TELEGRAM PARENT NOTIFICATION MICROSERVICE (GO IMPLEMENTATION)
// High-performance asynchronous Telegram webhook processor and alert engine
// ============================================================================

// NotificationSettings schema
type NotificationSettings struct {
	OnTestSubmitted bool `json:"on_test_submitted" db:"on_test_submitted"`
	OnLowScore      bool `json:"on_low_score" db:"on_low_score"`
	OnInactivity    bool `json:"on_inactivity" db:"on_inactivity"`
	WeeklyDigest    bool `json:"weekly_digest" db:"weekly_digest"`
}

// Student database model with parent linking fields
type Student struct {
	ID                   string               `json:"id" db:"id"`
	Name                 string               `json:"name" db:"name"`
	ClassroomCode        string               `json:"classroom_code" db:"classroom_code"`
	Grade                string               `json:"grade" db:"grade"`
	School               string               `json:"school" db:"school"`
	ParentPhone          string               `json:"parent_phone" db:"parent_phone"`
	ParentTelegramID     int64                `json:"parent_telegram_id" db:"parent_telegram_id"`
	ParentChatID         int64                `json:"parent_chat_id" db:"parent_chat_id"`
	ParentSyncStatus     string               `json:"parent_sync_status" db:"parent_sync_status"` // 'connected' | 'not_connected'
	BindingToken         string               `json:"binding_token" db:"binding_token"`
	NotificationSettings NotificationSettings `json:"notification_settings" db:"notification_settings"`
	LastActiveAt         time.Time            `json:"last_active_at" db:"last_active_at"`
}

// Test submission payload
type TestSubmission struct {
	ID              string `json:"id"`
	TestID          string `json:"test_id"`
	TestTitle       string `json:"test_title"`
	StudentID       string `json:"student_id"`
	StudentName     string `json:"student_name"`
	TotalScore      int    `json:"total_score"`
	MaxScore        int    `json:"max_score"`
	Percentage      int    `json:"percentage"`
	DurationSeconds int    `json:"duration_seconds"`
	SubmittedAt     string `json:"submitted_at"`
}

// Telegram Update Structs
type TelegramUpdate struct {
	UpdateID int              `json:"update_id"`
	Message  *TelegramMessage `json:"message"`
}

type TelegramMessage struct {
	MessageID int          `json:"message_id"`
	From      TelegramUser `json:"from"`
	Chat      TelegramChat `json:"chat"`
	Text      string       `json:"text"`
	Date      int64        `json:"date"`
}

type TelegramUser struct {
	ID        int64  `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Username  string `json:"username"`
}

type TelegramChat struct {
	ID   int64  `json:"id"`
	Type string `json:"type"`
}

type TelegramSendPayload struct {
	ChatID    int64  `json:"chat_id"`
	Text      string `json:"text"`
	ParseMode string `json:"parse_mode"`
}

// In-Memory Thread-Safe Store for Students (Mocking PostgreSQL repository)
type StudentStore struct {
	mu       sync.RWMutex
	students map[string]*Student
}

var store = &StudentStore{
	students: make(map[string]*Student),
}

var (
	botToken   = os.Getenv("TELEGRAM_BOT_TOKEN")
	httpClient = &http.Client{Timeout: 10 * time.Second}
)

func init() {
	if botToken == "" {
		botToken = "DEMO_BOT_TOKEN_QMATH"
	}
	// Seed demo student for testing
	store.students["stud-1"] = &Student{
		ID:               "stud-1",
		Name:             "Алихан Смаилов",
		ClassroomCode:    "MATH-2026",
		Grade:            "11-А",
		ParentPhone:      "+7 (701) 987-65-43",
		ParentChatID:     123456789,
		ParentSyncStatus: "connected",
		BindingToken:     "BIND_ALIKHAN_2026",
		NotificationSettings: NotificationSettings{
			OnTestSubmitted: true,
			OnLowScore:      true,
			OnInactivity:    true,
			WeeklyDigest:    true,
		},
		LastActiveAt: time.Now(),
	}
}

// ============================================================================
// TELEGRAM DISPATCHER CLIENT
// ============================================================================

func SendTelegramMessage(chatID int64, text string) error {
	if chatID == 0 {
		return fmt.Errorf("invalid chat ID: 0")
	}

	if botToken == "" || strings.HasPrefix(botToken, "DEMO_") {
		// Mock simulation mode
		log.Printf("[GO TELEGRAM BOT MOCK -> Chat: %d]\n%s\n", chatID, text)
		return nil
	}

	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", botToken)
	payload := TelegramSendPayload{
		ChatID:    chatID,
		Text:      text,
		ParseMode: "HTML",
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	resp, err := httpClient.Post(url, "application/json", bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("telegram api error: status %d", resp.StatusCode)
	}

	return nil
}

// ============================================================================
// WEBHOOK CONTROLLER
// ============================================================================

// HandleTelegramWebhook receives Telegram Bot updates via Webhook
func HandleTelegramWebhook(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var update TelegramUpdate
	if err := json.NewDecoder(r.Body).Decode(&update); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	if update.Message == nil || update.Message.Text == "" {
		w.WriteHeader(http.StatusOK)
		return
	}

	msg := update.Message
	text := strings.TrimSpace(msg.Text)
	chatID := msg.Chat.ID
	userID := msg.From.ID

	// 1. Process /start BIND_<token>
	if strings.HasPrefix(text, "/start BIND_") || strings.HasPrefix(text, "/start bind_") {
		token := strings.TrimSpace(strings.TrimPrefix(text, "/start "))

		store.mu.Lock()
		var matchedStudent *Student
		for _, s := range store.students {
			if strings.EqualFold(s.BindingToken, token) {
				matchedStudent = s
				break
			}
		}

		if matchedStudent != nil {
			matchedStudent.ParentChatID = chatID
			matchedStudent.ParentTelegramID = userID
			matchedStudent.ParentSyncStatus = "connected"
			store.mu.Unlock()

			welcomeMsg := fmt.Sprintf(
				"🎉 <b>Сәтті байланыстырылды!</b>\n\n"+
					"Құрметті ата-ана! Сіз <b>%s</b> (%s сынып) оқушысының Q-Math профиліне қосылдыңыз.\n\n"+
					"Енді балаңыздың ҰБТ сынақтары бойынша нәтижелері мен мұғалім хабарламалары осы чатқа жедел келіп түседі.",
				matchedStudent.Name, matchedStudent.Grade,
			)
			go SendTelegramMessage(chatID, welcomeMsg)
		} else {
			store.mu.Unlock()
			go SendTelegramMessage(chatID, "❌ <b>Қате:</b> Байланыстыру коды табылмады немесе мерзімі өткен.")
		}

		w.WriteHeader(http.StatusOK)
		return
	}

	// 2. Process /status
	if text == "/status" {
		store.mu.RLock()
		var s *Student
		for _, stud := range store.students {
			if stud.ParentChatID == chatID {
				s = stud
				break
			}
		}
		store.mu.RUnlock()

		if s != nil {
			statusMsg := fmt.Sprintf("📊 <b>Оқушының мәртебесі:</b> %s\nСынып: %s\nБайланыс күйі: Белсенді ✅", s.Name, s.Grade)
			go SendTelegramMessage(chatID, statusMsg)
		} else {
			go SendTelegramMessage(chatID, "Сіз әзірге ешқандай оқушымен байланыстырылмағансыз.")
		}

		w.WriteHeader(http.StatusOK)
		return
	}

	// 3. Process /stop
	if text == "/stop" {
		store.mu.Lock()
		for _, stud := range store.students {
			if stud.ParentChatID == chatID {
				stud.ParentSyncStatus = "not_connected"
				stud.ParentChatID = 0
			}
		}
		store.mu.Unlock()

		go SendTelegramMessage(chatID, "Хабарландырулар тоқтатылды.")
		w.WriteHeader(http.StatusOK)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// ============================================================================
// AUTOMATED EVENT NOTIFICATION DISPATCHERS
// ============================================================================

// NotifyTestCompleted sends test results directly to the parent
func NotifyTestCompleted(sub TestSubmission) error {
	store.mu.RLock()
	student, exists := store.students[sub.StudentID]
	store.mu.RUnlock()

	if !exists || student.ParentChatID == 0 || student.ParentSyncStatus != "connected" {
		return nil
	}

	if !student.NotificationSettings.OnTestSubmitted {
		return nil
	}

	statusEmoji := "📈"
	if sub.Percentage >= 80 {
		statusEmoji = "🎯"
	} else if sub.Percentage < 50 {
		statusEmoji = "⚠️"
	}

	msg := fmt.Sprintf(
		"%s <b>Q-Math: Тест нәтижесі</b>\n\n"+
			"Оқушы: <b>%s</b>\n"+
			"Тест: <b>%s</b>\n"+
			"Балл: <b>%d / %d (%d%%)</b>\n"+
			"Уақыты: %d минут\n\n"+
			"Оқушы жеке кабинетінде AI шешімдерін талдап, қатемен жұмыс жасай алады.",
		statusEmoji, sub.StudentName, sub.TestTitle, sub.TotalScore, sub.MaxScore, sub.Percentage,
		sub.DurationSeconds/60,
	)

	return SendTelegramMessage(student.ParentChatID, msg)
}

// StartInactivityCronWorker checks for inactive students every 24 hours
func StartInactivityCronWorker() {
	ticker := time.NewTicker(24 * time.Hour)
	go func() {
		for range ticker.C {
			now := time.Now()
			store.mu.RLock()
			for _, s := range store.students {
				if s.ParentChatID != 0 && s.ParentSyncStatus == "connected" && s.NotificationSettings.OnInactivity {
					if now.Sub(s.LastActiveAt) >= 72*time.Hour { // 3 days
						alertMsg := fmt.Sprintf(
							"⏰ <b>Q-Math Ескертуі:</b>\n\n"+
								"<b>%s</b> 3 күн бойы математикадан жаттығу жасамады. Тұрақты дайындық — ҰБТ грантының басты кепілі!",
							s.Name,
						)
						SendTelegramMessage(s.ParentChatID, alertMsg)
					}
				}
			}
			store.mu.RUnlock()
		}
	}()
}

// ============================================================================
// MAIN SERVER ENTRYPOINT
// ============================================================================

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start background cron workers
	StartInactivityCronWorker()

	http.HandleFunc("/api/telegram/webhook", HandleTelegramWebhook)
	http.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","service":"qmath-parent-bot-go"}`))
	})

	log.Printf("[Q-Math Go Bot Service] Listening on port %s...\n", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
