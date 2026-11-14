# OR-Scheduler: Presentation Script

**Total time:** about 25 minutes (15 min slides + live demo, 8 min Q&A, 2 min buffer)
**Format:** "SAY" is what you speak. "DO" is what you click. Slide numbers match `OR-Scheduler-Demo.pptx`.

## Before you start (2 minutes)
- Restart the backend so the data is fresh: 3 pending cases, no schedules.
- Open http://localhost:5173 on the login page, full screen, zoom 100%.
- Keep the PowerPoint open in Presenter View on the other screen.
- Passwords for all demo accounts: `password123`.
- Demo date is the next working day (Mon 16 Nov 2026 if you present this weekend).

---

# PART 1: Introduction (about 6 minutes)

### Slide 1: Title (20 sec)
**SAY:** "Good morning everyone. My project is OR-Scheduler, a system that automatically builds operating room schedules for a hospital and re-plans them within seconds when something goes wrong. I'll explain the problem, show how it works, and then run a live demo with all four user roles."

### Slide 2: Agenda (20 sec)
**SAY:** "I'll cover the problem, the solution and roles, the technology and architecture, the scheduling engine, then a live demo, security and testing, and finally the five key questions about the project."

### Slide 3: Problem & Objective (1 min)
**SAY:** "Operating rooms are the most expensive and busiest part of a hospital. Today many hospitals still plan them with spreadsheets and phone calls. That causes double-booked rooms or surgeons, idle gaps, overtime, and slow reactions when an emergency arrives or a room breaks down. Nobody can easily see who changed what.
Our objective is to automate this safely: conflict-free schedules, 12 hard rules that can never be broken, re-planning in seconds, an approval workflow, analytics, and a full audit trail."

### Slide 4: Solution Overview (1 min)
**SAY:** "The system has six capabilities. Smart schedule generation. Independent validation of every schedule. An approval workflow from proposed to published. Dynamic rescheduling for six kinds of disruption. Resource management for rooms, staff, shifts, leave and equipment. And analytics plus an audit trail. I'll show every one of these live."

### Slide 5: Users & Roles (1 min)
**SAY:** "There are four roles with separation of duties. The clinical staff member, like a surgeon, can view schedules and file surgery requests. The scheduler can also generate schedules and prepare disruption responses. The OR manager approves and publishes schedules and manages the resources. The admin additionally manages user accounts. The rule enforced in the backend is: the scheduler proposes, the manager decides. Also, self-registration only ever creates a clinical account."

### Slide 6: Technology Stack (1 min)
**SAY:** "The backend uses Java 17 with Spring Boot, Spring Security with JWT tokens, JPA and Flyway for the database, and Swagger for API docs. The frontend uses React 18 with TypeScript, Vite, Tailwind, FullCalendar and Recharts. The database is PostgreSQL in production and an in-memory H2 database for local demos."

---

# PART 2: How it works (about 4 minutes)

### Slide 7: Architecture (1 min)
**SAY:** "The system is layered. The React client calls a REST API. Every call passes through a Spring Security filter that checks the JWT token and the user's role. Controllers hand over to services, which use the scheduling core: the ranker, slot generator, constraint checker, scorer and validator. Everything is stored through JPA in the database, with Flyway versioning the schema."

### Slide 8: Data Flow (1 min)
**SAY:** "Top row, the normal day. A request is filed. The engine ranks cases by priority, waiting time and deadline. For each case it generates 15-minute candidate slots in every room and assembles the team and equipment. Any slot that breaks a hard rule is thrown away. The remaining slots are scored and the best one wins. Then an independent validator re-checks the result and saves it as PROPOSED.
Bottom row, a disruption. The event is registered, unaffected and locked cases are preserved, three alternatives are generated, the manager compares the differences and adopts one."

### Slide 9: Constraints & Objectives (1 min)
**SAY:** "These are the 12 hard constraints. No overlapping rooms, staff or equipment, correct qualifications, the case must fit its time window, staff must be on shift and not on leave, rooms must be open and active, equipment must not be in maintenance. These are never violated.
The soft objective is a weighted penalty: waiting time, room idle time, staff overtime, deferrals, minus utilisation. The scheduler's sliders change these weights. The same input and the same weights always produce the same schedule, which is why it's explainable."

### Slides 10–11: Code (1 min)
**SAY:** "A quick look at the real code. The ranking is simple arithmetic: emergency, urgent and elective have big base scores, waiting time adds points per hour, and a close deadline adds urgency. The engine then loops over the ranked cases, takes the best feasible slot, and validates the result. And the core conflict check is one line: two time intervals overlap if one starts before the other ends and ends after it starts. That one check is applied to rooms, staff and equipment."

