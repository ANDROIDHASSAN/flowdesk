# Advanced Project Analytics & Profitability System

## What We're Building

### 1. **Task-Based Time Tracking**
- ✅ Start/Stop timer directly on tasks
- ✅ Estimated hours vs Actual hours
- ✅ Auto-pause on inactivity
- ✅ Break tracking
- ✅ Real-time progress visualization

### 2. **Project Profitability Analytics**
Pages:
- **Projects Dashboard** (owner only)
  - All projects with status, budget, spending
  - Estimated vs Actual hours
  - Cost variance (over/under budget)
  - Billable hours tracking
  
- **Project Detail View**
  - Timeline: Estimated vs Actual hours
  - Cost breakdown by team member
  - Hourly rate analysis
  - Profit/Loss calculation
  - Task-level drill-down

### 3. **Advanced Metrics**
```
Metrics Dashboard shows:
- Estimated Hours: 700
- Actual Hours: 720
- Cost Variance: +20 hours (LOSS)
- Hourly Rate: ₹500
- Loss Amount: ₹10,000 (20 × 500)
- Efficiency: 97.2% (700/720)

Per Team Member:
- Hours spent: X
- Cost: ₹Y
- Tasks completed: Z
- Avg time per task

Billable vs Non-billable
- Project billing rate vs cost rate
- Profit margin
- ROI
```

### 4. **Database Additions**
```
Task model updates:
- estimatedHours: number (owner sets)
- billableHours: number (actual billable)
- hourlyRate: number (project rate)
- isBillable: boolean

New Project model:
- name, description
- estimatedHours
- estimatedCost
- actualCost
- hourlyRate
- startDate, endDate
- status (planning, active, completed)
- profitMargin
```

### 5. **Visualizations**
- Bar charts: Est vs Actual hours
- Pie charts: Cost breakdown
- Line charts: Time progress
- Heat maps: Member productivity
- KPI cards: Key metrics

### 6. **Reports**
- Project Profitability Report
- Team Productivity by Project
- Cost Variance Analysis
- Timeline Analysis
- Member Performance vs Project Rates
