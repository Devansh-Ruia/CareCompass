# 🏥 MedFin - Healthcare Financial Navigator

A comprehensive healthcare financial management platform that helps users understand, manage, and reduce healthcare costs.

## 🚀 Live Demo
- **Frontend:** https://medfin-phi.vercel.app
- **Backend API:** https://medfin.onrender.com
- **API Docs:** https://medfin.onrender.com/docs (dev only)

## ✨ Features
- **Bill Analysis** - Detect billing errors, duplicate charges, and overcharges
- **Cost Estimation** - Get estimates for medical procedures by location
- **Insurance Analysis** - Track deductibles, coverage gaps, and benefits
- **Financial Assistance** - Match with charity care and assistance programs
- **Payment Plans** - Compare and generate payment options
- **Navigation Engine** - Personalized action plans to reduce medical debt

## 🛠️ Tech Stack
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** FastAPI, Python 3.9+, Pydantic
- **Deployment:** Vercel (frontend), Render (backend)

## 📋 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/cost/services` | GET | List available medical services |
| `/api/v1/cost/estimate` | POST | Get cost estimate for a service |
| `/api/v1/insurance/analyze` | POST | Analyze insurance coverage |
| `/api/v1/insurance/analyze/bills` | POST | Analyze medical bills |
| `/api/v1/navigation/plan` | POST | Generate financial action plan |
| `/api/v1/assistance/match` | POST | Match with assistance programs |
| `/api/v1/payment-plans/generate` | POST | Generate payment plan options |
| `/api/v1/feedback` | POST | Submit user feedback |
| `/health` | GET | Health check |

## 🔧 Local Development

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

## 🔐 Environment Variables

### Backend (Render)
| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend API key for email |
| `DEBUG` | Enable debug mode (default: false) |
| `ENVIRONMENT` | Environment name |

### Frontend (Vercel)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |

## 📊 Health Monitoring
- `/health` - Basic health check
- `/health/ready` - Readiness probe
- `/health/live` - Liveness probe

## 🔒 Security Features
- CORS restricted to frontend domain
- Rate limiting (100 requests/minute per IP)
- Input validation with Pydantic
- No sensitive data storage
- Security headers configured

## 📝 License
MIT License

## 👥 Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📋 Changelog

### v1.0.1 - Bug Fixes
- Fixed crash when payment plans API returns empty or partial data
- Fixed AssistancePrograms component handling of varying API response formats
- Added defensive checks for array mapping throughout components
- Improved error handling in API client with proper TypeScript types