### Slide 12: Divider
**SAY:** "Let's see it working."

---

# PART 3: Live demo (about 10 minutes)

### Step 1: Login (slide 13) (30 sec)
**DO:** Switch to the browser on the login page.
**SAY:** "The login page has quick-role buttons for the demo, and normal username and password also works. Passwords are hashed and tokens expire after 24 hours."

### Step 2: Clinical staff (slides 14–15) (1.5 min)
**DO:** Click **Chief Surgeon**. Show the sidebar. Click Rooms, Staff, Equipment. Go to Surgery Requests, click **Create Surgery Request**, type "Appendectomy", submit.
**SAY:** "I'm now logged in as a surgeon. Notice the short sidebar: no scheduling, no approval, no audit. Rooms, staff and equipment are read-only. I can see the pending cases: an elective, an urgent and an emergency. I'll file a new request with its duration, buffers and time window. It joins the queue as REQUESTED. There's no Cancel button because only schedulers and above can cancel."

### Step 3: Scheduler generates (slides 16–17) (2 min)
**DO:** Sign out. Click **Lead Scheduler**. Open Generate Schedule. Point at the sliders. Click **Run Deterministic Optimizer**.
**SAY:** "Now I'm the scheduler. These are the pending cases and these are the objective weights. When I run the optimizer, it ranks the cases, finds feasible slots and picks the best one. Here is the result: version SCH-… with status PROPOSED, four scheduled and none unscheduled, with its penalty score. Notice there is no 'Proceed to approval' button for this role. A scheduler cannot publish."

### Step 4: Manager approves (slide 18) (1.5 min)
**DO:** Sign out. Click **OR Manager**. Open Schedule Approvals. Click **Validate Constraints**, then **Approve**, then **Publish Schedule Live**.
**SAY:** "As the manager I validate. The validator independently re-checks all the hard constraints, and publishing is blocked if any is violated. Approve, then publish. This version is now the live schedule, and any older live version for that date is marked superseded."

### Step 5: Dashboard, Gantt, calendar (slides 19–21) (1.5 min)
**DO:** Open Operations Center, then Gantt, click a case, then Calendar.
**SAY:** "The dashboard now shows real numbers from the published schedule. In the Gantt chart each lane is a room. The darker blocks are prep and cleanup buffers, and there are no overlaps. Clicking a case shows its team and equipment. The same schedule is available as a calendar."

### Step 6: Resources (slides 22–23) (1 min)
**DO:** Open Surgical Staff, click **Shifts & Leave** on a surgeon, show a weekly shift. Then Rooms and Equipment briefly.
**SAY:** "As manager I can maintain the resources. For each person I manage weekly shifts and leave. Leave is a hard rule, so the optimizer won't assign that person. Rooms have operating hours and equipment has maintenance windows. Only managers and admins can change these."

### Step 7: Disruption and rescheduling, the highlight (slides 24–27) (2.5 min)
**DO:** Open Dynamic Reschedule. Click **Register Disruption**: type ROOM_CLOSURE, room OR-3 (Cardiac), description "Burst pipe", register. Click **Generate 3 Alternatives**. Click **Compare Schedule Diff**. Then **Adopt Alternative**. Open the Gantt.
**SAY:** "Now something goes wrong. At 10:30 the cardiac room has a burst pipe. I register a room closure. The system links it to the live schedule. Now I generate alternatives: minimal displacement, compact, and priority preservation. Each is a complete, validated schedule with a score. Let me open the comparison. Here are the cases that move, their original and new room and time, and the delay in minutes. I adopt this one. The old schedule is superseded, the disruption is resolved, and the Gantt shows the closed room empty and the cases re-planned with no conflicts."

### Step 8: Analytics and audit (slide 28) (45 sec)
**DO:** Open Analytics Dashboard, then Audit Trail.
**SAY:** "Analytics shows room utilisation, waiting times, deferrals and overtime. And the audit trail records who did what and when: generate, approve, publish, disruption, reschedule."

### Step 9: Role-based UI and Admin (slides 29–30) (45 sec)
**DO:** Sign out. Click **System Admin**. Open User Management. Click **Add User**, show the roles. Close.
**SAY:** "Finally the admin has a page nobody else sees: user management. Create users, assign roles, deactivate accounts. An admin can't deactivate themselves."

---

# PART 4: Security & quality (about 1 minute)

### Slides 31–33: Security / Swagger / Testing
**SAY:** "Security is enforced on the server, not just hidden in the interface. Each endpoint declares which roles may call it, and a forbidden call returns HTTP 403. All the APIs are documented in Swagger. For testing, there are 14 unit tests for the engine and over a hundred scripted API checks across all four roles, plus a clean production build."

