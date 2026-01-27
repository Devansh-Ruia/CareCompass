# MedFin - Autonomous Healthcare Financial Navigator

MedFin is a full-stack, production-ready web application that helps users understand, manage, and reduce healthcare costs. The system analyzes medical bills, insurance coverage, and income to generate personalized financial action plans, cost estimates, assistance matches, and payment plan recommendations.

## Features

- **Autonomous Navigation Engine** - Generates personalized financial action plans based on your situation
- **Cost Estimation** - Estimates healthcare service costs by type, location, and insurance coverage
- **Bill Analysis** - Detects duplicate charges, coding inconsistencies, and incorrect insurance adjustments
- **Insurance Analysis** - Tracks deductibles, out-of-pocket limits, and coverage gaps
- **Financial Assistance Matcher** - Matches users with hospital charity care, government programs, and pharmaceutical assistance
- **Payment Plan Generator** - Compares multiple payment options and recommends the best based on income and debt

## Tech Stack

### Backend
- Python 3.9+
- FastAPI
- Pydantic models
- Uvicorn

### Frontend
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS

## Project Structure

```
medfin-1/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── models.py
│   │   ├── routers/
│   │   │   ├── cost_estimation.py
│   │   │   ├── insurance.py
│   │   │   ├── bills.py
│   │   │   ├── navigation.py
│   │   │   ├── assistance.py
│   │   │   └── payment_plans.py
│   │   ├── services/
│   │   │   ├── cost_estimator.py
│   │   │   ├── navigation_engine.py
│   │   │   ├── assistance_matcher.py
│   │   │   ├── payment_planner.py
│   │   │   ├── bill_analyzer.py
│   │   │   └── insurance_analyzer.py
│   ├── main.py
│   └── requirements.txt
└── frontend/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── globals.css
    ├── components/
    │   ├── NavigationPlan.tsx
    │   ├── CostEstimation.tsx
    │   ├── BillAnalysis.tsx
    │   ├── InsuranceAnalysis.tsx
    │   ├── AssistancePrograms.tsx
    │   └── PaymentPlans.tsx
    ├── lib/
    │   └── api.ts
    ├── package.json
    └── next.config.js
```

## Setup Instructions

### Prerequisites

- Python 3.9+
- Node.js 18+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the backend server:
```bash
python -m uvicorn app.main:app --reload --port 8000
```

The backend API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### Cost
- `POST /api/v1/cost/estimate` - Estimate cost for a medical service
- `GET /api/v1/cost/services` - Get available medical services

### Insurance
- `POST /api/v1/insurance/analyze` - Analyze insurance coverage
- `GET /api/v1/insurance/types` - Get insurance types

### Bills
- `POST /api/v1/bills/analyze` - Analyze medical bills for errors
- `POST /api/v1/bills/itemize` - Generate itemization request

### Navigation
- `POST /api/v1/navigation/plan` - Create personalized navigation plan
- `POST /api/v1/navigation/analyze-situation` - Analyze financial situation

### Assistance
- `POST /api/v1/assistance/match` - Match with financial assistance programs
- `GET /api/v1/assistance/programs` - Get available assistance programs

### Payment Plans
- `POST /api/v1/payment-plans/generate` - Generate payment plan options
- `POST /api/v1/payment-plans/recommend` - Get recommended payment plan

## Feedback API

### POST /api/v1/feedback
Submit user feedback via email.

**Request Body:**
```json
{
  "rating": 5,
  "category": "feature",
  "comments": "Your feedback message",
  "name": "User Name (optional)",
  "email": "user@example.com (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thank you for your feedback!"
}
```

### GET /api/v1/feedback/health
Check if feedback service is configured.

## Core Principles

- **Modular, service-oriented architecture** - Clear separation between services and routers
- **Deterministic + rule-based intelligence** - No hallucinated outputs, all calculations are based on established rules
- **Clear separation of concerns** - Each service handles a specific domain
- **Scalable and extensible** - Easy to add new features or modify existing ones
- **Privacy-first and secure by default** - No real PHI persistence required
- **Developer-friendly and well-documented** - Type hints, docstrings, and clear code structure

## Data Handling & Security

- No real PHI persistence required
- Secure request validation using Pydantic models
- Clear disclaimers for non-medical advice
- Input validation on all endpoints

## Development

### Backend Development

The backend follows a service-oriented architecture:
- **Services** (`app/services/`) contain business logic
- **Routers** (`app/routers/`) handle HTTP requests and responses
- **Models** (`app/core/models.py`) define Pydantic models for type safety
- **Config** (`app/core/config.py`) contains application settings

### Frontend Development

The frontend uses Next.js 14 with App Router:
- **Components** (`components/`) contain reusable UI components
- **API Layer** (`lib/api.ts`) handles all backend communication
- **Styling** uses Tailwind CSS with custom healthcare-friendly color palette

## Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Build for Production

### Backend
The backend is production-ready with uvicorn:
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm run build
npm start
```

## License

This project is for educational purposes.

## Disclaimer

**Important:** This tool provides estimates and recommendations only. It does not constitute financial, medical, or legal advice. Always consult with appropriate professionals before making healthcare or financial decisions.

## Future Enhancements (TODOs)

- External integrations for real-time cost data
- Multi-provider price comparison
- Claims tracking and appeals management
- Personalized savings goals and tracking
- Export functionality for reports
- Multi-language support
- Mobile responsive optimization
- Real user authentication
- Historical data and trend analysis
