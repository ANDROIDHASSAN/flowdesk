# 🤖 AI-Powered Performance Intelligence System

## What We're Building

### 1. **Smart Quick-Add System**
- Floating action button with smart suggestions
- Create projects in 2 clicks (name + rate)
- Create tasks in 3 clicks (title + hours + project)
- Smart defaults based on team history
- Template shortcuts

### 2. **AI Employee Summaries**
Every employee card shows:
```
🎯 Performance Score: 87/100 (↑ +5 this week)

AI Summary:
"Priya is a top performer. Completed 12 tasks (100% on-time), 
logged 42 hours this week with high accuracy. Strong momentum."

Key Metrics:
├─ Task Completion: 95%
├─ On-Time Delivery: 98%
├─ Hours Logged: 42h (target: 40h)
├─ Follow-up Closure: 100%
└─ Efficiency: 104% (ahead of estimate)
```

### 3. **AI Chat Intelligence**
Natural language queries to chat with your team data:
```
User: "Who's underperforming?"
AI: "Rahul's score dropped to 72/100 this week. 
     He's 15% behind on task completion and 
     has 3 overdue follow-ups. Recommend check-in."

User: "Compare my team across all businesses"
AI: Shows performance matrix with rankings

User: "What's the profitability outlook?"
AI: Analyzes project data, predicts margin trends

User: "Summarize this month"
AI: Executive digest with key insights, risks, opportunities
```

### 4. **Performance Scoring Algorithm**
```
Base Score: 100

Deductions:
- Task completion % (target 95%): -1 point per %
- On-time delivery % (target 100%): -0.5 point per %
- Follow-up closure % (target 95%): -1.5 point per %
- Hours logged consistency: -2 points if < 5 days
- Efficiency vs estimate: -0.3 per % over

Bonuses:
+ 2 points if all metrics above target
+ 1 point per project completed on-time
+ 0.5 bonus for high utilization (> 40h/week)

Final: 0-100 scale, updated daily
Trend: 7-day moving average shows ↑↓
```

### 5. **System Architecture**
```
Frontend:
- Quick-Add modal (floating button)
- AI Summary cards on dashboard
- Chat widget (bottom-right)
- Performance charts

Backend:
- Score calculation service (daily cron)
- AI prompt builder (contextual summaries)
- Chat message processor
- Analytics aggregator

AI Integration (Groq API):
- Model: Llama 3.3 70B (free tier, fast)
- Prompts:
  * Employee summary generation
  * Chat response generation
  * Insight extraction
  * Anomaly detection
```

### 6. **API Endpoints**

```
// Performance & AI
GET  /api/analytics/performance?businessId=xxx
     → All employees with scores + summaries

GET  /api/analytics/employee/:id?businessId=xxx
     → Detailed employee analysis

POST /api/analytics/chat
     → Chat with AI about your data
     body: { message, businessId, context }

GET  /api/analytics/insights?businessId=xxx
     → Key insights and recommendations
```

### 7. **Key Features**

**Quick-Add**
- Projects: Name + rate (auto-populate from templates)
- Tasks: Title + hours (auto-suggest project)
- Follow-ups: Client + date (quick buttons)
- Time: Logging with quick-access for last 5 projects

**AI Summaries**
- Daily regeneration (3 PM IST)
- Caching for 24 hours
- Real-time update on action
- Customizable metrics per role

**Chat Features**
- 20 message history per session
- Cross-business queries
- Team comparisons
- Performance alerts
- Trend analysis
- "What-if" scenarios ("If everyone improves 10%, profit would be...")

**Performance Insights**
- Who's improving/declining
- Anomaly detection ("Priya's hours dropped 40%")
- Risks ("3 projects 20% over budget")
- Opportunities ("Efficiency gains possible in project X")
```

## Database Additions

```
PerformanceScore model:
- businessId, userId
- date
- score (0-100)
- breakdown {
    completion%, onTime%, followupClosure%,
    consistency, efficiency, bonus
  }
- summary (AI-generated text)

ChatHistory model:
- businessId, userId
- messages: [{role, content, timestamp}]
- context: {...aggregated data snapshot}
```

## UI/UX

**Dashboard Changes:**
1. Floating action button (+ icon, bottom-right)
2. Member cards now show:
   - Performance score (prominent)
   - AI summary (2-3 lines)
   - Trend arrow
   - Click for detailed AI analysis

**New Chat Widget:**
- Bottom-right corner
- Minimizable
- Shows last 5 messages
- "Ask me anything about your team"

**New Analytics Page:**
- Performance matrix (all employees)
- Team comparison charts
- Trend graphs
- AI insights panel
```

## Groq Integration

**Free Tier:**
- 100 requests/min
- Llama 3.3 70B
- <1s latency
- No credit card

**Prompts:**
```
Employee summary:
"Analyze this employee data and write a 2-3 line 
executive summary of their performance, highlighting 
strengths and any concerns. Data: [JSON]"

Chat response:
"You are an intelligent business analyst. Answer this 
question about our team data: [QUESTION]. Context: [DATA]. 
Give a specific, actionable answer."
```

## Implementation Order

1. Set up Groq API integration
2. Build performance scoring service
3. Create quick-add UI components
4. Add AI summary generation
5. Build chat interface
6. Create analytics dashboard
7. Add performance cards to member views
```

