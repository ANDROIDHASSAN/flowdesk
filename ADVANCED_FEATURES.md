# 🚀 Advanced Project Analytics & Profitability System

## New Features Added

### 1. **Projects Management**
- **New Route:** `/projects` (Owner only)
- Create projects with estimated hours and billing rates
- Track billable vs cost rates for profit margin analysis
- Project status: planning, active, completed, on-hold

### 2. **Profitability Metrics**
For each project, automatically calculates:

```
Estimated Hours: 160h
Actual Hours: 172h (from TimeEntry logs)
Variance: +12h (LOSS - you're losing money)
Variance %: +7.5%

Billable Rate: ₹1000/hour
Cost Rate: ₹600/hour (internal cost)

Revenue: ₹172,000 (172h × ₹1000)
Cost: ₹103,200 (172h × ₹600)
Profit: ₹68,800
Profit Margin: 40%

Efficiency: 93% (160/172)
```

### 3. **Key Indicators**
Each project shows:
- ✅ Estimated vs Actual hours
- 📊 Profit/Loss amount
- 💰 Profit margin percentage
- ⚡ Efficiency score (plan vs actual)
- 💵 Revenue, cost, and profit breakdown

### 4. **Dashboard KPIs**
- Total Revenue across all projects
- Total Profit (shows in red if negative)
- Average Profit Margin
- Number of projects

### 5. **Task-Level Enhancement**
Tasks now support:
- `estimatedHours` - owner sets the estimate
- `actualHours` - auto-calculated from TimeEntry logs
- `projectId` - link tasks to projects
- `hourlyRate` - task-specific billing (inherits from project)
- `isBillable` - toggle billable vs internal time

### 6. **Database Updates**
```
Project model:
- name, description
- estimatedHours, actualHours (computed)
- hourlyRate (to client)
- costRate (internal cost, defaults to hourly rate)
- status: planning | active | completed | on-hold
- startDate, endDate

Task model additions:
- projectId (FK to Project)
- estimatedHours
- actualHours (computed from TimeEntry)
- hourlyRate
- isBillable
```

### 7. **API Endpoints**
```
GET  /api/projects?businessId=xxx
     → List all projects with profit calculations

POST /api/projects
     → Create a new project
     body: { businessId, name, estimatedHours, hourlyRate, costRate }

GET  /api/projects/:id
     → Project detail with task breakdown
     returns: tasks + summary (revenue, profit, efficiency)

PATCH /api/projects/:id
     → Update project status, rates, estimates
```

## Use Cases

### Scenario 1: Over-time Project
```
Project: "Website Redesign"
Estimate: 200h
Actual: 240h (✗ 40h over)
Cost: 240h × ₹500 = ₹120,000
Revenue: 240h × ₹2000 = ₹480,000
Profit: ₹360,000
Margin: 75% (still profitable but 20% efficiency loss)
```

### Scenario 2: Loss-making Project
```
Project: "Mobile App"
Estimate: 400h
Actual: 500h (✗ 100h over)
Cost: 500h × ₹1000 = ₹500,000
Revenue: 500h × ₹1200 = ₹600,000
Profit: ₹100,000
Margin: 17% (squeezed profit)
```

### Scenario 3: Profitable Project
```
Project: "Consulting"
Estimate: 100h
Actual: 95h (✓ 5h under)
Cost: 95h × ₹500 = ₹47,500
Revenue: 95h × ₹2500 = ₹237,500
Profit: ₹190,000
Margin: 80% (highly efficient)
Efficiency: 105%
```

## Future Enhancements (Phase 3)

- [ ] Task-level profitability drill-down
- [ ] Member-based cost per hour (role-based rates)
- [ ] Resource allocation optimizer
- [ ] Budget vs Actuals chart
- [ ] Project timeline vs hours spent graph
- [ ] Client billing integration (invoice generation)
- [ ] Resource forecast for upcoming projects
- [ ] Utilization rate by team member
- [ ] Capacity planning dashboard
- [ ] Profit margin trends over time

## How It Integrates

1. **Owner creates a project** with estimated hours and rates
2. **Owner assigns tasks** to team members (tasks link to projects)
3. **Members log time** via TimeEntry (auto-calculates per task, per project)
4. **Owner views Projects page** to see:
   - Which projects are profitable
   - Which are over budget
   - Team efficiency per project
   - Quick profit/loss at a glance

This enables data-driven decisions on:
- Pricing strategy (rates too low for this work?)
- Resource allocation (pull people off this project, add to that)
- Team capacity planning
- Client profitability analysis