---

# PART 5: Project Q&A (about 8 minutes)

### Q1: Main objective and real-world problem (slide 35, 1 min)
**SAY:** "The objective is to automate operating room scheduling safely. The real-world problem is that manual planning causes double-bookings, wasted theatre time, overtime, slow reaction to emergencies and no accountability. Our system produces conflict-free schedules, re-plans in seconds, and records every action."

### Q2: Why this stack and methodology (slide 36, 1.5 min)
**SAY:** "The key decision is a deterministic rule-based engine rather than a black-box AI. In a hospital, a schedule must be explainable, reproducible and auditable, and we have no patient training data. Spring Boot gives us mature security, validation and transactions. JWT gives stateless authentication. JPA and Flyway give relational integrity and versioned migrations. React with TypeScript gives a typed, fast interface. The trade-off is that our search is greedy: it is fast and explainable but not provably optimal."

### Q3: Architecture and data flow (slide 37, 1.5 min)
**SAY:** "A request goes from the React client with its JWT, through the security filter that validates the token and role, to a controller that validates the input, to a service that applies business rules in a transaction, then into the scheduling core, and finally to the database. For example, generating a schedule loads rooms, staff, shifts and pending cases, ranks and places them, validates the result, saves a PROPOSED version, and writes an audit entry and notifications."

### Q4: Challenges and bugs (slides 38–39, 2 min)
**SAY:** "We found the issues by testing every role against the real backend. First, two endpoints returned HTTP 500 because objects were converted to responses after the database transaction had closed. We moved the conversion inside the transactional service. Second, the frontend silently showed fake demo data whenever the backend failed, which hid real errors. It is now opt-in only. Third, anyone could register as an administrator because the sign-up accepted roles from the client. We created a separate sign-up object that has no roles. Others: leave and weekends weren't enforced by the scheduler, one page crashed on an undefined status, and a disruption could be adopted twice. The lesson: test with real data, and never let a fallback hide a failure."

### Q5: Limitations and future scope (slide 40, 1.5 min)
**SAY:** "Honest limitations: the search is a heuristic, not a proven optimum. It plans one day at a time. The default demo database is in-memory and resets on restart. Generated alternatives are cached in memory. Notifications are polled rather than pushed. There are no hospital-system integrations, and the login token is kept in browser storage. Future scope: an optimal solver such as constraint programming, machine-learning prediction of surgery durations, multi-day planning with bed and ICU capacity, real-time push and e-mail or SMS alerts, EHR integration, stronger production security with refresh tokens, and a CI pipeline with automated UI tests."

### Slide 41: Close (20 sec)
**SAY:** "To summarise: conflict-free schedules from 12 hard rules, re-planning in seconds with side-by-side alternatives, and a role-based workflow with a full audit trail. Thank you. I'm happy to take questions."

---

# Likely follow-up questions (short answers)

| Question | Answer |
|---|---|
| Why not AI / machine learning? | Hospital decisions must be explainable and reproducible. Rules can be audited line by line. ML could later predict durations, not make the final decision. |
| Is the schedule optimal? | No. It's greedy: each case takes the best feasible slot. It always satisfies the hard rules, but optimality isn't guaranteed. A solver is future work. |
| What if two disruptions happen? | Each is registered separately and re-planned against the current live schedule. Adopting one supersedes the old version, so the next starts from the new one. |
| How do you stop a scheduler publishing? | The server rejects the call with HTTP 403. The button is hidden in the UI, but the real check is in the backend. |
| Where is the data stored? | PostgreSQL in production. For the demo it's in-memory H2, which resets on restart. |
| How are passwords stored? | BCrypt hashes. Tokens are signed JWTs that expire after 24 hours. |
| Can it scale? | The API is stateless, so it scales horizontally. Alternatives caching would need to move to the database or Redis first. |
| What did you test? | 14 unit tests on the engine, 100+ scripted API checks across all four roles, and a clean TypeScript production build. |
| Can the live schedule be changed by hand? | Not directly. Changes go through a new generated or rescheduled version that must be approved and published, so everything stays versioned and audited. |

---

# If something goes wrong in the demo
- **A page shows an error toast:** say "that's the server's role check at work" if it's a 403, otherwise refresh and retry.
- **No schedule appears on the dashboard:** you skipped Publish. Go to Schedule Approvals and publish.
- **Disruption registration says no published schedule:** the schedule date and disruption time must be on the same day, and it must be published first.
- **Everything looks empty or stale:** restart the backend (data resets to the 3 seeded cases) and start the demo again from Step 2.
- **Screenshot fallback:** slides 13–30 contain a screenshot of every demo step, so you can narrate over the slides if the live app fails.
